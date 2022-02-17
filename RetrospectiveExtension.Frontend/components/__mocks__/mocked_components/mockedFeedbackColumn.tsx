
import { mocked } from 'jest-mock';
import { WorkflowPhase } from '../../../interfaces/workItem';
import { v4 as uuid } from 'uuid';
import { TooltipOverflowMode } from 'office-ui-fabric-react';

export const testTeamId = uuid();
export const testBoardId = uuid();
export const testWorkItemType = mocked({
  _links: [],
  color: '#cc293d',
  description: 'Test Work Item Type Description',
  fieldInstances: [],
  fields: [],
  icon: {
    id: uuid(),
    url: ''
  },
  isDisabled: true,
  name: 'Test Work Item Type Name',
  referenceName: 'Test Work Item Type Reference Name',
  states: [],
  transitions: {},
  url: '',
  xmlForm: '',
});
export const testColumnUuidOne = uuid();
export const testColumnUuidTwo = uuid();
export const testColumnTwoTitle = 'Test Feedback Column Two';
export const testUpvotes = Math.floor(Math.random() * 10);
export const testGroupedItemProps = mocked({
  groupedCount: 0,
  isGroupExpanded: false,
  isMainItem: true,
  parentItemId: '',
  setIsGroupBeingDragged: jest.fn(() => { }),
  toggleGroupExpand: jest.fn(() => { }),
  updateGroupCardStackHeight: jest.fn(() => { }),
});
export const testFeedbackItem = mocked({
  id: uuid(),
  element: mocked({
    innerText: 'Test Inner Text',
    innerHtml: '<div>Test Inner HTML</div>'
  }),
  boardId: testBoardId,
  title: 'Test Feedback Item',
  description: 'Test Feedback Item Description',
  columnId: testColumnUuidOne,
  upvotes: testUpvotes,
  voteCollection: { [uuid()]: testUpvotes },
  createdDate: new Date(),
  createdByProfileImage: 'testProfileImageSource',
  groupedItemProps: testGroupedItemProps,
  userIdRef: uuid(),
  timerSecs: Math.floor(Math.random() * 60),
  timerstate: false,
  timerId: uuid(),
  groupTitles: ['example one', 'example two'],
  isGroupedCarouselItem: false,
});
export const testColumnItem = mocked({
  feedbackItem: testFeedbackItem,
  actionItems: [],
  newlyCreated: false,
  showAddedAnimation: false,
  shouldHaveFocus: false,
  hideFeedbackItems: false,
});

export const testColumnIds: string[] = [testColumnUuidOne, testColumnUuidTwo];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const testColumnsObj: any = {};
testColumnsObj[testColumnUuidOne] = {
  columnProperties:
  {
    id: testColumnUuidOne,
    title: 'Test Feedback Column One',
    iconClass: 'far fa-smile',
    accentColor: '#008000',
  },
  columnItems:
    [
      {
        feedbackItem: testFeedbackItem,
        actionItems: []
      },
    ]
};
testColumnsObj[testColumnUuidTwo] = {
  columnProperties:
  {
    id: TooltipOverflowMode,
    title: testColumnTwoTitle,
    iconClass: 'far fa-smile',
    accentColor: '#008100',
  },
  columnItems: []
};
export const testColumns = mocked(testColumnsObj);

export const testColumnProps = mocked({
  columns: testColumns,
  columnIds: testColumnIds,
  columnName: testColumns[testColumnUuidOne].columnProperties.title,
  columnId: testColumnUuidOne,
  accentColor: testColumns[testColumnUuidOne].columnProperties.accentColor,
  iconClass: testColumns[testColumnUuidOne].columnProperties.iconClass,
  workflowPhase: WorkflowPhase.Act,
  isDataLoaded: false,
  columnItems: testColumns[testColumnUuidOne].columnItems,
  team: {
    id: uuid(),
    identity: {
      customDisplayName: 'Test Web API Identity Custom Display Name',
      descriptor: {
        identifier: 'Test Identifier',
        identityType: 'Test Identity Type'
      },
      id: uuid(),
      isActive: true,
      isContainer: false,
      masterId: uuid(),
      memberIds: [],
      memberOf: [],
      members: [],
      metaTypeId: 5,
      properties: [],
      providerDisplayName: 'Test Web API Identity Provider Display Name',
      resourceVersion: 10,
      socialDescriptor: 'Test Social Descriptor',
      subjectDescriptor: 'Test Subject Descriptor',
      uniqueUserId: 500,
    },
    name: 'Test Web API Team Name',
    description: 'Test Web API Team Description',
    identityUrl: '',
    projectId: uuid(),
    projectName: 'Test Azure DevOps Retrospectives Extension',
    url: ''
  },
  boardId: testBoardId,
  boardTitle: 'Test Feedback Board',
  defaultActionItemIteration: testTeamId,
  defaultActionItemAreaPath: testTeamId,
  nonHiddenWorkItemTypes: [testWorkItemType],
  allWorkItemTypes: [testWorkItemType],
  isBoardAnonymous: false,
  shouldFocusOnCreateFeedback: false,
  hideFeedbackItems: false,
  groupTitles: ['example one', 'example two'],
  isFocusModalHidden: false,
  onVoteCasted: jest.fn(() => { }),
  addFeedbackItems: jest.fn(() => { }),
  removeFeedbackItemFromColumn: jest.fn(() => { }),
  refreshFeedbackItems: jest.fn(() => { }),
});