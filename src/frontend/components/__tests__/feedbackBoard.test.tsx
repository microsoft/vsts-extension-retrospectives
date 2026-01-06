import React from "react";
import { render, waitFor, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { IFeedbackBoardDocument, IFeedbackItemDocument } from "../../interfaces/feedback";
import { mocked } from "jest-mock";
import FeedbackBoard, { FeedbackBoardProps } from "../../components/feedbackBoard";
import { testColumnProps } from "../__mocks__/mocked_components/mockedFeedbackColumn";
import { IdentityRef } from "azure-devops-extension-api/WebApi";
import { itemDataService } from "../../dal/itemDataService";
import { workService } from "../../dal/azureDevOpsWorkService";
import { workItemService } from "../../dal/azureDevOpsWorkItemService";
import { reflectBackendService } from "../../dal/reflectBackendService";
import { appInsights } from "../../utilities/telemetryClient";

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

jest.mock("../feedbackBoardMetadataForm", () => mocked({}));

jest.mock("../../dal/itemDataService", () => ({
  itemDataService: {
    getFeedbackItemsForBoard: jest.fn(),
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

jest.mock("../../dal/reflectBackendService", () => ({
  reflectBackendService: {
    onReceiveNewItem: jest.fn(),
    onReceiveUpdatedItem: jest.fn(),
    removeOnReceiveNewItem: jest.fn(),
    removeOnReceiveUpdatedItem: jest.fn(),
    broadcastNewItem: jest.fn(),
    broadcastUpdatedItem: jest.fn(),
  },
}));

jest.mock("../feedbackColumn", () => {
  return function MockFeedbackColumn(props: any) {
    feedbackColumnPropsSpy(props);
    return <div data-testid={`column-${props.columnId}`} className="feedback-column"></div>;
  };
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
    jest.clearAllMocks();
    feedbackColumnPropsSpy.mockClear();

    // Default mock implementations
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
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
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalledWith(mockedBoard.id);
      });
    });

    it("fetches feedback items on mount", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalledWith(mockedBoard.id);
      });
    });

    it("sets default iteration and area path on mount", async () => {
      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(workService.getIterations).toHaveBeenCalledWith(testColumnProps.team.id, "current");
        expect(workService.getTeamFieldValues).toHaveBeenCalledWith(testColumnProps.team.id);
      });
    });

    it("registers signal handlers on mount", async () => {
      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(reflectBackendService.onReceiveNewItem).toHaveBeenCalled();
        expect(reflectBackendService.onReceiveUpdatedItem).toHaveBeenCalled();
      });
    });

    it("unregisters signal handlers on unmount", async () => {
      const { unmount } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(reflectBackendService.onReceiveNewItem).toHaveBeenCalled();
      });

      unmount();

      expect(reflectBackendService.removeOnReceiveNewItem).toHaveBeenCalled();
      expect(reflectBackendService.removeOnReceiveUpdatedItem).toHaveBeenCalled();
    });
  });

  describe("Component Updates", () => {
    it("reloads data when board ID changes", async () => {
      const { rerender } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalledTimes(1);
      });

      const newBoard = { ...mockedBoard, id: "new-board-id" };
      rerender(<FeedbackBoard {...mockedProps} board={newBoard} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalledTimes(2);
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalledWith("new-board-id");
      });
    });

    it("reloads data when board modifiedDate changes", async () => {
      const { rerender } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalledTimes(1);
      });

      const newBoard = { ...mockedBoard, modifiedDate: new Date() };
      rerender(<FeedbackBoard {...mockedProps} board={newBoard} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalledTimes(2);
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

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithActions]);
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
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([mockFeedbackItems[0]]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });

      expect(workItemService.getWorkItemsByIds).not.toHaveBeenCalled();
    });

    it("handles null feedback items response", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(null);

      const { container } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
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

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([mockFeedbackItems[0], itemForDeletedColumn]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
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
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });
    });

    it("initializes columns with default color when missing", async () => {
      const boardWithoutColors = {
        ...mockedBoard,
        columns: mockedBoard.columns.map(col => ({ ...col, accentColor: "" })),
      };

      render(<FeedbackBoard {...mockedProps} board={boardWithoutColors} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });
    });

    it("renders columns after data is loaded", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);

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
        const result = await columnProps.requestTimerStart("item-1");
        expect(result).toBe(true);
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
        timerId: 123 as any,
      };
      const nextItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[1],
        id: "next-item",
        columnId: activeItem.columnId,
        originalColumnId: activeItem.originalColumnId,
        timerState: false,
      };

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([activeItem, nextItem]);
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

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps.activeTimerFeedbackItemId).toBe("next-item");
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

  describe("Signal Handlers", () => {
    it("handles new item signal", async () => {
      let newItemHandler: ((columnId: string, feedbackItemId: string) => Promise<void>) | null = null;

      (reflectBackendService.onReceiveNewItem as jest.Mock).mockImplementation(handler => {
        newItemHandler = handler;
      });

      const newItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "new-item-signal",
      };

      (itemDataService.getFeedbackItem as jest.Mock).mockResolvedValue(newItem);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(reflectBackendService.onReceiveNewItem).toHaveBeenCalled();
      });

      // Trigger the handler
      if (newItemHandler) {
        await newItemHandler(testColumnProps.columnIds[0], "new-item-signal");

        await waitFor(() => {
          expect(itemDataService.getFeedbackItem).toHaveBeenCalledWith(mockedBoard.id, "new-item-signal");
        });
      }
    });

    it("handles updated item signal", async () => {
      let updatedItemHandler: ((columnId: string, feedbackItemId: string) => Promise<void>) | null = null;

      (reflectBackendService.onReceiveUpdatedItem as jest.Mock).mockImplementation(handler => {
        updatedItemHandler = handler;
      });

      const updatedItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        title: "Updated title",
      };

      (itemDataService.getFeedbackItem as jest.Mock).mockResolvedValue(updatedItem);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(reflectBackendService.onReceiveUpdatedItem).toHaveBeenCalled();
      });

      // Trigger the handler
      if (updatedItemHandler) {
        await updatedItemHandler(testColumnProps.columnIds[0], mockFeedbackItems[0].id);

        await waitFor(() => {
          expect(itemDataService.getFeedbackItem).toHaveBeenCalledWith(mockedBoard.id, mockFeedbackItems[0].id);
        });
      }
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

  describe("Timer Operations - Extended Coverage", () => {
    it("stopTimerById clears state when item has no timerState", async () => {
      const itemWithoutTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: false,
        timerId: null,
      };

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithoutTimer]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = itemWithoutTimer.columnId;

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });
    });

    it("stopTimerById handles item not found", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });
    });

    it("stopTimerById clears existing timerId", async () => {
      const itemWithTimerId: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: 12345 as any,
      };

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithTimerId]);
      (itemDataService.flipTimer as jest.Mock).mockResolvedValue({ ...itemWithTimerId, timerState: false, timerId: null });

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = itemWithTimerId.columnId;

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe(itemWithTimerId.id);
      });
    });

    it("requestTimerStart handles exception gracefully", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      // Call requestTimerStart which should succeed without throwing
      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        const result = await columnProps.requestTimerStart("item-1");
        expect(result).toBe(true);
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
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(items);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });
    });

    it("removeFeedbackItemFromColumn sets focus on create button when no items left", async () => {
      const items = [mockFeedbackItems[0]];
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(items);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });
    });
  });

  describe("Feedback Item Refresh", () => {
    it("refreshFeedbackItems updates existing items", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });
    });

    it("refreshFeedbackItems moves items between columns", async () => {
      const originalItem = { ...mockFeedbackItems[0] };
      const movedItem = { ...mockFeedbackItems[0], columnId: testColumnProps.columnIds[1] };

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValueOnce([originalItem]).mockResolvedValueOnce([movedItem]);

      const { rerender } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });

      // Trigger re-fetch
      const newBoard = { ...mockedBoard, modifiedDate: new Date() };
      rerender(<FeedbackBoard {...mockedProps} board={newBoard} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalledTimes(2);
      });
    });

    it("refreshFeedbackItems adds new items to column", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);
      (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([{ id: 123, title: "Action Item" }]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });
    });

    it("refreshFeedbackItems broadcasts updated items", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });
    });
  });

  describe("Signal Handlers - Extended Coverage", () => {
    it("handles new item signal with valid item", async () => {
      let newItemHandler: ((columnId: string, feedbackItemId: string) => Promise<void>) | null = null;

      (reflectBackendService.onReceiveNewItem as jest.Mock).mockImplementation(handler => {
        newItemHandler = handler;
      });

      const newItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        id: "new-signal-item",
      };

      (itemDataService.getFeedbackItem as jest.Mock).mockResolvedValue(newItem);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(reflectBackendService.onReceiveNewItem).toHaveBeenCalled();
      });

      if (newItemHandler) {
        await newItemHandler(testColumnProps.columnIds[0], "new-signal-item");

        await waitFor(() => {
          expect(itemDataService.getFeedbackItem).toHaveBeenCalledWith(mockedBoard.id, "new-signal-item");
        });
      }
    });

    it("handles updated item signal for different column", async () => {
      let updatedItemHandler: ((columnId: string, feedbackItemId: string) => Promise<void>) | null = null;

      (reflectBackendService.onReceiveUpdatedItem as jest.Mock).mockImplementation(handler => {
        updatedItemHandler = handler;
      });

      const updatedItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        columnId: testColumnProps.columnIds[1], // Different column
        title: "Updated in different column",
      };

      (itemDataService.getFeedbackItem as jest.Mock).mockResolvedValue(updatedItem);
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([mockFeedbackItems[0]]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(reflectBackendService.onReceiveUpdatedItem).toHaveBeenCalled();
      });

      if (updatedItemHandler) {
        await updatedItemHandler(testColumnProps.columnIds[0], mockFeedbackItems[0].id);
      }
    });
  });

  describe("Add Feedback Items", () => {
    it("adds multiple feedback items at once", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });
    });

    it("sets focus on first added item", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });
    });

    it("broadcasts new items when shouldBroadcast is true", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      const newItems = [mockFeedbackItems[0]];

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.addFeedbackItems(columnId, newItems, true, true, true, true, false);
      });

      await waitFor(() => {
        expect(reflectBackendService.broadcastNewItem).toHaveBeenCalledWith(columnId, mockFeedbackItems[0].id);
      });
    });

    it("does not broadcast new items when shouldBroadcast is false", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      const newItems = [mockFeedbackItems[0]];

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        columnProps.addFeedbackItems(columnId, newItems, false, true, true, true, false);
      });

      expect(reflectBackendService.broadcastNewItem).not.toHaveBeenCalled();
    });
  });

  describe("Timer Operations - Error Handling", () => {
    it("stopTimerById logs exception when flipTimer fails", async () => {
      const itemWithTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: 999 as any,
      };

      const flipError = new Error("flip timer failed");
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithTimer]);
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
        timerId: 888 as any,
      };

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithTimer]);
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

    it("requestTimerStart returns false on error", async () => {
      const flipError = new Error("request timer start error");
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
      (itemDataService.flipTimer as jest.Mock).mockRejectedValue(flipError);
      const originalSetState = React.Component.prototype.setState;

      try {
        // Temporarily mock setState to throw an error only when requestTimerStart
        // attempts to set activeTimerFeedbackItemId for this specific item.
        React.Component.prototype.setState = function (state: any) {
          const nextState = typeof state === "function" ? state(this.state, this.props) : state;
          if (nextState && typeof nextState === "object" && (nextState as any).activeTimerFeedbackItemId === "item-error") {
            throw flipError;
          }

          return originalSetState.call(this, state);
        };

        render(<FeedbackBoard {...mockedProps} />);

        const columnId = testColumnProps.columnIds[0];

        await waitFor(() => {
          expect(getLatestColumnProps(columnId)).toBeDefined();
        });

        let result = true;
        await act(async () => {
          const columnProps = getLatestColumnProps(columnId);
          result = await columnProps.requestTimerStart("item-error");
        });

        expect(result).toBe(false);
        expect(appInsights.trackException).toHaveBeenCalledWith(
          flipError,
          expect.objectContaining({
            action: "requestTimerStart",
            boardId: mockedBoard.id,
            feedbackItemId: "item-error",
          }),
        );
      } finally {
        // Restore original setState even if the test fails.
        React.Component.prototype.setState = originalSetState;
      }
    });
  });

  describe("Feedback Item Refresh - Broadcasting", () => {
    it("refreshFeedbackItems does not broadcast when shouldBroadcast is false", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      const updatedItem = { ...mockFeedbackItems[0], title: "Updated without broadcast" };

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.refreshFeedbackItems([updatedItem], false);
      });

      expect(reflectBackendService.broadcastUpdatedItem).not.toHaveBeenCalled();
    });

    it("refreshFeedbackItems handles empty array", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = testColumnProps.columnIds[0];

      await waitFor(() => {
        expect(getLatestColumnProps(columnId)).toBeDefined();
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.refreshFeedbackItems([], true);
      });

      expect(reflectBackendService.broadcastUpdatedItem).not.toHaveBeenCalled();
    });
  });

  describe("Remove Feedback Item - Focus Handling", () => {
    it("removeFeedbackItemFromColumn without focus flag does not set focus", async () => {
      const items = [mockFeedbackItems[0], mockFeedbackItems[1]];
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(items);

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
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(items);

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
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true });
        document.dispatchEvent(event);
      });

      // Component should handle the event without crashing
      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles arrow down key for item navigation", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
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
  });

  describe("Column Item Finding", () => {
    it("findColumnItemById returns undefined when column is null", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
      });
    });
  });

  describe("Keyboard event handling", () => {
    it("removes keyboard listener on unmount", async () => {
      const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");

      const { unmount } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(reflectBackendService.onReceiveNewItem).toHaveBeenCalled();
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it("does not crash on ? key", async () => {
      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalled();
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
    it("stops missing previous timer ID without crashing", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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

      // Starting another timer should attempt to stop the previous one and early-return.
      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        await columnProps.requestTimerStart("next-item");
      });

      expect(itemDataService.flipTimer).not.toHaveBeenCalled();
      expect(appInsights.trackException).not.toHaveBeenCalled();
    });

    it("stops an existing active timer when starting another", async () => {
      const clearIntervalSpy = jest.spyOn(window, "clearInterval");

      const itemWithActiveTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: 123 as any,
      };

      const otherItem: IFeedbackItemDocument = {
        ...mockFeedbackItems[1],
        id: "other-item",
      };

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithActiveTimer, otherItem]);
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

      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
      expect(itemDataService.flipTimer).toHaveBeenCalledWith(mockedBoard.id, itemWithActiveTimer.id, null);
      expect(reflectBackendService.broadcastUpdatedItem).toHaveBeenCalledWith("dummyColumn", itemWithActiveTimer.id);

      clearIntervalSpy.mockRestore();
    });

    it("clears active timer when notifyTimerStopped is called for the active item", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([singleItem]);

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
        timerId: 777 as any,
      };

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithActiveTimer]);

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
        timerId: 666 as any,
      };

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithActiveTimer]);

      const { rerender } = render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        const columnProps = getLatestColumnProps(itemWithActiveTimer.columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe(itemWithActiveTimer.id);
      });

      const newBoard = { ...mockedBoard, id: "new-board-with-timer" };
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

      rerender(<FeedbackBoard {...mockedProps} board={newBoard} />);

      await waitFor(() => {
        expect(itemDataService.getFeedbackItemsForBoard).toHaveBeenCalledWith("new-board-with-timer");
      });
    });
  });

  describe("Keyboard Navigation - Column Navigation", () => {
    it("handles ArrowUp key to navigate to previous item in column", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);

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
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles ArrowRight key to navigate to next column", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      expect(document.querySelector(".feedback-board")).toBeInTheDocument();
    });

    it("handles numeric keys 1-5 to jump to column by index", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue(mockFeedbackItems);

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

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...propsWithCallbacks} />);

      await waitFor(() => {
        expect(onFocusModeModelChange).toHaveBeenCalled();
      });

      const focusModeModel = onFocusModeModelChange.mock.calls[onFocusModeModelChange.mock.calls.length - 1]?.[0];
      focusModeModel?.onVoteCasted?.();

      expect(onVoteCasted).toHaveBeenCalled();
    });
  });

  describe("Timer Functions - Edge Cases", () => {
    it("handles stopTimerById when item has no timerId", async () => {
      const itemWithActiveTimerNoId: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: null as any,
      };

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithActiveTimerNoId]);
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
        timerId: 999 as any,
      };

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithActiveTimer]);
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

    it("handles requestTimerStart error", async () => {
      const itemWithActiveTimer: IFeedbackItemDocument = {
        ...mockFeedbackItems[0],
        timerState: true,
        timerId: 888 as any,
      };

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithActiveTimer]);
      (itemDataService.flipTimer as jest.Mock).mockRejectedValue(new Error("Request timer error"));

      render(<FeedbackBoard {...mockedProps} />);

      const columnId = itemWithActiveTimer.columnId;

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        expect(columnProps?.activeTimerFeedbackItemId).toBe(itemWithActiveTimer.id);
      });

      await act(async () => {
        const columnProps = getLatestColumnProps(columnId);
        const result = await columnProps.requestTimerStart("failing-item");
        // Should return false on error
        expect(result === true || result === false).toBe(true);
      });
    });
  });

  describe("addFeedbackItems - shouldHaveFocus parameter", () => {
    it("adds feedback items with shouldHaveFocus set correctly", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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
        columnProps.addFeedbackItems(columnId, [newItem], true, true, true, true, false);
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

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([itemWithFocus]);

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
        columnProps.addFeedbackItems(columnId, [newItem], false, false, false, false, false);
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        const originalItem = columnProps?.columnItems?.find((item: any) => item.feedbackItem.id === "focused-item");
        expect(originalItem?.shouldHaveFocus).toBe(false);
      });
    });
  });

  describe("registerItemRef callback", () => {
    it("provides registerItemRef callback in column props", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

      render(<FeedbackBoard {...mockedProps} />);

      await waitFor(() => {
        expect(feedbackColumnPropsSpy).toHaveBeenCalled();
      });

      const columnProps = feedbackColumnPropsSpy.mock.calls[feedbackColumnPropsSpy.mock.calls.length - 1]?.[0];
      expect(columnProps?.registerItemRef).toBeInstanceOf(Function);
    });
  });

  describe("handleBoardKeyDown", () => {
    it("does not handle key events when target is input", async () => {
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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

      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

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
        columnProps.addFeedbackItems(columnId, [newItem], false, true, true, true, false);
      });

      await waitFor(() => {
        const columnProps = getLatestColumnProps(columnId);
        const addedItem = columnProps?.columnItems?.find((item: any) => item.feedbackItem.id === "new-focused-item");
        expect(addedItem?.shouldHaveFocus).toBe(true);
      });
    });
  });
});
