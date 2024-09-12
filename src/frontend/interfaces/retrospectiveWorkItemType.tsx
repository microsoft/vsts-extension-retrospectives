import { FieldModel, FieldType, PickListModel, WorkItemTypeClass, WorkItemTypeModel } from 'azure-devops-extension-api/WorkItemTrackingProcessDefinitions';

export const feedbackType: FieldModel = {
    description: 'The type of feedback.',
    id: null,
    name: 'Feedback Type',
    pickList: null,
    type: 1,
    url: null,
};

export const upvotes: FieldModel = {
    description: 'Upvote count',
    id: null,
    name: 'Upvotes',
    pickList: null,
    type: FieldType.Integer,
    url: null,
};

export const retrospectiveWorkItemTypeModel: WorkItemTypeModel = {
    behaviors: [],
    class: WorkItemTypeClass.Custom,
    color: '60af49',
    description: 'Tracks retrospective feedback.',
    icon: 'icon_chat_bubble',
    id: null,
    inherits: null,
    isDisabled: false,
    layout: null,
    name: 'Retrospective',
    states: [],
    url: null,
};

export const feedbackPickList: PickListModel = {
    id: null,
    isSuggested: false,
    items: [{ value: 'Negative', id: null }, { value: 'Neutral', id: null }, { value: 'Positive', id: null }],
    name: 'picklist_3afce441-2c57-4572-860a-8cf9b942c022',
    type: 'String',
    url: null,
};

export enum ExceptionCode {
    Unexpected = 0,
    NotInheritedProcess = 1,
}

export interface InitialRetrospectiveState {
    retrospectiveWorkItemType?: WorkItemTypeModel;
    isInheritedProcess: boolean;
    displayBoard: boolean;
    exceptionCode?: ExceptionCode;
}
