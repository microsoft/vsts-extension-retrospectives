import React from 'react';
import { shallow, mount, ReactWrapper } from 'enzyme';
import { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { act } from 'react-dom/test-utils';

import BoardSummaryTable, { IBoardSummaryTableProps, IBoardSummaryTableItem } from '../boardSummaryTable';
import { TrashIcon, isTrashEnabled, handleArchiveToggle } from '../boardSummaryTable';
import BoardDataService from '../../dal/boardDataService';
import { IFeedbackBoardDocument } from '../../interfaces/feedback';
import { appInsights, TelemetryEvents } from "../../utilities/telemetryClient";

jest.mock('../../utilities/telemetryClient', () => {
  return {
    appInsights: {
      trackEvent: jest.fn(),
    },
    TelemetryEvents: {
      FeedbackBoardArchived: 'FeedbackBoardArchived',
      FeedbackBoardRestored: 'FeedbackBoardRestored',
    },
  };
});

jest.mock('../../dal/itemDataService', () => ({
  __esModule: true, // Helps Jest handle module imports correctly
  getFeedbackItemsForBoard: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../dal/boardDataService', () => ({
  getBoardsForTeam: jest.fn(),
  deleteFeedbackBoard: jest.fn(),
  archiveFeedbackBoard: jest.fn(),
  restoreArchivedFeedbackBoard: jest.fn(),
}));

jest.mock('../../dal/azureDevOpsWorkItemService');
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
  url: 'https://example.com/user',
};

const mockBoards: IFeedbackBoardDocument[] = [
  {
    id: 'board-1',
    teamId: 'team-1',
    title: 'Test Board',
    createdDate: new Date(),
    createdBy: mockedIdentity,
    isArchived: false,
    columns: [], // Adjust as needed
    activePhase: 'Collect',
    maxVotesPerUser: 5,
    boardVoteCollection: {},
    teamEffectivenessMeasurementVoteCollection: [],
  },
];

const baseProps: IBoardSummaryTableProps = {
  teamId: 'team-1',
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn(),
  currentUserId: 'user-1',
};

describe('BoardSummaryTable', () => {
  let wrapper: ReactWrapper | null;

  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = null;
  });

  it('renders when no boards exist', () => {
    const shallowWrapper = shallow(<BoardSummaryTable {...baseProps} />);
    const component = shallowWrapper.children().dive();
    expect(component.exists()).toBeTruthy();
  });

  it('renders loading spinner initially', async () => {
    (BoardDataService.getBoardsForTeam as jest.Mock).mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      wrapper = mount(<BoardSummaryTable {...baseProps} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    if (!wrapper) throw new Error('Wrapper not initialized');

    wrapper.update();
    expect(wrapper.find('.board-summary-initialization-spinner').exists()).toBe(true);
  });
});

describe('isTrashEnabled', () => {
  const board: IBoardSummaryTableItem = {
    boardName: 'Sample Board',
    createdDate: new Date(),
    isArchived: false,
    archivedDate: undefined,
    pendingWorkItemsCount: 0,
    totalWorkItemsCount: 0,
    feedbackItemsCount: 0,
    id: 'board-1',
    teamId: 'team-1',
    ownerId: 'user-1',
  };

  it('should return false for a non-archived board', () => {
    expect(isTrashEnabled(board)).toBe(false);
  });

  it('should return true if archive delay has passed', () => {
    const archivedBoard = { ...board, isArchived: true, archivedDate: new Date(Date.now() - 3 * 60 * 1000) };
    expect(isTrashEnabled(archivedBoard)).toBe(true);
  });

  it('should return false if archive delay has not passed', () => {
    const recentlyArchivedBoard = { ...board, isArchived: true, archivedDate: new Date(Date.now() - 1 * 60 * 1000) };
    expect(isTrashEnabled(recentlyArchivedBoard)).toBe(false);
  });
});

describe('TrashIcon', () => {
  it('should render enabled trash icon when board is deletable', () => {
    const board: IBoardSummaryTableItem = {
      boardName: 'Sample Board',
      createdDate: new Date(),
      isArchived: true,
      archivedDate: new Date(Date.now() - 3 * 60 * 1000), // Archived 3 mins ago
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
      feedbackItemsCount: 0,
      id: 'board-1',
      teamId: 'team-1',
      ownerId: 'user-1',
    };

    const wrapper = shallow(<TrashIcon board={board} currentUserId="user-1" onClick={jest.fn()} />);

    expect(wrapper.find('.trash-icon').exists()).toBe(true);
  });

  it('should render disabled trash icon when board is not deletable yet', () => {
    const board = {
      boardName: 'Sample Board',
      createdDate: new Date(),
      isArchived: true,
      archivedDate: new Date(Date.now() - 1 * 60 * 1000), // Archived 1 min ago
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
      feedbackItemsCount: 0,
      id: 'board-1',
      teamId: 'team-1',
      ownerId: 'user-1',
    };

    const wrapper = shallow(<TrashIcon board={board} currentUserId="user-1" onClick={jest.fn()} />);

    expect(wrapper.find('.trash-icon-disabled').exists()).toBe(true);
  });

  it('should not render trash icon when board is not archived', () => {
    const board = {
      boardName: 'Sample Board',
      createdDate: new Date(),
      isArchived: false,
      archivedDate: undefined as Date | undefined,
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
      feedbackItemsCount: 0,
      id: 'board-1',
      teamId: 'team-1',
      ownerId: 'user-1',
    };

    const wrapper = shallow(<TrashIcon board={board} currentUserId="user-1" onClick={jest.fn()} />);

    expect(wrapper.find('.trash-icon').exists()).toBe(false);
    expect(wrapper.find('.trash-icon-disabled').exists()).toBe(false);
  });
});

describe('handleArchiveToggle', () => {
  it('should call archiveFeedbackBoard when archiving a board', async () => {
    const mockSetTableData = jest.fn();
    const mockOnArchiveToggle = jest.fn();

    await handleArchiveToggle('team123', 'board456', true, mockSetTableData, mockOnArchiveToggle);

    expect(BoardDataService.archiveFeedbackBoard).toHaveBeenCalledWith('team123', 'board456');
    expect(appInsights.trackEvent).toHaveBeenCalledWith({
      name: TelemetryEvents.FeedbackBoardArchived,
      properties: { boardId: 'board456' }
    });
    expect(mockSetTableData).toHaveBeenCalled();
    expect(mockOnArchiveToggle).toHaveBeenCalled();
  });

  it('should call restoreArchivedFeedbackBoard when restoring a board', async () => {
    const mockSetTableData = jest.fn();
    const mockOnArchiveToggle = jest.fn();

    await handleArchiveToggle('team123', 'board456', false, mockSetTableData, mockOnArchiveToggle);

    expect(BoardDataService.restoreArchivedFeedbackBoard).toHaveBeenCalledWith('team123', 'board456');
    expect(appInsights.trackEvent).toHaveBeenCalledWith({
      name: TelemetryEvents.FeedbackBoardRestored,
      properties: { boardId: 'board456' }
    });
    expect(mockSetTableData).toHaveBeenCalled();
    expect(mockOnArchiveToggle).toHaveBeenCalled();
  });
});
