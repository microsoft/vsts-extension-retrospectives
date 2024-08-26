import { createDocument, deleteDocument, readDocument, readDocuments, updateDocument } from './dataService';
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions, IFeedbackColumn, IFeedbackItemDocument } from '../interfaces/feedback';
import { WorkflowPhase } from '../interfaces/workItem';
import { getUserIdentity } from '../utilities/userIdentityHelper';
import { generateUUID } from '../utilities/random';

class BoardDataService {
  public readonly legacyPositiveColumnId: string = 'whatwentwell';
  public readonly legacyNegativeColumnId: string = 'whatdidntgowell';

  public createBoardForTeam = async (
    teamId: string,
    title: string,
    maxVotesPerUser: number,
    columns: IFeedbackColumn[],
    isIncludeTeamEffectivenessMeasurement?: boolean,
    isAnonymous?: boolean,
    shouldShowFeedbackAfterCollect?: boolean,
    displayPrimeDirective?: boolean,
    startDate?: Date,
    endDate?: Date,
    permissions?: IFeedbackBoardDocumentPermissions) => {
    const boardId: string = generateUUID();
    const userIdentity = getUserIdentity();

    const board: IFeedbackBoardDocument = {
      activePhase: WorkflowPhase.Collect,
      columns,
      createdBy: userIdentity,
      createdDate: new Date(Date.now()),
      endDate,
      id: boardId,
      isIncludeTeamEffectivenessMeasurement: isIncludeTeamEffectivenessMeasurement ?? false,
      isAnonymous: isAnonymous ?? false,
      modifiedDate: new Date(Date.now()),
      shouldShowFeedbackAfterCollect: shouldShowFeedbackAfterCollect ?? false,
      displayPrimeDirective: displayPrimeDirective ?? false,
      maxVotesPerUser,
      startDate,
      teamId,
      title,
      boardVoteCollection: {},
      teamEffectivenessMeasurementVoteCollection: [],
      isPublic: this.isBoardPublic(permissions),
      permissions: permissions
    }

    return await createDocument<IFeedbackBoardDocument>(teamId, board);
  }

  public checkIfBoardNameIsTaken = async (teamId: string, boardName: string) => {
    const teamBoards: IFeedbackBoardDocument[] = await this.getBoardsForTeam(teamId);

    const boardNameExists =
      teamBoards.find(teamBoard => {
        return (teamBoard.title.replace(/\s+/g, ' ').trim().localeCompare(boardName.replace(/\s+/g, ' ').trim(), [],
          { sensitivity: "accent" }) === 0);
      });

    return boardNameExists ? true : false;
  }

  public getBoardsForTeam = async (teamId: string) => {
    let teamBoards: IFeedbackBoardDocument[] = [];

    try {
      teamBoards = await readDocuments<IFeedbackBoardDocument>(teamId, false, true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.serverError?.typeKey === 'DocumentCollectionDoesNotExistException') {
        // TODO (enpolat) : appInsightsClient.trackTrace(TelemetryExceptions.BoardsNotFoundForTeam, e, AI.SeverityLevel.Warning);
      }
    }

    return teamBoards;
  }

  public getBoardForTeamById = async (teamId: string, boardId: string) => {
    return await readDocument<IFeedbackBoardDocument>(teamId, boardId);
  }

  public deleteFeedbackBoard = async (teamId: string, boardId: string) => {
    // Delete all documents in this board's collection.
    const boardItems = await readDocuments<IFeedbackItemDocument>(boardId);
    if (boardItems && boardItems.length) {
      boardItems.forEach(async (item) => {
        await deleteDocument(boardId, item.id);
      });
    }

    await deleteDocument(teamId, boardId);
  }

  public updateBoardMetadata = async (teamId: string, boardId: string, maxvotesPerUser: number, title: string, newColumns: IFeedbackColumn[], permissions: IFeedbackBoardDocumentPermissions): Promise<IFeedbackBoardDocument> => {
    const board: IFeedbackBoardDocument = await this.getBoardForTeamById(teamId, boardId);

    // Check in case board was deleted by other user after option to update was selected by current user
    if (!board) {
      console.log(`Cannot update title for a non-existent feedback board. Board: ${boardId}`);
      return undefined;
    }

    board.title = title;
    board.maxVotesPerUser = maxvotesPerUser;
    board.columns = newColumns;
    board.modifiedDate = new Date(Date.now());
    board.isPublic = this.isBoardPublic(permissions),
    board.permissions = permissions;

    return await this.updateBoard(teamId, board);
  }

  // Update the board document.
  private updateBoard = async (teamId: string, board: IFeedbackBoardDocument): Promise<IFeedbackBoardDocument> => {
    return await updateDocument<IFeedbackBoardDocument>(teamId, board);
  }

  private isBoardPublic = (permissions: IFeedbackBoardDocumentPermissions): boolean => {
    return permissions === undefined || (permissions.Teams.length === 0 && permissions.Members.length === 0);
  }
}

export default new BoardDataService();
