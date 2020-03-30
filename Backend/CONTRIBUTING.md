---
ms.reviewedAt: 03/22/2019
ms.reviewedBy: proak
---

# Contributing

_Welcome and thank you for your interest in contributing to **Reflect(Retrospectives) Backend**! Before contributing to this project, please review this document for policies and procedures which will ease the contribution and review process for everyone. If you have questions, please contact the **[Retrospectives team](retrospectives@microsoft.com)**. This project adopted Inner Source [model](https://oe-documentation.azurewebsites.net/inner-source/index.html)._

## Issues and Feature Requests

Please reach out to the [Retrospectives team](retrospectives@microsoft.com) to report any issues or feature requests.
TODO: Add paths to create issues or feature requests.

## Style Guidelines

Follow the coding guidelines here - http://aka.ms/csharpguidelines.

## Pull Request Process

1. Clone the repository to your local machine.
2. Create a new local branch from the 'master' branch. Follow the '<alias>/<nameofyourbranch>' naming convention for your branch.
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
