import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import { IdentityRef } from "azure-devops-extension-api/WebApi";

import FeedbackBoard, { FeedbackBoardProps } from "../../components/feedbackBoard";
import { IFeedbackBoardDocument, IFeedbackItemDocument } from "../../interfaces/feedback";
import { itemDataService } from "../../dal/itemDataService";
import { workService } from "../../dal/azureDevOpsWorkService";
import { workItemService } from "../../dal/azureDevOpsWorkItemService";
import { appInsights } from "../../utilities/telemetryClient";
import { WorkflowPhase } from "../../interfaces/workItem";

const feedbackColumnPropsSpy = jest.fn();
const mockNavigateByKeyboard = jest.fn();
const mockFocusColumn = jest.fn();
let omitImperativeMethods = false;

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

jest.mock("../../components/feedbackColumn", () => {
  const ReactLib = require("react");
  return ReactLib.forwardRef(function MockFeedbackColumn(props: any, ref: any) {
    feedbackColumnPropsSpy(props);
    ReactLib.useImperativeHandle(
      ref,
      () =>
        omitImperativeMethods
          ? {}
          : {
              navigateByKeyboard: mockNavigateByKeyboard,
              focusColumn: mockFocusColumn,
            },
      [],
    );

    return <div data-testid={`column-${props.columnId}`} data-column-id={props.columnId} className="feedback-column" />;
  });
});

const mockedIdentity: IdentityRef = {
  directoryAlias: "",
  id: "owner-1",
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

const baseTeam = {
  id: "team-1",
  name: "team",
} as any;

const createBoard = (overrides?: Partial<IFeedbackBoardDocument>): IFeedbackBoardDocument => ({
  id: "board-1",
  title: "Board",
  teamId: "team-1",
  createdBy: mockedIdentity,
  createdDate: new Date("2024-01-01"),
  modifiedDate: new Date("2024-01-01"),
  columns: [
    {
      id: "col-1",
      title: "Column 1",
      accentColor: "#0078d4",
      iconClass: "reviews",
      notes: "note-1",
    } as any,
    {
      id: "col-2",
      title: "Column 2",
      accentColor: "#0078d4",
      iconClass: "reviews",
      notes: "note-2",
    } as any,
  ],
  activePhase: "Collect",
  maxVotesPerUser: 5,
  boardVoteCollection: {},
  teamEffectivenessMeasurementVoteCollection: [],
  ...overrides,
});

const createItem = (overrides?: Partial<IFeedbackItemDocument>): IFeedbackItemDocument => ({
  id: "item-1",
  boardId: "board-1",
  title: "item",
  columnId: "col-1",
  originalColumnId: "col-1",
  upvotes: 0,
  voteCollection: {},
  createdDate: new Date(),
  userIdRef: "u-1",
  timerSecs: 0,
  timerState: false,
  timerId: null,
  groupIds: [],
  isGroupedCarouselItem: false,
  ...overrides,
});

const renderBoard = (overrides?: Partial<FeedbackBoardProps>) => {
  const props: FeedbackBoardProps = {
    displayBoard: true,
    board: createBoard(),
    team: baseTeam,
    workflowPhase: WorkflowPhase.Collect,
    nonHiddenWorkItemTypes: [],
    allWorkItemTypes: [],
    isAnonymous: false,
    hideFeedbackItems: false,
    userId: "owner-1",
    onColumnNotesChange: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return render(<FeedbackBoard {...props} />);
};

const getLatestColumnPropsById = (columnId: string): any => {
  for (let index = feedbackColumnPropsSpy.mock.calls.length - 1; index >= 0; index -= 1) {
    const [props] = feedbackColumnPropsSpy.mock.calls[index] ?? [];
    if (props?.columnId === columnId) {
      return props;
    }
  }
  return undefined;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  omitImperativeMethods = false;
  (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  (itemDataService.getFeedbackItem as jest.Mock).mockResolvedValue(createItem());
  (itemDataService.flipTimer as jest.Mock).mockResolvedValue(createItem());
  (workService.getIterations as jest.Mock).mockResolvedValue([{ path: "iteration-a" }]);
  (workService.getTeamFieldValues as jest.Mock).mockResolvedValue({ values: [{ value: "area-a" }] });
  (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([{ id: 1 }]);
});

beforeAll(() => {
  if (!(document as unknown as { closest?: unknown }).closest) {
    (document as unknown as { closest: () => null }).closest = () => null;
  }
});

describe("FeedbackBoard targeted coverage", () => {
  it("covers board owner and notes nullish branches", async () => {
    renderBoard({
      userId: "someone-else",
      board: createBoard({
        createdBy: undefined as unknown as IdentityRef,
        columns: [{ id: "col-1", title: "Column 1", accentColor: "#0078d4", iconClass: "reviews", notes: undefined } as any],
      }),
    });

    await waitFor(() => {
      const columnProps = getLatestColumnPropsById("col-1");
      expect(columnProps).toBeTruthy();
      expect(columnProps.showColumnEditButton).toBe(false);
      expect(columnProps.columnNotes).toBe("");
    });
  });

  it("covers default iteration and area fallback branches", async () => {
    (workService.getIterations as jest.Mock).mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined);
    (workService.getTeamFieldValues as jest.Mock).mockResolvedValue(undefined);

    renderBoard();

    await waitFor(() => {
      const columnProps = getLatestColumnPropsById("col-1");
      expect(columnProps.defaultActionItemIteration).toBe("");
      expect(columnProps.defaultActionItemAreaPath).toBe("");
    });
  });

  it("covers column notes update path when previous notes exist", async () => {
    const onColumnNotesChange = jest.fn().mockResolvedValue(undefined);
    renderBoard({ onColumnNotesChange, workflowPhase: WorkflowPhase.Vote });

    await waitFor(() => {
      expect(getLatestColumnPropsById("col-1")).toBeTruthy();
    });

    const columnProps = getLatestColumnPropsById("col-1");
    await act(async () => {
      await columnProps.onColumnNotesChange("updated-note");
    });

    expect(onColumnNotesChange).toHaveBeenCalledWith("col-1", "updated-note");
  });

  it("covers refreshFeedbackItems action-item lookup path", async () => {
    renderBoard({ workflowPhase: WorkflowPhase.Vote });

    await waitFor(() => {
      expect(getLatestColumnPropsById("col-1")).toBeTruthy();
    });

    const columnProps = getLatestColumnPropsById("col-1");
    await act(async () => {
      await columnProps.refreshFeedbackItems([createItem({ associatedActionItemIds: [42] })], false);
    });

    expect(workItemService.getWorkItemsByIds).toHaveBeenCalledWith([42]);
  });

  it("covers active editor merge and associated work-item loading during polling", async () => {
    jest.useFakeTimers();

    const localEditingItem = createItem({ id: "editing-1", title: "local", associatedActionItemIds: [] });
    const serverItem = createItem({ id: "server-1", title: "server", associatedActionItemIds: [88] });

    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([serverItem]);

    const querySpy = jest.spyOn(document, "querySelector").mockImplementation(() => {
      return {
        closest: () => ({ getAttribute: () => "editing-1" }),
      } as unknown as HTMLElement;
    });

    renderBoard({ workflowPhase: WorkflowPhase.Collect });

    await waitFor(() => {
      expect(getLatestColumnPropsById("col-1")).toBeTruthy();
    });

    const beforePollProps = getLatestColumnPropsById("col-1");
    await act(async () => {
      beforePollProps.addFeedbackItems("col-1", [localEditingItem], false, true, false, false, false);
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      const afterPollProps = getLatestColumnPropsById("col-1");
      const ids = afterPollProps.columnItems.map((item: any) => item.feedbackItem.id);
      expect(ids).toContain("editing-1");
      expect(ids).toContain("server-1");
    });

    expect(workItemService.getWorkItemsByIds).toHaveBeenCalledWith([88]);
    querySpy.mockRestore();
  });

  it("covers associatedActionItemIds undefined branch in refresh and polling paths", async () => {
    jest.useFakeTimers();
    const serverItemWithoutActions = createItem({ id: "server-no-actions", associatedActionItemIds: undefined });

    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([serverItemWithoutActions]);

    renderBoard({ workflowPhase: WorkflowPhase.Collect });

    await waitFor(() => {
      expect(getLatestColumnPropsById("col-1")).toBeTruthy();
    });

    const columnProps = getLatestColumnPropsById("col-1");
    await act(async () => {
      await columnProps.refreshFeedbackItems([createItem({ id: "refresh-no-actions", associatedActionItemIds: undefined })], false);
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(workItemService.getWorkItemsByIds).not.toHaveBeenCalledWith(undefined);
  });

  it("covers removeFeedbackItem focus index branch when removed index is not last", async () => {
    renderBoard({ workflowPhase: WorkflowPhase.Vote });

    await waitFor(() => {
      expect(getLatestColumnPropsById("col-1")).toBeTruthy();
    });

    const colProps = getLatestColumnPropsById("col-1");
    await act(async () => {
      colProps.addFeedbackItems("col-1", [createItem({ id: "a" }), createItem({ id: "b" })], false, false, false, false, false);
    });

    await act(async () => {
      colProps.removeFeedbackItemFromColumn("col-1", "a", true);
    });

    const latest = getLatestColumnPropsById("col-1");
    expect(latest.columnItems[0].feedbackItem.id).toBe("b");
    expect(latest.columnItems[0].shouldHaveFocus).toBe(true);
  });

  it("covers focus mode vote callback path", async () => {
    const onVoteCasted = jest.fn();
    const onFocusModeModelChange = jest.fn();
    renderBoard({ onVoteCasted, onFocusModeModelChange, workflowPhase: WorkflowPhase.Vote });

    await waitFor(() => {
      expect(onFocusModeModelChange).toHaveBeenCalled();
    });

    const model = onFocusModeModelChange.mock.calls[onFocusModeModelChange.mock.calls.length - 1][0];
    model.onVoteCasted();
    expect(onVoteCasted).toHaveBeenCalled();
  });

  it("covers focus mode vote callback when prop is undefined", async () => {
    const onFocusModeModelChange = jest.fn();
    renderBoard({ onVoteCasted: undefined, onFocusModeModelChange, workflowPhase: WorkflowPhase.Vote });

    await waitFor(() => {
      expect(onFocusModeModelChange).toHaveBeenCalled();
    });

    const model = onFocusModeModelChange.mock.calls[onFocusModeModelChange.mock.calls.length - 1][0];
    expect(() => model.onVoteCasted()).not.toThrow();
  });

  it("covers missing-column branches in notes update and revert handlers", async () => {
    const updateError = new Error("persist failed");
    const onColumnNotesChange = jest.fn().mockRejectedValue(updateError);
    const initialBoard = createBoard({ id: "board-a", columns: [{ id: "old-col", title: "Old", accentColor: "#0078d4", iconClass: "reviews", notes: "persisted" } as any] });
    const nextBoard = createBoard({ id: "board-b", columns: [{ id: "new-col", title: "New", accentColor: "#0078d4", iconClass: "reviews", notes: "next" } as any] });

    const { rerender } = renderBoard({ board: initialBoard, onColumnNotesChange, workflowPhase: WorkflowPhase.Vote });

    await waitFor(() => {
      expect(getLatestColumnPropsById("old-col")).toBeTruthy();
    });

    const oldColumnProps = getLatestColumnPropsById("old-col");
    rerender(
      <FeedbackBoard
        displayBoard={true}
        board={nextBoard}
        team={baseTeam}
        workflowPhase={WorkflowPhase.Vote}
        nonHiddenWorkItemTypes={[]}
        allWorkItemTypes={[]}
        isAnonymous={false}
        hideFeedbackItems={false}
        userId="owner-1"
        onColumnNotesChange={onColumnNotesChange}
      />,
    );

    await act(async () => {
      await oldColumnProps.onColumnNotesChange("temp");
    });

    expect(appInsights.trackException).toHaveBeenCalledWith(
      updateError,
      expect.objectContaining({
        action: "updateColumnNotes",
        columnId: "old-col",
      }),
    );
  });

  it("covers keyboard optional chaining branches with missing imperative methods and unknown column id", async () => {
    omitImperativeMethods = true;
    const { container } = renderBoard({ workflowPhase: WorkflowPhase.Vote });

    await waitFor(() => {
      expect(container.querySelector(".feedback-board")).toBeTruthy();
    });

    const unknownColumnElement = document.createElement("div");
    unknownColumnElement.setAttribute("data-column-id", "unknown-column");
    document.body.appendChild(unknownColumnElement);

    await act(async () => {
      unknownColumnElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
      unknownColumnElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      unknownColumnElement.dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true }));
    });

    document.body.removeChild(unknownColumnElement);
  });

  it("covers keyboard navigation branches when board has no columns", async () => {
    const emptyBoard = createBoard({ id: "empty-board", columns: [] });
    omitImperativeMethods = true;
    renderBoard({ workflowPhase: WorkflowPhase.Vote, board: emptyBoard });

    await act(async () => {
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
  });

  it("covers stale requestTimerStart path against changed board columns", async () => {
    const firstBoard = createBoard({ id: "board-first", columns: [{ id: "old-col", title: "Old", accentColor: "#0078d4", iconClass: "reviews", notes: "old" } as any] });
    const secondBoard = createBoard({ id: "board-second", columns: [] });

    const { rerender } = renderBoard({ board: firstBoard, workflowPhase: WorkflowPhase.Vote });

    await waitFor(() => {
      expect(getLatestColumnPropsById("old-col")).toBeTruthy();
    });

    const oldColumnProps = getLatestColumnPropsById("old-col");
    await act(async () => {
      oldColumnProps.requestTimerStart("timer-a");
    });

    rerender(
      <FeedbackBoard
        displayBoard={true}
        board={secondBoard}
        team={baseTeam}
        workflowPhase={WorkflowPhase.Vote}
        nonHiddenWorkItemTypes={[]}
        allWorkItemTypes={[]}
        isAnonymous={false}
        hideFeedbackItems={false}
        userId="owner-1"
        onColumnNotesChange={jest.fn().mockResolvedValue(undefined)}
      />,
    );

    await act(async () => {
      oldColumnProps.requestTimerStart("timer-b");
    });
  });
});
