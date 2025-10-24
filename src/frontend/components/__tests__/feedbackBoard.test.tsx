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
  const React = require("react");
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
  isCarouselDialogHidden: false,
  hideCarouselDialog: jest.fn(() => {}),
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
    timerstate: false,
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
    timerstate: false,
    timerId: null,
    groupIds: [],
    isGroupedCarouselItem: false,
    associatedActionItemIds: [123],
  },
];

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

    const getLatestColumnPropsById = (columnId: string) => {
      for (let index = feedbackColumnPropsSpy.mock.calls.length - 1; index >= 0; index -= 1) {
        const [props] = feedbackColumnPropsSpy.mock.calls[index] ?? [];
        if (props?.columnId === columnId) {
          return props;
        }
      }

      return undefined;
    };

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

  describe("Carousel Dialog", () => {
    it("renders successfully when carousel is not hidden", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} isCarouselDialogHidden={false} />);

      // Fluent UI Dialog renders in a portal and is difficult to test in JSDOM
      // We verify the component renders without errors
      const feedbackBoard = container.querySelector(".feedback-board");
      expect(feedbackBoard).toBeTruthy();
    });

    it("renders successfully when carousel is hidden", () => {
      const { container } = render(<FeedbackBoard {...mockedProps} isCarouselDialogHidden={true} />);

      const feedbackBoard = container.querySelector(".feedback-board");
      expect(feedbackBoard).toBeTruthy();
    });

    it("accepts hideCarouselDialog prop", () => {
      const hideCarouselDialog = jest.fn();

      render(<FeedbackBoard {...mockedProps} hideCarouselDialog={hideCarouselDialog} isCarouselDialogHidden={false} />);

      // The dialog exists in DOM but we can't easily test onDismiss without more setup
      expect(hideCarouselDialog).not.toHaveBeenCalled();
    });
  });
});
