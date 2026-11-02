# Contributing

## Summary Announcement

> Hi everyone!
>
> Maintaining the `Retrospective Extension for Azure DevOps` has been a passion project we’ve pursued in our personal time. While we’ll continue to handle security updates and occasional feature improvements when we can, our available time is limited. To help take the project to the next level, we’d love to invite contributors to join us in making it even better for the community.
>
> If you're interested in contributing, please check out the repo and the [Contributing Guideline](./CONTRIBUTING.md)! Together, we can ensure the project continues to thrive! 🚀

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/microsoft/vsts-extension-retrospectives/badge)](https://scorecard.dev/viewer/?uri=github.com/microsoft/vsts-extension-retrospectives)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/9514/badge)](https://www.bestpractices.dev/projects/9514)
[![CodeCov](https://codecov.io/gh/microsoft/vsts-extension-retrospectives/branch/main/graph/badge.svg?token=XU0895TPB4)](https://codecov.io/gh/microsoft/vsts-extension-retrospectives)
[![CI and CD for Frontend](https://github.com/microsoft/vsts-extension-retrospectives/actions/workflows/ci_cd_frontend.yml/badge.svg)](https://github.com/microsoft/vsts-extension-retrospectives/actions/workflows/ci_cd_frontend.yml)

## Table of Contents

- [Background](#background)
- [Ways to Contribute](#ways-to-contribute)
  - [Reporting Issues](#reporting-issues)
  - [Helping the Community](#helping-the-community)
  - [Adding Features and Fixing Bugs](#adding-features-and-fixing-bugs)
- [Contributing Guidelines](#contributing-guidelines)
  - [Branching and Pull Requests](#branching-and-pull-requests)
  - [Continuous Integration (CI) and Pre-commit Hook](#continuous-integration-ci-and-pre-commit-hook)
- [Development Environments](#development-environments)
  - [Visual Studio Code - Dev Containers](#dev-containers)
  - [Windows Subsystem for Linux (WSL)](#windows-subsystem-for-linux)
  - [Github Codespaces](#github-codespaces)
- [Build](#build)
  - [Test in Azure DevOps](#test-in-azure-devops)
  - [Test with Hot Reload and Debug](#test-with-hot-reload-and-debug)
- [Frontend Development](#frontend-development)
  - [Style Guide](#frontend-style-guide)
  - [Storage and Live Updates](#storage-and-live-updates)
  - [Unit Testing](#frontend-unit-testing)
- [Application Monitoring and Telemetry](#application-monitoring-and-telemetry)

## Background

Retrospectives is an Azure DevOps extension. Visit the [Azure DevOps Extension overview](https://docs.microsoft.com/en-us/azure/devops/extend/?view=vsts) to learn more about developing extensions. The Retrospectives Azure DevOps extension is implemented in React using Typescript and runs entirely in the browser: it stores its data in Azure DevOps and has no backend service. The project follows a single branch source control strategy.

## Ways to Contribute

There are several ways you can contribute to the Retrospectives extension:

### Reporting Issues

If you encounter bugs, have feature requests, or need help with the extension, please visit the [GitHub Issues](https://github.com/microsoft/vsts-extension-retrospectives/issues) page. When reporting an issue:

1. Search existing issues to avoid duplicates
2. Use the appropriate issue template
3. Provide clear steps to reproduce the problem
4. Include relevant screenshots or error messages
5. Specify your browser, Azure DevOps version, and extension version

### Helping the Community

You can help other users by participating in community discussions:

- **GitHub Discussions**: Join conversations and share insights at the [GitHub Discussions](https://github.com/microsoft/vsts-extension-retrospectives/discussions) page
- **GitHub Issues**: Help answer questions and provide solutions in existing [GitHub Issues](https://github.com/microsoft/vsts-extension-retrospectives/issues)
- Share your experience and best practices with the extension
- Help troubleshoot problems reported by other users

### Adding Features and Fixing Bugs

If you want to contribute code changes, bug fixes, or new features:

1. Follow the [Contributing Guidelines](#contributing-guidelines) outlined in this document
2. Read through the [Development Environments](#development-environments) section to set up your local development environment*
3. Review the [Frontend Development](#frontend-development) section for specific guidance
4. Ensure your changes include appropriate tests and documentation

*Alternatively, watch the [Azure DevOps Retrospective Extension - Setting Up Development Environment](https://www.youtube.com/watch?v=GwsscfcAjg8) video for instructions on setting up your development environment.

## Contributing Guidelines

### Branching and Pull Requests

1. When creating a new branch, follow the `{alias}/{issue##}` naming convention. - **Note:** It is recommended to keep the branch name length below 30 characters in order to allow the Github Action which builds and deploys the development extension on pull request creation or update to successfully execute.

2. Once your feature addition or bug fix is ready for review, create a pull request against the `main` branch of the repository.

3. Include a link to the GitHub issue you are addressing to the description of your pull request. Reviewers will be added to the pull request automatically.

4. Ensure all CI/CD checks are successful after the creation of the pull request.

5. Update any documentation, user and contributor, that is impacted by your changes.

6. Add one release documentation label to your pull request: `docs updated` when you updated release-facing content such as the changelog, What's New, README, or package description; or `docs not needed` when you reviewed those files and no update is required. The frontend CI pipeline fails when neither label is present.

7. You may merge the pull request in once you have the sign-off from one developer from the [Retrospectives team](mailto:retrospectives@microsoft.com), or if you do not have permission to do that, you may request the reviewer to merge it for you.

### Continuous Integration (CI) and Pre-commit Hook

Our CI pipeline can be invoked on Github, or if you want to get ahead of the potential failures, you can use the [`pre-commit` configuration](./.pre-commit-config.yaml). It will run linting on markdown files and Python files, and run a spellcheck. The same rules will be caught locally that will be caught in Github actions.

To use `pre-commit`, it's recommended to have a [Python virtual environment (venv)](https://docs.python.org/3/library/venv.html#creating-virtual-environments).  If the venv ends with `-env`, such as `retro-env`, then the `.gitignore` is configured to not watch this environment during development!

Either in the [dev container](#dev-containers) or locally:

1. Run: `pip install -r requirements.txt`
2. Run: `pre-commit install`
3. To run the checks ahead of commiting:
    - `pre-commit run` will run the pre-commit hooks against staged files
    - `pre-commit run --all-files` will run against *everything*
    - `pre-commit run markdownlint` to run the markdown linting
    - `pre-commit run spellcheck-cli` to run the spellchecking

4. To run linting for the typescript/javascript (must be done within the `src/frontend` directory): `npm run lint`

Read more about the [Python pre-commit framework](https://pre-commit.com/). To disable the pre-commit hook run `pre-commit uninstall` from the root folder.

## Development Environments

The Retrospectives Extension can be built, developed and tested in several development environments. This section highlights three of the primary environments in order of relevance.

All of the development prerequisites, are listed in the [DevContainer Configuration](.devcontainer/devcontainer.json). This file can be opened in a text editor and the tools and extensions can be used to configure the prerequisites outside of a [dev container](#dev-containers).

### Dev Containers

1. Install the latest version of [Visual Studio Code](https://code.visualstudio.com/).

2. Install the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension for Visual Studio Code.

3. Check out this repository and open the parent folder in Visual Studio Code.

4. Follow the steps outlined in the [Build](#build) section to build, test, and deploy development versions of the extension.

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

1. To configure the WSL if it is not already available on the development machine, follow this [tutorial](https://docs.microsoft.com/en-us/learn/modules/get-started-with-windows-subsystem-for-linux/).

2. Follow [Git on WSL Instructions](https://docs.microsoft.com/en-us/windows/wsl/tutorials/wsl-git) if Git is not already installed on the development machine.

3. Follow [Node Installation Instructions](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl) to enable Node for WSL.

4. Install the latest version of [Visual Studio Code](https://code.visualstudio.com/).

5. Install the [Remote – WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) extension for Visual Studio Code.

6. Check out this repository and open the parent folder in Visual Studio Code.

7. If VSCode does not recognize the WSL on its own, in the top right hand corner of the terminal window, select the down arrow to "Launch Profile..." and select the name of the distribution in use to create a new WSL terminal.

8. Follow the steps outlined in the [Build](#build) section to build, test, and deploy development versions of the extension.

---

- Some commands, such as `npm run build` may need `sudo` prefixed to execute successfully.

### Github Codespaces

1. If necessary, read GitHub's [codespace creation](https://docs.github.com/en/codespaces/developing-in-codespaces/creating-a-codespace) documentation.

2. Create a branch for the work you are planning to complete.

3. Create a codespace through the new branch's dropdown on GitHub.

4. Codespaces are powered by [Visual Studio Code and dev containers](https://docs.github.com/en/codespaces/developing-in-codespaces/developing-in-a-codespace) \- once the codespace has been entered, you can follow the instructions within the [dev containers section](#dev-containers) for continuing to set up the development environment. View the [Developing in a codespace](https://docs.github.com/en/codespaces/developing-in-codespaces/developing-in-a-codespace) documentation for additional details.

## Build

To build the frontend for production, run `make build` from the repository root
after installing frontend dependencies with `npm ci --prefix src/frontend`.

To run the frontend tests with coverage in jsdom, run `make test` from the
repository root.

### Test in Azure DevOps

Test changes in the Azure DevOps environment by publishing a development version of the extension under an Azure DevOps publisher account.

---

1. Clone this repository, and open in your preferred [development environment](#development-environments).
2. Using Powershell, navigate to the `/src/frontend` folder, run `npm install`. This will download all the dependent packages listed in `package.json`.
3. When developing or publishing the extension locally, you need to create a .env file at the top-level directory of the front end project (where `package.json` lives). You can copy `src/frontend/.env.template` to `src/frontend/.env` to get started.

The contents of the `.env` file are

  ```bash
  # App Instrumentation Key
  REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY="put Instrumentation key here"
  ```

- In lieu of the .env file you can set actual environment variables.

- When using the CI/CD Github action(s) pipeline to deploy the extension, environment variables are used to set the Application Insights instrumentation key.

1. Run `npm run build:d` or `npm run build:p` to build the project. The difference in commands is `development` versus `production`, respectively; the `production` command will generate a smaller bundle.
2. To test your changes, you will need to publish a new extension under a new Azure DevOps publisher account. Refer to the [documentation](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts) on publishing extensions. You can publish it to any test Azure DevOps organization that you are an admin of. (As a Microsoft employee, you can create a new test organization from your Azure DevOps profile page.) Currently this is the only way to test the extension.
3. Copy the file `vss-extension-dev.json.template` into a new `vss-extension-dev.json` file with the new publisher that you setup. Also update the name and ID fields.

  ```json
  {
    "manifestVersion": 1,
    "id": <any new ID>,
    "publisher": <the new publisher you created>,
    "version": <your staring version>,
    "name": <your extension's name. Can be any name you can identify by. Eg. Retrospectives-test>,
  }
  ```

1. Run `npm run pack:d` to package the modules into a Azure DevOps extension package. This generated package has a `.vsix` extension. This package is generated using information from the manifest file and your built code. Refer to the [documentation](https://docs.microsoft.com/en-us/azure/devops/extend/develop/manifest?view=vsts) to know more about extension manifests.
2. [Publish your package to the marketplace](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts#publish).  Once published, share the extension with the newly created test org. See [this link](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts#share) for documentation on sharing.

---

1. Once the extension has been shared with your test org, you can install it to your org and start using it. This installation process is similar to installing any other DevOps extensions. Refer to [this link](https://docs.microsoft.com/en-us/azure/devops/marketplace/install-extension?view=vsts) for instructions. Since the extension is still in preview mode, it needs to be enabled for the Azure DevOps project. Enable the extension from the `Preview Features` tab.

2. Now start using the extension to test your changes.

- For updates, rebuild and package your extension and publish an update from the Azure DevOps marketplace. That will automatically update the extension in your project.

- Live updates work in test extensions without any extra setup, since they only use Azure DevOps.

### Test with Hot Reload and Debug

Test changes by loading changes locally without having to re-package and re-publish the extension in the marketplace.

---

#### Hot Reload Prerequisites

1. [Azure DevOps Extension Hot Reload and Debug](https://github.com/microsoft/azure-devops-extension-hot-reload-and-debug)

2. [Visual Studio Code](https://code.visualstudio.com/download)

3. [Firefox](https://www.mozilla.org/en-US/firefox/)

4. [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=firefox-devtools.vscode-firefox-debug) VS Code extension

---

1. In the `src/frontend` folder, create the `vss-extension-dev.json` file using the template file `vss-extension-dev.json.template` for reference.
2. Update the `webpack.config.js` to enable source maps. Set the devtool property to `inline-source-map`. Also set `devServer.https` to true and devServer.port to 3000.

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

3. Set `output.publicPath` to `/dist/` in the webpack.config.json file. This will allow webpack to serve files from `https://localhost:3000/dist`.

    ```js
    module.exports = {
        output: {
          publicPath: "/dist/"
          // ...
        }
        // ..
    };
    ```

4. In the root of the project, create a folder named `.vscode`. In there, create a file named `launch.json`, which will help to set up a debug configuration for VS Code that launches Firefox with the correct path mappings.  Inside of this file, you will add a path mapping with `url` set to `webpack:///` and have the path set to `${workspaceFolder}/src/frontend/`. Also set the reAttach property on the configuration to true to avoid restarting Firefox every time you debug.

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
              "path": "${workspaceFolder}/src/frontend/components"
            },
            {
              "url": "webpack://retrospective-vsts-extension/dal",
              "path": "${workspaceFolder}/src/frontend/dal"
            },
            {
              "url": "webpack:///",
              "path": "${workspaceFolder}/src/frontend/"
            }
          ]
        }
      ]
    }
    ```

5. Navigate to the `/src/frontend` folder, run `npm install` to download all the dependent packages listed in `package.json`.
6. Run `npm run build:d` to build the project.
7. Run `npm run start:dev` to start the webpack-dev-server
8. Start debugger (making sure the webpack-dev-server is still running). The default launch configuration should be set to Launch Firefox.
9. IF YOU ARE ON WINDOWS -> Access Firefox settings from the hamburger menu. Navigate to `Privacy & Security` and under `Logins and Passwords` select `Allow Windows single sign-on for Microsoft, work and school accounts`. This is necessary to login to Azure otherwise you will be blocked by a Microsoft management policy for Firefox. This step needs to be completed each time you launch the debugger as it launches Firefox with a cleared cache and default settings.
10. Once Firefox starts up, you should get an untrusted certificate error page.  Select Advanced and then select **Accept the Risk and Continue** and log into your Azure DevOps account. From now on, if you leave this Firefox window open, the debugger will reattach instead of starting a clean Firefox instance each time.
11. Once you are logged in to Azure DevOps, your extension should be running.  Set a breakpoint in a method in VS Code and you should see that breakpoint hit when that method executes.

## Frontend Development

### Frontend Style Guide

This extension uses [ESLint](https://eslint.org/) for consistent formatting and styling within the React components.

### Storage and Live Updates

The extension has no backend service. All data is stored with the [Azure DevOps data service](https://docs.microsoft.com/en-us/azure/devops/extend/develop/data-storage?view=vsts) (boards in one collection per team, feedback items in one collection per board), and work items are read through the Azure DevOps REST clients.

Changes made by other users are picked up by polling with the shared loop in [pollingLoop.ts](src/frontend/utilities/pollingLoop.ts), the same approach used by the [Estimate extension](https://github.com/microsoft/azure-boards-estimate):

- `FeedbackBoard` polls the feedback items of the open board and `FeedbackBoardContainer` polls the open board every 2 seconds (`LIVE_SYNC_POLL_INTERVAL_MS`). A `poll` callback resolves `false` when it found nothing new (`FeedbackBoard` compares a fingerprint of the polled items, see `getFeedbackItemsFingerprint`; `FeedbackBoardContainer` checks whether the polled board is newer). After 5 polls in a row that found nothing new, such a loop polls every 6 seconds (`LIVE_SYNC_IDLE_POLL_INTERVAL_MS`) until a poll finds a change; resolving `true` or nothing counts as a change. `FeedbackBoardContainer` polls the team's list of boards every 2 minutes (`BOARD_LIST_POLL_INTERVAL_MS`) and also when the Board selection dropdown gets focus, unless the list was fetched in the last 10 seconds (`BOARD_LIST_FOCUS_REFRESH_MIN_AGE_MS`).
- A loop runs one poll at a time, pauses while the browser tab is hidden, backs off exponentially after errors (up to about 30 seconds), and polls right away, back at the regular pace, when the tab becomes visible again or the browser comes back online.
- Polls use the strict data access methods (for example `getFeedbackItemsForBoardStrict` and `getBoardsForTeamStrict`). These only treat a missing collection or document as empty and throw on any other error, so a failed read is retried instead of being mistaken for deleted data.
- Polled documents are merged by their `__etag` revision (`mergeServerFeedbackItems`, `mergePolledBoard`). Unchanged columns and items keep their object identity, an older server copy never overwrites a newer local copy or a change that is still being saved, and items deleted locally are not brought back by a stale read.

To share a change with other users, save it through the data services in [src/frontend/dal](src/frontend/dal). Other users pick it up on their next poll, so there is nothing to broadcast.

### Frontend Unit Testing

#### Framework

React Component tests are written using the following packages:

- [Jest Testing Framework](https://jestjs.io/)
- [Enzyme Testing utility](https://enzymejs.github.io/enzyme/)
- [Enzyme to JSON](https://github.com/adriantoine/enzyme-to-json)

---

#### Test Coverage

To automatically generate the test coverage report, add the `--coverage` flag to the `test` script defined in
[package.json](src/frontend/package.json). After the test run is completed, coverage statistics will then be reported in the newly created `coverage` directory.

---

#### Test Execution

- `npm install` must be executed before running any tests.
- `npm run test` is the default test execution method defined in the [package.json](src/frontend/package.json) file. This will automatically run all of the tests in files suffixed with `.test.tsx` inside of the [tests folder](src/frontend/components/__tests__).
- `jest --env=jsdom --silent -ci --testResultsProcessor=jest-junit {FULL_FILE_PATH}` can be used to run tests only in the specified file. Wildcards also work instead of a fully qualified path.

---

#### Mocks

- In this project, mocks have been implemented for simulating API calls and external module functionality. Reusable mocks should be added to the [mock folder](src/frontend/components/__mocks__).
- Mocks which are shared by the majority of tests should be initialized in the [test setup file](src/frontend/components/__tests__/setupTests.tsx).

---

## Application Monitoring and Telemetry

1. The Retro tool uses [Azure Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview) to capture application logs, telemetry and performance data.

2. Failed live update polls are tracked as exceptions with the `pollFeedbackItems`, `pollCurrentBoard` or `pollTeamBoards` action and the number of consecutive failures, which helps to find users whose boards are not receiving updates.

## License Information

Copyright (c) Microsoft Corporation. All rights reserved.
