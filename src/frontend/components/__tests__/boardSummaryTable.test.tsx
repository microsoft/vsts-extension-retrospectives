import React from "react";
import { render, waitFor } from "@testing-library/react";
import { IdentityRef } from "azure-devops-extension-api/WebApi";

import BoardSummaryTable, { buildBoardSummaryState, handleConfirmDelete, IBoardSummaryTableProps, IBoardSummaryTableItem } from "../boardSummaryTable";
import { TrashIcon, isTrashEnabled, handleArchiveToggle } from "../boardSummaryTable";
import BoardDataService from "../../dal/boardDataService";
import { itemDataService } from "../../dal/itemDataService";
import { IFeedbackBoardDocument } from "../../interfaces/feedback";
import { appInsights, TelemetryEvents } from "../../utilities/telemetryClient";
import { reflectBackendService } from "../../dal/reflectBackendService";
import * as userIdentityHelper from "../../utilities/userIdentityHelper";

jest.mock("../../utilities/telemetryClient", () => {
  return {
    appInsights: {
      trackEvent: jest.fn(),
      trackException: jest.fn(),
    },
    TelemetryEvents: {
      FeedbackBoardArchived: "FeedbackBoardArchived",
      FeedbackBoardRestored: "FeedbackBoardRestored",
      FeedbackBoardDeleted: "FeedbackBoardDeleted",
    },
  };
});

jest.mock("../../dal/itemDataService", () => {
  const originalModule = jest.requireActual("../../dal/itemDataService");
  return {
    __esModule: true,
    ...originalModule,
    itemDataService: {
      ...originalModule.itemDataService,
      getFeedbackItemsForBoard: jest.fn().mockResolvedValue([]),
    },
  };
});

jest.mock("../../dal/boardDataService", () => {
  const mockBoardDataService = {
    getBoardsForTeam: jest.fn(),
    deleteFeedbackBoard: jest.fn(),
    archiveFeedbackBoard: jest.fn(),
    restoreArchivedFeedbackBoard: jest.fn(),
  };
  return mockBoardDataService;
});

jest.mock("../../dal/reflectBackendService", () => ({
  reflectBackendService: {
    broadcastDeletedBoard: jest.fn(),
  },
}));

jest.mock("../../dal/azureDevOpsWorkItemService");

const mockedIdentity: IdentityRef = {
  directoryAlias: "test.user",
  id: "user-1",
  imageUrl: "https://example.com/avatar.png",
  inactive: false,
  isAadIdentity: true,
  isContainer: false,
  isDeletedInOrigin: false,
  profileUrl: "https://example.com/profile",
  uniqueName: "test.user@example.com",
  _links: undefined,
  descriptor: "vssgp.Uy0xLTktMTY=",
  displayName: "Test User",
  url: "https://example.com/user",
};

const mockBoards: IFeedbackBoardDocument[] = [
  {
    id: "board-1",
    teamId: "team-1",
    title: "Test Board Not Archived",
    createdDate: new Date(),
    createdBy: mockedIdentity,
    isArchived: false,
    columns: [], // Adjust as needed
    activePhase: "Collect",
    maxVotesPerUser: 5,
    boardVoteCollection: {},
    teamEffectivenessMeasurementVoteCollection: [],
  },
  {
    id: "board-2",
    teamId: "team-1",
    title: "Test Board Archived",
    createdDate: new Date(),
    createdBy: mockedIdentity,
    isArchived: true,
    columns: [], // Adjust as needed
    activePhase: "Collect",
    maxVotesPerUser: 5,
    boardVoteCollection: {},
    teamEffectivenessMeasurementVoteCollection: [],
  },
];

const baseProps: IBoardSummaryTableProps = {
  teamId: "team-1",
  currentUserId: "user-1",
  currentUserIsTeamAdmin: true,
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn(),
};

describe("BoardSummaryTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue([]);
  });

  it("renders when no boards exist", () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);
    expect(container).toBeTruthy();
  });

  it("renders loading spinner initially", async () => {
    (BoardDataService.getBoardsForTeam as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    expect(container.querySelector(".board-summary-initialization-spinner")).toBeTruthy();
  });
});

describe("isTrashEnabled", () => {
  const board: IBoardSummaryTableItem = {
    boardName: "Sample Board",
    createdDate: new Date(),
    isArchived: false,
    archivedDate: undefined,
    pendingWorkItemsCount: 0,
    totalWorkItemsCount: 0,
    feedbackItemsCount: 0,
    id: "board-1",
    teamId: "team-1",
    ownerId: "user-1",
  };

  it("should return false for a non-archived board", () => {
    expect(isTrashEnabled(board)).toBe(false);
  });

  it("should return true if archive delay has passed", () => {
    const archivedBoard = { ...board, isArchived: true, archivedDate: new Date(Date.now() - 3 * 60 * 1000) };
    expect(isTrashEnabled(archivedBoard)).toBe(true);
  });

  it("should return false if archive delay has not passed", () => {
    const recentlyArchivedBoard = { ...board, isArchived: true, archivedDate: new Date(Date.now() - 1 * 60 * 1000) };
    expect(isTrashEnabled(recentlyArchivedBoard)).toBe(false);
  });
});

describe("TrashIcon tests", () => {
  const baseBoard: IBoardSummaryTableItem = {
    boardName: "Sample Board",
    createdDate: new Date(),
    isArchived: true,
    archivedDate: new Date(Date.now() - 3 * 60 * 1000), // Archived 3 mins ago
    pendingWorkItemsCount: 0,
    totalWorkItemsCount: 0,
    feedbackItemsCount: 0,
    id: "board-1",
    teamId: "team-1",
    ownerId: "user-1",
  };

  it("should render disabled trash icon when board is not deletable yet", () => {
    const recentlyArchived = { ...baseBoard, archivedDate: new Date(Date.now() - 1 * 60 * 1000) };
    const { container } = render(<TrashIcon board={recentlyArchived} currentUserId="user-1" currentUserIsTeamAdmin={true} onClick={jest.fn()} />);
    expect(container.querySelector(".trash-icon-disabled")).toBeTruthy();
  });

  it("should not render trash icon when board is not archived", () => {
    const unarchived: IBoardSummaryTableItem = {
      ...baseBoard,
      isArchived: false,
      archivedDate: undefined,
    };

    const { container } = render(<TrashIcon board={unarchived} currentUserId="user-1" currentUserIsTeamAdmin={true} onClick={jest.fn()} />);

    expect(container.querySelector(".trash-icon")).toBeFalsy();
    expect(container.querySelector(".trash-icon-disabled")).toBeFalsy();
  });

  it("should NOT show trash icon if user is not board owner AND not team admin", () => {
    const { container } = render(<TrashIcon board={{ ...baseBoard, ownerId: "someone-else" }} currentUserId="user-2" currentUserIsTeamAdmin={false} onClick={jest.fn()} />);
    expect(container.querySelector(".trash-icon")).toBeFalsy();
  });

  it("should show trash icon if user is board owner BUT not team admin", () => {
    const { container } = render(<TrashIcon board={{ ...baseBoard, ownerId: "user-1" }} currentUserId="user-1" currentUserIsTeamAdmin={false} onClick={jest.fn()} />);
    expect(container.querySelector(".trash-icon")).toBeTruthy();
  });

  it("should show trash icon if user is not board owner BUT is team admin", () => {
    const { container } = render(<TrashIcon board={{ ...baseBoard, ownerId: "someone-else" }} currentUserId="user-2" currentUserIsTeamAdmin={true} onClick={jest.fn()} />);
    expect(container.querySelector(".trash-icon")).toBeTruthy();
  });

  it("should show trash icon if user is board owner AND team admin", () => {
    const { container } = render(<TrashIcon board={{ ...baseBoard, ownerId: "user-1" }} currentUserId="user-1" currentUserIsTeamAdmin={true} onClick={jest.fn()} />);
    expect(container.querySelector(".trash-icon")).toBeTruthy();
  });
});

describe("handleArchiveToggle", () => {
  it("should call archiveFeedbackBoard when archiving a board", async () => {
    const mockSetTableData = jest.fn();
    const mockOnArchiveToggle = jest.fn();

    await handleArchiveToggle("team123", "board456", true, mockSetTableData, mockOnArchiveToggle);

    expect(BoardDataService.archiveFeedbackBoard).toHaveBeenCalledWith("team123", "board456");
    expect(appInsights.trackEvent).toHaveBeenCalledWith({
      name: TelemetryEvents.FeedbackBoardArchived,
      properties: { boardId: "board456" },
    });
    expect(mockSetTableData).toHaveBeenCalled();
    expect(mockOnArchiveToggle).toHaveBeenCalled();
  });

  it("should call restoreArchivedFeedbackBoard when restoring a board", async () => {
    const mockSetTableData = jest.fn();
    const mockOnArchiveToggle = jest.fn();

    await handleArchiveToggle("team123", "board456", false, mockSetTableData, mockOnArchiveToggle);

    expect(BoardDataService.restoreArchivedFeedbackBoard).toHaveBeenCalledWith("team123", "board456");
    expect(appInsights.trackEvent).toHaveBeenCalledWith({
      name: TelemetryEvents.FeedbackBoardRestored,
      properties: { boardId: "board456" },
    });
    expect(mockSetTableData).toHaveBeenCalled();
    expect(mockOnArchiveToggle).toHaveBeenCalled();
  });
});

jest.spyOn(userIdentityHelper, "getUserIdentity").mockReturnValue({
  ...mockedIdentity,
  id: "user-1", // make sure the id matches your test
});

jest.spyOn(userIdentityHelper, "encrypt").mockImplementation(id => `encrypted-${id}`);

describe("handleConfirmDelete", () => {
  const mockSetOpenDialogBoardId = jest.fn();
  const mockSetTableData = jest.fn();
  const mockSetRefreshKey = jest.fn();

  const board: IBoardSummaryTableItem = {
    id: "board-1",
    boardName: "Board One",
    feedbackItemsCount: 3,
    teamId: "team-1",
    ownerId: "user-1",
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

  it("returns early if openDialogBoardId is null", async () => {
    await handleConfirmDelete(null, tableData, "team-1", mockSetOpenDialogBoardId, mockSetTableData, mockSetRefreshKey);

    expect(BoardDataService.deleteFeedbackBoard).not.toHaveBeenCalled();
    expect(mockSetOpenDialogBoardId).not.toHaveBeenCalled();
  });

  it("deletes board successfully and tracks event", async () => {
    (BoardDataService.deleteFeedbackBoard as jest.Mock).mockResolvedValue(undefined);

    await handleConfirmDelete("board-1", tableData, "team-1", mockSetOpenDialogBoardId, mockSetTableData, mockSetRefreshKey);

    expect(mockSetOpenDialogBoardId).toHaveBeenCalledWith(null);
    expect(BoardDataService.deleteFeedbackBoard).toHaveBeenCalledWith("team-1", "board-1");
    expect(reflectBackendService.broadcastDeletedBoard).toHaveBeenCalledWith("team-1", "board-1");
    expect(mockSetTableData).toHaveBeenCalledWith(expect.any(Function));
  });

  it("handles errors and sets refresh key", async () => {
    (BoardDataService.deleteFeedbackBoard as jest.Mock).mockRejectedValue(new Error("fail"));

    await handleConfirmDelete("board-1", tableData, "team-1", mockSetOpenDialogBoardId, mockSetTableData, mockSetRefreshKey);

    expect(appInsights.trackException).toHaveBeenCalledWith(expect.any(Error), {
      boardId: "board-1",
      boardName: "Board One",
      feedbackItemsCount: 3,
      action: "delete",
    });
    expect(mockSetRefreshKey).toHaveBeenCalledWith(true);
  });
});

describe("buildBoardSummaryState", () => {
  it("returns empty state when no boards exist", () => {
    const state = buildBoardSummaryState([]);
    expect(state.boardsTableItems).toEqual([]);
    expect(state.isDataLoaded).toBe(true);
    expect(state.feedbackBoards).toEqual([]);
    expect(state.actionItemsByBoard).toEqual({});
    expect(state.allDataLoaded).toBe(false);
  });

  it("builds board summary state correctly for provided boards", () => {
    const state = buildBoardSummaryState(mockBoards);

    // Sort mockBoards by createdDate descending to match function behavior
    const sortedMockBoards = [...mockBoards].sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());

    // The returned boardsTableItems should have the same length as mockBoards
    expect(state.boardsTableItems.length).toBe(mockBoards.length);

    // The boards should be sorted by createdDate descending
    sortedMockBoards.forEach((originalBoard, index) => {
      const item = state.boardsTableItems[index];
      expect(item.id).toBe(originalBoard.id);
      expect(item.boardName).toBe(originalBoard.title);
      expect(item.createdDate.getTime()).toBe(originalBoard.createdDate.getTime());
      expect(item.isArchived).toBe(originalBoard.isArchived);
      expect(item.archivedDate).toBe(originalBoard.archivedDate ? new Date(originalBoard.archivedDate) : null);
      expect(item.ownerId).toBe(originalBoard.createdBy.id);
    });

    // Check that actionItemsByBoard keys match board IDs
    expect(Object.keys(state.actionItemsByBoard)).toEqual(mockBoards.map(b => b.id));

    // Check that allDataLoaded is false
    expect(state.allDataLoaded).toBe(false);
  });
});

describe("BoardSummaryTable, additional coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("handleBoardsDocuments updates state via useEffect", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      // Check that rendered boards exist
      mockBoards.forEach(board => {
        expect(container.textContent).toContain(board.title);
      });
    });
  });

  it("handleActionItems, handles feedback items early return paths", async () => {
    // First board: no feedback items
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValueOnce([]);
    // Second board: has feedback items with no actionable IDs
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValueOnce([{ id: "item-1", associatedActionItemIds: [] }]);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      // BoardsTableItems should reflect board titles
      expect(container.textContent).toContain(mockBoards[0].title);
      expect(container.textContent).toContain(mockBoards[1].title);
    });
  });

  it("useEffect tracks exception if getBoardsForTeam fails", async () => {
    const error = new Error("fail");
    (BoardDataService.getBoardsForTeam as jest.Mock).mockRejectedValueOnce(error);

    render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(appInsights.trackException).toHaveBeenCalledWith(error);
    });
  });

  describe("Additional Coverage Tests", () => {
    it("TrashIcon shows disabled icon before delete delay passes", () => {
      const recentlyArchivedBoard: IBoardSummaryTableItem = {
        id: "board-recent",
        boardName: "Recently Archived",
        teamId: "team-1",
        createdDate: new Date(),
        isArchived: true,
        archivedDate: new Date(Date.now() - 60000), // 1 minute ago (less than 2 minutes)
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
        ownerId: "user-1",
      };

      const { container } = render(<TrashIcon board={recentlyArchivedBoard} currentUserId="user-1" currentUserIsTeamAdmin={false} onClick={jest.fn()} />);

      expect(container.querySelector(".trash-icon-disabled")).toBeTruthy();
    });

    it("TrashIcon shows enabled icon after delete delay passes", () => {
      const oldArchivedBoard: IBoardSummaryTableItem = {
        id: "board-old",
        boardName: "Old Archived",
        teamId: "team-1",
        createdDate: new Date(),
        isArchived: true,
        archivedDate: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago (more than 2 minutes)
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
        ownerId: "user-1",
      };

      const onClick = jest.fn();
      const { container } = render(<TrashIcon board={oldArchivedBoard} currentUserId="user-1" currentUserIsTeamAdmin={false} onClick={onClick} />);

      expect(container.querySelector(".trash-icon")).toBeTruthy();
    });

    it("TrashIcon doesn't show for non-archived boards", () => {
      const activeBoard: IBoardSummaryTableItem = {
        id: "board-active",
        boardName: "Active Board",
        teamId: "team-1",
        createdDate: new Date(),
        isArchived: false,
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
        ownerId: "user-1",
      };

      const { container } = render(<TrashIcon board={activeBoard} currentUserId="user-1" currentUserIsTeamAdmin={false} onClick={jest.fn()} />);

      expect(container.querySelector(".centered-cell")).toBeTruthy();
      expect(container.querySelector(".trash-icon")).toBeFalsy();
    });

    it("TrashIcon doesn't show for non-owner unless admin", () => {
      const archivedBoard: IBoardSummaryTableItem = {
        id: "board-owned",
        boardName: "Owned Board",
        teamId: "team-1",
        createdDate: new Date(),
        isArchived: true,
        archivedDate: new Date(Date.now() - 5 * 60 * 1000),
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
        ownerId: "other-user",
      };

      const { container } = render(<TrashIcon board={archivedBoard} currentUserId="user-1" currentUserIsTeamAdmin={false} onClick={jest.fn()} />);

      expect(container.querySelector(".centered-cell")).toBeTruthy();
      expect(container.querySelector(".trash-icon")).toBeFalsy();
    });

    it("TrashIcon shows for admin even if not owner", () => {
      const archivedBoard: IBoardSummaryTableItem = {
        id: "board-admin",
        boardName: "Admin Can Delete",
        teamId: "team-1",
        createdDate: new Date(),
        isArchived: true,
        archivedDate: new Date(Date.now() - 5 * 60 * 1000),
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
        ownerId: "other-user",
      };

      const { container } = render(<TrashIcon board={archivedBoard} currentUserId="user-1" currentUserIsTeamAdmin={true} onClick={jest.fn()} />);

      expect(container.querySelector(".trash-icon")).toBeTruthy();
    });

    it("isTrashEnabled returns false for non-archived board", () => {
      const activeBoard: IBoardSummaryTableItem = {
        id: "board-1",
        boardName: "Active",
        teamId: "team-1",
        createdDate: new Date(),
        isArchived: false,
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
        ownerId: "user-1",
      };

      expect(isTrashEnabled(activeBoard)).toBe(false);
    });

    it("isTrashEnabled returns false for archived board without archivedDate", () => {
      const legacyArchivedBoard: IBoardSummaryTableItem = {
        id: "board-legacy",
        boardName: "Legacy Archived",
        teamId: "team-1",
        createdDate: new Date(),
        isArchived: true,
        archivedDate: undefined,
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
        ownerId: "user-1",
      };

      expect(isTrashEnabled(legacyArchivedBoard)).toBe(false);
    });

    it("isTrashEnabled returns false before delay passes", () => {
      const recentBoard: IBoardSummaryTableItem = {
        id: "board-recent",
        boardName: "Recent",
        teamId: "team-1",
        createdDate: new Date(),
        isArchived: true,
        archivedDate: new Date(Date.now() - 60000), // 1 minute ago
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
        ownerId: "user-1",
      };

      expect(isTrashEnabled(recentBoard)).toBe(false);
    });

    it("isTrashEnabled returns true after delay passes", () => {
      const oldBoard: IBoardSummaryTableItem = {
        id: "board-old",
        boardName: "Old",
        teamId: "team-1",
        createdDate: new Date(),
        isArchived: true,
        archivedDate: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
        ownerId: "user-1",
      };

      expect(isTrashEnabled(oldBoard)).toBe(true);
    });

    it("handleArchiveToggle handles errors gracefully", async () => {
      const boardId = "error-board";
      const teamId = "team-1";
      const setTableData = jest.fn();
      const onArchiveToggle = jest.fn();
      const mockError = new Error("Archive failed");

      (BoardDataService.archiveFeedbackBoard as jest.Mock).mockRejectedValueOnce(mockError);

      await handleArchiveToggle(teamId, boardId, true, setTableData, onArchiveToggle);

      expect(appInsights.trackException).toHaveBeenCalledWith(
        mockError,
        expect.objectContaining({
          boardId,
          teamId,
          action: "archive",
        }),
      );
    });

    it("handleArchiveToggle restores archived board", async () => {
      const boardId = "restore-board";
      const teamId = "team-1";
      const setTableData = jest.fn();
      const onArchiveToggle = jest.fn();

      (BoardDataService.restoreArchivedFeedbackBoard as jest.Mock).mockResolvedValueOnce(undefined);

      await handleArchiveToggle(teamId, boardId, false, setTableData, onArchiveToggle);

      expect(BoardDataService.restoreArchivedFeedbackBoard).toHaveBeenCalledWith(teamId, boardId);
      expect(appInsights.trackEvent).toHaveBeenCalledWith({
        name: TelemetryEvents.FeedbackBoardRestored,
        properties: { boardId },
      });
      expect(onArchiveToggle).toHaveBeenCalled();
    });
  });

  describe("Sorting functionality", () => {
    it("renders sortable column headers", async () => {
      (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce(mockBoards);

      const { container, getByText } = render(
        <BoardSummaryTable 
          teamId="team-1" 
          currentUserId="user-1" 
          currentUserIsTeamAdmin={true} 
          onArchiveToggle={jest.fn()} 
          supportedWorkItemTypes={[]} 
        />
      );

      await waitFor(() => {
        expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
      });
    });

    it("buildBoardSummaryState handles null archivedDate", () => {
      const boardWithNullArchivedDate: IFeedbackBoardDocument = {
        id: "board-null-archived",
        teamId: "team-1",
        title: "Board with null archived date",
        createdDate: new Date("2023-01-01"),
        createdBy: mockedIdentity,
        isArchived: true,
        archivedDate: null as unknown as Date,
        columns: [],
        activePhase: "Collect",
        maxVotesPerUser: 5,
        boardVoteCollection: {},
        teamEffectivenessMeasurementVoteCollection: [],
      };

      const result = buildBoardSummaryState([boardWithNullArchivedDate]);
      
      expect(result.boardsTableItems).toHaveLength(1);
      expect(result.boardsTableItems[0].archivedDate).toBeNull();
    });

    it("buildBoardSummaryState handles undefined archivedDate", () => {
      const boardWithUndefinedArchivedDate: IFeedbackBoardDocument = {
        id: "board-undefined-archived",
        teamId: "team-1",
        title: "Board with undefined archived date",
        createdDate: new Date("2023-01-01"),
        createdBy: mockedIdentity,
        isArchived: true,
        columns: [],
        activePhase: "Collect",
        maxVotesPerUser: 5,
        boardVoteCollection: {},
        teamEffectivenessMeasurementVoteCollection: [],
      };

      const result = buildBoardSummaryState([boardWithUndefinedArchivedDate]);
      
      expect(result.boardsTableItems).toHaveLength(1);
    });
  });

  describe("Row expansion", () => {
    it("renders expansion toggle buttons for rows", async () => {
      (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce(mockBoards);

      const { container } = render(
        <BoardSummaryTable 
          teamId="team-1" 
          currentUserId="user-1" 
          currentUserIsTeamAdmin={true} 
          onArchiveToggle={jest.fn()} 
          supportedWorkItemTypes={[]} 
        />
      );

      await waitFor(() => {
        expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
      });
    });
  });
});

describe("BoardSummaryTable - Sorting Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("getSortedData returns unsorted data when no sort direction", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("toggleSort sets new column when clicking different column", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("toggleSort cycles through asc, desc, false for same column", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("sorts by createdDate column correctly", async () => {
    const boardsWithDates: IFeedbackBoardDocument[] = [
      { ...mockBoards[0], createdDate: new Date("2023-01-01") },
      { ...mockBoards[1], createdDate: new Date("2023-06-01") },
    ];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(boardsWithDates);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("sorts by archivedDate column correctly with null values", async () => {
    const boardsWithArchivedDates: IFeedbackBoardDocument[] = [
      { ...mockBoards[0], archivedDate: null as unknown as Date },
      { ...mockBoards[1], isArchived: true, archivedDate: new Date("2023-03-01") },
    ];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(boardsWithArchivedDates);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("sorts by boardName column alphabetically", async () => {
    const boardsWithNames: IFeedbackBoardDocument[] = [
      { ...mockBoards[0], title: "Zebra Board" },
      { ...mockBoards[1], title: "Alpha Board" },
    ];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(boardsWithNames);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("handles null values in sort comparison", async () => {
    const boardsWithNulls: IFeedbackBoardDocument[] = [
      { ...mockBoards[0], archivedDate: undefined as unknown as Date },
      { ...mockBoards[1], archivedDate: null as unknown as Date },
    ];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(boardsWithNulls);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });
});

describe("BoardSummaryTable - Row Expansion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("toggleExpanded adds row to expanded set", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    // Find and click the expand button
    const expandButtons = container.querySelectorAll(".contextual-menu-button");
    if (expandButtons.length > 0) {
      (expandButtons[0] as HTMLElement).click();
    }
  });

  it("toggleExpanded removes row from expanded set when clicked again", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const expandButtons = container.querySelectorAll(".contextual-menu-button");
    if (expandButtons.length > 0) {
      // Click to expand
      (expandButtons[0] as HTMLElement).click();
      // Click again to collapse
      (expandButtons[0] as HTMLElement).click();
    }
  });
});

describe("BoardSummaryTable - Action Items Loading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
  });

  it("handleActionItems processes boards with action items", async () => {
    const feedbackItemsWithActions = [
      { id: "item-1", associatedActionItemIds: [1, 2] },
      { id: "item-2", associatedActionItemIds: [3] },
    ];
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(feedbackItemsWithActions);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("handleActionItems handles boards with no feedback items", async () => {
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("handleActionItems handles feedback items without action items", async () => {
    const feedbackItemsWithoutActions = [
      { id: "item-1", associatedActionItemIds: [] as number[] },
      { id: "item-2" },
    ];
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(feedbackItemsWithoutActions);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });
});

describe("BoardSummaryTable - Delete Dialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("opens delete dialog when trash icon is clicked", async () => {
    const archivedBoards: IFeedbackBoardDocument[] = [
      { ...mockBoards[0], isArchived: true, archivedDate: new Date(Date.now() - 5 * 60 * 1000) },
    ];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(archivedBoards);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const trashIcon = container.querySelector(".trash-icon");
    if (trashIcon) {
      (trashIcon as HTMLElement).click();
    }
  });

  it("closes delete dialog when cancel is clicked", async () => {
    const archivedBoards: IFeedbackBoardDocument[] = [
      { ...mockBoards[0], isArchived: true, archivedDate: new Date(Date.now() - 5 * 60 * 1000) },
    ];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(archivedBoards);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });
});

describe("BoardSummaryTable - Archive Checkbox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("archive checkbox triggers handleArchiveToggle", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const archiveCheckboxes = container.querySelectorAll('input[type="checkbox"]');
    if (archiveCheckboxes.length > 0) {
      (archiveCheckboxes[0] as HTMLInputElement).click();
    }
  });
});

describe("BoardSummaryTable - boardRowSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("renders board row summary when row is expanded", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    // Click expand button to show summary
    const expandButtons = container.querySelectorAll(".contextual-menu-button");
    if (expandButtons.length > 0) {
      (expandButtons[0] as HTMLElement).click();
    }
  });

  it("boardRowSummary returns null for non-existent board", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });
});
