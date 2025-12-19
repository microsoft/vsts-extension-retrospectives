import { IdentityRef } from "azure-devops-extension-api/WebApi";
import { WorkflowPhase } from "./workItem";

export interface IUserVisit {
  teamId: string;
  boardId?: string;
}

export interface IFeedbackBoardDocument {
  id: string;
  __etag?: number;
  title: string;
  teamId: string;
  projectId?: string;
  createdBy: IdentityRef;
  createdDate: Date;
  startDate?: Date;
  endDate?: Date;
  areaPaths?: string[];
  iterations?: string[];
  columns: IFeedbackColumn[];
  modifiedDate?: Date;
  modifiedBy?: IdentityRef;
  activePhase: WorkflowPhase;
  isIncludeTeamEffectivenessMeasurement?: boolean;
  isAnonymous?: boolean;
  shouldShowFeedbackAfterCollect?: boolean;
  maxVotesPerUser: number;
  boardVoteCollection: { [voter: string]: number };
  teamEffectivenessMeasurementVoteCollection: ITeamEffectivenessMeasurementVoteCollection[];
  permissions?: IFeedbackBoardDocumentPermissions;
  isPublic?: boolean;
  isArchived?: boolean;
  archivedDate?: Date;
  archivedBy?: IdentityRef;
}

export class FeedbackBoardDocumentHelper {
  static sort(board1: IFeedbackBoardDocument, board2: IFeedbackBoardDocument): number {
    return new Date(board2.createdDate).getTime() - new Date(board1.createdDate).getTime();
  }

  /**
   * Filter out boards that the user does not have access to
   * @param board - Current board being evaluated
   * @param teamIds - List of team ids the user has access to
   * @param userId - Id of the current user
   * @returns
   */
  static filter(board: IFeedbackBoardDocument, teamIds: string[], userId: string): boolean {
    const isBoardOwner = board.createdBy?.id === userId;
    const isBoardPublic = board.isPublic === undefined || board.isPublic === true;
    const hasAccessByMember = board.permissions?.Members === undefined || board.permissions.Members.includes(userId);
    const hasAccessByTeam = board.permissions?.Teams === undefined || teamIds.some(t => board.permissions.Teams.includes(t));
    const isBoardNotArchived = board.isArchived === undefined || board.isArchived === false;

    const hasAccess = isBoardNotArchived && (isBoardOwner || isBoardPublic || hasAccessByMember || hasAccessByTeam);

    return hasAccess;
  }
}

export interface IFeedbackBoardDocumentPermissions {
  Teams: string[];
  Members: string[];
}

export interface ITeamEffectivenessMeasurementVoteCollection {
  userId: string;
  responses: { questionId: number; selection: number }[];
}

export interface IFeedbackColumn {
  id: string;
  title: string;
  iconClass?: string;
  accentColor: string;
  notes?: string;
}

export interface IFeedbackItemDocument {
  id: string;
  __etag?: number;
  boardId: string;
  title: string;
  description?: string;
  childFeedbackItemIds?: string[];
  parentFeedbackItemId?: string;
  associatedActionItemIds?: number[];
  columnId: string;
  originalColumnId: string;
  upvotes: number;
  voteCollection: { [voter: string]: number };
  createdBy?: IdentityRef;
  createdDate: Date;
  modifiedDate?: Date;
  modifiedBy?: IdentityRef;
  userIdRef: string;
  timerSecs: number;
  timerState: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timerId: any;
  groupIds: string[];
  isGroupedCarouselItem: boolean;
}
