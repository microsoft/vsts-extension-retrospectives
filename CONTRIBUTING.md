# Contributing

## Table of Contents

- [Background](#background)
- [Contributing Guidelines](#contributing-guidelines)
  - [Branching and Pull Requests](#branching-and-pull-requests)
  - [Continuous Integration and Pre-commit Hook](#continuous-integration-ci-script-and-pre-commit-hook)
- [Development Environments](#development-environments)
  - [Visual Studio Code - Dev Containers](#dev-containers)
  - [Windows Subsystem for Linux (WSL)](#windows-subsystem-for-linux)
  - [Github Codespaces](#github-codespaces)
- [Build](#build)
  - [Test in Azure DevOps](#test-in-azure-devops)
  - [Test with Hot Reload and Debug](#test-with-hot-reload-and-debug)
  - [Test with Deployed Backend Service](#test-with-deployed-backend-service)
- [Frontend Development](#frontend-development)
  - [Style Guide](#frontend-style-guide)
  - [Unit Testing](#frontend-unit-testing)
- [Backend Development](#backend-development)
  - [Style Guide](#backend-style-guide)
  - [Storage](#storage)
  - [Code](#code)
  - [Unit Testing](#backend-unit-testing)
- [Application Monitoring and Telemetry](application-monitoring-and-telemetry)

## Background

Retrospectives is an Azure DevOps extension. Visit
[this link](https://docs.microsoft.com/en-us/azure/devops/extend/?view=vsts) to
learn more about developing extensions. The Retrospectives Azure DevOps
extension frontend is implemented in React using Typescript, and the backend is
implemented in C#. The project follows a single branch source control strategy.

## Contributing Guidelines

### Branching and Pull Requests

1. When creating a new branch, follow the `{alias}/{issue##}` naming
convention.
    - **Note:** It is recommended to keep the branch name length below 30
    characters in order to allow the Github Action which builds and deploys the
    development extension on Pull Request creation or update to successfully execute.

2. Once your feature addition or bug fix is ready for review, create a pull
request against the `master` branch of the repository.

3. Include a link to the GitHub issue you are addressing to the description of
your pull request. Reviewers will be added to the pull request automatically.

4. Ensure all CI/CD checks are successful after the creation of the pull request.

5. Update any documentation, user and contributor, that is impacted by your
changes.

6. You may merge the pull request in once you have the sign-off from one
developer from the [Retrospectives team](retrospectives@microsoft.com), or if
you do not have permission to do that, you may request the reviewer to merge it for you.

### Continuous Integration (CI) Script and Pre-commit Hook

The `RetrospectiveExtension.Frontend/scripts` folder includes a ci script,
[`ci.sh`](RetrospectiveExtension.Frontend/scripts/ci.sh).
The script runs all CI steps locally. If you are using the
projects dev container all script dependencies are already installed.
If you are not using the [dev container](#dev-containers) you can run the
[`setup_ci.sh`](RetrospectiveExtension.Frontend/scripts/setup_ci.sh) script
to install all dependencies.

In addition to running the CI script manually the dev container is
configured to install a
[pre-commit hook](https://git-scm.com/docs/githooks#_pre_commit) using the
[Python pre-commit framework](https://pre-commit.com/). The pre-commit
hook will run the [`ci.sh`](RetrospectiveExtension.Frontend/scripts/ci.sh)
script before each commit and abort the commit on error. To
disable the pre-commit hook run `pre-commit uninstall` from the
root folder.

## Development Environments

The Retrospectives Extension can be built, developed and tested in several
development environments. This section highlights three of the primary
environments in order of relevance.

All of the development prerequisites, such as [Webpack](https://webpack.js.org/)
and [NodeJS](https://nodejs.org/en/download/) are listed in the
[Dockerfile](.devcontainer/Dockerfile). This file can be opened in a text
editor and the install commands can be used to configure the prerequisites
outside of a [dev container](#dev-containers).

### Dev Containers

1. Install the latest version of [Docker Desktop](https://www.docker.com/products/docker-desktop).

2. Install the latest version of
[Visual Studio Code](https://code.visualstudio.com/).

3. Install the [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) extension for Visual Studio Code.

4. Install the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension for Visual Studio Code.

5. Check out this repository and open the parent folder in Visual Studio Code.

6. Follow the steps outlined in the [Build](#build) section to build, test, and
deploy development versions of the extension.

---

- The first time this repository is opened in Visual Studio Code, the
`.devcontainer` folder will be detected. In the bottom right-hand corner of the
screen, a prompt will be displayed: “Folder contains a Dev Container
configuration file. Reopen folder to develop in a container.”.
- Selecting the “Reopen in Container” option will automatically start the
process of creating the Dev Container; this may take a few minutes the first
time the container is created, or any time the settings for the container have
changed and the container needs to be recreated.
- If there are issues running the `ci.sh` script in a clean checkout, check the
`Files: Eol` setting in Visual Studio Code. Change it to \n, open the `ci.sh`
file, save it, and retry the script.

### Windows Subsystem For Linux

1. To configure the WSL if it is not already available on the development
machine, follow this [tutorial](https://docs.microsoft.com/en-us/learn/modules/get-started-with-windows-subsystem-for-linux/).

2. Follow [Git on WSL Instructions](https://docs.microsoft.com/en-us/windows/wsl/tutorials/wsl-git) if Git is not already installed on the development machine.

3. Follow [Node Installation Instructions](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl) to enable Node for WSL.

4. Install the latest version of [Visual Studio Code](https://code.visualstudio.com/).

5. Install the [Remote – WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) extension for Visual Studio Code.

6. Check out this repository and open the parent folder in Visual Studio Code.

7. If VSCode does not recognize the WSL on its own, in the top right hand
corner of the terminal window, select the down arrow to "Launch Profile..."
and select the name of the distribution in use to create a new WSL terminal.

8. Perform the commands listed in the [Dockerfile](.devcontainer/Dockerfile) to
globally install required packages such as dotnet core.

9. Run the [setup_ci.sh](RetrospectiveExtension.Frontend/scripts/setup_ci.sh)
script to configure the WSL for the pre-commit hook.

10. Follow the steps outlined in the [Build](#build) section to build, test,
and deploy development versions of the extension.

---

- Some commands, such as `dotnet build` and `npm run build:p` may need `sudo`
prefixed to execute successfully.

### Github Codespaces

1. If necessary, read GitHub's [codespace creation](https://docs.github.com/en/codespaces/developing-in-codespaces/creating-a-codespace) documentation.

2. Create a branch for the work you are planning to complete.

3. Create a codespace through the new branch's dropdown on GitHub.

4. Codespaces are powered by [Visual Studio Code and dev containers](https://docs.github.com/en/codespaces/developing-in-codespaces/developing-in-a-codespace) - once the codespace has been entered, you can follow the instructions within the [dev containers section](#dev-containers) for continuing to set up the development environment. View the [Developing in a codespace](https://docs.github.com/en/codespaces/developing-in-codespaces/developing-in-a-codespace) documentation for additional details.

## Build

### Test in Azure DevOps

Test changes in the Azure DevOps environment by publishing a development
version of the extension under an Azure DevOps publisher account.

---

1. Clone this repository, and open in your preferred [development environment](#development-environments).
2. Using Powershell, navigate to the `/RetrospectiveExtension.Frontend` folder,
run `npm install`. This will download all the dependent packages listed in
`package.json`.
3. When developing or publishing the extension locally, you need to create a .env file at the top level directory of the front end project (where `package.json` lives). You can copy `RetrospectiveExtension.Frontend/.env.template` to `RetrospectiveExtension.Frontend/.env` to get started. The contents of the `.env` file are

    ```bash
    # Backend Service URL
    REACT_APP_COLLABORATION_STATE_SERVICE_URL="put the deployed backend service url here"
    # App Instrumentation Key
    REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY="put Instrumentation key here"
    ```

    - In lieu of the .env file you can set actual environment variables.

    - When using the CI/CD github action(s) pipeline to deploy the extension,
    environment variables are used to set Application Insights instrumentation
    key and the backend service url.

4. Run `npm run build:d` or `npm run build:p` to build the project. The
difference in commands is `development` versus `production`, respectively;
the `production` command will generate a smaller bundle.
5. To test your changes, you will need to publish a new extension under a new
Azure DevOps publisher account. Refer to the
[documentation](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts)
on publishing extensions. You can publish it to any test Azure DevOps
organization that you are an admin of (As a Microsoft employee, you can create
a new test organization from your Azure DevOps profile page). Currently this is
the only way to test the extension.
6. Copy the file `vss-extension-dev.json.template` into a new
`vss-extension-dev.json` file with the new publisher that you setup. Also
update the name and id fields.

    ```json
    {
      "manifestVersion": 1,
      "id": <any new id>,
      "publisher": <the new publisher you created>,
      "version": <your staring version>,
      "name": <your extension's name. Can be any name you can identify by. Eg. Retrospectives-test>,
    }
    ```

7. Run `npm run pack:d` to package the modules into a Azure DevOps extension
package. This generated package has a `.vsix` extension. This package is
generated using information from the manifest file and your built code. Refer
to the [documentation](https://docs.microsoft.com/en-us/azure/devops/extend/develop/manifest?view=vsts)
to know more about extension manifests.
8. [Publish your to the marketplace](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts#publish).
Once published, share the extension with the newly created test org. See
[this link](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts#share)
for documentation on sharing.

---

- Once the extension has been shared with your test org, you can install it to
your org and start using it. This installation process is similar to installing
any other DevOps extensions. Refer to
[this link](https://docs.microsoft.com/en-us/azure/devops/marketplace/install-extension?view=vsts)
for instructions. Since the extension is still in preview mode, it needs to be
enabled for the Azure DevOps project. Enable the extension from the
`Preview Features` tab.

- Now start using the extension to test your changes.

- For updates, rebuild and package your extension and publish an update from
the Azure DevOps marketplace. That will automatically update the extension in
your project.

- For the real time live syncing to work, our service needs to know your
publisher id and your extension's unique key. To enable real time updates for
your test extension, please
[reach out to us](https://github.com/microsoft/vsts-extension-retrospectives/issues)
with your publisher id and the
[unique key](https://docs.microsoft.com/en-us/azure/devops/extend/develop/auth?view=vsts#get-your-extensions-key)
of your extension.

### Test with Hot Reload and Debug

Test changes by loading changes locally without having to re-package and
re-publish the extension in the marketplace.

---

#### Hot Reload Prerequisites

1. [Azure DevOps Extension Hot Reload and Debug](https://github.com/microsoft/azure-devops-extension-hot-reload-and-debug)

2. [Visual Studio Code](https://code.visualstudio.com/download)

3. [Firefox](https://www.mozilla.org/en-US/firefox/)

4. [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=firefox-devtools.vscode-firefox-debug) VS Code extension

---

1. In the `RetrospectiveExtension.Frontend` folder, create the
`vss-extension-dev.json` file using the template file
`vss-extension-dev.json.template` for reference.
2. Update the `webpack.config.js` to enable source maps. Set the devtool
property to `inline-source-map`. Also set `devServer.https` to true and
devServer.port to 3000.

    ```js
    module.exports = {
      devtool: 'inline-source-map',
      devServer: {
        https: true,
        port: 3000,
        static: {
          directory: path.join(__dirname),
        }
      },
    ...
    ```

3. Set `output.publicPath` to `/dist/` in the webpack.config.json file. This
will allow webpack to serve files from `https://localhost:3000/dist`.

    ```js
    module.exports = {
        output: {
          publicPath: "/dist/"
          // ...
        }
        // ..
    };
    ```

4. In the root of the project, create a folder named `.vscode`. In there,
create a file named `launch.json`, which will help to set up a debug
configuration for VS Code that launches Firefox with the correct path mappings.
Inside of this file, you will add a path mapping with `url` set to
`webpack:///` and have the path set to
`${workspaceFolder}/RetrospectiveExtension.Frontend/`. Also set the reAttach
property on the configuration to true to avoid restarting Firefox every time
you debug.

    ```json
    {
      "version": "0.2.0",
      "configurations": [
        {
          "name": "Launch Firefox",
          "type": "firefox",
          "request": "launch",
          "url": "https://localhost:3000/",
          "reAttach": true,
          "pathMappings": [
            {
              "url": "webpack://retrospective-vsts-extension/components",
              "path": "${workspaceFolder}/RetrospectiveExtension.Frontend/components"
            },
            {
              "url": "webpack://retrospective-vsts-extension/dal",
              "path": "${workspaceFolder}/RetrospectiveExtension.Frontend/dal"
            },
            {
              "url": "webpack:///",
              "path": "${workspaceFolder}/RetrospectiveExtension.Frontend/"
            }
          ]
        }
      ]
    }
    ```

5. Navigate to the `/RetrospectiveExtension.Frontend` folder, run `npm install`
to download all the dependent packages listed in `package.json`.
6. Run `npm run build:d` to build the project.
7. Run `npm run start:dev` to start the webpack-dev-server
8. Start debugger (making sure the webpack-dev-server is still running). The
default launch configuration should be set to Launch Firefox.
9. Once Firefox starts up, you should get an untrusted certificate error page.
Select Advanced and then select **Accept the Risk and Continue** and log into
your Azure DevOps account. From now on, if you leave this Firefox window open,
the debugger will reattach instead of starting a clean Firefox instance each
time.
10. Once you are logged in to Azure DevOps, your extension should be running.
Set a breakpoint in a method in VS Code and you should see that breakpoint hit
when that method executes.

### Test with Deployed Backend Service

The Retrospectives extension uses the
[Azure SignalR service](https://azure.microsoft.com/en-us/services/signalr-service/)
 to add real time support. The backend codebase can be found
 [here](https://github.com/microsoft/vsts-extension-retrospectives/tree/master/RetrospectiveExtension.Backend).

To enable real time updates from your test extension you will need to deploy
the backend to Azure specifying your publisher id and the unique key of your
extension.

---

#### Notes

- This setup is ***not*** required for contributing to this extension, but can
be helpful if you want certain debugging options available to you.
- If you are part of a team working on the Retrospectives extension you can
deploy a single backend to support multiple developer test extensions.

#### Backend Prerequisites

1. Azure CLI - [installation instructions here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)

2. dotnet CLI - the CLI comes as a part of the [.NET SDK](https://dotnet.microsoft.com/en-us/download/dotnet/5.0)

3. the `zip` CLI tool - via `brew install zip` or `apt-get install zip` in a unix-flavored environment.

#### Setup

1. Copy `/deploy/.env.template` to `/deploy/.env` and make the following
changes:
   - Add the Service Principal values used by the `env_setup.sh` script.
   [Instructions on how to create a Service Principal](https://docs.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli#password-based-authentication).
   - Add the `RESOURCE_NAME_SUFFIX` value. This will be used for naming
   all Azure resources including the App Service name - `https://<RESOURCE_NAME_SUFFIX>.azurewebsites.net`.
   **Note:** The app name must be globally unique so select something accordingly.
   - Add the `LOCATION`value i.e. "eastus", "westus", etc.

2. Copy `/allowed_origins.json.template` to `/allowed_origins.json` and replace
the `<publisher id>` with your publisher id. This id uniquely identifies your
publisher in the Visual Studio Marketplace. If you are part of a team working
on the retro tool you can add additional allowed origins. There should be two
allowed origins per publisher id. Remember to increment the name index as you
add additional origins.

3. Copy `/dev_certs.json.template` to `/dev_certs.json` and replace the
`<extension secret>` with your secret. [Instructions on how to download the
unique key](https://docs.microsoft.com/en-us/azure/devops/extend/develop/auth?view=vsts#get-your-extensions-key).
If you are part of a team working on the retro tool you can add additional
secrets. Remember to increment the name index to add additional secrets.

4. Run the `deploy/env_setup.sh` script.

5. Once the script completes, it will output the url of the backend service. You can navigate to the [Azure Portal](https://portal.azure.com)
and validate that the `rg-<RESOURCE_NAME_SUFFIX>` resource group exists and
contains the App Service, App Service Plan and SignalR resources.

6. Update the `RetrospectiveExtension.FrontEnd/config/environment.tsx` to
reflect changes to:
   - `CollaborationStateServiceUrl` value to the App Service URL -
`https://<RESOURCE_NAME_SUFFIX>.azurewebsites.net`.
   - `AppInsightsInstrumentKey` value to Application Insights' Instrumentation
   Key for the resource `ai-<RESOURCE_NAME_SUFFIX>`.

7. After updating the above values redeploy the extension.

## Frontend Development

### Frontend Style Guide

This extension uses [ESLint](https://eslint.org/) for consistent formatting
and styling within the React components.

### Frontend Unit Testing

#### Framework

React Component tests are written using the following packages:

- [Jest Testing Framework](https://jestjs.io/)
- [Enzyme Testing utility](https://enzymejs.github.io/enzyme/)
- [Enzyme to JSON](https://github.com/adriantoine/enzyme-to-json)

---

#### Test Coverage

To automatically generate the test coverage report, add the `--coverage` flag
to the `test` script defined in
[package.json](RetrospectiveExtension.Frontend/package.json). After the test
run is completed, coverage statistics will then be reported in the newly
created `coverage` directory.

---

#### Test Execution

- `npm install` must be executed before running any tests.
- `npm run test` is the default test execution method defined in the
[package.json](RetrospectiveExtension.Frontend/package.json) file. This will
automatically run all of the tests in files suffixed with `.test.tsx` inside of
the [tests folder](RetrospectiveExtension.Frontend/components/__tests__).
- `npm run test:watch` will run tests in watch mode, re-running tests every
time a component change is saved.
- `jest --env=jsdom --silent -ci --testResultsProcessor=jest-junit {FULL_FILE_PATH}`
can be used to run tests only in the specified file. Wildcards also work
instead of a fully qualified path.

---

#### Mocks

- In this project, mocks have been implemented for simulating API calls and
external module functionality. Reusable mocks should be added to the
[mock folder](RetrospectiveExtension.Frontend/components/__mocks__).
- Mocks which are shared by the majority of tests should be initialized in the
[test setup file](RetrospectiveExtension.Frontend/components/__tests__/setupTests.tsx).

---

#### Snapshots

To ensure proper rendering of components, snapshots tests are being used
to compare expected component rendering state against its actual state.
Snapshot tests will fail when changes are made to components that are not
accounted for through updates to these stored snapshots.

To update snapshots, delete the snapshot for the component you are testing,
(located in the [snapshots folder](RetrospectiveExtension.Frontend/components/__tests__/__snapshots__))
and run the test command. On test run completion, new snapshots should be
created. Please check the newly created snapshot file, to ensure that the
expected changes are present, and include the snapshot in your pull request.

## Backend Development

### Backend Style Guide

Follow the coding guidelines here - [C# Coding Conventions (C# Programming Guide)](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/inside-a-program/coding-conventions).

### Storage

The Retrospectives tool uses the [Azure DevOps data service](https://docs.microsoft.com/en-us/azure/devops/extend/develop/data-storage?view=vsts) for handling all its storage.

### Code

1. The project is developed using the [.NET Core](https://docs.microsoft.com/en-us/dotnet/core/)
development platform. The `CollaborationStateService` web project contains the
code for the backend service. Since .NET Core is platform independent, project
can be developed on any operating system.

2. The `ReflectBackend.ReflectHub` class contains the implementation of all the
functions that the backend service supports. New methods should be added here
to support more real time scenarios.

3. Examples:
   - The code snippet below provides a method that the client can use to join a
  backend Group. Groups in SignalR provide a method for broadcasting messages
  to specified subsets of connected clients. Any client using this method gets
  added to the group that it specifies by the reflectBoardId.

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

   - The code snippet below broadcasts that a new Feedback specified by the
   `feedbackItemId` is available on the board specified by `reflectBoardId`.
   The `columnId` specifies which column of the board the item was added to.
   Clients can use this method to signal to other clients that a new Feedback
   was added to one of its boards.

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

### Backend Unit Testing

Unit Tests for the Backend are located in the
[Backend Tests folder](RetrospectiveExtension.Backend.Tests/). To execute
these tests, perform the following steps:

1. Navigate to the `RetrospectiveExtension.Backend` folder.

2. Execute `dotnet restore`.

3. Execute `dotnet build`.

4. Execute `dotnet test ../RetrospectiveExtension.Backend.Tests`.

5. View test results in the terminal.

## Application Monitoring and Telemetry

1. The Retro tool uses
[Azure Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
to capture application logs, telemetry and performance data.

2. A custom Azure portal is deployed as part of the backend deployment script
that enables real time monitoring of the application. The dashboard includes
useful telemetry data such as number of active user sessions, histogram of
React Components visited, HTTP requests made, page load times, backend and
front end exceptions and other metrics.

## License Information

Copyright (c) Microsoft Corporation. All rights reserved.

---

[Return to Table of Contents](#table-of-contents)
