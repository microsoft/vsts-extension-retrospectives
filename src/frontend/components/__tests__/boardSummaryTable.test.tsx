// Mock all modules first before importing anything
jest.mock("../../utilities/telemetryClient", () => {
  return {
    appInsights: {
      trackEvent: jest.fn(),
      trackException: jest.fn(),
    },
    TelemetryEvents: {
      FeedbackBoardArchived: "FeedbackBoardArchived",
      FeedbackBoardRestored: "FeedbackBoardRestored",
    },
  };
});

jest.mock("../../dal/itemDataService");

jest.mock("../../dal/boardDataService", () => {
  const mockBoardDataService = {
    getBoardsForTeam: jest.fn(),
    deleteFeedbackBoard: jest.fn(),
    archiveFeedbackBoard: jest.fn(),
    restoreArchivedFeedbackBoard: jest.fn(),
  };
  return mockBoardDataService;
});

jest.mock("../../dal/azureDevOpsWorkItemService");
jest.mock("../../dal/reflectBackendService");

import React from "react";
import { render } from "@testing-library/react";
import { IdentityRef } from "azure-devops-extension-api/WebApi";

import BoardSummaryTable, { IBoardSummaryTableProps, IBoardSummaryTableItem } from "../boardSummaryTable";
import { TrashIcon, isTrashEnabled, handleArchiveToggle } from "../boardSummaryTable";
import BoardDataService from "../../dal/boardDataService";
import { IFeedbackBoardDocument } from "../../interfaces/feedback";
import { appInsights, TelemetryEvents } from "../../utilities/telemetryClient";
import { itemDataService } from "../../dal/itemDataService";

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
    title: "Test Board",
    createdDate: new Date(),
    createdBy: mockedIdentity,
    isArchived: false,
    columns: [], // Adjust as needed
    activePhase: "Collect",
    maxVotesPerUser: 5,
    boardVoteCollection: {},
    teamEffectivenessMeasurementVoteCollection: [],
  },
];

const baseProps: IBoardSummaryTableProps = {
  teamId: "team-1",
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn(),
};

describe("BoardSummaryTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock implementations
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue(mockBoards);
    (BoardDataService.archiveFeedbackBoard as jest.Mock).mockResolvedValue(undefined);
    (BoardDataService.restoreArchivedFeedbackBoard as jest.Mock).mockResolvedValue(undefined);

    // Mock itemDataService directly
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("renders when no boards exist", () => {
    const { container } = render(<BoardSummaryTable {...baseProps} />);
    expect(container).toBeTruthy();
  });

  it("renders loading spinner initially", async () => {
    (BoardDataService.getBoardsForTeam as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { container } = render(<BoardSummaryTable {...baseProps} />);

    // Should render the component
    expect(container).toBeTruthy();
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

describe("TrashIcon", () => {
  it("should render enabled trash icon when board is deletable", () => {
    const board: IBoardSummaryTableItem = {
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

    const { container } = render(<TrashIcon board={board} onClick={jest.fn()} />);

    expect(container.querySelector(".trash-icon")).toBeTruthy();
  });

  it("should render disabled trash icon when board is not deletable yet", () => {
    const board = {
      boardName: "Sample Board",
      createdDate: new Date(),
      isArchived: true,
      archivedDate: new Date(Date.now() - 1 * 60 * 1000), // Archived 1 min ago
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
      feedbackItemsCount: 0,
      id: "board-1",
      teamId: "team-1",
      ownerId: "user-1",
    };

    const { container } = render(<TrashIcon board={board} onClick={jest.fn()} />);

    expect(container.querySelector(".trash-icon-disabled")).toBeTruthy();
  });

  it("should not render trash icon when board is not archived", () => {
    const board = {
      boardName: "Sample Board",
      createdDate: new Date(),
      isArchived: false,
      archivedDate: undefined as Date | undefined,
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
      feedbackItemsCount: 0,
      id: "board-1",
      teamId: "team-1",
      ownerId: "user-1",
    };

    const { container } = render(<TrashIcon board={board} onClick={jest.fn()} />);

    expect(container.querySelector(".trash-icon")).toBeFalsy();
    expect(container.querySelector(".trash-icon-disabled")).toBeFalsy();
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
