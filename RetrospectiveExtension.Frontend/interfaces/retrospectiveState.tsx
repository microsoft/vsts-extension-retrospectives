import { WorkItemTypeModel } from 'TFS/WorkItemTracking/ProcessDefinitionsContracts';

export enum ExceptionCode {
    Unexpected = 0,
    NotInheritedProcess = 1,
}

export interface InitialRetrospectiveState {
  displayBoard: boolean;
  exceptionCode?: ExceptionCode;
  isInheritedProcess: boolean;
  retrospectiveWorkItemType?: WorkItemTypeModel;
}
