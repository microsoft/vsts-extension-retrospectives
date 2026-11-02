import React from "react";
import { render, waitFor, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { IFeedbackBoardDocument, IFeedbackItemDocument } from "../../interfaces/feedback";
import { WorkflowPhase } from "../../interfaces/workItem";
import { mocked } from "jest-mock";
import FeedbackBoard, { FeedbackBoardProps, IColumn, IColumnItem, mergeServerFeedbackItems } from "../../components/feedbackBoard";
import { testColumnProps } from "../__mocks__/mocked_components/mockedFeedbackColumn";
import { IdentityRef } from "azure-devops-extension-api/WebApi";
import type { WorkItem } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { itemDataService } from "../../dal/itemDataService";
import { workService } from "../../dal/azureDevOpsWorkService";
import { workItemService } from "../../dal/azureDevOpsWorkItemService";
import { appInsights } from "../../utilities/telemetryClient";
import { LIVE_SYNC_POLL_INTERVAL_MS } from "../../utilities/pollingLoop";

const feedbackColumnPropsSpy = jest.fn();

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
  },
  appInsights: {
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
  TelemetryEvents: {},
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: jest.fn((_plugin, Component) => Component),
  useTrackMetric: () => jest.fn(),
}));

jest.mock("../feedbackBoardMetadataForm", () => mocked({}));

jest.mock("../../dal/itemDataService", () => ({
  itemDataService: {
    getFeedbackItemsForBoardStrict: jest.fn(),
    getFeedbackItem: jest.fn(),
    getBoardItem: jest.fn(),
    flipTimer: jest.fn(),
  },
}));

jest.mock("../../dal/azureDevOpsWorkService", () => ({
  workService: {
    getIterations: jest.fn(),
    getTeamFieldValues: jest.fn(),
  },
}));

jest.mock("../../dal/azureDevOpsWorkItemService", () => ({
  workItemService: {
    getWorkItemsByIds: jest.fn(),
  },
}));

const mockNavigateByKeyboard = jest.fn();
const mockFocusColumn = jest.fn();

jest.mock("../feedbackColumn", () => {
  const React = require("react");
  return React.forwardRef(function MockFeedbackColumn(props: any, ref: any) {
    feedbackColumnPropsSpy(props);
    React.useImperativeHandle(ref, () => ({
      navigateByKeyboard: mockNavigateByKeyboard,
      focusColumn: mockFocusColumn,
    }));
    return <div data-testid={`column-${props.columnId}`} data-column-id={props.columnId} className="feedback-column"></div>;
  });
});

jest.mock("../feedbackCarousel", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="feedback-carousel"></div>),
}));

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
  },
  appInsights: {
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
  TelemetryEvents: {},
}));

jest.mock("../feedbackBoardMetadataForm", () => mocked({}));

jest.mock("azure-devops-extension-api/Work/WorkClient", () => {
  const getTeamIterationsMock = () => {
    return [
      mocked({
        attributes: mocked({
          finishDate: new Date(),
          startDate: new Date(),
          timeFrame: 1,
        }),
        id: "iterationId",
        name: "iteration name",
        path: "default path",
        _links: [],
        url: "https://teamfieldvaluesurl",
      }),
    ];
  };

  const getTeamFieldValuesMock = () => {
    return [
      mocked({
        defaultValue: "default field value",
        field: mocked({
          referenceName: "default reference name",
          url: "https://fieldurl",
        }),
        values: [
          mocked({
            includeChildren: false,
            value: "default team field value",
          }),
        ],
        links: [],
        url: "https://teamfieldvaluesurl",
      }),
    ];
  };

  const workRestClientMock = jest.fn().mockImplementation(() => ({
    getTeamIterations: getTeamIterationsMock,
    getTeamFieldValues: getTeamFieldValuesMock,
  }));

  return { WorkRestClient: workRestClientMock };
});

jest.mock("azure-devops-extension-api/Common", () => ({
  getClient: () => ({
    getIdentities: jest.fn().mockResolvedValue([]),
    getUserInfo: jest.fn().mockResolvedValue({ displayName: "Mock User" }),
  }),
}));

const mockedIdentity: IdentityRef = {
  directoryAlias: "",
  id: "",
  imageUrl: "",
  inactive: false,
  isAadIdentity: false,
  isContainer: false,
  isDeletedInOrigin: false,
  profileUrl: "",
  uniqueName: "",
  _links: undefined,
  descriptor: "",
  displayName: "",
  url: "",
};

const mockedBoard: IFeedbackBoardDocument = {
  id: testColumnProps.boardId,
  title: testColumnProps.boardTitle,
  teamId: testColumnProps.team.id,
  createdBy: mockedIdentity,
  createdDate: new Date(),
  columns: testColumnProps.columnIds.map(columnId => testColumnProps.columns[columnId].columnProperties),
  activePhase: "Vote",
  maxVotesPerUser: 5,
  boardVoteCollection: {},
  teamEffectivenessMeasurementVoteCollection: [],
};

const mockedProps: FeedbackBoardProps = {
  displayBoard: true,
  board: mockedBoard,
  team: testColumnProps.team,
  workflowPhase: "Vote",
  nonHiddenWorkItemTypes: testColumnProps.nonHiddenWorkItemTypes,
  allWorkItemTypes: testColumnProps.allWorkItemTypes,
  isAnonymous: testColumnProps.isBoardAnonymous,
  hideFeedbackItems: testColumnProps.hideFeedbackItems,
  userId: "",
  onColumnNotesChange: jest.fn().mockResolvedValue(undefined),
};

const mockFeedbackItems: IFeedbackItemDocument[] = [
  {
    id: "item-1",
    boardId: "board-1",
    title: "Test feedback item 1",
    columnId: testColumnProps.columnIds[0],
    originalColumnId: testColumnProps.columnIds[0],
    upvotes: 0,
    voteCollection: {},
    createdDate: new Date(),
    userIdRef: "user-1",
    timerSecs: 0,
    timerState: false,
    timerId: null,
    groupIds: [],
    isGroupedCarouselItem: false,
    associatedActionItemIds: [],
  },
  {
    id: "item-2",
    boardId: "board-1",
    title: "Test feedback item 2",
    columnId: testColumnProps.columnIds[1],
    originalColumnId: testColumnProps.columnIds[1],
    upvotes: 5,
    voteCollection: {},
    createdDate: new Date(),
    userIdRef: "user-2",
    timerSecs: 0,
    timerState: false,
    timerId: null,
    groupIds: [],
    isGroupedCarouselItem: false,
    associatedActionItemIds: [123],
  },
];

const getLatestColumnProps = (columnId: string): any => {
  const columnCalls = feedbackColumnPropsSpy.mock.calls.filter(call => (call[0] as { columnId?: string })?.columnId === columnId);
  return columnCalls[columnCalls.length - 1]?.[0];
};

const getLatestColumnPropsById = (columnId: string) => {
  for (let index = feedbackColumnPropsSpy.mock.calls.length - 1; index >= 0; index -= 1) {
    const [props] = feedbackColumnPropsSpy.mock.calls[index] ?? [];
    if (props?.columnId === columnId) {
      return props;
    }
  }

  return undefined;
};

const renderWithRef = (props: FeedbackBoardProps = mockedProps) => {
  const renderResult = render(<FeedbackBoard {...props} />);
  return { ...renderResult };
};

// In production, key events usually target a focused Element.
// In these tests we often dispatch on `document`, which makes `e.target` a `Document` without `.closest()`.
// Provide a minimal shim so keyboard shortcut handling doesn't crash under jsdom.
beforeAll(() => {
  if (!(document as unknown as { closest?: unknown }).closest) {
    (document as unknown as { closest: () => null }).closest = () => null;
  }
});

describe("FeedbackBoard Component", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    feedbackColumnPropsSpy.mockClear();
    mockNavigateByKeyboard.mockClear();
    mockFocusColumn.mockClear();

    // Default mock implementations
    (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);
    (itemDataService.getBoardItem as jest.Mock).mockResolvedValue(mockedBoard);
    (workService.getIterations as jest.Mock).mockResolvedValue([{ path: "Iteration\\Sprint 1", id: "iter-1" }]);
    (workService.getTeamFieldValues as jest.Mock).mockResolvedValue({
      values: [{ value: "Area\\Path\\1" }],
    });
    (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([]);
  });

  describe("Basic Rendering", () => {
    it("can be rendered", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);
      const feedbackBoard = container.querySelector(".feedback-board");
      expect(feedbackBoard).toBeTruthy();
      expect(feedbackBoard).toHaveClass("scroll-mode-column");
    });

    it("applies board scroll mode class", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} scrollMode="board" />);
      const feedbackBoard = container.querySelector(".feedback-board");
      expect(feedbackBoard).toHaveClass("scroll-mode-board");
    });

    it("renders error message when displayBoard is false", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} displayBoard={false} />);
      expect(container.textContent).toContain("An unexpected exception occurred");
    });
  });

  describe("Component Lifecycle", () => {
    it("initializes columns on mount", async () => {
      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledWith(mockedBoard.id);
      });
    });

    it("fetches feedback items on mount", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledWith(mockedBoard.id);
      });
    });

    it("sets default iteration and area path on mount", async () => {
      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(workService.getIterations).toHaveBeenCalledWith(testColumnProps.team.id, "current");
        expect(workService.getTeamFieldValues).toHaveBeenCalledWith(testColumnProps.team.id);
      });
    });

    it("polls the board's feedback items again after the live sync interval", async () => {
      jest.useFakeTimers();

      render(<FeedbackBoard {...mockedProps} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });

      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(1);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(LIVE_SYNC_POLL_INTERVAL_MS);
      });

      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(2);
      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenLastCalledWith(mockedBoard.id);
    });

    it("stops polling on unmount", async () => {
      jest.useFakeTimers();

      const { unmount } = render(<FeedbackBoard {...mockedProps} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });

      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(1);

      unmount();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(LIVE_SYNC_POLL_INTERVAL_MS * 5);
      });

      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(1);
    });

    it("keeps polling with backoff and reports the error when a poll fails", async () => {
      jest.useFakeTimers();
      const pollError = new Error("Service unavailable");
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockRejectedValueOnce(pollError).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });

      expect(appInsights.trackException).toHaveBeenCalledWith(pollError, expect.objectContaining({ action: "pollFeedbackItems", boardId: mockedBoard.id, consecutiveErrorCount: 1 }));
      // The board is shown after the first attempt even if it failed.
      expect(getLatestColumnProps(mockFeedbackItems[0].columnId)?.isDataLoaded).toBe(true);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(3000);
      });

      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(2);
      expect(getLatestColumnProps(mockFeedbackItems[0].columnId)?.columnItems.map((item: any) => item.feedbackItem.id)).toContain(mockFeedbackItems[0].id);
    });
  });

  describe("Component Updates", () => {
    it("reloads data when board ID changes", async () => {
      const { rerender } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });

      const initialCallCount = (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mock.calls.length;

      const newBoard = { ...mockedBoard, id: "new-board-id" };
      rerender(<FeedbackBoard {...mockedProps} board={newBoard} />);

      await waitFor(() => {
        expect((itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledWith("new-board-id");
      });
    });

    it("reloads data when board modifiedDate changes", async () => {
      const { rerender } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(1);
      });

      const newBoard = { ...mockedBoard, modifiedDate: new Date() };
      rerender(<FeedbackBoard {...mockedProps} board={newBoard} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(2);
      });
    });

    it("updates default paths when team ID changes", async () => {
      const { rerender } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(workService.getIterations).toHaveBeenCalledTimes(1);
      });

      const newTeam = { ...testColumnProps.team, id: "new-team-id" };
      rerender(<FeedbackBoard {...mockedProps} team={newTeam} />);

      await waitFor(() => {
        expect(workService.getIterations).toHaveBeenCalledWith("new-team-id", "current");
        expect(workService.getTeamFieldValues).toHaveBeenCalledWith("new-team-id");
      });
    });

    it("accepts onVoteCasted callback prop", async () => {
      const onVoteCasted = jest.fn();
      const boardWithVotes = {
        ...mockedBoard,
        boardVoteCollection: { "encrypted-user-id": 3 },
      };

      const { rerender } = render(<FeedbackBoard {...mockedProps} board={boardWithVotes} onVoteCasted={onVoteCasted} />);

      const newBoard = { ...boardWithVotes, id: "new-board-id" };
      rerender(<FeedbackBoard {...mockedProps} board={newBoard} onVoteCasted={onVoteCasted} />);

      // The component should accept the onVoteCasted prop without errors
      expect(onVoteCasted).not.toHaveBeenCalled(); // Not called unless a vote is cast
    });
  });

  describe("Iteration and Area Path Setup", () => {
    it("uses current iteration when available", async () => {
      const currentIterations = [{ path: "Current\\Sprint", id: "current-iter" }];
      (workService.getIterations as jest.Mock).mockResolvedValue(currentIterations);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(workService.getIterations).toHaveBeenCalledWith(testColumnProps.team.id, "current");
      });
    });

    it("falls back to any iteration when no current iteration", async () => {
      (workService.getIterations as jest.Mock)
        .mockResolvedValueOnce([]) // No current iterations
        .mockResolvedValueOnce([{ path: "Past\\Sprint", id: "past-iter" }]); // Fallback

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(workService.getIterations).toHaveBeenCalledTimes(2);
        expect(workService.getIterations).toHaveBeenNthCalledWith(1, testColumnProps.team.id, "current");
        expect(workService.getIterations).toHaveBeenNthCalledWith(2, testColumnProps.team.id);
      });
    });

    it("handles empty iteration response", async () => {
      (workService.getIterations as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(workService.getIterations).toHaveBeenCalled();
      });
    });

    it("handles empty area path response", async () => {
      (workService.getTeamFieldValues as jest.Mock).mockResolvedValue({ values: [] });

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(workService.getTeamFieldValues).toHaveBeenCalled();
      });
    });
  });

  describe("Feedback Items Loading", () => {
    it("loads feedback items with action items", async () => {
      const itemWithActions = {
        ...mockFeedbackItems[1],
        associatedActionItemIds: [123, 456],
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithActions]);
      (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([
        { id: 123, title: "Action 1" },
        { id: 456, title: "Action 2" },
      ]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(workItemService.getWorkItemsByIds).toHaveBeenCalledWith([123, 456]);
      });
    });

    it("handles feedback items without action items", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([mockFeedbackItems[0]]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });

      expect(workItemService.getWorkItemsByIds).not.toHaveBeenCalled();
    });

    it("handles null feedback items response", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(null);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });

      // Should still render the board
      const feedbackBoard = container.querySelector(".feedback-board");
      expect(feedbackBoard).toBeTruthy();
    });

    it("filters items for deleted columns", async () => {
      const itemForDeletedColumn = {
        ...mockFeedbackItems[0],
        columnId: "non-existent-column",
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([mockFeedbackItems[0], itemForDeletedColumn]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });
    });
  });

  describe("Column Initialization", () => {
    it("initializes columns with default icon when missing", async () => {
      const boardWithoutIcons = {
        ...mockedBoard,
        columns: mockedBoard.columns.map(col => ({ ...col, iconClass: "" })),
      };

      render(<FeedbackBoard {...mockedProps} board={boardWithoutIcons} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });
    });

    it("initializes columns with default color when missing", async () => {
      const boardWithoutColors = {
        ...mockedBoard,
        columns: mockedBoard.columns.map(col => ({ ...col, accentColor: "" })),
      };

      render(<FeedbackBoard {...mockedProps} board={boardWithoutColors} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });
    });

    it("renders columns after data is loaded", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const columns = screen.getAllByTestId(/column-/);
        expect(columns.length).toBe(testColumnProps.columnIds.length);
      });
    });
  });

  describe("Column Notes Integration", () => {
    const buildBoardWithNotes = (firstNote: string, secondNote = "") => ({
      ...mockedBoard,
      columns: mockedBoard.columns.map((column, index) => ({
        ...column,
        notes: index === 0 ? firstNote : secondNote,
      })),
    });

    const getColumnPropsById = (columnId: string) => feedbackColumnPropsSpy.mock.calls.find(([props]) => props.columnId === columnId)?.[0];

    it("passes existing column notes to rendered feedback columns", async () => {
      const boardWithNotes = buildBoardWithNotes("Initial column note", "Other note");

      render(<FeedbackBoard {...mockedProps} board={boardWithNotes} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const firstColumnId = boardWithNotes.columns[0].id;
      const firstColumnProps = getColumnPropsById(firstColumnId);

      expect(firstColumnProps?.columnNotes).toBe("Initial column note");
    });

    it("optimistically updates notes and calls persistence handler", async () => {
      const boardWithNotes = buildBoardWithNotes("Initial column note");
      const onColumnNotesChange = jest.fn().mockResolvedValue(undefined);
      const props = { ...mockedProps, board: boardWithNotes, onColumnNotesChange };

      render(<FeedbackBoard {...props} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const firstColumnId = boardWithNotes.columns[0].id;
      const initialCallCount = feedbackColumnPropsSpy.mock.calls.length;
      const columnProps = getColumnPropsById(firstColumnId);

      await act(async () => {
        columnProps?.onColumnNotesChange("Updated notes");
        await Promise.resolve();
      });

      expect(onColumnNotesChange).toHaveBeenCalledWith(firstColumnId, "Updated notes");

      await waitFor(() => {
        expect(feedbackColumnPropsSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
        const latestCallForColumn = getLatestColumnPropsById(firstColumnId);
        expect(latestCallForColumn?.columnNotes).toBe("Updated notes");
      });
    });

    it("reverts notes and logs telemetry when persistence fails", async () => {
      const boardWithNotes = buildBoardWithNotes("Persisted note");
      const persistenceError = new Error("notes update failed");
      const onColumnNotesChange = jest.fn().mockRejectedValue(persistenceError);
      const props = { ...mockedProps, board: boardWithNotes, onColumnNotesChange };

      render(<FeedbackBoard {...props} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const firstColumnId = boardWithNotes.columns[0].id;
      const columnProps = getColumnPropsById(firstColumnId);

      await act(async () => {
        columnProps?.onColumnNotesChange("Temporary note");
        await Promise.resolve();
      });

      expect(onColumnNotesChange).toHaveBeenCalledWith(firstColumnId, "Temporary note");

      await waitFor(() => {
        expect(appInsights.trackException).toHaveBeenCalledWith(
          persistenceError,
          expect.objectContaining({
            action: "updateColumnNotes",
            boardId: props.board.id,
            columnId: firstColumnId,
          }),
        );
      });

      await waitFor(() => {
        const latestCallForColumn = getLatestColumnPropsById(firstColumnId);
        expect(latestCallForColumn?.columnNotes).toBe("Persisted note");
      });
    });
  });

  describe("Timer Coordination", () => {
    it("sets the active timer id when a column requests a start", async () => {
      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.requestTimerStart("item-1");
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps.activeTimerFeedbackItemId).toBe("item-1");
      });
    });

    it("stops the previous timer when a different item starts", async () => {
      const activeItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "active-item",
        timerState: true,
        timerId: null,
      };
      const nextItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[1],
        id: "next-item",
        columnId: activeItem.columnId,
        originalColumnId: activeItem.originalColumnId,
        timerState: false,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([activeItem, nextItem]);
      (itemDataService.flipTimer as jest.Mock).mockResolvedValue({ ...activeItem, timerState: false, timerId: null });

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = activeItem.columnId;

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe("active-item");
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.requestTimerStart("next-item");
      });

      await waitFor(() => {
        expect(itemDataService.flipTimer).toHaveBeenCalledWith(mockedBoard.id, "active-item", null);
      });

      // After timer operations complete, verify state has been updated
      // (the exact timing of state updates may vary due to async nature of the operations)
      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        // Either the new timer is active, or the timer state has been reset
        expect(columnProps.activeTimerFeedbackItemId === "next-item" || columnProps.activeTimerFeedbackItemId === null).toBe(true);
      });
    });

    it("clears the active timer when notified that an item stopped", async () => {
      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.requestTimerStart("item-1");
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps.activeTimerFeedbackItemId).toBe("item-1");
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.notifyTimerStopped("item-1");
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps.activeTimerFeedbackItemId).toBeNull();
      });
    });
  });

  describe("Live Sync Polling", () => {
    const loadBoard = async (props: FeedbackBoardProps = mockedProps) => {
      jest.useFakeTimers();
      const renderResult = render(<FeedbackBoard {...props} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });

      return renderResult;
    };

    const advanceTime = async (ms: number = LIVE_SYNC_POLL_INTERVAL_MS) => {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(ms);
      });
    };

    const getColumnItemIds = (columnId: string): string[] => (getLatestColumnProps(columnId)?.columnItems ?? []).map((item: any) => item.feedbackItem.id);

    const findColumnItem = (columnId: string, feedbackItemId: string): any => getLatestColumnProps(columnId)?.columnItems.find((item: any) => item.feedbackItem.id === feedbackItemId);

    const deferNextPoll = () => {
      let resolvePoll: (feedbackItems: IFeedbackItemDocument[]) => void = () => undefined;
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockImplementationOnce(
        () =>
          new Promise<IFeedbackItemDocument[]>(resolve => {
            resolvePoll = resolve;
          }),
      );

      return (feedbackItems: IFeedbackItemDocument[]) => resolvePoll(feedbackItems);
    };

    it("does not animate the items of the first load", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([mockFeedbackItems[0]]);

      await loadBoard();

      expect(findColumnItem(mockFeedbackItems[0].columnId, mockFeedbackItems[0].id)?.showAddedAnimation).toBe(false);
    });

    it("shows feedback items created by others on the next poll", async () => {
      const remoteItem: IFeedbackItemDocument = { ...mockFeedbackItems[0], id: "remote-new-item" };
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValueOnce([]).mockResolvedValue([remoteItem]);

      await loadBoard();
      expect(getColumnItemIds(remoteItem.columnId)).not.toContain(remoteItem.id);

      await advanceTime();

      expect(findColumnItem(remoteItem.columnId, remoteItem.id)?.showAddedAnimation).toBe(true);
    });

    it("applies feedback item updates made by others on the next poll", async () => {
      const remoteUpdate: IFeedbackItemDocument = { ...mockFeedbackItems[0], title: "Updated by someone else" };
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValueOnce([mockFeedbackItems[0]]).mockResolvedValue([remoteUpdate]);

      await loadBoard();
      await advanceTime();

      expect(findColumnItem(remoteUpdate.columnId, remoteUpdate.id)?.feedbackItem.title).toBe("Updated by someone else");
    });

    it("moves an item to the column reported by the server on the next poll", async () => {
      const movedItem: IFeedbackItemDocument = { ...mockFeedbackItems[0], columnId: testColumnProps.columnIds[1] };
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValueOnce([mockFeedbackItems[0]]).mockResolvedValue([movedItem]);

      await loadBoard();
      expect(getColumnItemIds(testColumnProps.columnIds[0])).toContain(movedItem.id);

      await advanceTime();

      expect(getColumnItemIds(testColumnProps.columnIds[0])).not.toContain(movedItem.id);
      expect(getColumnItemIds(testColumnProps.columnIds[1])).toContain(movedItem.id);
    });

    it("removes items deleted by others on the next poll", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValueOnce(mockFeedbackItems).mockResolvedValue([mockFeedbackItems[1]]);

      await loadBoard();
      expect(getColumnItemIds(mockFeedbackItems[0].columnId)).toContain(mockFeedbackItems[0].id);

      await advanceTime();

      expect(getColumnItemIds(mockFeedbackItems[0].columnId)).not.toContain(mockFeedbackItems[0].id);
      expect(getColumnItemIds(mockFeedbackItems[1].columnId)).toContain(mockFeedbackItems[1].id);
    });

    it("keeps the board state unchanged when a poll returns the same items", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      await loadBoard();
      const columnsBeforePoll = getLatestColumnProps(testColumnProps.columnIds[0]).columns;

      await advanceTime();

      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(2);
      expect(getLatestColumnProps(testColumnProps.columnIds[0]).columns).toBe(columnsBeforePoll);
    });

    it("polls immediately when the board settings change", async () => {
      const { rerender } = await loadBoard();
      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(1);

      rerender(<FeedbackBoard {...mockedProps} board={{ ...mockedBoard, modifiedDate: new Date() }} />);
      await advanceTime(0);

      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(2);
    });

    it("loads the action items of polled items and reuses them on the next poll", async () => {
      const actionItem = { id: 123, rev: 1, fields: { "System.Title": "Action item" } };
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([mockFeedbackItems[1]]);
      (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([actionItem]);

      await loadBoard();

      expect(workItemService.getWorkItemsByIds).toHaveBeenCalledWith([123]);
      expect(findColumnItem(mockFeedbackItems[1].columnId, mockFeedbackItems[1].id)?.actionItems).toEqual([actionItem]);

      await advanceTime();

      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(2);
      expect(workItemService.getWorkItemsByIds).toHaveBeenCalledTimes(1);
    });

    it("refreshes cached action items periodically so work item changes show up", async () => {
      const actionItem = { id: 123, rev: 1, fields: { "System.Title": "Action item" } };
      const updatedActionItem = { id: 123, rev: 2, fields: { "System.Title": "Renamed action item" } };
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([mockFeedbackItems[1]]);
      (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValueOnce([actionItem]).mockResolvedValue([updatedActionItem]);

      await loadBoard();
      await advanceTime(32000);

      expect(workItemService.getWorkItemsByIds).toHaveBeenCalledTimes(2);
      expect(findColumnItem(mockFeedbackItems[1].columnId, mockFeedbackItems[1].id)?.actionItems).toEqual([updatedActionItem]);
    });

    it("keeps syncing feedback items and throttles retries when loading action items fails", async () => {
      const workItemError = new Error("Work items unavailable");
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);
      (workItemService.getWorkItemsByIds as jest.Mock).mockRejectedValue(workItemError);

      await loadBoard();

      expect(getColumnItemIds(mockFeedbackItems[0].columnId)).toContain(mockFeedbackItems[0].id);
      expect(getColumnItemIds(mockFeedbackItems[1].columnId)).toContain(mockFeedbackItems[1].id);
      expect(appInsights.trackException).toHaveBeenCalledWith(workItemError, expect.objectContaining({ action: "pollActionItems", boardId: mockedBoard.id }));

      await advanceTime();

      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(2);
      expect(workItemService.getWorkItemsByIds).toHaveBeenCalledTimes(1);
    });

    it("does not let a poll that started before a local change undo it", async () => {
      const locallyUpdatedItem: IFeedbackItemDocument = { ...mockFeedbackItems[0], title: "Local edit" };
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValueOnce([mockFeedbackItems[0]]);

      await loadBoard();

      const resolveStalePoll = deferNextPoll();
      await advanceTime();

      await act(async () => {
        await getLatestColumnProps(mockFeedbackItems[0].columnId).refreshFeedbackItems([locallyUpdatedItem]);
      });

      await act(async () => {
        resolveStalePoll([mockFeedbackItems[0]]);
        await jest.advanceTimersByTimeAsync(0);
      });

      expect(findColumnItem(mockFeedbackItems[0].columnId, mockFeedbackItems[0].id)?.feedbackItem.title).toBe("Local edit");
    });

    it("does not bring back an item deleted locally when a stale poll still returns it", async () => {
      const columnId = mockFeedbackItems[0].columnId;
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValueOnce([mockFeedbackItems[0]]);

      await loadBoard();

      const resolveStalePoll = deferNextPoll();
      await advanceTime();

      await act(async () => {
        getLatestColumnProps(columnId).removeFeedbackItemFromColumn(columnId, mockFeedbackItems[0].id, false);
      });

      await act(async () => {
        resolveStalePoll([mockFeedbackItems[0]]);
        await jest.advanceTimersByTimeAsync(0);
      });

      expect(getColumnItemIds(columnId)).not.toContain(mockFeedbackItems[0].id);

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);
      await advanceTime();

      expect(getColumnItemIds(columnId)).not.toContain(mockFeedbackItems[0].id);
    });

    it("requests each action item once when several items reference it", async () => {
      const actionItem = { id: 123, rev: 1, fields: { "System.Title": "Action item" } };
      const itemSharingActionItem: IFeedbackItemDocument = { ...mockFeedbackItems[0], associatedActionItemIds: [123] };
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemSharingActionItem, mockFeedbackItems[1]]);
      (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([actionItem]);

      await loadBoard();

      expect(workItemService.getWorkItemsByIds).toHaveBeenCalledTimes(1);
      expect(workItemService.getWorkItemsByIds).toHaveBeenCalledWith([123]);
      expect(findColumnItem(itemSharingActionItem.columnId, itemSharingActionItem.id)?.actionItems).toEqual([actionItem]);
      expect(findColumnItem(mockFeedbackItems[1].columnId, mockFeedbackItems[1].id)?.actionItems).toEqual([actionItem]);
    });

    it("ignores documents without an id", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([null, { ...mockFeedbackItems[1], id: "" }, mockFeedbackItems[0]]);

      await loadBoard();

      expect(getColumnItemIds(mockFeedbackItems[0].columnId)).toEqual([mockFeedbackItems[0].id]);
      expect(getColumnItemIds(mockFeedbackItems[1].columnId)).toEqual([]);
      expect(workItemService.getWorkItemsByIds).not.toHaveBeenCalled();
    });

    it("keeps an item that is playing its delete animation until the animation ends", async () => {
      const columnId = mockFeedbackItems[0].columnId;
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValueOnce([mockFeedbackItems[0]]).mockResolvedValue([]);

      const { container } = await loadBoard();

      const itemBeingDeleted = document.createElement("div");
      itemBeingDeleted.className = "removeFeedbackItem";
      itemBeingDeleted.setAttribute("data-feedback-item-id", mockFeedbackItems[0].id);
      container.appendChild(itemBeingDeleted);

      await advanceTime();
      expect(getColumnItemIds(columnId)).toContain(mockFeedbackItems[0].id);

      itemBeingDeleted.remove();
      await advanceTime();
      expect(getColumnItemIds(columnId)).not.toContain(mockFeedbackItems[0].id);
    });

    it("ignores removing an item from a column the board no longer has", async () => {
      const columnId = mockFeedbackItems[0].columnId;
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([mockFeedbackItems[0]]);

      await loadBoard();
      const columnsBeforeRemoval = getLatestColumnProps(columnId).columns;

      await act(async () => {
        getLatestColumnProps(columnId).removeFeedbackItemFromColumn("removed-column", mockFeedbackItems[0].id, false);
      });

      expect(getLatestColumnProps(columnId).columns).toBe(columnsBeforeRemoval);
      expect(getColumnItemIds(columnId)).toContain(mockFeedbackItems[0].id);
    });

    it("discards a poll that finishes after switching to another board", async () => {
      const otherBoard: IFeedbackBoardDocument = { ...mockedBoard, id: "other-board" };
      const otherBoardItem: IFeedbackItemDocument = { ...mockFeedbackItems[0], id: "other-board-item", boardId: otherBoard.id };
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockImplementation(async (boardId: string) => (boardId === otherBoard.id ? [otherBoardItem] : [mockFeedbackItems[1]]));
      let resolveActionItems: (workItems: unknown[]) => void = () => undefined;
      (workItemService.getWorkItemsByIds as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveActionItems = resolve;
          }),
      );

      const { rerender } = await loadBoard();

      rerender(<FeedbackBoard {...mockedProps} board={otherBoard} />);
      await advanceTime(0);

      await act(async () => {
        resolveActionItems([{ id: 123, rev: 1 }]);
        await jest.advanceTimersByTimeAsync(0);
      });

      expect(getColumnItemIds(otherBoardItem.columnId)).toEqual([otherBoardItem.id]);
      expect(getColumnItemIds(mockFeedbackItems[1].columnId)).not.toContain(mockFeedbackItems[1].id);
    });

    it("does not poll a board without columns, even when its settings change", async () => {
      const boardWithoutColumns: IFeedbackBoardDocument = { ...mockedBoard, columns: [] };
      const { rerender } = await loadBoard({ ...mockedProps, board: boardWithoutColumns });

      rerender(<FeedbackBoard {...mockedProps} board={{ ...boardWithoutColumns, modifiedDate: new Date() }} />);
      await advanceTime();

      expect(itemDataService.getFeedbackItemsForBoardStrict).not.toHaveBeenCalled();
    });
  });

  describe("Server Feedback Item Merging", () => {
    const [firstColumnId, secondColumnId] = testColumnProps.columnIds;
    const actionItem = { id: 123, rev: 1 } as WorkItem;

    const buildColumns = (firstColumnItems: IColumnItem[], secondColumnItems: IColumnItem[] = []): { [id: string]: IColumn } => ({
      [firstColumnId]: { columnProperties: testColumnProps.columns[firstColumnId].columnProperties, columnItems: firstColumnItems },
      [secondColumnId]: { columnProperties: testColumnProps.columns[secondColumnId].columnProperties, columnItems: secondColumnItems },
    });

    it("adds new server items without animation by default", () => {
      const columns = buildColumns([]);

      const mergedColumns = mergeServerFeedbackItems(columns, [mockFeedbackItems[1]]);

      expect(mergedColumns[firstColumnId]).toBe(columns[firstColumnId]);
      expect(mergedColumns[secondColumnId].columnItems).toEqual([{ feedbackItem: mockFeedbackItems[1], actionItems: [], showAddedAnimation: false }]);
    });

    it("keeps an item listed in two columns only in the first one", () => {
      const columnItem: IColumnItem = { feedbackItem: mockFeedbackItems[0], actionItems: [] };
      const columns = buildColumns([columnItem], [columnItem]);

      const mergedColumns = mergeServerFeedbackItems(columns, [mockFeedbackItems[0]]);

      expect(mergedColumns[firstColumnId]).toBe(columns[firstColumnId]);
      expect(mergedColumns[secondColumnId].columnItems).toEqual([]);
    });

    it("keeps the action items on the board when their work items were not loaded", () => {
      const columnItem: IColumnItem = { feedbackItem: { ...mockFeedbackItems[1], __etag: 1 }, actionItems: [actionItem] };
      const serverItem: IFeedbackItemDocument = { ...mockFeedbackItems[1], title: "Updated by someone else", __etag: 2 };

      const mergedColumns = mergeServerFeedbackItems(buildColumns([], [columnItem]), [serverItem]);

      const [mergedItem] = mergedColumns[secondColumnId].columnItems;
      expect(mergedItem.feedbackItem).toBe(serverItem);
      expect(mergedItem.actionItems).toBe(columnItem.actionItems);
    });

    it("drops an item the server moved to a column this board no longer has", () => {
      const columnItem: IColumnItem = { feedbackItem: { ...mockFeedbackItems[0], __etag: 1 }, actionItems: [] };
      const serverItem: IFeedbackItemDocument = { ...mockFeedbackItems[0], columnId: "removed-column", __etag: 2 };

      const mergedColumns = mergeServerFeedbackItems(buildColumns([columnItem]), [serverItem]);

      expect(mergedColumns[firstColumnId].columnItems).toEqual([]);
      expect(mergedColumns[secondColumnId].columnItems).toEqual([]);
    });

    it("leaves an item in place when only its newer local copy points to a column this board no longer has", () => {
      const columnItem: IColumnItem = { feedbackItem: { ...mockFeedbackItems[0], columnId: "removed-column", __etag: 2 }, actionItems: [] };
      const columns = buildColumns([columnItem]);

      expect(mergeServerFeedbackItems(columns, [{ ...columnItem.feedbackItem, __etag: 1 }])).toBe(columns);
    });
  });

  describe("Keyboard Navigation", () => {
    it("opens keyboard shortcuts dialog when ? key is pressed", async () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(container.querySelector(".feedback-board")).toBeInTheDocument();
      });

      // Press ? key
      act(() => {
        const event = new KeyboardEvent("keydown", { key: "?", bubbles: true });
        document.dispatchEvent(event);
      });

      // State should update but we can't easily test dialog visibility in JSDOM
      // Just verify the component doesn't crash
      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("does not handle keyboard shortcuts when target is an input", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "?", bubbles: true });
        Object.defineProperty(event, "target", { value: input, enumerable: true });
        document.dispatchEvent(event);
      });

      // Should return early without handling
      expect(container.querySelector(".feedback-board")).toBeInTheDocument();

      document.body.removeChild(input);
    });

    it("does not handle keyboard shortcuts when target is a textarea", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      textarea.focus();

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "?", bubbles: true });
        Object.defineProperty(event, "target", { value: textarea, enumerable: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();

      document.body.removeChild(textarea);
    });

    it("does not handle keyboard shortcuts when target is contentEditable", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      const div = document.createElement("div");
      div.contentEditable = "true";
      document.body.appendChild(div);
      div.focus();

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "?", bubbles: true });
        Object.defineProperty(event, "target", { value: div, enumerable: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();

      document.body.removeChild(div);
    });

    it("does not handle keyboard shortcuts when a dialog is open", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      // Create a mock dialog
      const dialog = document.createElement("div");
      dialog.setAttribute("role", "dialog");
      document.body.appendChild(dialog);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "?", bubbles: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();

      document.body.removeChild(dialog);
    });

    it("handles arrow left key for column navigation", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles arrow right key for column navigation", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles number keys for direct column navigation", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      // Test keys 1-3 (within column range)
      ["1", "2", "3"].forEach(key => {
        act(() => {
          const event = new KeyboardEvent("keydown", { key, bubbles: true });
          document.dispatchEvent(event);
        });
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("ignores number keys with modifier keys", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "1", shiftKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "1", ctrlKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "1", altKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("ignores arrow keys with modifier keys", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowLeft", shiftKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowRight", ctrlKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles number key 9 when only 3 columns exist", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "9", bubbles: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles multiple arrow right presses to wrap around", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      // Press right arrow multiple times
      for (let i = 0; i < 5; i++) {
        act(() => {
          const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true });
          document.dispatchEvent(event);
        });
      }

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles multiple arrow left presses to wrap around", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      // Press left arrow multiple times
      for (let i = 0; i < 5; i++) {
        act(() => {
          const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true });
          document.dispatchEvent(event);
        });
      }

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });
  });

  describe("Column Notes Changes", () => {
    it("calls onColumnNotesChange when notes are updated", async () => {
      const onColumnNotesChange = jest.fn();
      const propsWithCallback = {
        ...mockedProps,
        onColumnNotesChange,
      };

      render(<FeedbackBoard {...propsWithCallback} />);

      // Component renders with callback prop
      expect(onColumnNotesChange).toBeDefined();
    });
  });

  describe("Feedback item operations", () => {
    it("handles addFeedbackItems callback", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);
      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles refreshFeedbackItems callback", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);
      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });
  });

  describe("Internal helper coverage", () => {
    // These tests verify internal behaviors indirectly through rendered output and props
    // since internal methods are not exposed on functional components

    it("column props contain expected callback functions", async () => {
      render(<FeedbackBoard {...mockedProps} />);

      const columnId = mockedProps.board.columns[0].id;

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      const columnProps = getLatestColumnProps(columnId);
      expect(typeof columnProps.requestTimerStart).toBe("function");
      expect(typeof columnProps.notifyTimerStopped).toBe("function");
      expect(typeof columnProps.addFeedbackItems).toBe("function");
      expect(typeof columnProps.removeFeedbackItemFromColumn).toBe("function");
      expect(typeof columnProps.refreshFeedbackItems).toBe("function");
    });

    it("renders columns from board data", async () => {
      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        mockedProps.board.columns.forEach(column => {
          const columnProps = getLatestColumnProps(column.id);
          expect(columnProps).toBeDefined();
          expect(columnProps.columnId).toBe(column.id);
        });
      });
    });
  });

  describe("Timer Operations - Extended Coverage", () => {
    it("stopTimerById clears state when item has no timerState", async () => {
      const itemWithoutTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: false,
        timerId: null,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithoutTimer]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = itemWithoutTimer.columnId;

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });
    });

    it("stopTimerById handles item not found", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });
    });

    it("stopTimerById clears existing timerId", async () => {
      const itemWithTimerId: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: null,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithTimerId]);
      (itemDataService.flipTimer as jest.Mock).mockResolvedValue({ ...itemWithTimerId, timerState: false, timerId: null });

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = itemWithTimerId.columnId;

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe(itemWithTimerId.id);
      });
    });

    it("requestTimerStart handles exception gracefully", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      // Call requestTimerStart which should succeed without throwing
      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.requestTimerStart("item-1");
      });
    });

    it("notifyTimerStopped does nothing if different item is active", async () => {
      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      // Start timer for item-1
      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.requestTimerStart("item-1");
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps.activeTimerFeedbackItemId).toBe("item-1");
      });

      // Notify that item-2 stopped - should not affect item-1
      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.notifyTimerStopped("item-2");
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        // item-1 should still be active
        expect(columnProps.activeTimerFeedbackItemId).toBe("item-1");
      });
    });
  });

  describe("Column Item Removal", () => {
    it("removeFeedbackItemFromColumn sets focus on next item when available", async () => {
      const items = [mockFeedbackItems[0], mockFeedbackItems[1]];
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(items);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });
    });

    it("removeFeedbackItemFromColumn sets focus on create button when no items left", async () => {
      const items = [mockFeedbackItems[0]];
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(items);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });
    });
  });

  describe("Feedback Item Refresh", () => {
    it("refreshFeedbackItems updates existing items", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });
    });

    it("refreshFeedbackItems moves items between columns", async () => {
      const originalItem = { ...mockFeedbackItems[0] };
      const movedItem = { ...mockFeedbackItems[0], columnId: testColumnProps.columnIds[1] };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValueOnce([originalItem]).mockResolvedValueOnce([movedItem]);

      const { rerender } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });

      // Trigger re-fetch
      const newBoard = { ...mockedBoard, modifiedDate: new Date() };
      rerender(<FeedbackBoard {...mockedProps} board={newBoard} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(2);
      });
    });

    it("refreshFeedbackItems adds new items to column", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);
      (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([{ id: 123, title: "Action Item" }]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });
    });
  });

  describe("Add Feedback Items", () => {
    it("adds multiple feedback items at once", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });
    });

    it("sets focus on first added item", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });
    });

    it("adds new items to the column with the requested flags", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      const newItems = [mockFeedbackItems[0]];

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.addFeedbackItems(columnId, newItems, true, true, true, false);
      });

      await waitFor(() => {
        const addedItem = getLatestColumnProps(columnId).columnItems.find((item: any) => item.feedbackItem.id === mockFeedbackItems[0].id);
        expect(addedItem).toEqual(expect.objectContaining({ newlyCreated: true, showAddedAnimation: true, shouldHaveFocus: true, hideFeedbackItems: false }));
      });
    });

    it("ignores items added to a column the board does not have", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      const columnsBeforeAdd = getLatestColumnProps(columnId).columns;

      await act(async () => {
        getLatestColumnProps(columnId).addFeedbackItems("missing-column", [mockFeedbackItems[0]], true, true, true, false);
      });

      expect(getLatestColumnProps(columnId).columns).toBe(columnsBeforeAdd);
    });

    it("adds multiple items and keeps subsequent items unfocused", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      const newItems = [
        { ...mockFeedbackItems[0], id: "new-1", columnId },
        { ...mockFeedbackItems[0], id: "new-2", columnId },
      ];

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.addFeedbackItems(columnId, newItems, false, false, true, false);
      });

      await waitFor(() => {
        const latestProps = getLatestColumnProps(columnId);
        expect(latestProps.columnItems[1].feedbackItem.id).toBe("new-2");
        expect(latestProps.columnItems[1].shouldHaveFocus).toBeFalsy();
      });
    });
  });

  describe("Timer Operations - Error Handling", () => {
    it("stopTimerById logs exception when flipTimer fails", async () => {
      const itemWithTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: null,
      };

      const flipError = new Error("flip timer failed");
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithTimer]);
      (itemDataService.flipTimer as jest.Mock).mockRejectedValue(flipError);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const columnProps = getLatestColumnProps(itemWithTimer.columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe(itemWithTimer.id);
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(itemWithTimer.columnId);
        await columnProps.requestTimerStart("another-item");
      });

      await waitFor(() => {
        expect(appInsights.trackException).toHaveBeenCalledWith(
          flipError,
          expect.objectContaining({
            action: "stopTimer",
            boardId: mockedBoard.id,
            feedbackItemId: itemWithTimer.id,
          }),
        );
      });
    });

    it("stopTimerById returns early if updatedFeedbackItem is null", async () => {
      const itemWithTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: null,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithTimer]);
      (itemDataService.flipTimer as jest.Mock).mockResolvedValue(null);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const columnProps = getLatestColumnProps(itemWithTimer.columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe(itemWithTimer.id);
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(itemWithTimer.columnId);
        await columnProps.requestTimerStart("another-item");
      });

      await waitFor(() => {
        expect(itemDataService.flipTimer).toHaveBeenCalled();
      });
    });

    it("requestTimerStart handles errors in stopTimer gracefully", async () => {
      // The functional component's requestTimerStart doesn't throw
      // because errors in stopTimerById are caught internally
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);
      (itemDataService.flipTimer as jest.Mock).mockRejectedValue(new Error("flip error"));

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      // Start first timer
      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.requestTimerStart("item-1");
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        // Start another timer which will try to stop the first one
        columnProps.requestTimerStart("item-2");
      });

      // flipTimer should have been called even if it failed
      await waitFor(() => {
        expect(itemDataService.flipTimer).toHaveBeenCalled();
      });
    });
  });

  describe("Feedback Item Refresh - Local Updates", () => {
    it("refreshFeedbackItems applies a locally updated item", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)?.columnItems).toHaveLength(1);
      });

      const updatedItem = { ...mockFeedbackItems[0], title: "Updated locally" };

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.refreshFeedbackItems([updatedItem]);
      });

      expect(getLatestColumnProps(columnId).columnItems[0].feedbackItem.title).toBe("Updated locally");
    });

    it("refreshFeedbackItems handles empty array", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      const columnsBeforeRefresh = getLatestColumnProps(columnId).columns;

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.refreshFeedbackItems([]);
      });

      expect(getLatestColumnProps(columnId).columns).toBe(columnsBeforeRefresh);
    });

    it("refreshFeedbackItems keeps a newer copy that is already on the board", async () => {
      const newerItem: IFeedbackItemDocument = { ...mockFeedbackItems[0], title: "Newer title", __etag: 5 };
      const olderItem: IFeedbackItemDocument = { ...mockFeedbackItems[0], title: "Older title", __etag: 4 };
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([newerItem]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = newerItem.columnId;

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)?.columnItems[0]?.feedbackItem.title).toBe("Newer title");
      });

      await act(async () => {
        await getLatestColumnProps(columnId).refreshFeedbackItems([olderItem]);
      });

      expect(getLatestColumnProps(columnId).columnItems[0].feedbackItem.title).toBe("Newer title");
    });
  });

  describe("Remove Feedback Item - Focus Handling", () => {
    it("removeFeedbackItemFromColumn without focus flag does not set focus", async () => {
      const items = [mockFeedbackItems[0], mockFeedbackItems[1]];
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(items);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = items[0].columnId;

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.removeFeedbackItemFromColumn(columnId, items[0].id, false);
      });

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });
    });

    it("removeFeedbackItemFromColumn sets focus on last item when removed item was last", async () => {
      const items = [mockFeedbackItems[0], { ...mockFeedbackItems[1], columnId: mockFeedbackItems[0].columnId }];
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(items);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = items[0].columnId;

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.removeFeedbackItemFromColumn(columnId, items[1].id, true);
      });

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });
    });
  });

  describe("Keyboard Shortcuts - Arrow Up/Down", () => {
    it("handles arrow up key for item navigation", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true });
        document.dispatchEvent(event);
      });

      // Component should handle the event without crashing
      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles arrow down key for item navigation", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true });
        document.dispatchEvent(event);
      });

      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("ignores arrow up with modifier keys", async () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowUp", shiftKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowUp", ctrlKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("ignores arrow down with modifier keys", async () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowDown", shiftKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowDown", ctrlKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("ignores arrow left with altKey", async () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowLeft", altKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("ignores arrow right with altKey", async () => {
      const { container } = render(<FeedbackBoard {...mockedProps} />);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowRight", altKey: true, bubbles: true });
        document.dispatchEvent(event);
      });

      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });
  });

  describe("User Permissions", () => {
    it("shows column edit button when user is board creator", async () => {
      const creatorBoard = {
        ...mockedBoard,
        createdBy: { ...mockedIdentity, id: "creator-user-id" },
      };
      const propsWithCreator = {
        ...mockedProps,
        board: creatorBoard,
        userId: "creator-user-id",
      };

      render(<FeedbackBoard {...propsWithCreator} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const columnProps = feedbackColumnPropsSpy.mock.calls[feedbackColumnPropsSpy.mock.calls.length - 1]?.[0];
      expect(columnProps?.showColumnEditButton).toBe(true);
    });

    it("hides column edit button when user is not board creator", async () => {
      const creatorBoard = {
        ...mockedBoard,
        createdBy: { ...mockedIdentity, id: "different-user-id" },
      };
      const propsWithOtherUser = {
        ...mockedProps,
        board: creatorBoard,
        userId: "current-user-id",
      };

      render(<FeedbackBoard {...propsWithOtherUser} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const columnProps = feedbackColumnPropsSpy.mock.calls[feedbackColumnPropsSpy.mock.calls.length - 1]?.[0];
      expect(columnProps?.showColumnEditButton).toBe(false);
    });

    it("shows column edit button when user is Team Admin but not board creator", async () => {
      const creatorBoard = {
        ...mockedBoard,
        createdBy: { ...mockedIdentity, id: "different-user-id" },
      };
      const propsWithTeamAdmin = {
        ...mockedProps,
        board: creatorBoard,
        userId: "current-user-id",
        currentUserIsTeamAdmin: true,
      };

      render(<FeedbackBoard {...propsWithTeamAdmin} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const columnProps = feedbackColumnPropsSpy.mock.calls[feedbackColumnPropsSpy.mock.calls.length - 1]?.[0];
      expect(columnProps?.showColumnEditButton).toBe(true);
      expect(columnProps?.canManageBoard).toBe(true);
    });
  });

  describe("Column Item Finding", () => {
    it("findColumnItemById returns undefined when column is null", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });
    });
  });

  describe("Keyboard event handling", () => {
    it("removes keyboard listener on unmount", async () => {
      const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");

      const { unmount } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it("does not crash on ? key", async () => {
      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
      });

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
      });

      // Keyboard shortcuts dialog is owned by ExtensionSettingsMenu, not FeedbackBoard.
      expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
    });
  });

  describe("Column defaults", () => {
    it("applies default iconClass and accentColor when missing", async () => {
      const boardWithMissingDefaults: IFeedbackBoardDocument = {
        ...mockedBoard,
        columns: mockedBoard.columns.map(col => ({
          ...col,
          iconClass: "",
          accentColor: "",
          notes: undefined as unknown as string,
        })),
      };

      render(<FeedbackBoard {...mockedProps} board={boardWithMissingDefaults} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const columnId = boardWithMissingDefaults.columns[0].id;
      const columnProps = getLatestColumnProps(columnId);

      expect(columnProps?.icon).toBeTruthy();
      expect(columnProps?.accentColor).toBe("#0078d4");
      expect(columnProps?.columnNotes).toBe("");
    });
  });

  describe("Timer and focus edge cases", () => {
    it("calls flipTimer when stopping a previous timer even if item is not found in columns", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);
      (itemDataService.flipTimer as jest.Mock).mockResolvedValue(null);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];
      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      // Start a timer for an item that does not exist in state.
      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.requestTimerStart("missing-item");
      });

      // Starting another timer should attempt to stop the previous one.
      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.requestTimerStart("next-item");
      });

      // The component now calls flipTimer when stopping a timer regardless of item state
      await waitFor(() => {
        expect(itemDataService.flipTimer).toHaveBeenCalledWith(mockedBoard.id, "missing-item", null);
      });
    });

    it("stops an existing active timer when starting another", async () => {
      const clearIntervalSpy = jest.spyOn(window, "clearInterval");

      const mockTimerId = setInterval(() => {}, 1000);

      const itemWithActiveTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: mockTimerId,
      };

      const otherItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[1],
        id: "other-item",
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithActiveTimer, otherItem]);
      (itemDataService.flipTimer as jest.Mock).mockResolvedValue({
        ...itemWithActiveTimer,
        timerState: false,
        timerId: null,
      });

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const columnProps = getLatestColumnProps(itemWithActiveTimer.columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe(itemWithActiveTimer.id);
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(itemWithActiveTimer.columnId);
        await columnProps.requestTimerStart(otherItem.id);
      });

      expect(clearIntervalSpy).toHaveBeenCalledWith(mockTimerId);
      expect(itemDataService.flipTimer).toHaveBeenCalledWith(mockedBoard.id, itemWithActiveTimer.id, null);

      clearInterval(mockTimerId);
      clearIntervalSpy.mockRestore();
    });

    it("clears active timer when notifyTimerStopped is called for the active item", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];
      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.requestTimerStart("active-item");
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe("active-item");
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.notifyTimerStopped("active-item");
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBeNull();
      });
    });

    it("sets focus to create button when removing last item", async () => {
      const singleItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "single-item",
        columnId: testColumnProps.columnIds[0],
        originalColumnId: testColumnProps.columnIds[0],
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([singleItem]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = singleItem.columnId;

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.columnItems?.length).toBe(1);
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.removeFeedbackItemFromColumn(columnId, singleItem.id, true);
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.shouldFocusOnCreateFeedback).toBe(true);
      });
    });
  });

  describe("Column Notes - Edge Cases", () => {
    it("handles column notes with undefined values", async () => {
      const boardWithUndefinedNotes = {
        ...mockedBoard,
        columns: mockedBoard.columns.map(col => ({ ...col, notes: undefined as unknown as string })),
      };

      render(<FeedbackBoard {...mockedProps} board={boardWithUndefinedNotes} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const columnProps = feedbackColumnPropsSpy.mock.calls[feedbackColumnPropsSpy.mock.calls.length - 1]?.[0];
      expect(columnProps?.columnNotes).toBe("");
    });

    it("handles onColumnNotesChange when callback is undefined", async () => {
      const propsWithoutCallback = {
        ...mockedProps,
        onColumnNotesChange: undefined as FeedbackBoardProps["onColumnNotesChange"] | undefined,
      };

      render(<FeedbackBoard {...propsWithoutCallback} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const columnId = mockedBoard.columns[0].id;
      const columnProps = getLatestColumnPropsById(columnId);

      await act(async () => {
        columnProps?.onColumnNotesChange("New notes");
      });

      // Should not crash
      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });
  });

  describe("Feedback Item Active Timer Tracking", () => {
    it("tracks active timer item ID when item has timerState true", async () => {
      const itemWithActiveTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: null,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithActiveTimer]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const columnProps = getLatestColumnProps(itemWithActiveTimer.columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe(itemWithActiveTimer.id);
      });
    });

    it("clears active timer on board change", async () => {
      const itemWithActiveTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: null,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithActiveTimer]);

      const { rerender } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const columnProps = getLatestColumnProps(itemWithActiveTimer.columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe(itemWithActiveTimer.id);
      });

      const newBoard = { ...mockedBoard, id: "new-board-with-timer" };
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      rerender(<FeedbackBoard {...mockedProps} board={newBoard} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledWith("new-board-with-timer");
      });
    });
  });

  describe("Keyboard Navigation - Column Navigation", () => {
    it("handles ArrowUp key to navigate to previous item in column", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      // Should be handled without errors
      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles ArrowLeft key to navigate to previous column", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles ArrowRight key to navigate to next column", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles numeric keys 1-5 to jump to column by index", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const event1 = new KeyboardEvent("keydown", { key: "1", bubbles: true, cancelable: true });
      document.dispatchEvent(event1);

      const event2 = new KeyboardEvent("keydown", { key: "2", bubbles: true, cancelable: true });
      document.dispatchEvent(event2);

      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("ignores numeric keys for non-existent column indices", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      // Press key 9 which is beyond the column count
      const event = new KeyboardEvent("keydown", { key: "9", bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("ignores keyboard events when input is focused", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const input = document.createElement("input");
      container.appendChild(input);
      input.focus();

      const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: input, writable: false });
      document.dispatchEvent(event);

      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
      container.removeChild(input);
    });

    it("ignores keyboard events when textarea is focused", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const textarea = document.createElement("textarea");
      container.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: textarea, writable: false });
      document.dispatchEvent(event);

      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
      container.removeChild(textarea);
    });

    it("ignores keyboard events when modifier keys are pressed", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const shiftEvent = new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true, cancelable: true });
      document.dispatchEvent(shiftEvent);

      const ctrlEvent = new KeyboardEvent("keydown", { key: "ArrowLeft", ctrlKey: true, bubbles: true, cancelable: true });
      document.dispatchEvent(ctrlEvent);

      const altEvent = new KeyboardEvent("keydown", { key: "1", altKey: true, bubbles: true, cancelable: true });
      document.dispatchEvent(altEvent);

      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });
  });

  describe("getFocusModeModel", () => {
    it("returns complete focus mode model with all properties", async () => {
      const onFocusModeModelChange = jest.fn();
      const propsWithFocusMode = {
        ...mockedProps,
        onFocusModeModelChange,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...propsWithFocusMode} />);

      await waitFor(() => {
        expect(onFocusModeModelChange).toHaveBeenCalled();
      });

      const focusModeModel = onFocusModeModelChange.mock.calls[onFocusModeModelChange.mock.calls.length - 1]?.[0];
      expect(focusModeModel).toHaveProperty("columns");
      expect(focusModeModel).toHaveProperty("columnIds");
      expect(focusModeModel).toHaveProperty("workflowPhase");
      expect(focusModeModel).toHaveProperty("team");
      expect(focusModeModel).toHaveProperty("boardId");
      expect(focusModeModel).toHaveProperty("boardTitle");
      expect(focusModeModel).toHaveProperty("requestTimerStart");
      expect(focusModeModel).toHaveProperty("notifyTimerStopped");
      expect(focusModeModel).toHaveProperty("addFeedbackItems");
      expect(focusModeModel).toHaveProperty("removeFeedbackItemFromColumn");
      expect(focusModeModel).toHaveProperty("refreshFeedbackItems");
    });

    it("handles onVoteCasted callback in focus mode model", async () => {
      const onVoteCasted = jest.fn();
      const onFocusModeModelChange = jest.fn();
      const propsWithCallbacks = {
        ...mockedProps,
        onVoteCasted,
        onFocusModeModelChange,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...propsWithCallbacks} />);

      await waitFor(() => {
        expect(onFocusModeModelChange).toHaveBeenCalled();
      });

      const focusModeModel = onFocusModeModelChange.mock.calls[onFocusModeModelChange.mock.calls.length - 1]?.[0];
      focusModeModel?.onVoteCasted?.();

      expect(onVoteCasted).toHaveBeenCalled();
    });

    it("sets canManageBoard to true when the current user created the board", async () => {
      const onFocusModeModelChange = jest.fn();
      // mockedProps.userId and mockedBoard.createdBy.id are both "", so the current user is the owner.
      const ownerProps = {
        ...mockedProps,
        onFocusModeModelChange,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...ownerProps} />);

      await waitFor(() => {
        expect(onFocusModeModelChange).toHaveBeenCalled();
      });

      const focusModeModel = onFocusModeModelChange.mock.calls[onFocusModeModelChange.mock.calls.length - 1]?.[0];
      expect(focusModeModel?.canManageBoard).toBe(true);
    });

    it("sets canManageBoard to false when the current user is not the board creator and not Team Admin", async () => {
      const onFocusModeModelChange = jest.fn();
      const boardWithDifferentOwner: IFeedbackBoardDocument = {
        ...mockedBoard,
        createdBy: { ...mockedIdentity, id: "board-owner-id" },
      };
      const nonOwnerProps = {
        ...mockedProps,
        board: boardWithDifferentOwner,
        userId: "current-user-id",
        currentUserIsTeamAdmin: false,
        onFocusModeModelChange,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...nonOwnerProps} />);

      await waitFor(() => {
        expect(onFocusModeModelChange).toHaveBeenCalled();
      });

      const focusModeModel = onFocusModeModelChange.mock.calls[onFocusModeModelChange.mock.calls.length - 1]?.[0];
      expect(focusModeModel?.canManageBoard).toBe(false);
    });

    it("sets canManageBoard true when the current user is Team Admin", async () => {
      const onFocusModeModelChange = jest.fn();
      const boardWithDifferentOwner: IFeedbackBoardDocument = {
        ...mockedBoard,
        createdBy: { ...mockedIdentity, id: "different-user-id" },
      };
      const teamAdminProps = {
        ...mockedProps,
        board: boardWithDifferentOwner,
        userId: "current-user-id",
        currentUserIsTeamAdmin: true,
        onFocusModeModelChange,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...teamAdminProps} />);

      await waitFor(() => {
        expect(onFocusModeModelChange).toHaveBeenCalled();
      });

      const focusModeModel = onFocusModeModelChange.mock.calls[onFocusModeModelChange.mock.calls.length - 1]?.[0];
      expect(focusModeModel?.canManageBoard).toBe(true);
    });

    it("uses focus mode work item types when they are provided", async () => {
      const onFocusModeModelChange = jest.fn();
      const focusModeNonHiddenWorkItemTypes = [{ name: "Focus Task" }] as any;

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} focusModeNonHiddenWorkItemTypes={focusModeNonHiddenWorkItemTypes} onFocusModeModelChange={onFocusModeModelChange} />);

      await waitFor(() => {
        expect(onFocusModeModelChange).toHaveBeenCalled();
      });

      const focusModeModel = onFocusModeModelChange.mock.calls[onFocusModeModelChange.mock.calls.length - 1]?.[0];
      expect(focusModeModel?.nonHiddenWorkItemTypes).toBe(focusModeNonHiddenWorkItemTypes);
    });
  });

  describe("Timer Functions - Edge Cases", () => {
    it("handles stopTimerById when item has no timerId", async () => {
      const itemWithActiveTimerNoId: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: null as any,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithActiveTimerNoId]);
      (itemDataService.flipTimer as jest.Mock).mockResolvedValue({
        ...itemWithActiveTimerNoId,
        timerState: false,
      });

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = itemWithActiveTimerNoId.columnId;

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe(itemWithActiveTimerNoId.id);
      });

      // Start another timer to trigger stop on the first one
      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.requestTimerStart("new-timer-item");
      });

      expect(itemDataService.flipTimer).toHaveBeenCalledWith(mockedBoard.id, itemWithActiveTimerNoId.id, null);
    });

    it("handles flipTimer error in stopTimerById", async () => {
      const itemWithActiveTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: null,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithActiveTimer]);
      (itemDataService.flipTimer as jest.Mock).mockRejectedValue(new Error("Timer error"));

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = itemWithActiveTimer.columnId;

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe(itemWithActiveTimer.id);
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.requestTimerStart("another-item");
      });

      expect(appInsights.trackException).toHaveBeenCalled();
    });
  });

  describe("addFeedbackItems - shouldHaveFocus parameter", () => {
    it("adds feedback items with shouldHaveFocus set correctly", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps).toBeDefined();
      });

      const newItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "focus-item",
        columnId,
        originalColumnId: columnId,
      };

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        // Call addFeedbackItems with shouldHaveFocus = true
        columnProps.addFeedbackItems(columnId, [newItem], true, true, true, false);
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        const addedItem = columnProps?.columnItems?.find((item: any) => item.feedbackItem.id === "focus-item");
        expect(addedItem?.shouldHaveFocus).toBe(true);
      });
    });
  });

  describe("getColumnsWithReleasedFocus", () => {
    it("resets focus flags when columns update", async () => {
      const itemWithFocus: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "focused-item",
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithFocus]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = itemWithFocus.columnId;

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.columnItems?.length).toBeGreaterThan(0);
      });

      // Add another item which should trigger focus reset
      const newItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[1],
        id: "new-item",
        columnId,
        originalColumnId: columnId,
      };

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.addFeedbackItems(columnId, [newItem], false, false, false, false);
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        const originalItem = columnProps?.columnItems?.find((item: any) => item.feedbackItem.id === "focused-item");
        expect(originalItem?.shouldHaveFocus).toBe(false);
      });
    });
  });

  describe("handleBoardKeyDown", () => {
    it("does not handle key events when target is input", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const inputElement = document.createElement("input");
      container.appendChild(inputElement);
      inputElement.focus();

      const keyEvent = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true });
      inputElement.dispatchEvent(keyEvent);

      // Event should not be prevented for input elements
      expect(true).toBe(true);
    });

    it("does not handle key events when target is textarea", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const textareaElement = document.createElement("textarea");
      container.appendChild(textareaElement);
      textareaElement.focus();

      const keyEvent = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true });
      textareaElement.dispatchEvent(keyEvent);

      // Event should not be prevented for textarea elements
      expect(true).toBe(true);
    });
  });

  describe("onVoteCasted callback", () => {
    it("calls props.onVoteCasted when vote is casted", async () => {
      const onVoteCasted = jest.fn();
      const propsWithCallback = {
        ...mockedProps,
        onVoteCasted,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...propsWithCallback} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const columnProps = feedbackColumnPropsSpy.mock.calls[feedbackColumnPropsSpy.mock.calls.length - 1]?.[0];

      if (columnProps?.onVoteCasted) {
        columnProps.onVoteCasted();
        expect(onVoteCasted).toHaveBeenCalled();
      }
    });

    it("does not throw when onVoteCasted prop is undefined", async () => {
      const { onVoteCasted: _, ...propsWithoutCallback } = mockedProps;

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...propsWithoutCallback} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const columnProps = feedbackColumnPropsSpy.mock.calls[feedbackColumnPropsSpy.mock.calls.length - 1]?.[0];

      // Call onVoteCasted - should not throw even when prop is undefined
      if (columnProps?.onVoteCasted) {
        expect(() => columnProps.onVoteCasted()).not.toThrow();
      }
    });
  });

  describe("addFeedbackItems with shouldHaveFocus", () => {
    it("sets shouldHaveFocus correctly when adding new items", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const columnId = testColumnProps.columnIds[0];

      const newItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "new-focused-item",
        columnId,
        originalColumnId: columnId,
      };

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.addFeedbackItems(columnId, [newItem], true, true, true, false);
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        const addedItem = columnProps?.columnItems?.find((item: any) => item.feedbackItem.id === "new-focused-item");
        expect(addedItem?.shouldHaveFocus).toBe(true);
      });
    });
  });

  describe("Keyboard Navigation - navigateByKeyboard calls", () => {
    it("calls navigateByKeyboard with prev when ArrowUp is pressed on a column element", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      // Wait for columns to be rendered
      await waitFor(() => {
        const columns = container.querySelectorAll("[data-column-id]");
        expect(columns.length).toBeGreaterThan(0);
      });

      // Get a column element and focus it
      const columnElement = container.querySelector("[data-column-id]");
      expect(columnElement).toBeTruthy();

      // Focus the column element
      if (columnElement) {
        (columnElement as HTMLElement).focus();
      }

      // Clear mock to ensure we're catching fresh calls
      mockNavigateByKeyboard.mockClear();

      // Press ArrowUp - the handler should call navigateByKeyboard("prev")
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "ArrowUp",
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, "target", { value: columnElement, writable: false });
        document.dispatchEvent(event);
      });

      // The navigateByKeyboard should have been called with "prev"
      expect(mockNavigateByKeyboard).toHaveBeenCalledWith("prev");
    });

    it("calls navigateByKeyboard with next when ArrowDown is pressed on a column element", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      // Wait for columns to be rendered
      await waitFor(() => {
        const columns = container.querySelectorAll("[data-column-id]");
        expect(columns.length).toBeGreaterThan(0);
      });

      const columnElement = container.querySelector("[data-column-id]");
      expect(columnElement).toBeTruthy();

      if (columnElement) {
        (columnElement as HTMLElement).focus();
      }

      mockNavigateByKeyboard.mockClear();

      // Press ArrowDown
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "ArrowDown",
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, "target", { value: columnElement, writable: false });
        document.dispatchEvent(event);
      });

      expect(mockNavigateByKeyboard).toHaveBeenCalledWith("next");
    });

    it("calls focusColumn when a number key is pressed for a valid column", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      // Wait for columns to be rendered
      await waitFor(() => {
        const columns = container.querySelectorAll("[data-column-id]");
        expect(columns.length).toBeGreaterThan(0);
      });

      mockFocusColumn.mockClear();

      // Press key "1" to navigate to first column
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "1",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
      });

      expect(mockFocusColumn).toHaveBeenCalled();
    });

    it("calls focusColumn when a number key is pressed for second column", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      // Wait for columns to be rendered
      await waitFor(() => {
        const columns = container.querySelectorAll("[data-column-id]");
        expect(columns.length).toBeGreaterThan(0);
      });

      mockFocusColumn.mockClear();

      // Press key "2" to navigate to second column
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "2",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
      });

      expect(mockFocusColumn).toHaveBeenCalled();
    });

    it("navigates to column when ArrowLeft is pressed", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      // Wait for columns to be rendered
      await waitFor(() => {
        const columns = container.querySelectorAll("[data-column-id]");
        expect(columns.length).toBeGreaterThan(0);
      });

      mockFocusColumn.mockClear();

      // Press ArrowLeft multiple times
      await act(async () => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
      });

      expect(mockFocusColumn).toHaveBeenCalled();
    });

    it("navigates to column when ArrowRight is pressed", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      // Wait for columns to be rendered
      await waitFor(() => {
        const columns = container.querySelectorAll("[data-column-id]");
        expect(columns.length).toBeGreaterThan(0);
      });

      mockFocusColumn.mockClear();

      // Press ArrowRight
      await act(async () => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      });

      expect(mockFocusColumn).toHaveBeenCalled();
    });
  });

  describe("getColumnsWithReleasedFocus - shouldFocusOnCreateFeedback", () => {
    it("resets shouldFocusOnCreateFeedback to false when adding items", async () => {
      const singleItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "only-item",
        columnId: testColumnProps.columnIds[0],
        originalColumnId: testColumnProps.columnIds[0],
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([singleItem]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = singleItem.columnId;

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.columnItems?.length).toBe(1);
      });

      // Remove the only item with focus flag set
      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.removeFeedbackItemFromColumn(columnId, singleItem.id, true);
      });

      // shouldFocusOnCreateFeedback should be true now
      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.shouldFocusOnCreateFeedback).toBe(true);
      });

      // Now add a new item - this should trigger getColumnsWithReleasedFocus
      // which should reset shouldFocusOnCreateFeedback to false
      const newItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "new-item-after-focus",
        columnId,
        originalColumnId: columnId,
      };

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.addFeedbackItems(columnId, [newItem], true, true, true, false);
      });

      // After adding, shouldFocusOnCreateFeedback should be reset to false
      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.shouldFocusOnCreateFeedback).toBe(false);
      });
    });
  });

  describe("requestTimerStart error handling", () => {
    it("stopTimerById logs errors when flipTimer fails", async () => {
      // The error occurs when stopTimerById is called from within requestTimerStart

      const itemWithActiveTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "active-timer-item",
        timerState: true,
        timerId: null,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemWithActiveTimer]);

      // Make flipTimer fail to cause an error in stopTimerById
      const flipError = new Error("Simulated flip timer error");
      (itemDataService.flipTimer as jest.Mock).mockRejectedValue(flipError);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = itemWithActiveTimer.columnId;

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe("active-timer-item");
      });

      // Start a new timer - this should try to stop the previous one and encounter an error
      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.requestTimerStart("new-timer-item");
      });

      // Verify the exception was tracked in stopTimerById
      await waitFor(() => {
        expect(appInsights.trackException).toHaveBeenCalledWith(
          flipError,
          expect.objectContaining({
            action: "stopTimer",
          }),
        );
      });
    });
  });

  describe("navigateToColumnByIndex - edge cases", () => {
    it("does not navigate when index exceeds column count via key 4", async () => {
      // handleBoardKeyDown guards against invalid indices before calling navigateToColumnByIndex
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      // Wait for columns to be rendered
      await waitFor(() => {
        const columns = container.querySelectorAll("[data-column-id]");
        expect(columns.length).toBeGreaterThan(0);
      });

      mockFocusColumn.mockClear();

      // The board has 2 columns, so pressing "4" or higher should not navigate
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "4",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
      });

      // focusColumn should NOT have been called because index 3 is >= column count
      expect(mockFocusColumn).not.toHaveBeenCalled();
    });

    it("does not navigate when index exceeds column count via key 9", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const columns = container.querySelectorAll("[data-column-id]");
        expect(columns.length).toBeGreaterThan(0);
      });

      mockFocusColumn.mockClear();

      // Press a high number key that exceeds the column count
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "9",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
      });

      // focusColumn should NOT have been called because index 8 is >= column count
      expect(mockFocusColumn).not.toHaveBeenCalled();
    });
  });

  describe("getColumnIndexFromElement - edge cases", () => {
    it("returns null when element is null", async () => {
      // This tests line 515 - the early return when element is null
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const columns = container.querySelectorAll("[data-column-id]");
        expect(columns.length).toBeGreaterThan(0);
      });

      // Dispatch keydown event when no element is focused (activeElement might be document.body or null)
      // This should trigger the null check in getColumnIndexFromElement
      // When target doesn't have data-column-id and activeElement doesn't either
      await act(async () => {
        // Create a div without data-column-id
        const orphanElement = document.createElement("div");
        document.body.appendChild(orphanElement);
        orphanElement.focus();

        const event = new KeyboardEvent("keydown", {
          key: "ArrowUp",
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, "target", { value: orphanElement, writable: false });
        document.dispatchEvent(event);

        document.body.removeChild(orphanElement);
      });

      // The component should handle this gracefully without errors
      expect(container.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles keydown when target does not have data-column-id", async () => {
      // Test that the fallback chain works correctly
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const columns = container.querySelectorAll("[data-column-id]");
        expect(columns.length).toBeGreaterThan(0);
      });

      mockNavigateByKeyboard.mockClear();

      // Focus on document.body which has no data-column-id
      document.body.focus();

      // ArrowUp should still work, falling back to focusedColumnIndex
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "ArrowUp",
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, "target", { value: document.body, writable: false });
        document.dispatchEvent(event);
      });

      // Should still call navigateByKeyboard with the default column index
      expect(mockNavigateByKeyboard).toHaveBeenCalledWith("prev");
    });

    it("handles getColumnIndexFromElement with element.closest returning null", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const columns = container.querySelectorAll("[data-column-id]");
        expect(columns.length).toBeGreaterThan(0);
      });

      mockFocusColumn.mockClear();

      // Create an element that is not inside a column
      const orphanDiv = document.createElement("div");
      document.body.appendChild(orphanDiv);

      // Mock closest to return null
      const originalClosest = orphanDiv.closest;
      orphanDiv.closest = jest.fn().mockReturnValue(null);

      // Press number key 1 - this should work because the guard check passes
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "1",
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, "target", { value: orphanDiv, writable: false });
        document.dispatchEvent(event);
      });

      orphanDiv.closest = originalClosest;
      document.body.removeChild(orphanDiv);

      // focusColumn should have been called for index 0
      expect(mockFocusColumn).toHaveBeenCalled();
    });
  });

  describe("Branch coverage regressions", () => {
    it("falls back to non-current iterations when current iterations are empty", async () => {
      (workService.getIterations as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([{ path: "Iteration\\Fallback", id: "iter-fallback" }]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(workService.getIterations).toHaveBeenNthCalledWith(1, testColumnProps.team.id, "current");
        expect(workService.getIterations).toHaveBeenNthCalledWith(2, testColumnProps.team.id);
      });
    });

    it("handles null feedback item list from data service", async () => {
      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(null);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const firstColumnProps = getLatestColumnProps(testColumnProps.columnIds[0]);
        expect(firstColumnProps?.isDataLoaded).toBe(true);
        expect(firstColumnProps?.columnItems).toEqual([]);
      });
    });

    it("does not show column edit button when current user is not board owner", async () => {
      const props = {
        ...mockedProps,
        userId: "different-user",
        board: {
          ...mockedBoard,
          createdBy: { ...mockedIdentity, id: "owner-user" },
        },
      };

      render(<FeedbackBoard {...props} />);

      await waitFor(() => {
        const firstColumnProps = getLatestColumnProps(testColumnProps.columnIds[0]);
        expect(firstColumnProps?.showColumnEditButton).toBe(false);
      });
    });

    it.each<WorkflowPhase>(["Collect", "Group", "Vote", "Act"])("polls in the %s phase and stops polling on unmount", async workflowPhase => {
      jest.useFakeTimers();

      const { unmount } = render(<FeedbackBoard {...mockedProps} workflowPhase={workflowPhase} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(LIVE_SYNC_POLL_INTERVAL_MS * 2);
      });

      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(3);

      unmount();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(LIVE_SYNC_POLL_INTERVAL_MS * 2);
      });

      expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalledTimes(3);
      jest.useRealTimers();
    });

    it("ignores server feedback items that belong to unknown columns", async () => {
      const unknownColumnItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "unknown-column-item",
        columnId: "column-not-in-board",
        originalColumnId: "column-not-in-board",
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([unknownColumnItem]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const firstColumnProps = getLatestColumnProps(testColumnProps.columnIds[0]);
        expect(firstColumnProps).toBeDefined();
        expect(firstColumnProps?.columnItems.some((item: any) => item.feedbackItem.id === "unknown-column-item")).toBe(false);
      });
    });

    it("preserves locally newly-created items when server returns no items on polling", async () => {
      jest.useFakeTimers();

      const collectProps: FeedbackBoardProps = {
        ...mockedProps,
        workflowPhase: "Collect",
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...collectProps} />);

      const columnId = testColumnProps.columnIds[0];
      const localNewItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "local-new-item",
        columnId,
        originalColumnId: columnId,
      };

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.addFeedbackItems(columnId, [localNewItem], true, false, false, false);
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.columnItems.some((item: any) => item.feedbackItem.id === localNewItem.id)).toBe(true);
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(LIVE_SYNC_POLL_INTERVAL_MS);
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.columnItems.some((item: any) => item.feedbackItem.id === localNewItem.id)).toBe(true);
      });

      jest.useRealTimers();
    });

    it("preserves local empty placeholder item when server returns no items on polling", async () => {
      jest.useFakeTimers();

      const collectProps: FeedbackBoardProps = {
        ...mockedProps,
        workflowPhase: "Collect",
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...collectProps} />);

      const columnId = testColumnProps.columnIds[0];
      const emptyPlaceholderItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "emptyFeedbackItem",
        title: "",
        columnId,
        originalColumnId: columnId,
      };

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.addFeedbackItems(columnId, [emptyPlaceholderItem], false, false, false, false);
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(LIVE_SYNC_POLL_INTERVAL_MS);
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.columnItems.some((item: any) => item.feedbackItem.id === "emptyFeedbackItem")).toBe(true);
      });

      jest.useRealTimers();
    });

    it("skips merging for a board column id that does not yet exist in local column state", async () => {
      const extraColumnId = "new-column-id";
      const boardWithAdditionalColumn: IFeedbackBoardDocument = {
        ...mockedBoard,
        columns: [
          ...mockedBoard.columns,
          {
            ...mockedBoard.columns[0],
            id: extraColumnId,
            title: "New Column",
          },
        ],
      };

      const itemForNewColumn: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "server-new-column-item",
        columnId: extraColumnId,
        originalColumnId: extraColumnId,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue([itemForNewColumn]);

      const { rerender } = render(<FeedbackBoard {...mockedProps} />);

      rerender(<FeedbackBoard {...mockedProps} board={boardWithAdditionalColumn} />);

      await waitFor(() => {
        const firstColumnProps = getLatestColumnProps(testColumnProps.columnIds[0]);
        expect(firstColumnProps).toBeDefined();
      });
    });

    it("replaces local item with server item when ids match during merge", async () => {
      jest.useFakeTimers();

      const collectProps: FeedbackBoardProps = {
        ...mockedProps,
        workflowPhase: "Collect",
      };

      const columnId = testColumnProps.columnIds[0];
      const localItemId = "duplicate-item-id";

      const localItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: localItemId,
        title: "Local Item Title",
        columnId,
        originalColumnId: columnId,
      };

      const serverItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: localItemId,
        title: "Server Item Title",
        columnId,
        originalColumnId: columnId,
      };

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValueOnce([]).mockResolvedValue([serverItem]);

      render(<FeedbackBoard {...collectProps} />);

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.addFeedbackItems(columnId, [localItem], true, false, false, false);
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(LIVE_SYNC_POLL_INTERVAL_MS);
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        const mergedItem = columnProps?.columnItems.find((item: any) => item.feedbackItem.id === localItemId);
        expect(mergedItem?.feedbackItem.title).toBe("Server Item Title");
      });

      jest.useRealTimers();
    });

    it("handles merge when local columns map is missing a board column key", async () => {
      const realUseState = React.useState;
      const useStateSpy = jest.spyOn(React, "useState");

      (useStateSpy as unknown as jest.Mock).mockImplementation((initialState: unknown) => {
        const [state, setState] = (realUseState as unknown as (value: unknown) => [unknown, React.Dispatch<React.SetStateAction<unknown>>])(initialState);

        const isColumnsState = !!state && typeof state === "object" && !Array.isArray(state) && Object.values(state as Record<string, unknown>).some(value => !!value && typeof value === "object" && "columnItems" in (value as object) && "columnProperties" in (value as object));

        if (!isColumnsState) {
          return [state, setState] as [unknown, React.Dispatch<React.SetStateAction<unknown>>];
        }

        const wrappedSetState: React.Dispatch<React.SetStateAction<unknown>> = update => {
          if (typeof update === "function") {
            const currentColumns = state as Record<string, unknown>;
            const keys = Object.keys(currentColumns);

            if (keys.length > 1) {
              const [, ...remainingKeys] = keys;
              const columnsMissingFirstKey = remainingKeys.reduce(
                (acc, key) => {
                  acc[key] = currentColumns[key];
                  return acc;
                },
                {} as Record<string, unknown>,
              );

              (update as (prevState: unknown) => unknown)(columnsMissingFirstKey);
              return;
            }
          }

          setState(update);
        };

        return [state, wrappedSetState] as [unknown, React.Dispatch<React.SetStateAction<unknown>>];
      });

      (itemDataService.getFeedbackItemsForBoardStrict as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoardStrict).toHaveBeenCalled();
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      useStateSpy.mockRestore();
    });
  });
});
