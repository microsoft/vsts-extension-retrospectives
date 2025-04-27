import { WorkItem } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';
import { IFeedbackBoardDocument, IFeedbackItemDocument, ITeamEffectivenessMeasurementVoteCollection } from '../interfaces/feedback';
import { appInsights } from '../utilities/telemetryClient';
import { encrypt, getUserIdentity } from '../utilities/userIdentityHelper';
import { workItemService } from './azureDevOpsWorkItemService';
import { createDocument, deleteDocument, readDocument, readDocuments, updateDocument } from './dataService';
import { generateUUID } from '../utilities/random';
import { IColumnItem } from '../../frontend/components/feedbackBoard';

class ItemDataService {
  /**
   * Create an item with given title and column ID in the board.
   */
  public appendItemToBoard = async (item: IFeedbackItemDocument): Promise<IFeedbackItemDocument> => {
    return await createDocument<IFeedbackItemDocument>(item.boardId, item);
  }

  /**
   * Create an item with given title and column ID in the board.
   */
  public createItemForBoard = async (
    boardId: string, title: string, columnId: string, isAnonymous: boolean = true): Promise<IFeedbackItemDocument> => {
    const itemId: string = generateUUID();
    const userIdentity = getUserIdentity();

    const feedbackItem: IFeedbackItemDocument = {
      boardId,
      columnId,
      originalColumnId: columnId,
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
      groupIds: [],
      isGroupedCarouselItem: false
    };

    const createdItem: IFeedbackItemDocument =
      await createDocument<IFeedbackItemDocument>(boardId, feedbackItem);
    createdItem.voteCollection = {};

    return createdItem;
  }

  /**
   * Get the feedback item.
   */
  public getFeedbackItem = async (boardId: string, feedbackItemId: string): Promise<IFeedbackItemDocument> => {
    const feedbackItem: IFeedbackItemDocument =
      await readDocument<IFeedbackItemDocument>(boardId, feedbackItemId);
    return feedbackItem;
  }

  /**
   * Get the board item.
   */
  public getBoardItem = async (teamId: string, boardId: string): Promise<IFeedbackBoardDocument> => {
    // Can we get it this way? [const boardItem:  IFeedbackBoardDocument = await boardDataService.getBoardForTeamById(VSS.getWebContext().team.id, boardId);]
    return await readDocument<IFeedbackBoardDocument>(teamId, boardId);
  }

  /**
   * Get all feedback items in the board.
   */
  public getFeedbackItemsForBoard = async (boardId: string): Promise<IFeedbackItemDocument[]> => {
    let feedbackItems: IFeedbackItemDocument[] = [];

    try {
      // Attempt to fetch feedback items
      feedbackItems = await readDocuments<IFeedbackItemDocument>(boardId, false, true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // Handle specific case where the collection does not exist
      if (e.serverError?.typeKey === 'DocumentCollectionDoesNotExistException') {
        console.warn(`No feedback items found for board ${boardId}—expected for new or unused boards.`);

        // Add telemetry for observability
        appInsights.trackTrace({
          message: `Feedback items not found for board ${boardId}.`,
          properties: { boardId, exception: e }
        });

        return []; // Gracefully return an empty array
      }

      // Log unexpected exceptions
      console.error(`Unexpected error fetching feedback items for board ${boardId}:`, e);
      appInsights.trackException(e);
    }

    return feedbackItems; // Return fetched data or an empty array
  };

  /**
   * Get feedback items in the board matching the specified item IDs.
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

    const feedbackItem: IFeedbackItemDocument = await readDocument<IFeedbackItemDocument>(boardId, feedbackItemId);
    if (feedbackItem && feedbackItem.upvotes > 0) {
      console.log(`Cannot delete a feedback item which has upvotes. Board: ${boardId} Item: ${feedbackItemId}`);
      return undefined;
    }

    if(feedbackItem && feedbackItem.upvotes > 0) {
      console.log(`Cannot delete a feedback item which has upvotes. Board: ${boardId} Item: ${feedbackItemId}`);
      return undefined;
    }

    if (feedbackItem.parentFeedbackItemId) {
      const parentFeedbackItem: IFeedbackItemDocument = await readDocument<IFeedbackItemDocument>(boardId, feedbackItem.parentFeedbackItemId);

      parentFeedbackItem.childFeedbackItemIds = parentFeedbackItem.childFeedbackItemIds.filter(id => id !== feedbackItemId);

      updatedParentFeedbackItem = await this.updateFeedbackItem(boardId, parentFeedbackItem);
    }
    else if (feedbackItem.childFeedbackItemIds) {
      const childFeedbackItemPromises = feedbackItem.childFeedbackItemIds.map((childFeedbackItemId) => {
        return readDocument<IFeedbackItemDocument>(boardId, childFeedbackItemId);
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

    await deleteDocument(boardId, feedbackItemId);

    return {
      updatedParentFeedbackItem,
      updatedChildFeedbackItems
    };
  }

  /**
   * Update the feedback item.
   */
  private readonly updateFeedbackItem = async (boardId: string, feedbackItem: IFeedbackItemDocument): Promise<IFeedbackItemDocument> => {
    const updatedFeedbackItem: IFeedbackItemDocument = await updateDocument<IFeedbackItemDocument>(boardId, feedbackItem);
    return updatedFeedbackItem;
  }

  /**
   * Update the board item.
   */
  private readonly updateBoardItem = async (teamId: string, boardItem: IFeedbackBoardDocument): Promise<IFeedbackBoardDocument> => {
    const updatedBoardItem: IFeedbackBoardDocument = await updateDocument<IFeedbackBoardDocument>(teamId, boardItem);
    return updatedBoardItem;
  }

  /**
   * Check if the user has voted on this item.
   */

  public oldisVoted = async (boardId: string, userId: string, feedbackItemId: string): Promise<string> => {
    const feedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItemId);

    if (!feedbackItem) {
      return undefined;
    }

    if (feedbackItem.upvotes <= 0) {
      return "0";
    } else if (feedbackItem.voteCollection[userId] === undefined || feedbackItem.voteCollection[userId] === null || feedbackItem.voteCollection[userId] === 0) {
      return "0";
    }
    else {
      return feedbackItem.voteCollection[userId].toString();
    }
  }
  public isVoted = async (boardId: string, userId: string, feedbackItemId: string): Promise<string> => {
    const feedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItemId);
  
    if (!feedbackItem) {
      return undefined;
    }
  
    if (feedbackItem.upvotes <= 0 || !feedbackItem.voteCollection) {
      return "0";
    }
  
    const userVotes = feedbackItem.voteCollection[userId];
  
    if (userVotes === undefined || userVotes === null || userVotes === 0) {
      return "0";
    }
  
    return userVotes.toString();
  }
  
  /**
   * Calculate total votes for a feedback item.
   */
  public getVotes(feedbackItem: IFeedbackItemDocument): number {
    return Object.values(feedbackItem.voteCollection || {}).reduce((sum, votes) => sum + votes, 0);
  }

  /**
   * Calculate total votes for a specific user on a feedback item.
   */
  public getVotesByUser(feedbackItem: IFeedbackItemDocument, encryptedUserId: string): number {
    return feedbackItem.voteCollection?.[encryptedUserId] || 0;
  }

  /**
   * Calculate total votes for grouped feedback items.
   */
  public getVotesForGroupedItems(
    mainFeedbackItem: IFeedbackItemDocument,
    groupedFeedbackItems: IFeedbackItemDocument[]
  ): number {
    const mainItemVotes = itemDataService.getVotes(mainFeedbackItem);
    const groupedItemsVotes = groupedFeedbackItems.reduce((sum, item) => {
      return sum + itemDataService.getVotes(item);
    }, 0);

    return mainItemVotes + groupedItemsVotes;
  }

  /**
   * Calculate total votes for a specific user on a set of grouped feedback items.
   */
  public getVotesForGroupedItemsByUser(
    mainFeedbackItem: IFeedbackItemDocument,
    groupedFeedbackItems: IFeedbackItemDocument[],
    encryptedUserId: string
  ): number {
    // Calculate votes for the main feedback item using getTotalVotesByUser
    const mainItemVotesByUser = this.getVotesByUser(mainFeedbackItem, encryptedUserId);

    // Calculate votes for all grouped feedback items using getTotalVotesByUser
    const groupedItemsVotesByUser = groupedFeedbackItems.reduce((sum, item) => {
      return sum + this.getVotesByUser(item, encryptedUserId);
    }, 0);

    // Return the total votes cast by the user
    return mainItemVotesByUser + groupedItemsVotesByUser;
  }

  /**
   * Sort feedback items by total grouped votes then by created date
   */
  public sortItemsByVotesAndDate(items: IColumnItem[], allItems: IColumnItem[]): IColumnItem[] {
    return [...items].sort((a, b) => {
      // Get child items (grouped items) for both a and b
      const groupedItemsA = allItems.filter(item => a.feedbackItem.childFeedbackItemIds?.includes(item.feedbackItem.id));
      const groupedItemsB = allItems.filter(item => b.feedbackItem.childFeedbackItemIds?.includes(item.feedbackItem.id));

      // Calculate total votes using getVotesForGroupedItems
      const totalVotesA = this.getVotesForGroupedItems(a.feedbackItem, groupedItemsA.map(item => item.feedbackItem));
      const totalVotesB = this.getVotesForGroupedItems(b.feedbackItem, groupedItemsB.map(item => item.feedbackItem));

      // Primary sort by total votes (descending)
      if (totalVotesB !== totalVotesA) {
        return totalVotesB - totalVotesA;
      }

      // Secondary sort by created date (descending)
      return new Date(b.feedbackItem.createdDate).getTime() - new Date(a.feedbackItem.createdDate).getTime();
    });
  }

  /**
   * Increment or decrement the vote of the feedback item.
   */
  public updateVote = async (
    boardId: string,
    teamId: string,
    userId: string,
    feedbackItemId: string,
    decrement: boolean = false
  ): Promise<IFeedbackItemDocument> => {
    const encryptedUserId = encrypt(userId);

    // Step 1: Fetch Feedback and Board Items
    const feedbackItem = await this.getFeedbackItem(boardId, feedbackItemId);
    const boardItem = await this.getBoardItem(teamId, boardId);

    // Early return if either item is not found
    if (!feedbackItem || !boardItem) {
      return undefined;
    }

    // Step 2: Validate Voting Eligibility
    if (!this.validateVotingEligibility(feedbackItem, boardItem, encryptedUserId, decrement)) {
      return undefined;
    }

    // Step 3: Modify Votes
    this.modifyVotes(feedbackItem, boardItem, encryptedUserId, decrement);

    // Step 4: Update Feedback and Board Items
    const updatedFeedbackItem = await this.updateFeedbackItem(boardId, feedbackItem);
    const updatedBoardItem = await this.updateBoardItem(teamId, boardItem);

    // Handle rollback in case of update failure
    if (!updatedBoardItem) {
      this.rollbackVotes(feedbackItem, encryptedUserId, decrement);
      return await this.updateFeedbackItem(boardId, feedbackItem);
    }

    return updatedFeedbackItem;
  };

  private validateVotingEligibility(
    feedbackItem: IFeedbackItemDocument,
    boardItem: IFeedbackBoardDocument,
    userId: string,
    decrement: boolean
  ): boolean {
    const userVotes = boardItem.boardVoteCollection?.[userId] || 0;
    const itemVotes = feedbackItem.voteCollection?.[userId] || 0;

    if (decrement) {
      // Check if the user has votes to decrement
      return userVotes > 0 && itemVotes > 0 && feedbackItem.upvotes > 0;
    } else {
      // Check if the user has remaining votes to cast
      const maxVotes = boardItem.maxVotesPerUser;
      return userVotes < maxVotes;
    }
  }

  private modifyVotes(
    feedbackItem: IFeedbackItemDocument,
    boardItem: IFeedbackBoardDocument,
    userId: string,
    decrement: boolean
  ): void {
    const voteChange = decrement ? -1 : 1;

    // Initialize vote collections if needed
    feedbackItem.voteCollection = feedbackItem.voteCollection || {};
    boardItem.boardVoteCollection = boardItem.boardVoteCollection || {};

    feedbackItem.voteCollection[userId] = (feedbackItem.voteCollection[userId] || 0) + voteChange;
    boardItem.boardVoteCollection[userId] = (boardItem.boardVoteCollection[userId] || 0) + voteChange;
    feedbackItem.upvotes += voteChange;
  }

  private rollbackVotes(
    feedbackItem: IFeedbackItemDocument,
    userId: string,
    decrement: boolean
  ): void {
    const voteChange = decrement ? 1 : -1;

    feedbackItem.voteCollection[userId] = (feedbackItem.voteCollection[userId] || 0) + voteChange;
    feedbackItem.upvotes += voteChange;
  }

  /**
   * flip the timer state.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public flipTimer = async (boardId: string, feedbackItemId: string, timerid: any): Promise<IFeedbackItemDocument> => {
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
  public updateTimer = async (boardId: string, feedbackItemId: string, setZero: boolean = false): Promise<IFeedbackItemDocument> => {
    const feedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItemId);

    if (!feedbackItem) {
      return undefined;
    }

    if (setZero) {
      feedbackItem.timerSecs = 0;
    }
    else {
      feedbackItem.timerSecs++;
    }

    const updatedFeedbackItem = await this.updateFeedbackItem(boardId, feedbackItem);

    return updatedFeedbackItem;
  }

  /**
   * Update the team effectiveness measurement.
   */
  public updateTeamEffectivenessMeasurement = async (boardId: string, teamId: string, currentUserId: string, teamEffectivenessMeasurementVoteCollection: ITeamEffectivenessMeasurementVoteCollection[]): Promise<IFeedbackBoardDocument> => {
    const boardItem: IFeedbackBoardDocument = await this.getBoardItem(teamId, boardId);

    if (boardItem === undefined) {
      return undefined;
    }

    if (boardItem.teamEffectivenessMeasurementVoteCollection === undefined) {
      boardItem.teamEffectivenessMeasurementVoteCollection = [];
    }

    if (boardItem.teamEffectivenessMeasurementVoteCollection.find(e => e.userId === currentUserId) === undefined || boardItem.boardVoteCollection[currentUserId] === null) {
      boardItem.teamEffectivenessMeasurementVoteCollection.push({ userId: currentUserId, responses: [] });
    }

    boardItem.teamEffectivenessMeasurementVoteCollection.find(e => e.userId === currentUserId).responses = teamEffectivenessMeasurementVoteCollection.find(e => e.userId === currentUserId).responses;

    await this.updateBoardItem(teamId, boardItem);

    return boardItem;
  }

  /**
   * Update the title of the feedback item.
   */
  public updateTitle = async (boardId: string, feedbackItemId: string, title: string): Promise<IFeedbackItemDocument> => {
    const feedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItemId);

    if (!feedbackItem) {
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
  public addFeedbackItemAsChild = async (boardId: string, parentFeedbackItemId: string, childFeedbackItemId: string): Promise<{ updatedParentFeedbackItem: IFeedbackItemDocument, updatedChildFeedbackItem: IFeedbackItemDocument, updatedOldParentFeedbackItem: IFeedbackItemDocument, updatedGrandchildFeedbackItems: IFeedbackItemDocument[] }> => {
    const parentFeedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, parentFeedbackItemId);
    const childFeedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, childFeedbackItemId);

    if (!parentFeedbackItem || !childFeedbackItem) {
      return undefined;
    }

    // The parent feedback item must not be a child of another group.
    if (parentFeedbackItem.parentFeedbackItemId) {
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
  public addFeedbackItemAsMainItemToColumn = async (boardId: string, feedbackItemId: string, newColumnId: string): Promise<{ updatedOldParentFeedbackItem: IFeedbackItemDocument, updatedFeedbackItem: IFeedbackItemDocument, updatedChildFeedbackItems: IFeedbackItemDocument[] }> => {
    const feedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItemId);

    if (!feedbackItem) {
      return undefined;
    }

    let updatedOldParentFeedbackItem: IFeedbackItemDocument;

    if (feedbackItem.parentFeedbackItemId) {
      const parentFeedbackItem: IFeedbackItemDocument = await this.getFeedbackItem(boardId, feedbackItem.parentFeedbackItemId);
      if (!parentFeedbackItem) {
        return undefined;
      }

      parentFeedbackItem.childFeedbackItemIds = parentFeedbackItem.childFeedbackItemIds.filter((item) => item !== feedbackItemId);

      updatedOldParentFeedbackItem = await this.updateFeedbackItem(boardId, parentFeedbackItem);
    }

    let updatedChildFeedbackItems: IFeedbackItemDocument[] = []
    if (feedbackItem.columnId !== newColumnId && feedbackItem.childFeedbackItemIds) {
      let getChildFeedbackItemPromises: Promise<IFeedbackItemDocument>[] = [];

      getChildFeedbackItemPromises = feedbackItem.childFeedbackItemIds.map((childFeedbackItem) => this.getFeedbackItem(boardId, childFeedbackItem));

      const childFeedbackItems = await Promise.all(getChildFeedbackItemPromises).then((promiseResults) => {
        return promiseResults.map((childFeedbackItem) => {
          childFeedbackItem.columnId = newColumnId;
          return childFeedbackItem;
        })
      });

      const updatedChildFeedbackItemPromises: Promise<IFeedbackItemDocument>[] = childFeedbackItems.map((childFeedbackItem) => this.updateFeedbackItem(boardId, childFeedbackItem));

      updatedChildFeedbackItems = await Promise.all(updatedChildFeedbackItemPromises).then((promiseResults) => {
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
      appInsights.trackException(e);
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
      appInsights.trackException(e);
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
      appInsights.trackException(e);
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
      appInsights.trackException(e);
      return await this.removeAssociatedActionItem(boardId, feedbackItemId, associatedWorkItemId);
    }

    if (!workItems || !workItems.length) {
      return await this.removeAssociatedActionItem(boardId, feedbackItemId, associatedWorkItemId);
    }

    return await this.getFeedbackItem(boardId, feedbackItemId);
  }
}

export const itemDataService = new ItemDataService();
