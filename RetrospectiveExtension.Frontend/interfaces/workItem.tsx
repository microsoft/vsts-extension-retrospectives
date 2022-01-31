import { WorkItem } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';

export interface WorkItemGroup {
  name: string;
  feedbackType: FeedbackType;
  iconName: string;
  workItems: WorkItemExtended[];
}

export interface WorkItemExtended {
  iconName: string;
  workItem: WorkItem;
  upvotes: number;
  isLinkedForGroup: boolean;
  isParentForGroup: boolean;
}

export enum FeedbackType {
  Neutral = 'Neutral',
  Positive = 'Positive',
  Negative = 'Negative',
}

export enum RelationshipType {
  ReferencedByForward = 'Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Forward',
  ReferencedByReverse = 'Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Reverse',
  Related = 'System.LinkTypes.Related',
}

export type WorkflowPhase = 'Collect' | 'Group' | 'Vote' | 'Discuss' | 'Act';
export const WorkflowPhase = {
    get Collect(): WorkflowPhase { return 'Collect'; },
    get Group(): WorkflowPhase { return 'Group'; },
    get Vote(): WorkflowPhase { return 'Vote'; },
    get Discuss(): WorkflowPhase { return 'Discuss'; },
    get Act(): WorkflowPhase { return 'Act'; },
    getState(str: string): WorkflowPhase {
      if ( str === 'Collect') return WorkflowPhase.Collect;
      if ( str === 'Group') return WorkflowPhase.Group;
      if ( str === 'Vote') return WorkflowPhase.Vote;
      if ( str === 'Discuss') return WorkflowPhase.Discuss;
      if ( str === 'Act') return WorkflowPhase.Act;
      return undefined;
    }
  }

export interface IRetrospectiveItemCreate {
  title: string;
  feedbackType: FeedbackType;
  iteration: string;
  areaPath: string;
  isAnonymous: boolean;
}

export interface IRetrospectiveItemsQuery {
  feedbackType: FeedbackType;
  iteration: string;
  areaPath: string;
}
