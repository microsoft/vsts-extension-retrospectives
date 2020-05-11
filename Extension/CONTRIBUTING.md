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
2. Create a new local branch from the 'master' branch. Follow the 'users/<alias>/<nameofyourbranch>' naming convention for your branch. 
3. Publish the newly created branch to the Retrospectives repo. Use this branch as your working branch.
4. Once you are ready to check-in, create a pull request against the 'master' branch. Link the Bug/Task that you are fixing/adding to the pull request. Reviewers will be added automatically.

## Development on Windows
### Clone repo
 Clone the repository to your local machine from the Azure DevOps endpoint.
 
### Build and Test
**Note:** You will need NodeJS to be able to build the project and download depedencies. Go [here](https://nodejs.org/en/download/) to download NodeJS. 
**Note:** The project uses webpack for module bundling. Refer to the webpack documentation [here](https://webpack.js.org/).

1. Open the 'Retrospective.sln' file with Visual Studio or open the Retrospectives folder with Visual Studio Code. You can also use any IDE or editor that you normally use to work with React/Typescript. Using Powershell, navigate to the /Retrospective/Retrospective.Hub.Extension' folder.
2. Run  ```npm install```. This will download all the dependent packages listed in 'package.json'.
3. Run ```npm run build``` to build the project. Refer to the 'scripts' section in 'package.json' for other commands.
4. To test your changes, you will need to publish a new extension under a new Azure DevOps publisher account. Refer to the [documentation](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts) on publishing extensions. You can publish it to any test Azure DevOps organization that you are an admin of (As a Microsoft employee, you can create a new test organization from your Azure DevOps profile page). Currently this is the only way to test the extension. 
5. Update the 'vss-extension-dev.json' file with the new publisher that you setup. Also update the name and id fields.
    ```json
    {
      "manifestVersion": 1,
      "id": <any new id>,
      "publisher": <the new publisher you created>,
      "version": <your staring version>,
      "name": <your extension's name. Can be any name you can identify by. Eg. Retrospectives-test>,
    }
    ```
6. Run ```npm run pack``` to package the modules into a Azure DevOps extension package. This generated package has a '.vsix' extension. This package is generated using information from the manifest file and your built code. Refer to the [documentation](https://docs.microsoft.com/en-us/azure/devops/extend/develop/manifest?view=vsts) to know more about extension manifests.
7. [Publish your to the marketplace](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts#publish). Once published, share the extension with the newly created test org. See [this link](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=vsts#share) for documentation on sharing.
8. Once the extension has been shared with your test org, you can install it to your org and start using it. This installation process is similar to installing any other DevOps extensions. Refer to [this link](https://docs.microsoft.com/en-us/azure/devops/marketplace/install-extension?view=vsts) for instructions. Since the extension is still in preview mode, it needs to be enabled for the Azure DevOps project. Enable the extension from the 'Preview Features' tab.
9. Now start using the extension to test your changes.
10. For updates, simple rebuild and package your extension and publish an update from the Azure DevOps marketplace. That will automatically update the extension in your project.
11. For the real time live syncing to work, our service needs to know your publisher id and your extension's unique key. To enable real time updates for your test extension, please [reach out to us](mailto:retrospectives@microsoft.com?subject=[InnerSource]%20Add%20package%20secret%20for%20backend%20support) with your publisher id and the unique key of your extension. [Instructions on how to download the unique key](https://docs.microsoft.com/en-us/azure/devops/extend/develop/auth?view=vsts#get-your-extensions-key).

### Storage
The Retrospectives tool uses the [Azure DevOps data service](https://docs.microsoft.com/en-us/azure/devops/extend/develop/data-storage?view=vsts) for handling all its storage.

### Backend
The Retrospectives tool uses the [Azure SignalR service](https://azure.microsoft.com/en-us/services/signalr-service/) to add real time support. The backend codebase can be found [here](https://github.com/microsoft/vsts-extension-retrospectives/tree/master/Backend).
