import { mocked } from 'jest-mock';

const WorkItemFieldReference = {
  name: 'Test Work Item Field Reference Name',
  referenceName: 'Test Work Item Field Reference Ref',
  url: 'https://workitemfieldrefurl',
}

const WorkItemTypeFieldInstance = {
  allowedValues: ['Type 1', 'Type 2', 'Type 3'],
  defaultValue: 'Default Work Item Type Field value',
  alwaysRequired: false,
  dependentFields: [WorkItemFieldReference],
  helpText: 'Test Work Item Type Help Text',
  name: 'Test Work Item Type Field Name',
  referenceName: 'Test Work Item Type Field Reference Name',
  url: 'https://workitemtypefieldurl',
}

const WorkItemIcon = {
  id: 'TestWorkItemIconId',
  url: 'https://workitemiconurl',
}

const WorkItemStateColor = {
  category: 'Test State Category',
  color: '#008080',
  name: 'Test State Name',
}

const WorkItemStateTransition = {
  actions: ['action 1', 'action 2', 'action 3'],
  to: 'action 2',
}
const WorkItemCommentVersionRef = {
  commentId: 4,
  createdInRevision: 1,
  isDeleted: false,
  text: 'Test Work Item Comment Version Text',
  version: 1,
  url: 'https://workitemcommenturl'
}

const WorkItemRelation = {
  attributes: { ['Test attribute'] : '' },
  rel: 'Test relation',
  url: 'https://workitemrelationurl',
}

export const mockWorkItem = mocked({
  commentVersionRef: WorkItemCommentVersionRef,
  fields: {
    ['System.WorkItemType'] : 'Test Work Item Type Name',
    ['System.ChangedDate'] : (new Date()).toLocaleDateString(),
    ['System.AssignedTo'] : 'Jane Doe',
    ['System.Title'] : 'Mocked Work Item Title',
    ['System.State'] : 'Resolved',
    ['Microsoft.VSTS.Common.Priority'] : 'high'
  },
  id: 500,
  relations: [WorkItemRelation],
  rev: 2,
  _links: ['link 1'],
  url: 'https://workitemurl'
});

export const mockWorkItemType = mocked({
  color: '#4B0082',
  description: 'Test Work Item Type Description',
  fieldInstances: [WorkItemTypeFieldInstance],
  fields: [WorkItemTypeFieldInstance],
  icon: WorkItemIcon,
  isDisabled: false,
  name: 'Test Work Item Type Name',
  referenceName: 'Test Work Item Type Reference Name',
  states: [WorkItemStateColor],
  transitions: { ['test transition'] : [WorkItemStateTransition] },
  xmlForm: '<samplexml>Test XML Form</samplexml>',
  url: 'https://workitemtypeurl',
  _links: ['link 1'],
});
