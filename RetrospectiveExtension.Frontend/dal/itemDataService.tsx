import * as ExtensionDataService from './dataService';
import { IFeedbackItemDocument, IFeedbackBoardDocument, ITeamEffectivenessMeasurementVoteCollection } from '../interfaces/feedback';
import { WorkItem } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';
import { workItemService } from './azureDevOpsWorkItemService';
// TODO (enpolat) : import { appInsightsClient, TelemetryExceptions } from '../utilities/appInsightsClient';
import { v4 as uuid } from 'uuid';
import { getUserIdentity } from '../utilities/userIdentityHelper';

class ItemDataService {
  /**
   * Create an item with given title and column id in the board.
   */
  public createItemForBoard = async (
    boardId: string, title: string, columnId: string, isAnonymous: boolean = true): Promise<IFeedbackItemDocument> => {
    const itemId: string = uuid();
    const userIdentity = getUserIdentity();

    const feedbackItem: IFeedbackItemDocument = {
      boardId,
      columnId,
      createdBy: isAnonymous ? null : userIdentity,
      createdDate: new Date(Date.now()),
      id: itemId,
      title,
      voteCollection: {},
      upvotes: 0,
      userIdRef: userIdentity.id,
      timerSecs: 0,
      timerstate: false,
      timerId: null,
    };

    const createdItem: IFeedbackItemDocument =
      await ExtensionDataService.createDocument<IFeedbackItemDocument>(boardId, feedbackItem);
    createdItem.voteCollection = {};

    return createdItem;
  }

  /**
   * Get the feedback item.
   */
  public getFeedbackItem = async (boardId: string, feedbackItemId: string): Promise<IFeedbackItemDocument> => {
    const feedbackItem: IFeedbackItemDocument =
      await ExtensionDataService.readDocument<IFeedbackItemDocument>(boardId, feedbackItemId);
    return feedbackItem;
  }

  /**
   * Get the board item.
   */
  public getBoardItem = async (teamId:string, boardId: string): Promise<IFeedbackBoardDocument> => {
    // Can we get it this way? [const boardItem:  IFeedbackBoardDocument = await boardDataService.getBoardForTeamById(VSS.getWebContext().team.id, boardId);]
    return await ExtensionDataService.readDocument<IFeedbackBoardDocument>(teamId, boardId);
  }

  /**
   * Get all feedback items in the board.
   */
  public getFeedbackItemsForBoard = async (boardId: string): Promise<IFeedbackItemDocument[]> => {
    let feedbackItems: IFeedbackItemDocument[] = [];

    try {
      feedbackItems = await ExtensionDataService.readDocuments<IFeedbackItemDocument>(boardId, false, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.serverError.typeKey === 'DocumentCollectionDoesNotExistException') {
        // TODO (enpolat) : appInsightsClient.trackTrace(TelemetryExceptions.ItemsNotFoundForBoard, e, AI.SeverityLevel.Warning);
      }
    }

    return feedbackItems;
  }

  /**
   * Get feedback items in the board matching the specified item ids.
   */
  public getFeedbackItemsByIds = async (boardId: string, feedbackItemIds: string[]): Promise<IFeedbackItemDocument[]> => {
    const feedbackitemsForBoard: IFeedbackItemDocument[] = await this.getFeedbackItemsForBoard(boardId);
    const feedbackItems: IFeedbackItemDocument[] = feedbackitemsForBoard.filter(item => feedbackItemIds.find(id => id === item.id));
    return feedbackItems;
  }

  /**
   * Delete the feedback item and propagate the changes to the parent and children feedback items (if any).
   */
  public deleteFeedbackItem = async (boardId: string, feedbackItemId: string): Promise<{ updatedParentFeedbackItem: IFeedbackItemDocument, updatedChildFeedbackItems: IFeedbackItemDocument[] }> => {

    let updatedParentFeedbackItem: IFeedbackItemDocument = null;
    let updatedChildFeedbackItems: IFeedbackItemDocument[] = [];

    const feedbackItem: IFeedbackItemDocument = await ExtensionDataService.readDocument<IFeedbackItemDocument>(boardId, feedbackItemId);
    if(feedbackItem && feedbackItem.upvotes > 0) {
      console.log(`Cannot delete a feedback item which has upvotes. Board: ${boardId} Item: ${feedbackItemId}`);
      return undefined;
    }

    if (feedbackItem.parentFeedbackItemId) {
      const parentFeedbackItem: IFeedbackItemDocument =
        await ExtensionDataService.readDocument<IFeedbackItemDocument>(boardId, feedbackItem.parentFeedbackItemId);

      parentFeedbackItem.childFeedbackItemIds = parentFeedbackItem.childFeedbackItemIds.filter(id => id !== feedbackItemId);
      updatedParentFeedbackItem = await this.updateFeedbackItem(boardId, parentFeedbackItem);

    }
    else if (feedbackItem.childFeedbackItemIds) {
      const childFeedbackItemPromises = feedbackItem.childFeedbackItemIds.map((childFeedbackItemId) => {
        return ExtensionDataService.readDocument<IFeedbackItemDocument>(boardId, childFeedbackItemId);
      });

      const updatedChildFeedbackItemPromises = await Promise.all(childFeedbackItemPromises).then((childFeedbackItems) => {
        return childFeedbackItems.map((childFeedbackItem) => {
          childFeedbackItem.parentFeedbackItemId = null;
          return this.updateFeedbackItem(boardId, childFeedbackItem);
        })
      });

      updatedChildFeedbackItems = await Promise.all(updatedChildFeedbackItemPromises).then((updatedChildFeedbackItems) => {
        return updatedChildFeedbackItems.map((updatedChildFeedbackItem) => updatedChildFeedbackItem);
      });
    }

    await ExtensionDataService.deleteDocument(boardId, feedbackItemId);

    return {
      updatedParentFeedbackItem,
      updatedChildFeedbackItems
    };
  }

  /**
   * Update the feedback item.
   */
  private updateFeedbackItem = async (boardId: string, feedbackItem: IFeedbackItemDocument): Promise<IFeedbackItemDocument> => {
    const updatedFeedbackItem: IFeedbackItemDocument = await ExtensionDataService.updateDocument<IFeedbackItemDocument>(boardId, feedbackItem);
    return updatedFeedbackItem;
  }

  /**
   * Update the board item.
   */
  private updateBoardItem = async (teamId: string, boardItem: IFeedbackBoardDocument): Promise<IFeedbackBoardDocument> => {
    const updatedBoardItem: IFeedbackBoardDocument = await ExtensionDataService.updateDocument<IFeedbackBoardDocument>(teamId, boardItem);
    return updatedBoardItem;
  }

  /**
   * Check if the user has voted on this item.
   */

  public isVoted = async (boardId: string, userId: string, feedbackItemId: string): Promise<string> =>
  {
    const feedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItemId);

    if (!feedbackItem) {
      console.log(`Cannot increment upvote for a non-existent feedback item. Board: ${boardId}, Item: ${feedbackItemId}`);
      return undefined;
    }

    if (feedbackItem.upvotes <= 0) {
      return "0";
    } else {
      if (feedbackItem.voteCollection[userId] === null || feedbackItem.voteCollection[userId] === 0) {
        return "0";
      }
      else {
        return feedbackItem.voteCollection[userId].toString();
      }
    }

  }

  /**
   * flip the timer state.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public flipTimer = async (boardId: string, feedbackItemId: string, timerid: any): Promise<IFeedbackItemDocument> =>
  {
    const feedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItemId);

    if (!feedbackItem) {
      console.log(`Cannot flip the timer state for a non-existent feedback item. Board: ${boardId}, Item: ${feedbackItemId}`);
      return undefined;
    }

    if (feedbackItem.timerstate === false) {
      feedbackItem.timerstate = true;
    }
    else {
      feedbackItem.timerstate = false;
    }
    feedbackItem.timerId = timerid;
    const updatedFeedbackItem = await this.updateFeedbackItem(boardId, feedbackItem);
    return updatedFeedbackItem;
  }

  /**
   * update the timer count.
   */
  public updateTimer = async (boardId: string, feedbackItemId: string, setZero: boolean=false): Promise<IFeedbackItemDocument> =>
  {
    const feedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItemId);

    if (!feedbackItem) {
      console.log(`Cannot increment the timer seconds for a non-existent feedback item. Board: ${boardId}, Item: ${feedbackItemId}`);
      return undefined;
    }

    if (setZero)
    {
      feedbackItem.timerSecs = 0;
    }
    else
    {
      feedbackItem.timerSecs++;
    }
    const updatedFeedbackItem = await this.updateFeedbackItem(boardId, feedbackItem);
    return updatedFeedbackItem;
  }

  /**
   * Increment/Decrement the vote of the feedback item.
   */
  public updateVote = async (boardId: string, teamId: string, userId: string, feedbackItemId: string, decrement: boolean = false): Promise<IFeedbackItemDocument> => {
    const feedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItemId);

    if (!feedbackItem) {
      console.log(`Cannot increment upvote for a non-existent feedback item. Board: ${boardId}, Item: ${feedbackItemId}`);
      return undefined;
    }
    const boardItem: IFeedbackBoardDocument = await this.getBoardItem(teamId, boardId);

    if (boardItem == undefined) {
      console.log(`Cannot retrieve board for the feedback. Board: ${boardId}, Item: ${feedbackItemId}`);
      return undefined;
     }

    if (decrement) {
      if(!boardItem.boardVoteCollection ||
        !boardItem.boardVoteCollection[userId] ||
        boardItem.boardVoteCollection[userId] <= 0) {
          console.log(`Cannot decrement item with zero or less votes. Board ${boardId}, Item: ${feedbackItemId}`);
          return undefined;
      }

      if (feedbackItem.upvotes <= 0) {
        console.log(`Cannot decrement upvote as votes must be > 0 to decrement. Board: ${boardId}, Item: ${feedbackItemId}`);
        return undefined;
      } else {
        if (feedbackItem.voteCollection[userId] === null || feedbackItem.voteCollection[userId] === 0) {
          console.log(`Cannot decrement upvote as your votes must be > 0 to decrement. Board: ${boardId}, Item: ${feedbackItemId}`);
          return undefined;
        }
        else {
          feedbackItem.voteCollection[userId]--;
          feedbackItem.upvotes--;
          boardItem.boardVoteCollection[userId]--;
        }
      }
    } else {
      if (feedbackItem.voteCollection === undefined) {
        feedbackItem.voteCollection = {};
      }
      if (feedbackItem.voteCollection[userId] === undefined || feedbackItem.voteCollection[userId] === null) {
        feedbackItem.voteCollection[userId] = 0;
      }

      if (boardItem.boardVoteCollection === undefined) {
        boardItem.boardVoteCollection = {};
      }
      if (boardItem.boardVoteCollection[userId] === undefined || boardItem.boardVoteCollection[userId] === null) {
        boardItem.boardVoteCollection[userId] = 0;
      }

      if (boardItem.boardVoteCollection[userId] >= boardItem.maxVotesPerUser) {
        console.log(`User has reached max votes for the board. Board: ${boardId}, Max Votes: ${boardItem.maxVotesPerUser}`);

        return undefined;
      }

      boardItem.boardVoteCollection[userId]++;

      feedbackItem.voteCollection[userId]++;
      feedbackItem.upvotes++;
    }

    const updatedFeedbackItem = await this.updateFeedbackItem(boardId, feedbackItem);

    if(!updatedFeedbackItem) {
      console.log(`The feedback item was not incremented or decremented. Board: ${boardId}, Item: ${feedbackItemId}`);
      return undefined;
    }

    const updatedBoardItem = await this.updateBoardItem(teamId, boardItem);
    if(!updatedBoardItem) {
      console.log(`Could not update board, votes will be removed from or added to the feedback item.
        Board: ${boardId}, Item: ${feedbackItemId}`);

      updatedFeedbackItem.voteCollection[userId] = decrement ?
        updatedFeedbackItem.voteCollection[userId]++ : updatedFeedbackItem.voteCollection[userId]--;
      updatedFeedbackItem.upvotes = decrement ? updatedFeedbackItem.upvotes++ : updatedFeedbackItem.upvotes--;

      const feedbackItemWithOriginalVotes = await this.updateFeedbackItem(boardId, updatedFeedbackItem);
      if (feedbackItemWithOriginalVotes) {
        return feedbackItemWithOriginalVotes;
      }
      console.log(`Cannot remove or add votes from feedback item. Board ${boardId}, Item: ${updatedFeedbackItem.id}`);
    }

    return updatedFeedbackItem;
  }

  /**
   * Update the team effectiveness measurement.
   */
   public updateTeamEffectivenessMeasurement = async (boardId: string, teamId: string, userId: string, teamEffectivenessMeasurementVoteCollection: ITeamEffectivenessMeasurementVoteCollection[]): Promise<IFeedbackBoardDocument> => {
    const boardItem: IFeedbackBoardDocument = await this.getBoardItem(teamId, boardId);

    if (boardItem === undefined) {
      console.log(`Cannot retrieve board for the feedback. Board: ${boardId}`);
      return undefined;
    }

    if (boardItem.teamEffectivenessMeasurementVoteCollection === undefined) {
      boardItem.teamEffectivenessMeasurementVoteCollection = [];
    }

    if (boardItem.teamEffectivenessMeasurementVoteCollection.find(e => e.userId === userId) === undefined || boardItem.boardVoteCollection[userId] === null) {
      boardItem.teamEffectivenessMeasurementVoteCollection.push({ userId: userId, responses: []});
    }

    boardItem.teamEffectivenessMeasurementVoteCollection.find(e => e.userId === userId).responses = teamEffectivenessMeasurementVoteCollection.find(e => e.userId === userId).responses;

    await this.updateBoardItem(teamId, boardItem);

    return boardItem;
  }

  /**
   * Update the title of the feedback item.
   */
  public updateTitle = async (boardId: string, feedbackItemId: string, title: string): Promise<IFeedbackItemDocument> => {
    const feedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItemId);

    if (!feedbackItem) {
      console.log(`Cannot update title for a non-existent feedback item. Board: ${boardId}, Item: ${feedbackItemId}`);
      return undefined;
    }

    feedbackItem.title = title;

    const updatedFeedbackItem = await this.updateFeedbackItem(boardId, feedbackItem);
    return updatedFeedbackItem;
  }

  /**
   * Add a feedback item as a child feedback item of another feedback item.
   * This method also ensures that
   *   1) an existing parent-child association is removed from the old parent if the childFeedbackItem already had one.
   *   2) the existing children of the child feedback item (if any) become children of the specified parent
   *   feedback item as well.
   *   3) that the child feedback item and the existing children of the child feedback item (if any) are
   *   assigned the same columnId as the parent feedback item.
   */
  public addFeedbackItemAsChild = async (boardId: string, parentFeedbackItemId: string, childFeedbackItemId: string):
    Promise<{
      updatedParentFeedbackItem: IFeedbackItemDocument,
      updatedChildFeedbackItem: IFeedbackItemDocument,
      updatedOldParentFeedbackItem: IFeedbackItemDocument,
      updatedGrandchildFeedbackItems: IFeedbackItemDocument[]
    }> => {
    const parentFeedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, parentFeedbackItemId);
    const childFeedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, childFeedbackItemId);

    if (!parentFeedbackItem || !childFeedbackItem) {
      console.log(`Cannot add child for a non-existent feedback item. 
                Board: ${boardId}, 
                Parent Item: ${parentFeedbackItemId},
                Child Item: ${childFeedbackItemId}`);
      return undefined;
    }

    // The parent feedback item must not be a child of another group.
    if (parentFeedbackItem.parentFeedbackItemId) {
      console.log(`Cannot add child if parent is already a child in another group.
                Board: ${boardId}, 
                Parent Item: ${parentFeedbackItemId}`);
      return undefined;
    }

    if (parentFeedbackItem.childFeedbackItemIds) {
      parentFeedbackItem.childFeedbackItemIds.push(childFeedbackItemId);
    } else {
      parentFeedbackItem.childFeedbackItemIds = [childFeedbackItemId];
    }

    let updatedOldParentFeedbackItem: IFeedbackItemDocument;
    if (childFeedbackItem.parentFeedbackItemId) {
      const oldParentFeedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, childFeedbackItem.parentFeedbackItemId);
      oldParentFeedbackItem.childFeedbackItemIds = oldParentFeedbackItem.childFeedbackItemIds
        .filter((existingchildFeedbackItemId) => existingchildFeedbackItemId !== childFeedbackItemId);
      updatedOldParentFeedbackItem = await this.updateFeedbackItem(boardId, oldParentFeedbackItem);
    }

    childFeedbackItem.parentFeedbackItemId = parentFeedbackItemId;

    let grandchildFeedbackItemPromises: Promise<IFeedbackItemDocument>[] = [];

    if (childFeedbackItem.childFeedbackItemIds) {
      grandchildFeedbackItemPromises = childFeedbackItem.childFeedbackItemIds.map((grandchildFeedbackItem) =>
        this.getFeedbackItem(boardId, grandchildFeedbackItem));
    }

    const grandchildFeedbackItems: IFeedbackItemDocument[] =
      await Promise.all(grandchildFeedbackItemPromises).then((promiseResults) => {
        return promiseResults.map((grandchildFeedbackItem) => {
          grandchildFeedbackItem.parentFeedbackItemId = parentFeedbackItemId;
          grandchildFeedbackItem.columnId = parentFeedbackItem.columnId;
          parentFeedbackItem.childFeedbackItemIds.push(grandchildFeedbackItem.id);
          return grandchildFeedbackItem;
        })
      });

    childFeedbackItem.childFeedbackItemIds = [];
    childFeedbackItem.columnId = parentFeedbackItem.columnId;

    const updatedParentFeedbackItem = await this.updateFeedbackItem(boardId, parentFeedbackItem);
    const updatedChildFeedbackItem = await this.updateFeedbackItem(boardId, childFeedbackItem);

    const updatedGrandchildFeedbackItemPromises: Promise<IFeedbackItemDocument>[] = grandchildFeedbackItems.map((grandchildFeedbackItem) =>
      this.updateFeedbackItem(boardId, grandchildFeedbackItem));

    const updatedGrandchildFeedbackItems: IFeedbackItemDocument[] =
      await Promise.all(updatedGrandchildFeedbackItemPromises).then((promiseResults) => {
        return promiseResults.map((updatedGrandchildFeedbackItem) => updatedGrandchildFeedbackItem)
      });

    return {
      updatedParentFeedbackItem,
      updatedChildFeedbackItem,
      updatedOldParentFeedbackItem,
      updatedGrandchildFeedbackItems,
    }
  }

  /**
   * Add the feedback item as main item to the column specified.
   * If the feedback item has a parent, the parent-child relationship is removed.
   * If the feedback item is being moved to a different column, its children are also updated.
   */
  public addFeedbackItemAsMainItemToColumn = async (boardId: string, feedbackItemId: string, newColumnId: string):
    Promise<{
      updatedOldParentFeedbackItem: IFeedbackItemDocument,
      updatedFeedbackItem: IFeedbackItemDocument,
      updatedChildFeedbackItems: IFeedbackItemDocument[]
    }> => {

    const feedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItemId);

    if (!feedbackItem) {
      console.log(`Cannot move a non-existent feedback item. 
              Board: ${boardId}, 
              Parent Item: ${feedbackItem.parentFeedbackItemId},
              Child Item: ${feedbackItemId}`);
      return undefined;
    }

    let updatedOldParentFeedbackItem: IFeedbackItemDocument;

    if (feedbackItem.parentFeedbackItemId) {
      const parentFeedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItem.parentFeedbackItemId);
      if (!parentFeedbackItem) {
        console.log(`The given feedback item has a non-existent parent. 
                Board: ${boardId}, 
                Parent Item: ${feedbackItem.parentFeedbackItemId},
                Child Item: ${feedbackItemId}`);
        return undefined;
      }

      parentFeedbackItem.childFeedbackItemIds = parentFeedbackItem.childFeedbackItemIds.filter((item) => item !== feedbackItemId);

      updatedOldParentFeedbackItem = await this.updateFeedbackItem(boardId, parentFeedbackItem);
    }

    let updatedChildFeedbackItems: IFeedbackItemDocument[] = []
    if (feedbackItem.columnId !== newColumnId && feedbackItem.childFeedbackItemIds) {
      let getChildFeedbackItemPromises: Promise<IFeedbackItemDocument>[] = [];

      getChildFeedbackItemPromises = feedbackItem.childFeedbackItemIds.map((childFeedbackItem) =>
        this.getFeedbackItem(boardId, childFeedbackItem));

      const childFeedbackItems =
        await Promise.all(getChildFeedbackItemPromises).then((promiseResults) => {
          return promiseResults.map((childFeedbackItem) => {
            childFeedbackItem.columnId = newColumnId;
            return childFeedbackItem;
          })
        });

      const updatedChildFeedbackItemPromises: Promise<IFeedbackItemDocument>[] = childFeedbackItems.map((childFeedbackItem) =>
        this.updateFeedbackItem(boardId, childFeedbackItem));
  
      updatedChildFeedbackItems =
        await Promise.all(updatedChildFeedbackItemPromises).then((promiseResults) => {
          return promiseResults.map((updatedChildFeedbackItem) => updatedChildFeedbackItem)
        });
    }

    feedbackItem.parentFeedbackItemId = null;
    feedbackItem.columnId = newColumnId;

    const updatedFeedbackItem = await this.updateFeedbackItem(boardId, feedbackItem);

    return Promise.resolve({
      updatedOldParentFeedbackItem,
      updatedFeedbackItem,
      updatedChildFeedbackItems
    });
  }

  /**
   * Add an associated work item to a feedback item.
   */
  public addAssociatedActionItem = async (boardId: string, feedbackItemId: string, associatedWorkItemId: number): Promise<IFeedbackItemDocument> => {
    let updatedFeedbackItem: IFeedbackItemDocument;

    try {
      updatedFeedbackItem = await this.getFeedbackItem(boardId, feedbackItemId);
    }
    catch (e) {
      // TODO (enpolat) : appInsightsClient.trackException(new Error(e.message));
      console.log(`Failed to read Feedback item with id: ${feedbackItemId}.`);
      updatedFeedbackItem = undefined;
    }

    if (!updatedFeedbackItem) {
      return updatedFeedbackItem;
    }

    if (!updatedFeedbackItem.associatedActionItemIds) {
      updatedFeedbackItem.associatedActionItemIds = new Array<number>();
    }

    if (updatedFeedbackItem.associatedActionItemIds.find(wi => wi === associatedWorkItemId)) {
      return updatedFeedbackItem;
    }

    updatedFeedbackItem.associatedActionItemIds.push(associatedWorkItemId);

    await this.updateFeedbackItem(boardId, updatedFeedbackItem);
    return updatedFeedbackItem;
  }

  /**
   * Remove an associated work item from a feedback item.
   */
  public removeAssociatedActionItem = async (boardId: string, feedbackItemId: string, associatedActionItemId: number): Promise<IFeedbackItemDocument> => {
    let updatedFeedbackItem: IFeedbackItemDocument;

    try {
      updatedFeedbackItem = await this.getFeedbackItem(boardId, feedbackItemId);
    }
    catch (e) {
      // TODO (enpolat) : appInsightsClient.trackException(new Error(e.message));
      console.log(`Failed to read Feedback item with id: ${feedbackItemId}.`);
      updatedFeedbackItem = undefined;
    }

    if (!updatedFeedbackItem || !updatedFeedbackItem.associatedActionItemIds) {
      return updatedFeedbackItem;
    }

    const updatedAssociatedList = updatedFeedbackItem.associatedActionItemIds.filter(workItemId => workItemId !== associatedActionItemId);
    updatedFeedbackItem.associatedActionItemIds = updatedAssociatedList;
    await this.updateFeedbackItem(boardId, updatedFeedbackItem);
    return updatedFeedbackItem;
  }

  /**
   * Get all associated work items of a feedback item.
   */
  public getAssociatedActionItemIds = async (boardId: string, feedbackItemId: string): Promise<number[]> => {
    let feedbackItem: IFeedbackItemDocument;

    try {
      feedbackItem = await this.getFeedbackItem(boardId, feedbackItemId);
    }
    catch (e) {
      // TODO (enpolat) : appInsightsClient.trackException(new Error(e.message));
      throw new Error(`Failed to read Feedback item with id: ${feedbackItemId}.`);
    }

    if (!feedbackItem) {
      throw new Error(`Feedback item with id: ${feedbackItemId} not found.`);
    }

    if (!feedbackItem.associatedActionItemIds) {
      return new Array<number>();
    }

    return feedbackItem.associatedActionItemIds;
  }

  /**
   * Checks if the work item exists in VSTS and if not, removes it.
   * This handles the special case for when a work item is deleted in VSTS. Currently, when a work item is updated using the navigation form service
   * there is no way to determine if the item was deleted.
   * https://github.com/MicrosoftDocs/vsts-docs/issues/1545
   */
  public removeAssociatedItemIfNotExistsInVsts = async (boardId: string, feedbackItemId: string, associatedWorkItemId: number): Promise<IFeedbackItemDocument> => {
    let workItems: WorkItem[];

    try {
      workItems = await workItemService.getWorkItemsByIds([associatedWorkItemId]);
    }
    catch (e) {
      // TODO (enpolat) : appInsightsClient.trackException(new Error(e.message));
      return await this.removeAssociatedActionItem(boardId, feedbackItemId, associatedWorkItemId);
    }

    if (!workItems || !workItems.length) {
      return await this.removeAssociatedActionItem(boardId, feedbackItemId, associatedWorkItemId);
    }

    return await this.getFeedbackItem(boardId, feedbackItemId);
  }
}

export const itemDataService = new ItemDataService();
