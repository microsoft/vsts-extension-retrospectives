using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CollaborationStateService.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Logging;

namespace CollaborationStateService
{
  public class Startup
  {
    public Startup(IWebHostEnvironment hostingEnvironment)
    {
      IConfigurationBuilder builder = new ConfigurationBuilder()
        .SetBasePath(hostingEnvironment.ContentRootPath)
        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
        .AddJsonFile($"appsettings.{hostingEnvironment.EnvironmentName}.json", optional: true)
        .AddEnvironmentVariables();

      Configuration = builder.Build();
    }

    public IConfiguration Configuration { get; }

    public void ConfigureServices(IServiceCollection services)
    {
      // Retrieve the environment specific extension secret from the azure vault.
      IConfigurationSection certificateData = Configuration.GetSection("VSTSExtensionCertificates");
      var combinedKeys = certificateData.AsEnumerable().Where(keyValue => !string.IsNullOrWhiteSpace(keyValue.Value)).Select(x => x.Value).ToList();

      // Retrieve additional dev extensions secrets from application settings.
      IConfigurationSection developerCertificateData = Configuration.GetSection("DeveloperOverrideCertificates");
      combinedKeys.AddRange(developerCertificateData.AsEnumerable().Where(keyValue => !string.IsNullOrWhiteSpace(keyValue.Value)).Select(x => x.Value));

      services.AddApplicationInsightsTelemetry();

      services.AddCors();

      services.AddAuthentication(options =>
      {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
      })
      .AddJwtBearer(options =>
      {
        options.TokenValidationParameters = new TokenValidationParameters
        {
          LifetimeValidator = (before, expires, token, param) => { return expires > DateTime.UtcNow; },
          ValidateAudience = true,
          ValidateIssuer = true,
          ValidateActor = true,
          ValidateLifetime = true,
          RequireSignedTokens = true,
          RequireExpirationTime = true,
          IssuerSigningKeys = combinedKeys.Select(e => new SymmetricSecurityKey(Encoding.UTF8.GetBytes(e))),
        };

        // We have to hook the OnMessageReceived event in order to
        // allow the JWT authentication handler to read the access
        // token from the query string when a WebSocket or
        // Server-Sent Events request comes in.
        options.Events = new JwtBearerEvents
        {
          OnMessageReceived = context =>
          {
            var accessToken = context.Request.Query["access_token"];

            // If the request is for our hub...
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/collaborationUpdates"))
            {
              // Read the token out of the query string
              context.Token = accessToken;
            }

            return Task.CompletedTask;
          }
        };
      });

      services.AddSignalR().AddAzureSignalR(Configuration.GetValue<string>("Azure:SignalR:ConnectionString"));
      services.Configure<AppInsightsSettings>(Configuration.GetSection("ApplicationInsights"));

      services.AddLogging(builder =>
      {
        builder.AddConsole();
      });
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILogger<Startup> logger)
    {
      // Retrieve allowed origins from the application settings.
      IConfigurationSection allowedOriginData = Configuration.GetSection("AllowedOrigin");
      var allowedOrigins = allowedOriginData.AsEnumerable().Where(keyValue => !string.IsNullOrWhiteSpace(keyValue.Value)).Select(x => x.Value).ToArray();

      app.UseRouting();

      app.UseCors(builder => { builder.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials(); });

      app.UseWebSockets();

      app.UseAuthentication();

      app.Use(async (context, next) =>
      {
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        await next();
      });

      app.UseEndpoints(endpoints =>
      {
        endpoints.MapHub<ReflectBackend.ReflectHub>("/collaborationUpdates");

        endpoints.MapGet("/health", async context =>
        {
          logger.LogInformation("Received health request");

          await context.Response.WriteAsync("App Running....");
        });
      });
    }
  }
}
