# Contribute

The Retrospectives Azure DevOps extension is developed in React, using Typescript. The project follows a single branch source control strategy.

## Table of Contents

- [Background](#background)
- [To contribute](#to-contribute)
- [Development on Windows](#development-on-windows)
- [Contribute](#contribute)
- [Storage](#storage)
- [Backend](#backend)

## Background

Retrospectives is an Azure DevOps extension. Visit [this link](https://docs.microsoft.com/en-us/azure/devops/extend/?view=vsts) to learn more about developing extensions.

## To contribute

1. Clone the repository to your local machine.
2. Create a new local branch from the 'master' branch. Follow the 'users/{alias}/{nameofyourbranch}' naming convention for your branch.
3. Publish the newly created branch to the Retrospectives repo. Use this branch as your working branch.
4. Once you are ready to check-in, create a pull request against the 'master' branch. Link the Bug/Task that you are fixing/adding to the pull request. Reviewers will be added automatically.

## Development on Windows

### Clone repo

Clone the repository to your local machine from the Azure DevOps endpoint.

### Build and Test

**Note:** You will need NodeJS to be able to build the project and download dependencies. Go [here](https://nodejs.org/en/download/) to download NodeJS.

**Note:** The project uses webpack for module bundling. Refer to the webpack documentation [here](https://webpack.js.org/).

- Clone this repo and open it with Visual Studio or with Visual Studio Code. You can also use any IDE or editor that you normally use to work with C# and React/Typescript.

- Using Powershell, navigate to the '/RetrospectiveExtension.Frontend' folder, run `npm install`. This will download all the dependent packages listed in 'package.json'.

- Copy the file `RetrospectiveExtension.Frontend\config\environment.tsx.template` into `RetrospectiveExtension.Frontend\config\environment.tsx` and update the fields

```json
{
   CollaborationStateServiceUrl : "https://my-backend-service.com", // change this to the deployed backend service
   AppInsightsInstrumentK       : "my_instrumentation_key" // put Instrumentation key here
}
```

- Run `npm run build` to build the project. Refer to the 'scripts' section in 'package.json' for other commands.

- To test your changes, you will need to publish a new extension under a new Azure DevOps publisher account. Refer to the [documentation](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts) on publishing extensions. You can publish it to any test Azure DevOps organization that you are an admin of (As a Microsoft employee, you can create a new test organization from your Azure DevOps profile page). Currently this is the only way to test the extension.

- Copy the file `vss-extension-dev.json.template` into `vss-extension-dev.json` file with the new publisher that you setup. Also update the name and id fields.

```json
{
  "manifestVersion": 1,
  "id": <any new id>,
  "publisher": <the new publisher you created>,
  "version": <your staring version>,
  "name": <your extension's name. Can be any name you can identify by. Eg. Retrospectives-test>,
}
```

- Run `npm run pack:p` to package the modules into a Azure DevOps extension package. This generated package has a '.vsix' extension. This package is generated using information from the manifest file and your built code. Refer to the [documentation](https://docs.microsoft.com/en-us/azure/devops/extend/develop/manifest?view=vsts) to know more about extension manifests.

- [Publish your to the marketplace](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts#publish). Once published, share the extension with the newly created test org. See [this link](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts#share) for documentation on sharing.

- Once the extension has been shared with your test org, you can install it to your org and start using it. This installation process is similar to installing any other DevOps extensions. Refer to [this link](https://docs.microsoft.com/en-us/azure/devops/marketplace/install-extension?view=vsts) for instructions. Since the extension is still in preview mode, it needs to be enabled for the Azure DevOps project. Enable the extension from the 'Preview Features' tab.

- Now start using the extension to test your changes.

- For updates, simple rebuild and package your extension and publish an update from the Azure DevOps marketplace. That will automatically update the extension in your project.

### Storage

The Retrospectives tool uses the [Azure DevOps data service](https://docs.microsoft.com/en-us/azure/devops/extend/develop/data-storage?view=vsts) for handling all its storage.

### Backend

The Retrospectives tool uses the [Azure SignalR service](https://azure.microsoft.com/en-us/services/signalr-service/) to add real time support. The backend codebase can be found [here](https://github.com/microsoft/vsts-extension-retrospectives/tree/master/RetrospectiveExtension.Backend).

To enable real time updates from your test extension you will need to deploy
the backend to Azure specifying your publisher id and the unique key of your
extension. **Note:** If you are part of a team working on the retro tool you can
deploy a single backend to support multiple developer test extensions.

1. Copy `/deploy/.env.template` to `/deploy/.env` and make the following
changes:
   - Add the Service Principal values used by the `env_setup.sh` script.
   [Instructions on how to create a Service Principal](https://docs.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli#password-based-authentication).
   - Add the `RESOURCE_NAME_SUFFIX` value. This will be used for naming
   all Azure resources including the App Service name - `https://<RESOURCE_NAME_SUFFIX>.azurewebsites.net`.
   **Note:** The app name must be globally unique so select something accordingly.
   - Add the `LOCATION `value i.e. "eastus", "westus", etc.
1. Copy `/allowed_origins.json.template` to `/allowed_origins.json` and replace
the `<publisher id>` with your publisher id. This id uniquely identifies your
publisher in the Visual Studio Marketplace. If you are part of a team working
on the retro tool you can add additional allowed origins. There should be two
allowed origins per publisher id. Remember to increment the name index as you
add additional origins.
1. Copy `/dev_certs.json.template` to `/dev_certs.json` and replace the
`<extension secret>` with your secret. [Instructions on how to download the
unique key](https://docs.microsoft.com/en-us/azure/devops/extend/develop/auth?view=vsts#get-your-extensions-key).
If you are part of a team working on the retro tool you can add additional
secrets. Remember to increment the name index to add additional secrets.
1. Run the `deploy/env_setup.sh` script.
1. Once the script completes, it will output the url of the backend service. You can navigate to the [Azure Portal](https://portal.azure.com)
and validate that the `rg-<RESOURCE_NAME_SUFFIX>` resource group exists and
contains the App Service, App Service Plan and SignalR resources.
1. Update the `RetrospectiveExtension.FrontEnd/config/environment.tsx` to reflect changes to:
   - `CollaborationStateServiceUrl` value to the App Service URL -
`https://<RESOURCE_NAME_SUFFIX>.azurewebsites.net`.
   - `AppInsightsInstrumentKey` value to Application Insights' Instrumentation Key for the resource `ai-<RESOURCE_NAME_SUFFIX>`.
1. After updating the above values redeploy the extension.

## Style Guidelines for Backend Project

Follow the coding guidelines here - [C# Coding Conventions (C# Programming Guide)](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/inside-a-program/coding-conventions).

## Pull Request Process

1. Clone the repository to your local machine.
2. Create a new local branch from the 'master' branch. Follow the `<alias>/<nameofyourbranch>` naming convention for your branch.
3. Publish the newly created branch to the Reflect Backend repo. Use this branch as your working branch.
4. Once you are ready to check-in, create a pull request against the 'master' branch. Link the Bug/Task that you are fixing/adding to the pull request. Reviewers will be added automatically.
5. Ensure builds are successful and tests, including any added or updated tests, pass prior to submitting the pull request.
6. Update any documentation, user and contributor, that is impacted by your changes.
7. You may merge the pull request in once you have the sign-off from one developer from the [Retrospectives team](retrospectives@microsoft.com), or if you do not have permission to do that, you may request the reviewer to merge it for you.

## Code

1. The project is developed using the [.NET Core](https://docs.microsoft.com/en-us/dotnet/core/) development platform. The 'CollaborationStateService' web project contains the code for the backend service. Since .NET Core is platform independent, project can be developed on any operating system.
2. The 'ReflectBackend.ReflectHub' class contains the implementation of all the functions that the backend service supports. New methods should be added here to support more real time scenarios.
3. Examples:
   - The code snippet below provides a method that the client can use to join a backend Group. Groups in SignalR provide a method for broadcasting messages to specified subsets of connected clients. Any client using this method gets added to the group that it specifies by the reflectBoardId.

     ```csharp
         /// <summary>
         /// Adds the client to the group for this reflect board.
         /// </summary>
         /// <param name="reflectBoardId">The id of the reflect board.</param>
         public Task JoinReflectBoardGroup( string reflectBoardId )
         {
             _insights.TrackEvent("Adding client to board");
             return Groups.AddToGroupAsync( Context.ConnectionId, reflectBoardId );
         }
     ```

   - The code snippet below broadcasts that a new Feedback specified by the 'feedbackItemId' is available on the board specified by 'reflectBoardId'. The 'columnId' specifies which column of the board the item was added to. Clients can use this method to signal to other clients that a new Feedback was added to one of its boards.

     ```csharp
     /// <summary>
     /// Broadcast receiveNewItem to all other clients viewing the same reflect board.
     /// </summary>
     /// <param name="reflectBoardId">The id of the reflect board.</param>
     /// <param name="columnId">The id of column this item is associated with.</param>
     /// <param name="feedbackItemId">The id of the new feedback item.</param>
     public Task BroadcastNewItem( string reflectBoardId, string columnId, string feedbackItemId )
     {
         _insights.TrackEvent("Broadcasting new item");
         return Clients.OthersInGroup( reflectBoardId ).SendAsync( "receiveNewItem", columnId, feedbackItemId );
     }
     ```

## License Information

Copyright (c) Microsoft Corporation. All rights reserved.
