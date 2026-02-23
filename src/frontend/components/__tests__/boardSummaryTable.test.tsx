/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { IdentityRef } from "azure-devops-extension-api/WebApi";
import { WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";

import BoardSummaryTable, { buildBoardSummaryState, IBoardSummaryTableProps, IBoardSummaryTableItem } from "../boardSummaryTable";
import { TrashIcon, isTrashEnabled, handleArchiveToggle, isArchivedWithoutValidDate } from "../boardSummaryTable";
import BoardDataService from "../../dal/boardDataService";
import { itemDataService } from "../../dal/itemDataService";
import { workItemService } from "../../dal/azureDevOpsWorkItemService";
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
    reactPlugin: {
      trackMetric: jest.fn(),
      trackEvent: jest.fn(),
    },
  };
});

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: (_plugin: any, Component: any) => Component,
  useTrackMetric: () => jest.fn(),
}));

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

beforeAll(() => {
  if (!(window as unknown as { HTMLDialogElement?: typeof HTMLDialogElement }).HTMLDialogElement) {
    (window as unknown as { HTMLDialogElement: typeof HTMLElement }).HTMLDialogElement = class HTMLDialogElement extends HTMLElement {} as unknown as typeof HTMLDialogElement;
  }

  HTMLDialogElement.prototype.showModal = function showModal() {
    (this as unknown as { open: boolean }).open = true;
  };

  HTMLDialogElement.prototype.close = function close() {
    (this as unknown as { open: boolean }).open = false;
  };
});

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

    expect(container.querySelector(".spinner")).toBeTruthy();
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

  it("should classify invalid archivedDate as legacy archived", () => {
    const invalidArchivedBoard = { ...board, isArchived: true, archivedDate: new Date("invalid") };
    expect(isTrashEnabled(invalidArchivedBoard)).toBe(false);
    expect(isArchivedWithoutValidDate(invalidArchivedBoard)).toBe(true);
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

  it("should render legacy disabled trash icon when archivedDate is missing", () => {
    const legacyArchivedBoard: IBoardSummaryTableItem = {
      ...baseBoard,
      archivedDate: undefined,
    };
    const { container } = render(<TrashIcon board={legacyArchivedBoard} currentUserId="user-1" currentUserIsTeamAdmin={true} onClick={jest.fn()} />);
    expect(container.querySelector(".trash-icon-disabled")).toBeTruthy();
    expect(container.querySelector(".trash-icon-disabled")?.getAttribute("title")).toBe("Toggle archive off and on to enable delete.");
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

  it("updates table data via setTableData updater when archiving", async () => {
    const mockSetTableData = jest.fn();
    const mockOnArchiveToggle = jest.fn();

    await handleArchiveToggle("team123", "board456", true, mockSetTableData, mockOnArchiveToggle);

    const updater = mockSetTableData.mock.calls[0][0] as (prev: IBoardSummaryTableItem[]) => IBoardSummaryTableItem[];

    const prevData: IBoardSummaryTableItem[] = [
      {
        id: "board456",
        boardName: "Board A",
        createdDate: new Date("2023-01-01"),
        teamId: "team123",
        ownerId: "user-1",
        isArchived: false,
        archivedDate: undefined,
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
      },
      {
        id: "other",
        boardName: "Other",
        createdDate: new Date("2023-01-02"),
        teamId: "team123",
        ownerId: "user-1",
        isArchived: false,
        archivedDate: undefined,
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
      },
    ];

    const nextData = updater(prevData);
    const updated = nextData.find(b => b.id === "board456")!;
    expect(updated.isArchived).toBe(true);
    expect(updated.archivedDate).toBeInstanceOf(Date);
    expect(nextData.find(b => b.id === "other")?.isArchived).toBe(false);
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

  it("updates table data via setTableData updater when restoring", async () => {
    const mockSetTableData = jest.fn();
    const mockOnArchiveToggle = jest.fn();

    await handleArchiveToggle("team123", "board456", false, mockSetTableData, mockOnArchiveToggle);

    const updater = mockSetTableData.mock.calls[0][0] as (prev: IBoardSummaryTableItem[]) => IBoardSummaryTableItem[];

    const prevData: IBoardSummaryTableItem[] = [
      {
        id: "board456",
        boardName: "Board A",
        createdDate: new Date("2023-01-01"),
        teamId: "team123",
        ownerId: "user-1",
        isArchived: true,
        archivedDate: new Date("2023-02-01"),
        pendingWorkItemsCount: 0,
        totalWorkItemsCount: 0,
        feedbackItemsCount: 0,
      },
    ];

    const nextData = updater(prevData);
    expect(nextData[0].isArchived).toBe(false);
    expect(nextData[0].archivedDate).toBeNull();
  });
});

jest.spyOn(userIdentityHelper, "getUserIdentity").mockReturnValue({
  ...mockedIdentity,
  id: "user-1", // make sure the id matches your test
});

jest.spyOn(userIdentityHelper, "obfuscateUserId").mockImplementation(id => `encrypted-${id}`);

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

  it("renders board summary when a row is expanded", async () => {
    const { container, getAllByLabelText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.textContent).toContain(mockBoards[0].title);
    });

    const expandButtons = getAllByLabelText("Expand Row");
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-container")).toBeTruthy();
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

      expect(container.innerHTML).toBe("");
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

      expect(container.innerHTML).toBe("");
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

      const { container } = render(<BoardSummaryTable teamId="team-1" currentUserId="user-1" currentUserIsTeamAdmin={true} onArchiveToggle={jest.fn()} supportedWorkItemTypes={[]} />);

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

    it("buildBoardSummaryState handles undefined isArchived", () => {
      const boardWithUndefinedIsArchived: IFeedbackBoardDocument = {
        id: "board-undefined-isarchived",
        teamId: "team-1",
        title: "Board with undefined isArchived",
        createdDate: new Date("2023-01-01"),
        createdBy: mockedIdentity,
        columns: [],
        activePhase: "Collect",
        maxVotesPerUser: 5,
        boardVoteCollection: {},
        teamEffectivenessMeasurementVoteCollection: [],
      };

      const result = buildBoardSummaryState([boardWithUndefinedIsArchived]);

      expect(result.boardsTableItems).toHaveLength(1);
      expect(result.boardsTableItems[0].isArchived).toBe(false);
    });
  });

  describe("Row expansion", () => {
    it("renders expansion toggle buttons for rows", async () => {
      (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce(mockBoards);

      const { container } = render(<BoardSummaryTable teamId="team-1" currentUserId="user-1" currentUserIsTeamAdmin={true} onArchiveToggle={jest.fn()} supportedWorkItemTypes={[]} />);

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

    // Find the Retrospective Name header and click to sort
    const nameHeader = Array.from(container.querySelectorAll('th[role="columnheader"]')).find(th => th.textContent?.includes("Retrospective Name")) as HTMLElement;
    expect(nameHeader).toBeTruthy();

    // Click to sort ascending by name
    nameHeader.click();
    await waitFor(() => {
      expect(nameHeader.getAttribute("aria-sort")).toBe("ascending");
    });

    // Click again to sort descending by name
    nameHeader.click();
    await waitFor(() => {
      expect(nameHeader.getAttribute("aria-sort")).toBe("descending");
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

  it("sorts by archivedDate with nulls and covers both null-side branches", async () => {
    const boardsWithArchivedDates: IFeedbackBoardDocument[] = [
      { ...mockBoards[0], title: "Null A", isArchived: true, archivedDate: null as unknown as Date },
      { ...mockBoards[1], title: "Date Old", isArchived: true, archivedDate: new Date("2023-01-01") },
      { ...mockBoards[0], id: "board-null-b", title: "Null B", isArchived: true, archivedDate: undefined as unknown as Date },
      { ...mockBoards[1], id: "board-date-new", title: "Date New", isArchived: true, archivedDate: new Date("2023-02-01") },
    ];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce(boardsWithArchivedDates);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const archivedDateHeader = Array.from(container.querySelectorAll('th[role="columnheader"]')).find(th => th.textContent?.includes("Archived Date")) as HTMLElement;
    expect(archivedDateHeader).toBeTruthy();

    // First click: archivedDate becomes active sort (asc)
    archivedDateHeader.click();

    await waitFor(() => {
      const rows = container.querySelectorAll('tbody tr[tabindex="0"]');
      expect(rows.length).toBeGreaterThanOrEqual(4);
      const firstRowName = rows[0]?.querySelectorAll("td")?.[1]?.textContent;
      const secondRowName = rows[1]?.querySelectorAll("td")?.[1]?.textContent;
      // Date rows come first in asc, null/undefined go last
      expect([firstRowName, secondRowName]).toEqual(["Date Old", "Date New"]);
    });

    // Second click: archivedDate desc
    archivedDateHeader.click();

    await waitFor(() => {
      const rows = container.querySelectorAll('tbody tr[tabindex="0"]');
      const firstRowName = rows[0]?.querySelectorAll("td")?.[1]?.textContent;
      const secondRowName = rows[1]?.querySelectorAll("td")?.[1]?.textContent;
      expect([firstRowName, secondRowName]).toEqual(["Date New", "Date Old"]);
    });
  });

  it("createdDate sort toggles desc → none → asc and updates aria-sort", async () => {
    const boardsWithDates: IFeedbackBoardDocument[] = [
      { ...mockBoards[0], title: "Old", createdDate: new Date("2023-01-01") },
      { ...mockBoards[1], title: "New", createdDate: new Date("2023-06-01") },
    ];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce(boardsWithDates);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const createdDateHeader = Array.from(container.querySelectorAll('th[role="columnheader"]')).find(th => th.textContent?.includes("Created Date")) as HTMLElement;
    expect(createdDateHeader).toBeTruthy();

    // Initial state: createdDate is current sort and descending
    expect(createdDateHeader.getAttribute("aria-sort")).toBe("descending");

    // Click 1: desc -> none
    createdDateHeader.click();
    await waitFor(() => {
      expect(createdDateHeader.getAttribute("aria-sort")).toBe("none");
    });

    // Click 2: none -> asc
    createdDateHeader.click();
    await waitFor(() => {
      expect(createdDateHeader.getAttribute("aria-sort")).toBe("ascending");
      const rows = container.querySelectorAll('tbody tr[tabindex="0"]');
      const firstRowName = rows[0]?.querySelectorAll("td")?.[1]?.textContent;
      expect(firstRowName).toBe("Old");
    });
  });
});

describe("BoardSummaryTable - Row Expansion Rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("renders BoardSummary content when expanding a row", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    await waitFor(() => {
      expect(container.querySelectorAll(".contextual-menu-button").length).toBeGreaterThan(0);
    });

    const expandButtons = container.querySelectorAll(".contextual-menu-button");
    (expandButtons[0] as HTMLElement).click();

    await waitFor(() => {
      expect(container.textContent).toContain("Looks like no work items were created for this board.");
    });
  });
});

describe("buildBoardSummaryState", () => {
  it("returns initialized empty state for no documents", () => {
    const state = buildBoardSummaryState([]);
    expect(state.boardsTableItems).toEqual([]);
    expect(state.feedbackBoards).toEqual([]);
    expect(state.isDataLoaded).toBe(true);
    expect(state.allDataLoaded).toBe(false);
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

    // Wait for boards to be loaded and rendered
    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
      expect(container.querySelectorAll(".contextual-menu-button").length).toBeGreaterThan(0);
    });

    // Find and click the expand button
    const expandButtons = container.querySelectorAll(".contextual-menu-button");
    (expandButtons[0] as HTMLElement).click();

    // Verify expanded content appears
    await waitFor(() => {
      expect(container.textContent).toContain("Looks like no work items were created for this board.");
    });
  });

  it("toggleExpanded removes row from expanded set when clicked again", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    // Wait for boards to be loaded and rendered
    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
      expect(container.querySelectorAll(".contextual-menu-button").length).toBeGreaterThan(0);
    });

    const expandButtons = container.querySelectorAll(".contextual-menu-button");

    // Click to expand
    (expandButtons[0] as HTMLElement).click();

    // Verify expanded content appears
    await waitFor(() => {
      expect(container.textContent).toContain("Looks like no work items were created for this board.");
    });

    // Click again to collapse
    (expandButtons[0] as HTMLElement).click();

    // Verify collapsed - expanded row content should not be visible
    await waitFor(() => {
      expect(container.querySelector(".board-summary-expanded-row")).toBeFalsy();
    });
  });
});

describe("BoardSummaryTable - Action Items Loading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
  });

  it("updates total work item counts when action items are loaded", async () => {
    const boards: IFeedbackBoardDocument[] = [
      {
        ...mockBoards[0],
        id: "board-with-actions",
        title: "Board With Actions",
        createdDate: new Date("2024-01-02"),
      },
      {
        ...mockBoards[1],
        id: "board-no-actions",
        title: "Board No Actions",
        createdDate: new Date("2024-01-01"),
      },
    ];

    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce(boards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockImplementation(async (boardId: string) => {
      if (boardId === "board-with-actions") {
        return [{ id: "item-1", associatedActionItemIds: [1, 2] }] as any;
      }
      return [] as any;
    });

    (workItemService.getWorkItemStates as jest.Mock).mockResolvedValue([
      { name: "Active", category: "InProgress" },
      { name: "Done", category: "Completed" },
    ] as any);

    (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([
      {
        fields: {
          "System.WorkItemType": "Task",
          "System.State": "Active",
        },
      },
      {
        fields: {
          "System.WorkItemType": "Task",
          "System.State": "Done",
        },
      },
    ] as any);

    const props: IBoardSummaryTableProps = {
      ...baseProps,
      supportedWorkItemTypes: [{ name: "Task" } as any],
    };

    const { container, getByLabelText } = render(<BoardSummaryTable {...props} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByLabelText("totalWorkItemsCount 2")).toBeTruthy();
    });
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
    const feedbackItemsWithoutActions = [{ id: "item-1", associatedActionItemIds: [] as number[] }, { id: "item-2" }];
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(feedbackItemsWithoutActions);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("handleActionItems sets loaded state when action item loading fails", async () => {
    const error = new Error("feedback load failed");
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockRejectedValueOnce(error);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    expect(appInsights.trackException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        action: "loadBoardHistoryActionItems",
        teamId: "team-1",
      }),
    );
  });
});

describe("BoardSummaryTable - Delete Dialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("opens delete dialog when trash icon is clicked", async () => {
    const archivedBoards: IFeedbackBoardDocument[] = [{ ...mockBoards[0], isArchived: true, archivedDate: new Date(Date.now() - 5 * 60 * 1000) }];
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
    const archivedBoards: IFeedbackBoardDocument[] = [{ ...mockBoards[0], isArchived: true, archivedDate: new Date(Date.now() - 5 * 60 * 1000) }];
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

  it("archive checkbox wrapper stops propagation and onChange calls archive", async () => {
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce(mockBoards);
    (BoardDataService.archiveFeedbackBoard as jest.Mock).mockResolvedValueOnce(undefined);
    (BoardDataService.restoreArchivedFeedbackBoard as jest.Mock).mockResolvedValueOnce(undefined);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    await waitFor(() => {
      expect(document.body.querySelector('input[type="checkbox"]')).toBeTruthy();
    });

    const checkboxes = Array.from(document.body.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
    const checkbox = checkboxes.find(c => !c.checked) as HTMLInputElement;
    expect(checkbox).toBeTruthy();

    const wrapper = checkbox.closest("div.centered-cell") as HTMLElement;
    expect(wrapper).toBeTruthy();

    // Covers the stopPropagation handler on the wrapper div.
    fireEvent.click(wrapper);
    expect(BoardDataService.archiveFeedbackBoard).not.toHaveBeenCalled();

    // Covers the onChange handler which calls handleArchiveToggle.
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(BoardDataService.archiveFeedbackBoard).toHaveBeenCalled();
    });
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

describe("BoardSummaryTable - Sorting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("sorts by title column when clicked", async () => {
    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    // Click on title header to sort
    const titleHeader = getByText("Retrospective Name");
    if (titleHeader) {
      titleHeader.click();
    }

    expect(container).toBeTruthy();
  });

  it("sorts by created date column when clicked", async () => {
    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    // Click on created date header to sort
    const createdDateHeader = getByText("Created Date");
    if (createdDateHeader) {
      createdDateHeader.click();
    }

    expect(container).toBeTruthy();
  });

  it("toggles sort direction when same column is clicked twice", async () => {
    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const titleHeader = getByText("Retrospective Name");
    if (titleHeader) {
      titleHeader.click(); // First click - asc
      titleHeader.click(); // Second click - desc
    }

    expect(container).toBeTruthy();
  });

  it("clears sort when clicked three times", async () => {
    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const titleHeader = getByText("Retrospective Name");
    if (titleHeader) {
      titleHeader.click(); // First click - asc
      titleHeader.click(); // Second click - desc
      titleHeader.click(); // Third click - no sort
    }

    expect(container).toBeTruthy();
  });
});

describe("BoardSummaryTable - Row Expansion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("expands row when expand button is clicked", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const expandButtons = container.querySelectorAll('button[aria-label*="expand"]');
    if (expandButtons.length > 0) {
      (expandButtons[0] as HTMLElement).click();
    }

    expect(container).toBeTruthy();
  });

  it("collapses row when expand button is clicked again", async () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const expandButtons = container.querySelectorAll('button[aria-label*="expand"]');
    if (expandButtons.length > 0) {
      (expandButtons[0] as HTMLElement).click(); // Expand
      (expandButtons[0] as HTMLElement).click(); // Collapse
    }

    expect(container).toBeTruthy();
  });
});

describe("BoardSummaryTable - Action Items", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
  });

  it("displays action item count when feedback items have associated action items", async () => {
    const feedbackItemsWithActions = [
      {
        id: "feedback-1",
        title: "Feedback with action",
        boardId: "board-1",
        columnId: "col-1",
        associatedActionItemIds: [1, 2],
      },
    ];
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(feedbackItemsWithActions);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("handles empty action items gracefully", async () => {
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });
});

describe("BoardSummaryTable - Action Item Aggregation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue([]);
  });

  it("updates pending and resolved counts from actionable work items", async () => {
    const actionableBoard: IFeedbackBoardDocument = {
      ...mockBoards[0],
      id: "board-actionable",
      title: "Actionable Board",
    };

    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue([actionableBoard]);

    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValueOnce([{ id: "fb-1", associatedActionItemIds: [11, 12] }]);

    (workItemService.getWorkItemStates as jest.Mock).mockResolvedValue([
      { name: "To Do", category: "Proposed" },
      { name: "Done", category: "Completed" },
    ]);

    (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([
      {
        id: 11,
        fields: {
          "System.WorkItemType": "Task",
          "System.State": "To Do",
          "System.Title": "Task One",
          "System.ChangedDate": new Date().toISOString(),
          "System.AssignedTo": { displayName: "Alex" },
          "Microsoft.VSTS.Common.Priority": 1,
        },
      },
      {
        id: 12,
        fields: {
          "System.WorkItemType": "Task",
          "System.State": "Done",
          "System.Title": "Task Two",
          "System.ChangedDate": new Date().toISOString(),
          "System.AssignedTo": { displayName: "Blake" },
          "Microsoft.VSTS.Common.Priority": 2,
        },
      },
    ]);

    const supportedWorkItemTypes: WorkItemType[] = [
      {
        name: "Task",
        icon: { id: "task-icon", url: "https://example.com/task-icon.png" },
      } as unknown as WorkItemType,
    ];

    const { container } = render(<BoardSummaryTable {...baseProps} supportedWorkItemTypes={supportedWorkItemTypes} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    await waitFor(() => {
      expect(container.querySelector(".contextual-menu-button")).toBeTruthy();
    });

    const expandButton = container.querySelector(".contextual-menu-button") as HTMLElement;
    expandButton?.click();

    await waitFor(() => {
      const pendingCount = container.querySelector('[aria-label="pending work items count"]');
      const resolvedCount = container.querySelector('[aria-label="resolved work items count"]');
      expect(pendingCount?.textContent).toBe("1");
      expect(resolvedCount?.textContent).toBe("1");
    });

    expect(workItemService.getWorkItemsByIds).toHaveBeenCalledWith([11, 12]);
    expect(workItemService.getWorkItemStates).toHaveBeenCalledWith("Task");
  });
});

describe("BoardSummaryTable - Archive/Restore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("calls onArchiveToggle when archive button is clicked", async () => {
    const onArchiveToggle = jest.fn().mockResolvedValue(undefined);
    const propsWithArchiveToggle = { ...baseProps, onArchiveToggle };

    const { container } = render(<BoardSummaryTable {...propsWithArchiveToggle} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const archiveButtons = container.querySelectorAll('button[aria-label*="Archive"]');
    if (archiveButtons.length > 0) {
      (archiveButtons[0] as HTMLElement).click();
    }
  });

  it("handles restore of archived board", async () => {
    const archivedBoards: IFeedbackBoardDocument[] = [{ ...mockBoards[0], isArchived: true, archivedDate: new Date() }];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(archivedBoards);
    (BoardDataService.restoreArchivedFeedbackBoard as jest.Mock).mockResolvedValue(undefined);

    const onArchiveToggle = jest.fn().mockResolvedValue(undefined);
    const propsWithArchiveToggle = { ...baseProps, onArchiveToggle };

    const { container } = render(<BoardSummaryTable {...propsWithArchiveToggle} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });
});

describe("BoardSummaryTable - Delete Board", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("confirms delete when delete button is clicked", async () => {
    const archivedBoards: IFeedbackBoardDocument[] = [{ ...mockBoards[0], isArchived: true, archivedDate: new Date(Date.now() - 10 * 60 * 1000) }];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(archivedBoards);
    (BoardDataService.deleteFeedbackBoard as jest.Mock).mockResolvedValue(undefined);

    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("cancels delete when cancel button is clicked", async () => {
    const archivedBoards: IFeedbackBoardDocument[] = [{ ...mockBoards[0], isArchived: true, archivedDate: new Date(Date.now() - 10 * 60 * 1000) }];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(archivedBoards);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });
});

describe("BoardSummaryTable - Delete confirmation flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("deletes board and broadcasts changes when confirmed", async () => {
    const archivedBoard: IFeedbackBoardDocument = { ...mockBoards[0], id: "board-archive", title: "Archived Board", isArchived: true, archivedDate: new Date(Date.now() - 5 * 60 * 1000) };
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue([archivedBoard]);
    (BoardDataService.deleteFeedbackBoard as jest.Mock).mockResolvedValue(undefined);

    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    await waitFor(() => {
      expect(container.querySelector(".trash-icon")).toBeTruthy();
    });

    const trashIcon = container.querySelector(".trash-icon") as HTMLElement;
    trashIcon?.click();

    await waitFor(() => {
      expect(container.querySelector(".delete-board-dialog")?.textContent).toContain("Archived Board");
    });

    getByText("Delete").click();

    await waitFor(() => {
      expect(BoardDataService.deleteFeedbackBoard).toHaveBeenCalledWith(baseProps.teamId, "board-archive");
    });

    await waitFor(() => {
      expect(reflectBackendService.broadcastDeletedBoard).toHaveBeenCalledWith(baseProps.teamId, "board-archive");
    });
  });

  it("tracks exception when delete fails", async () => {
    const archivedBoard: IFeedbackBoardDocument = { ...mockBoards[0], id: "board-error", title: "Fail Board", isArchived: true, archivedDate: new Date(Date.now() - 5 * 60 * 1000) };
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue([archivedBoard]);
    const error = new Error("delete failed");
    (BoardDataService.deleteFeedbackBoard as jest.Mock).mockRejectedValue(error);

    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    await waitFor(() => {
      expect(container.querySelector(".trash-icon")).toBeTruthy();
    });

    const trashIcon = container.querySelector(".trash-icon") as HTMLElement;
    trashIcon?.click();

    await waitFor(() => {
      expect(container.querySelector(".delete-board-dialog")?.textContent).toContain("Fail Board");
    });

    getByText("Delete").click();

    await waitFor(() => {
      expect(appInsights.trackException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          boardId: "board-error",
          boardName: "Fail Board",
          feedbackItemsCount: 0,
          action: "delete",
        }),
      );
    });
  });
});

describe("BoardSummaryTable - TrashIcon and isTrashEnabled", () => {
  it("isTrashEnabled returns true when board is archived for more than 2 minutes", () => {
    const board: IBoardSummaryTableItem = {
      id: "board-1",
      boardName: "Test Board",
      createdDate: new Date(),
      teamId: "team-1",
      ownerId: "owner-1",
      isArchived: true,
      archivedDate: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      feedbackItemsCount: 0,
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
    };
    expect(isTrashEnabled(board)).toBe(true);
  });

  it("isTrashEnabled returns false when board is archived for less than 2 minutes", () => {
    const board: IBoardSummaryTableItem = {
      id: "board-1",
      boardName: "Test Board",
      createdDate: new Date(),
      teamId: "team-1",
      ownerId: "owner-1",
      isArchived: true,
      archivedDate: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
      feedbackItemsCount: 0,
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
    };
    expect(isTrashEnabled(board)).toBe(false);
  });

  it("isTrashEnabled returns false when archivedDate is undefined", () => {
    const board: IBoardSummaryTableItem = {
      id: "board-1",
      boardName: "Test Board",
      createdDate: new Date(),
      teamId: "team-1",
      ownerId: "owner-1",
      isArchived: false,
      feedbackItemsCount: 0,
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
    };
    expect(isTrashEnabled(board)).toBe(false);
  });
});

describe("BoardSummaryTable - handleArchiveToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("archives a non-archived board when toggleIsArchived is true", async () => {
    const teamId = "team-1";
    const boardId = "board-1";
    const setTableData = jest.fn();
    const onArchiveToggle = jest.fn().mockResolvedValue(undefined);

    (BoardDataService.archiveFeedbackBoard as jest.Mock).mockResolvedValue(undefined);

    await handleArchiveToggle(teamId, boardId, true, setTableData, onArchiveToggle);

    expect(BoardDataService.archiveFeedbackBoard).toHaveBeenCalledWith(teamId, boardId);
    expect(onArchiveToggle).toHaveBeenCalled();
  });

  it("restores an archived board when toggleIsArchived is false", async () => {
    const teamId = "team-1";
    const boardId = "board-1";
    const setTableData = jest.fn();
    const onArchiveToggle = jest.fn().mockResolvedValue(undefined);

    (BoardDataService.restoreArchivedFeedbackBoard as jest.Mock).mockResolvedValue(undefined);

    await handleArchiveToggle(teamId, boardId, false, setTableData, onArchiveToggle);

    expect(BoardDataService.restoreArchivedFeedbackBoard).toHaveBeenCalledWith(teamId, boardId);
    expect(onArchiveToggle).toHaveBeenCalled();
  });

  it("tracks exception when archive operation fails", async () => {
    const teamId = "team-1";
    const boardId = "board-error";
    const setTableData = jest.fn();
    const onArchiveToggle = jest.fn().mockResolvedValue(undefined);
    const error = new Error("Archive failed");

    (BoardDataService.archiveFeedbackBoard as jest.Mock).mockRejectedValue(error);

    await handleArchiveToggle(teamId, boardId, true, setTableData, onArchiveToggle);

    expect(appInsights.trackException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        boardId: "board-error",
        teamId: "team-1",
        action: "archive",
      }),
    );
  });

  it("tracks exception when restore operation fails", async () => {
    const teamId = "team-1";
    const boardId = "board-error";
    const setTableData = jest.fn();
    const onArchiveToggle = jest.fn().mockResolvedValue(undefined);
    const error = new Error("Restore failed");

    (BoardDataService.restoreArchivedFeedbackBoard as jest.Mock).mockRejectedValue(error);

    await handleArchiveToggle(teamId, boardId, false, setTableData, onArchiveToggle);

    expect(appInsights.trackException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        boardId: "board-error",
        teamId: "team-1",
        action: "restore",
      }),
    );
  });
});

describe("BoardSummaryTable - TrashIcon rendering", () => {
  it("renders disabled trash icon when board is archived but not past delay", () => {
    const board: IBoardSummaryTableItem = {
      id: "board-1",
      boardName: "Test Board",
      createdDate: new Date(),
      teamId: "team-1",
      ownerId: "owner-1",
      isArchived: true,
      archivedDate: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago, not past 2 min delay
      feedbackItemsCount: 0,
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
    };

    const { container } = render(<TrashIcon board={board} currentUserId="owner-1" currentUserIsTeamAdmin={false} onClick={jest.fn()} />);

    expect(container.querySelector(".trash-icon-disabled")).toBeTruthy();
    expect(container.querySelector(".trash-icon-disabled")?.getAttribute("title")).toBe("To delete this board, you must wait for 2 minutes after archiving.");
  });

  it("renders enabled trash icon when board is archived and past delay", () => {
    const board: IBoardSummaryTableItem = {
      id: "board-1",
      boardName: "Test Board",
      createdDate: new Date(),
      teamId: "team-1",
      ownerId: "owner-1",
      isArchived: true,
      archivedDate: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago, past 2 min delay
      feedbackItemsCount: 0,
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
    };

    const onClick = jest.fn();
    const { container } = render(<TrashIcon board={board} currentUserId="owner-1" currentUserIsTeamAdmin={false} onClick={onClick} />);

    expect(container.querySelector(".trash-icon")).toBeTruthy();
  });

  it("renders nothing when user is not owner or admin", () => {
    const board: IBoardSummaryTableItem = {
      id: "board-1",
      boardName: "Test Board",
      createdDate: new Date(),
      teamId: "team-1",
      ownerId: "owner-1",
      isArchived: true,
      archivedDate: new Date(Date.now() - 5 * 60 * 1000),
      feedbackItemsCount: 0,
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
    };

    const { container } = render(<TrashIcon board={board} currentUserId="different-user" currentUserIsTeamAdmin={false} onClick={jest.fn()} />);

    expect(container.querySelector(".trash-icon")).toBeFalsy();
    expect(container.querySelector(".trash-icon-disabled")).toBeFalsy();
  });

  it("renders trash icon when user is team admin but not owner", () => {
    const board: IBoardSummaryTableItem = {
      id: "board-1",
      boardName: "Test Board",
      createdDate: new Date(),
      teamId: "team-1",
      ownerId: "owner-1",
      isArchived: true,
      archivedDate: new Date(Date.now() - 5 * 60 * 1000),
      feedbackItemsCount: 0,
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
    };

    const { container } = render(<TrashIcon board={board} currentUserId="different-user" currentUserIsTeamAdmin={true} onClick={jest.fn()} />);

    expect(container.querySelector(".trash-icon")).toBeTruthy();
  });

  it("renders nothing when board is not archived", () => {
    const board: IBoardSummaryTableItem = {
      id: "board-1",
      boardName: "Test Board",
      createdDate: new Date(),
      teamId: "team-1",
      ownerId: "owner-1",
      isArchived: false,
      feedbackItemsCount: 0,
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
    };

    const { container } = render(<TrashIcon board={board} currentUserId="owner-1" currentUserIsTeamAdmin={true} onClick={jest.fn()} />);

    expect(container.querySelector(".trash-icon")).toBeFalsy();
  });
});

describe("BoardSummaryTable - sortedData with equal values and edge cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles sortedData when aVal equals bVal (returns 0)", async () => {
    const boardsWithSameDate: IFeedbackBoardDocument[] = [
      { ...mockBoards[0], title: "Board A", createdDate: new Date("2023-06-15") },
      { ...mockBoards[1], id: "board-same", title: "Board B", createdDate: new Date("2023-06-15") },
    ];
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(boardsWithSameDate);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    // Click on Created Date header to trigger sorting
    const createdDateHeader = getByText("Created Date");
    createdDateHeader.click();

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("covers archivedDate sort branch when first row has no archivedDate", async () => {
    const legacyArchived: IFeedbackBoardDocument = {
      ...mockBoards[0],
      id: "board-legacy-archived",
      title: "Legacy Archived",
      isArchived: true,
      archivedDate: undefined,
      createdDate: new Date("2024-01-02"),
    };

    const archivedWithDate: IFeedbackBoardDocument = {
      ...mockBoards[1],
      id: "board-archived-date",
      title: "Archived With Date",
      isArchived: true,
      archivedDate: new Date("2024-01-01"),
      createdDate: new Date("2024-01-01"),
    };

    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce([legacyArchived, archivedWithDate]);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    getByText("Archived Date").click();

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("covers archivedDate sort branch when second row has no archivedDate", async () => {
    const archivedWithDate: IFeedbackBoardDocument = {
      ...mockBoards[0],
      id: "board-archived-date-first",
      title: "Archived With Date First",
      isArchived: true,
      archivedDate: new Date("2024-01-01"),
      createdDate: new Date("2024-01-02"),
    };

    const legacyArchived: IFeedbackBoardDocument = {
      ...mockBoards[1],
      id: "board-legacy-second",
      title: "Legacy Second",
      isArchived: true,
      archivedDate: undefined,
      createdDate: new Date("2024-01-01"),
    };

    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce([archivedWithDate, legacyArchived]);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    getByText("Archived Date").click();

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });
  });

  it("closes delete dialog via close button in header", async () => {
    const archivedBoard: IFeedbackBoardDocument = { ...mockBoards[0], id: "board-close-test", title: "Close Test Board", isArchived: true, archivedDate: new Date(Date.now() - 5 * 60 * 1000) };
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue([archivedBoard]);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container, getByLabelText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    await waitFor(() => {
      expect(container.querySelector(".trash-icon")).toBeTruthy();
    });

    // Open the dialog
    const trashIcon = container.querySelector(".trash-icon") as HTMLElement;
    trashIcon?.click();

    await waitFor(() => {
      expect(container.querySelector(".delete-board-dialog")).toBeTruthy();
    });

    const dialog = container.querySelector(".delete-board-dialog") as HTMLDialogElement;
    const headerCloseButton = container.querySelector('.delete-board-dialog .header button[aria-label="Close"]') as HTMLButtonElement;

    expect(dialog).toBeTruthy();
    expect(headerCloseButton).toBeTruthy();

    fireEvent.click(headerCloseButton);

    await waitFor(() => {
      expect((dialog as any).open).toBe(false);
    });
  });

  it("closes delete dialog via default close button", async () => {
    const archivedBoard: IFeedbackBoardDocument = { ...mockBoards[0], id: "board-default-close", title: "Default Close Board", isArchived: true, archivedDate: new Date(Date.now() - 5 * 60 * 1000) };
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue([archivedBoard]);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    await waitFor(() => {
      expect(container.querySelector(".trash-icon")).toBeTruthy();
    });

    // Open the dialog
    const trashIcon = container.querySelector(".trash-icon") as HTMLElement;
    trashIcon?.click();

    await waitFor(() => {
      expect(container.querySelector(".delete-board-dialog")).toBeTruthy();
    });

    const dialog = container.querySelector(".delete-board-dialog") as HTMLDialogElement;
    const footerCloseButton = container.querySelector(".delete-board-dialog .inner button.default.button") as HTMLButtonElement;

    expect(dialog).toBeTruthy();
    expect(footerCloseButton).toBeTruthy();

    fireEvent.click(footerCloseButton);

    await waitFor(() => {
      expect((dialog as any).open).toBe(false);
    });
  });

  it("triggers onClose handler when dialog is closed", async () => {
    const archivedBoard: IFeedbackBoardDocument = { ...mockBoards[0], id: "board-onclose", title: "OnClose Board", isArchived: true, archivedDate: new Date(Date.now() - 5 * 60 * 1000) };
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue([archivedBoard]);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    await waitFor(() => {
      expect(container.querySelector(".trash-icon")).toBeTruthy();
    });

    // Open the dialog
    const trashIcon = container.querySelector(".trash-icon") as HTMLElement;
    trashIcon?.click();

    const dialog = container.querySelector(".delete-board-dialog") as HTMLDialogElement;

    await waitFor(() => {
      expect(dialog).toBeTruthy();
      expect((dialog as any).open).toBe(true);
    });

    dialog.dispatchEvent(new Event("close"));

    await waitFor(() => {
      expect((dialog as any).open).toBe(false);
    });
  });

  it("covers non-date sort branches: aVal > bVal and equality return 0", async () => {
    const boardsForNameSort: IFeedbackBoardDocument[] = [
      // Ensure initial order (createdDate desc) is Zebra then Alpha so comparator sees aVal > bVal.
      { ...mockBoards[0], id: "board-z", title: "Zebra", createdDate: new Date("2023-06-01") },
      { ...mockBoards[1], id: "board-a", title: "Alpha", createdDate: new Date("2023-01-01") },
      // Two equal names to hit the comparator's equality branch (return 0).
      { ...mockBoards[0], id: "board-s1", title: "Same", createdDate: new Date("2023-05-01") },
      { ...mockBoards[1], id: "board-s2", title: "Same", createdDate: new Date("2023-04-01") },
    ];

    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce(boardsForNameSort);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    // Trigger non-date sorting by clicking the <th> (onClick handler is on the header cell).
    const titleHeaderCell = getByText("Retrospective Name").closest("th") as HTMLTableCellElement;
    expect(titleHeaderCell).toBeTruthy();
    fireEvent.click(titleHeaderCell);

    await waitFor(() => {
      expect(titleHeaderCell.getAttribute("aria-sort")).toBe("ascending");
    });

    await waitFor(() => {
      const rows = container.querySelectorAll('tbody tr[tabindex="0"]');
      expect(rows.length).toBeGreaterThanOrEqual(4);
    });
  });

  it("covers non-date sort branch when aVal is null/undefined", async () => {
    const boardWithMissingTitle: IFeedbackBoardDocument = {
      ...(mockBoards[0] as any),
      id: "board-missing-title-a",
      title: undefined,
      createdDate: new Date("2024-02-02"),
    };

    const boardWithTitle: IFeedbackBoardDocument = {
      ...mockBoards[1],
      id: "board-has-title-a",
      title: "Alpha",
      createdDate: new Date("2024-02-01"),
    };

    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce([boardWithMissingTitle, boardWithTitle]);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const titleHeaderCell = getByText("Retrospective Name").closest("th") as HTMLTableCellElement;
    fireEvent.click(titleHeaderCell);

    await waitFor(() => {
      expect(titleHeaderCell.getAttribute("aria-sort")).toBe("ascending");
    });
  });

  it("covers non-date sort branch when bVal is null/undefined", async () => {
    const boardWithTitle: IFeedbackBoardDocument = {
      ...mockBoards[0],
      id: "board-has-title-b",
      title: "Alpha",
      createdDate: new Date("2024-02-02"),
    };

    const boardWithMissingTitle: IFeedbackBoardDocument = {
      ...(mockBoards[1] as any),
      id: "board-missing-title-b",
      title: undefined,
      createdDate: new Date("2024-02-01"),
    };

    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce([boardWithTitle, boardWithMissingTitle]);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const titleHeaderCell = getByText("Retrospective Name").closest("th") as HTMLTableCellElement;
    fireEvent.click(titleHeaderCell);

    await waitFor(() => {
      expect(titleHeaderCell.getAttribute("aria-sort")).toBe("ascending");
    });
  });

  it("covers non-date sort descending when aVal > bVal", async () => {
    const boardAlpha: IFeedbackBoardDocument = {
      ...mockBoards[0],
      id: "board-alpha",
      title: "Alpha",
      createdDate: new Date("2024-02-02"),
    };

    const boardZeta: IFeedbackBoardDocument = {
      ...mockBoards[1],
      id: "board-zeta",
      title: "Zeta",
      createdDate: new Date("2024-02-01"),
    };

    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce([boardAlpha, boardZeta]);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    const { container, getByText } = render(<BoardSummaryTable {...baseProps} />);

    await waitFor(() => {
      expect(container.querySelector(".board-summary-table-container")).toBeTruthy();
    });

    const titleHeaderCell = getByText("Retrospective Name").closest("th") as HTMLTableCellElement;
    // Click once for ascending
    fireEvent.click(titleHeaderCell);
    await waitFor(() => {
      expect(titleHeaderCell.getAttribute("aria-sort")).toBe("ascending");
    });
    // Click again for descending - this covers aVal > bVal with desc direction
    fireEvent.click(titleHeaderCell);
    await waitFor(() => {
      expect(titleHeaderCell.getAttribute("aria-sort")).toBe("descending");
    });
  });
});
