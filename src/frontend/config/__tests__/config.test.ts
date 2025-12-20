import { config } from "../config";

describe("config", () => {
  it("should return the app configuration", () => {
    expect(config).toBeDefined();
  });
  it("should have the 'CollaborationStateServiceUrl' property", () => {
    expect(config.CollaborationStateServiceUrl).toBeDefined();
  });
  it("should have the 'AppInsightsInstrumentKey' property", () => {
    expect(config.AppInsightsInstrumentKey).toBeDefined();
  });
  it("should have the 'CurrentEnvironment' property", () => {
    expect(config.CurrentEnvironment).toBeDefined();
  });

  describe("getConfiguration warnings", () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      // Restore original env vars
      jest.resetModules();
    });

    it("should warn when APP_INSIGHTS_INSTRUMENTATION_KEY is missing", () => {
      // Save original value
      const originalKey = process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY;

      // Remove the env var
      delete process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY;

      // Force re-import to trigger getConfiguration again
      jest.resetModules();
      require("../config");

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("missing Application Insights Instrumentation key"));

      // Restore
      if (originalKey) {
        process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY = originalKey;
      }
    });

    it("should warn when COLLABORATION_STATE_SERVICE_URL is missing", () => {
      // Save original value
      const originalUrl = process.env.REACT_APP_COLLABORATION_STATE_SERVICE_URL;

      // Remove the env var
      delete process.env.REACT_APP_COLLABORATION_STATE_SERVICE_URL;

      // Force re-import to trigger getConfiguration again
      jest.resetModules();
      require("../config");

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Backend Service URL was not provided"));

      // Restore
      if (originalUrl) {
        process.env.REACT_APP_COLLABORATION_STATE_SERVICE_URL = originalUrl;
      }
    });
  });
});
