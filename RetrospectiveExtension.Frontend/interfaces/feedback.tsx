import { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { WorkflowPhase } from './workItem';

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
  displayPrimeDirective?: boolean;
  maxVotesPerUser: number;
  boardVoteCollection : { [voter: string]: number};
  teamEffectivenessMeasurementVoteCollection : ITeamEffectivenessMeasurementVoteCollection[];
}

export interface ITeamEffectivenessMeasurementVoteCollection {
  userId: string;
  responses: {questionId: string, selection: number}[]
}

export interface IFeedbackColumn {
  id: string;
  title: string;
  iconClass: string;
  accentColor: string;
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
  upvotes: number;
  voteCollection : { [voter: string]: number};
  createdBy?: IdentityRef;
  createdDate: Date;
  modifedDate?: Date;
  modifiedBy?: IdentityRef;
  userIdRef: string;
  timerSecs: number;
  timerstate: boolean;
  timerId: any;
}
