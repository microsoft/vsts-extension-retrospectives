import * as ExtensionDataService from './dataService';
import { IFeedbackBoardDocument, IFeedbackColumn, IFeedbackItemDocument } from '../interfaces/feedback';
import { v4 as uuid } from 'uuid';
import { WorkflowPhase } from '../interfaces/workItem';
import { appInsightsClient, TelemetryExceptions } from '../utilities/appInsightsClient';
import { getUserIdentity } from '../utilities/userIdentityHelper';

class BoardDataService {
  public readonly legacyPositiveColumnId: string = 'whatwentwell';
  public readonly legacyNegativeColumnId: string = 'whatdidntgowell';

  public createBoardForTeam = async (
    teamId: string, title: string, maxVotesPerUser: number, columns: IFeedbackColumn[],
    const boardId: string = uuid();
    const userIdentity = getUserIdentity();

    const board: IFeedbackBoardDocument = {
      activePhase: WorkflowPhase.Collect,
      columns,
      createdBy: userIdentity,
      createdDate: new Date(Date.now()),
      endDate,
      id: boardId,
      isAnonymous: isAnonymous ? isAnonymous : false,
      modifiedDate: new Date(Date.now()),
      shouldShowFeedbackAfterCollect: shouldShowFeedbackAfterCollect ? shouldShowFeedbackAfterCollect : false,
      maxVotesPerUser: maxVotesPerUser,
      startDate,
      teamId,
      title,
      boardVoteCollection: {},
    }

    return await ExtensionDataService.createDocument<IFeedbackBoardDocument>(teamId, board);
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
      teamBoards = await ExtensionDataService.readDocuments<IFeedbackBoardDocument>(teamId, false, true);
    } catch (e) {
      if (e.serverError.typeKey === 'DocumentCollectionDoesNotExistException') {
        appInsightsClient.trackTrace(TelemetryExceptions.BoardsNotFoundForTeam, e, AI.SeverityLevel.Warning);
      }
    }

    return teamBoards;
  }

  public getBoardForTeamById = async (teamId: string, boardId: string) => {
    return await ExtensionDataService.readDocument<IFeedbackBoardDocument>(teamId, boardId);
  }

  public deleteFeedbackBoard = async (teamId: string, boardId: string) => {
    // Delete all documents in this board's collection.
    const boardItems = await ExtensionDataService.readDocuments<IFeedbackItemDocument>(boardId);
    if (boardItems && boardItems.length) {
      boardItems.forEach(async (item) => {
        await ExtensionDataService.deleteDocument(boardId, item.id);
      });
    }

    await ExtensionDataService.deleteDocument(teamId, boardId);
  }

  public updateBoardMetadata = async (teamId: string, boardId: string, maxvotesPerUser:number, title: string, newColumns: IFeedbackColumn[]): Promise<IFeedbackBoardDocument> => {
    const board: IFeedbackBoardDocument = await this.getBoardForTeamById(teamId, boardId);

    // Check in case board was deleted by other user after option to update was selected by current user
    if (!board) {
      console.log(`Cannot update title for a non-existent feedback board. Board: ${boardId}`);
      return undefined;
    }

    board.title = title;
    board.maxvotesPerUser = maxvotesPerUser;
    board.columns = newColumns;
    board.modifiedDate = new Date(Date.now());

    return await this.updateBoard(teamId, board);
  }

  // Update the board document.
  private updateBoard = async (teamId: string, board: IFeedbackBoardDocument): Promise<IFeedbackBoardDocument> => {
    return await ExtensionDataService.updateDocument<IFeedbackBoardDocument>(teamId, board);
  }
}

export default new BoardDataService();
