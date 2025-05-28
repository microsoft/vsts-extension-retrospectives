import React from 'react';
import { shallow, mount } from 'enzyme';
import { IdentityRef } from 'azure-devops-extension-api/WebApi';

import BoardSummaryTable, { IBoardSummaryTableProps } from '../boardSummaryTable';
import BoardDataService from '../../dal/boardDataService';
import { itemDataService } from '../../dal/itemDataService';
import { reflectBackendService } from '../../dal/reflectBackendService';
import { workItemService } from '../../dal/azureDevOpsWorkItemService';
import { IFeedbackBoardDocument } from '../../interfaces/feedback';

jest.mock('../../dal/boardDataService');
jest.mock('../../dal/azureDevOpsWorkItemService');
jest.mock('../../dal/itemDataService');
jest.mock('../../dal/reflectBackendService');

const mockedIdentity: IdentityRef = {
  directoryAlias: 'test.user',
  id: 'user-1',
  imageUrl: 'https://example.com/avatar.png',
  inactive: false,
  isAadIdentity: true,
  isContainer: false,
  isDeletedInOrigin: false,
  profileUrl: 'https://example.com/profile',
  uniqueName: 'test.user@example.com',
  _links: undefined,
  descriptor: 'vssgp.Uy0xLTktMTY=',
  displayName: 'Test User',
  url: 'https://example.com/user'
};

const mockBoards: IFeedbackBoardDocument[] = [
  {
    id: 'board-1',
    teamId: 'team-1',
    title: 'Test Board',
    createdDate: new Date(),
    createdBy: mockedIdentity,
    isArchived: false,
    columns: [], // Assuming array of column definitions; adjust as needed
    activePhase: 'Collect', // Or 'Group' / 'Vote' / 'Discuss' / 'Complete' based on your app
    maxVotesPerUser: 5,
    boardVoteCollection: {}, // Use an appropriate mock if your code relies on this
    teamEffectivenessMeasurementVoteCollection: [], // Likewise
  }
];

const baseProps: IBoardSummaryTableProps = {
  teamId: 'team-1',
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn(),
};

describe('BoardSummaryTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when no boards exist', () => {
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);
    const component = wrapper.children().dive();
    expect(component.exists()).toBeTruthy();
  });

  it('renders loading spinner initially', () => {
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue([]);
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);
    expect(wrapper.find('Spinner').exists()).toBe(true);
  });

  it('renders with board data', async () => {
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
    (workItemService.getWorkItemStates as jest.Mock).mockResolvedValue([]);
    const wrapper = mount(<BoardSummaryTable {...baseProps} />);

    await new Promise(setImmediate); // Wait for useEffect/async work
    wrapper.update();

    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Board');
  });

  it('handles board deletion', async () => {
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
    (workItemService.getWorkItemStates as jest.Mock).mockResolvedValue([]);
    (BoardDataService.deleteFeedbackBoard as jest.Mock).mockResolvedValue(undefined);

    const wrapper = mount(<BoardSummaryTable {...baseProps} />);
    await new Promise(setImmediate);
    wrapper.update();

    const instance = wrapper.find('BoardSummaryTable').instance() as any;
    instance.setState({ openDialogBoardId: 'board-1' });
    wrapper.update();

    await instance.handleConfirmDelete();
    wrapper.update();

    expect(BoardDataService.deleteFeedbackBoard).toHaveBeenCalledWith('team-1', 'board-1');
    expect(reflectBackendService.broadcastDeletedBoard).toHaveBeenCalledWith('team-1', 'board-1');
  });
});
