import * as React from 'react';
import { shallow } from 'enzyme';
import { mocked } from 'jest-mock';
import FeedbackBoardContainer, { FeedbackBoardContainerProps } from '../feedbackBoardContainer';

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
    expect(wrapper.children().dive().html()).toBe(
      '<div class="ms-Spinner initialization-spinner root-41"><div class="ms-Spinner-circle ms-Spinner--large circle-42">' +
      '</div><div class="ms-Spinner-label label-43">Loading...</div></div>');
  });
});