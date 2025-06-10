import React from 'react';
import { shallow } from 'enzyme';
import { mocked } from 'jest-mock';
import { TeamMember } from 'azure-devops-extension-api/WebApi';
import FeedbackBoardContainer, { FeedbackBoardContainerProps } from '../feedbackBoardContainer';
import { deduplicateTeamMembers } from '../feedbackBoardContainer';

const getTeamIterationsMock = () => {
  return [
    mocked({
      attributes: mocked({
        finishDate: new Date(),
        startDate: new Date(),
        timeFrame: 1,
      }),
      id: 'iterationId',
      name: 'iteration name',
      path: 'default path',
      _links: [],
      url: 'https://teamfieldvaluesurl'
    })
  ];
};

const getTeamFieldValuesMock = () => {
  return [
    mocked({
      defaultValue: 'default field value',
      field: mocked({
        referenceName: 'default reference name',
        url: 'https://fieldurl'
      }),
      values: [
        mocked({
          includeChildren: false,
          value: 'default team field value',
        })
      ],
      links: [],
      url: 'https://teamfieldvaluesurl'
    })]
};

jest.mock('../feedbackBoardMetadataForm', () => { return mocked({});});
jest.mock('azure-devops-extension-api/Work/WorkClient', () => {
  return {
    getTeamIterations: getTeamIterationsMock,
    getTeamFieldValues: getTeamFieldValuesMock,
  };
});

const feedbackBoardContainerProps: FeedbackBoardContainerProps = {
  isHostedAzureDevOps: false,
  projectId: '1',
};

describe('Feedback Board Container ', () => {
  it('can be rendered without content.', () => {
    const wrapper = shallow(<FeedbackBoardContainer {...feedbackBoardContainerProps} />);
    expect(wrapper.children().dive().html()).toBe('<div class="ms-Spinner initialization-spinner root-41"><div class="ms-Spinner-circle ms-Spinner--large circle-42"></div><div class="ms-Spinner-label label-43">Loading...</div></div>');
  });
});

const baseIdentity = {
  directoryAlias: '',
  inactive: false,
  isAadIdentity: false,
  isContainer: false,
  isDeletedInOrigin: false,
  isMru: false,
  mail: '',
  mailNickname: '',
  originDirectory: '',
  originId: '',
  subjectDescriptor: '',
  id: '',
  displayName: '',
  uniqueName: '',
  imageUrl: '',
  profileUrl: '',
  _links: {},
  descriptor: '',
  url: ''
};

describe('deduplicateTeamMembers', () => {
  it('deduplicates users and favors admin status per user', () => {
    const team1Members: TeamMember[] = [
      {
        identity: { ...baseIdentity, id: 'user-1', displayName: 'User 1', uniqueName: 'user1', imageUrl: '' },
        isTeamAdmin: true
      },
      {
        identity: { ...baseIdentity, id: 'user-2', displayName: 'User 2', uniqueName: 'user2', imageUrl: '' },
        isTeamAdmin: false
      }
    ];
    const team2Members: TeamMember[] = [
      {
        identity: { ...baseIdentity, id: 'user-1', displayName: 'User 1', uniqueName: 'user1', imageUrl: '' },
        isTeamAdmin: false
      },
      {
        identity: { ...baseIdentity, id: 'user-2', displayName: 'User 2', uniqueName: 'user2', imageUrl: '' },
        isTeamAdmin: true
      }
    ];

    const deduped = deduplicateTeamMembers([...team1Members, ...team2Members]);
    expect(deduped).toHaveLength(2);

    // User 1 should be admin
    const user1 = deduped.find(m => m.identity.id === 'user-1');
    expect(user1?.isTeamAdmin).toBe(true);

    // User 2 should be admin
    const user2 = deduped.find(m => m.identity.id === 'user-2');
    expect(user2?.isTeamAdmin).toBe(true);
  });
});
