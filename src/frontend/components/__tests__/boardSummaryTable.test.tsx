import React from 'react';
import { shallow, mount, ReactWrapper } from 'enzyme';
import { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { act } from 'react-dom/test-utils';

import BoardSummaryTable, { buildBoardSummaryState, handleConfirmDelete, IBoardSummaryTableProps, IBoardSummaryTableItem } from '../boardSummaryTable';
import { TrashIcon, isTrashEnabled, handleArchiveToggle } from '../boardSummaryTable';
import BoardDataService from '../../dal/boardDataService';
import { itemDataService } from '../../dal/itemDataService';
import { IFeedbackBoardDocument } from '../../interfaces/feedback';
import { appInsights, TelemetryEvents } from "../../utilities/telemetryClient"
import { reflectBackendService } from '../../dal/reflectBackendService';
import * as userIdentityHelper from '../../utilities/userIdentityHelper';

jest.mock('../../utilities/telemetryClient', () => {
  return {
    appInsights: {
      trackEvent: jest.fn(),
      trackException: jest.fn(),
    },
    TelemetryEvents: {
      FeedbackBoardArchived: 'FeedbackBoardArchived',
      FeedbackBoardRestored: 'FeedbackBoardRestored',
      FeedbackBoardDeleted: 'FeedbackBoardDeleted',
    },
  };
});

jest.mock('../../dal/itemDataService', () => {
  const originalModule = jest.requireActual('../../dal/itemDataService');
  return {
    __esModule: true,
    ...originalModule,
    itemDataService: {
      ...originalModule.itemDataService,
      getFeedbackItemsForBoard: jest.fn().mockResolvedValue([]),
    },
  };
});

jest.mock('../../dal/boardDataService', () => ({
  getBoardsForTeam: jest.fn(),
  deleteFeedbackBoard: jest.fn(),
  archiveFeedbackBoard: jest.fn(),
  restoreArchivedFeedbackBoard: jest.fn(),
}));

jest.mock('../../dal/reflectBackendService', () => ({
  reflectBackendService: {
    broadcastDeletedBoard: jest.fn(),
  },
}));

jest.mock('../../dal/azureDevOpsWorkItemService');

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
    title: 'Test Board Not Archived',
    createdDate: new Date(),
    createdBy: mockedIdentity,
    isArchived: false,
    columns: [], // Adjust as needed
    activePhase: 'Collect',
    maxVotesPerUser: 5,
    boardVoteCollection: {},
    teamEffectivenessMeasurementVoteCollection: [],
  },
    {
    id: 'board-2',
    teamId: 'team-1',
    title: 'Test Board Archived',
    createdDate: new Date(),
    createdBy: mockedIdentity,
    isArchived: true,
    columns: [], // Adjust as needed
    activePhase: 'Collect',
    maxVotesPerUser: 5,
    boardVoteCollection: {},
    teamEffectivenessMeasurementVoteCollection: [],
  },
];

const baseProps: IBoardSummaryTableProps = {
  teamId: 'team-1',
  currentUserId: 'user-1',
  currentUserIsTeamAdmin: true,
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn(),
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

describe('TrashIcon tests', () => {
  const baseBoard: IBoardSummaryTableItem = {
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

  it('should render disabled trash icon when board is not deletable yet', () => {
    const recentlyArchived = { ...baseBoard, archivedDate: new Date(Date.now() - 1 * 60 * 1000) };
    const wrapper = shallow(
      <TrashIcon
        board={recentlyArchived}
        currentUserId="user-1"
        currentUserIsTeamAdmin={true}
        onClick={jest.fn()}
      />
    );
    expect(wrapper.find('.trash-icon-disabled').exists()).toBe(true);
  });

  it('should not render trash icon when board is not archived', () => {
    const unarchived: IBoardSummaryTableItem = {
      ...baseBoard,
      isArchived: false,
      archivedDate: undefined
    };

    const wrapper = shallow(
      <TrashIcon
        board={unarchived}
        currentUserId="user-1"
        currentUserIsTeamAdmin={true}
        onClick={jest.fn()}
      />
    );

    expect(wrapper.find('.trash-icon').exists()).toBe(false);
    expect(wrapper.find('.trash-icon-disabled').exists()).toBe(false);
  });

  it('should NOT show trash icon if user is not board owner AND not team admin', () => {
    const wrapper = shallow(
      <TrashIcon
        board={{ ...baseBoard, ownerId: 'someone-else' }}
        currentUserId="user-2"
        currentUserIsTeamAdmin={false}
        onClick={jest.fn()}
      />
    );
    expect(wrapper.find('.trash-icon').exists()).toBe(false);
  });

  it('should show trash icon if user is board owner BUT not team admin', () => {
    const wrapper = shallow(
      <TrashIcon
        board={{ ...baseBoard, ownerId: 'user-1' }}
        currentUserId="user-1"
        currentUserIsTeamAdmin={false}
        onClick={jest.fn()}
      />
    );
    expect(wrapper.find('.trash-icon').exists()).toBe(true);
  });

  it('should show trash icon if user is not board owner BUT is team admin', () => {
    const wrapper = shallow(
      <TrashIcon
        board={{ ...baseBoard, ownerId: 'someone-else' }}
        currentUserId="user-2"
        currentUserIsTeamAdmin={true}
        onClick={jest.fn()}
      />
    );
    expect(wrapper.find('.trash-icon').exists()).toBe(true);
  });

  it('should show trash icon if user is board owner AND team admin', () => {
    const wrapper = shallow(
      <TrashIcon
        board={{ ...baseBoard, ownerId: 'user-1' }}
        currentUserId="user-1"
        currentUserIsTeamAdmin={true}
        onClick={jest.fn()}
      />
    );
    expect(wrapper.find('.trash-icon').exists()).toBe(true);
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

jest
  .spyOn(userIdentityHelper, 'getUserIdentity')
  .mockReturnValue({
    ...mockedIdentity,
    id: 'user-1'  // make sure the id matches your test
  });

jest.spyOn(userIdentityHelper, 'encrypt').mockImplementation((id) => `encrypted-${id}`);

describe('handleConfirmDelete', () => {
  const mockSetOpenDialogBoardId = jest.fn();
  const mockSetTableData = jest.fn();
  const mockSetRefreshKey = jest.fn();

  const board: IBoardSummaryTableItem = {
    id: 'board-1',
    boardName: 'Board One',
    feedbackItemsCount: 3,
    teamId: 'team-1',
    ownerId: 'user-1',
    createdDate: new Date(),
    isArchived: true,
    archivedDate: new Date(Date.now() - 5 * 60 * 1000),
    pendingWorkItemsCount: 0,
    totalWorkItemsCount: 0,
  };

  const tableData: IBoardSummaryTableItem[] = [board];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns early if openDialogBoardId is null', async () => {
    await handleConfirmDelete(
      null,
      tableData,
      'team-1',
      mockSetOpenDialogBoardId,
      mockSetTableData,
      mockSetRefreshKey,
    );

    expect(BoardDataService.deleteFeedbackBoard).not.toHaveBeenCalled();
    expect(mockSetOpenDialogBoardId).not.toHaveBeenCalled();
  });

  it('deletes board successfully and tracks event', async () => {
    (BoardDataService.deleteFeedbackBoard as jest.Mock).mockResolvedValue(undefined);

    await handleConfirmDelete(
      'board-1',
      tableData,
      'team-1',
      mockSetOpenDialogBoardId,
      mockSetTableData,
      mockSetRefreshKey,
    );

    expect(mockSetOpenDialogBoardId).toHaveBeenCalledWith(null);
    expect(BoardDataService.deleteFeedbackBoard).toHaveBeenCalledWith('team-1', 'board-1');
    expect(reflectBackendService.broadcastDeletedBoard).toHaveBeenCalledWith('team-1', 'board-1');
    expect(mockSetTableData).toHaveBeenCalledWith(expect.any(Function));
  });

  it('handles errors and sets refresh key', async () => {
    (BoardDataService.deleteFeedbackBoard as jest.Mock).mockRejectedValue(new Error('fail'));

    await handleConfirmDelete(
      'board-1',
      tableData,
      'team-1',
      mockSetOpenDialogBoardId,
      mockSetTableData,
      mockSetRefreshKey,
    );

    expect(appInsights.trackException).toHaveBeenCalledWith(expect.any(Error), {
      boardId: 'board-1',
      boardName: 'Board One',
      feedbackItemsCount: 3,
      action: 'delete',
    });
    expect(mockSetRefreshKey).toHaveBeenCalledWith(true);
  });
});

describe('buildBoardSummaryState', () => {
  it('returns empty state when no boards exist', () => {
    const state = buildBoardSummaryState([]);
    expect(state.boardsTableItems).toEqual([]);
    expect(state.isDataLoaded).toBe(true);
    expect(state.feedbackBoards).toEqual([]);
    expect(state.actionItemsByBoard).toEqual({});
    expect(state.allDataLoaded).toBe(false);
  });

  it('builds board summary state correctly for provided boards', () => {
    const state = buildBoardSummaryState(mockBoards);

    // Sort mockBoards by createdDate descending to match function behavior
    const sortedMockBoards = [...mockBoards].sort(
      (a, b) => b.createdDate.getTime() - a.createdDate.getTime()
    );

    // The returned boardsTableItems should have the same length as mockBoards
    expect(state.boardsTableItems.length).toBe(mockBoards.length);

    // The boards should be sorted by createdDate descending
    sortedMockBoards.forEach((originalBoard, index) => {
      const item = state.boardsTableItems[index];
      expect(item.id).toBe(originalBoard.id);
      expect(item.boardName).toBe(originalBoard.title);
      expect(item.createdDate.getTime()).toBe(originalBoard.createdDate.getTime());
      expect(item.isArchived).toBe(originalBoard.isArchived);
      expect(item.archivedDate).toBe(
        originalBoard.archivedDate ? new Date(originalBoard.archivedDate) : null
      );
      expect(item.ownerId).toBe(originalBoard.createdBy.id);
    });

    // Check that actionItemsByBoard keys match board IDs
    expect(Object.keys(state.actionItemsByBoard)).toEqual(mockBoards.map(b => b.id));

    // Check that allDataLoaded is false
    expect(state.allDataLoaded).toBe(false);
  });
});

describe('BoardSummaryTable, additional coverage', () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]); // ADD THIS
  });

  it('handleBoardsDocuments updates state via useEffect', async () => {
    await act(async () => {
      wrapper = mount(<BoardSummaryTable {...baseProps} />);
      await new Promise(resolve => setTimeout(resolve, 0)); // wait for useEffect
      wrapper.update();
    });

    // Check that rendered boards exist
    mockBoards.forEach(board => {
      expect(wrapper.text()).toContain(board.title);
    });

    // Check that DeleteBoardDialog is rendered with hidden true initially
    const dialog = wrapper.find('DeleteBoardDialog');
    expect(dialog.prop('hidden')).toBe(true);
  });

  it('handleActionItems, handles feedback items early return paths', async () => {
    // First board: no feedback items
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValueOnce([]);
    // Second board: has feedback items with no actionable IDs
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValueOnce([
      { id: 'item-1', associatedActionItemIds: [] },
    ]);

    await act(async () => {
      wrapper = mount(<BoardSummaryTable {...baseProps} />);
      await new Promise(resolve => setTimeout(resolve, 0)); // wait for useEffect
      wrapper.update();
    });

    // BoardsTableItems should reflect feedback items count
    const firstBoardRow = wrapper.text();
    expect(firstBoardRow).toContain(mockBoards[0].title);
    const secondBoardRow = wrapper.text();
    expect(secondBoardRow).toContain(mockBoards[1].title);

    // The actionItemsByBoard map should exist (cannot directly inspect internal state without hooks spy)
  });

  it('useEffect tracks exception if getBoardsForTeam fails', async () => {
    const error = new Error('fail');
    (BoardDataService.getBoardsForTeam as jest.Mock).mockRejectedValueOnce(error);

    await act(async () => {
      wrapper = mount(<BoardSummaryTable {...baseProps} />);
      await new Promise(resolve => setTimeout(resolve, 0));
      wrapper.update();
    });

    expect(appInsights.trackException).toHaveBeenCalledWith(error);
  });
});
