import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { WebApiTeam } from "azure-devops-extension-api/Core";
import type { WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import type { IColumn, IColumnItem } from "../feedbackBoard";
import type { IFeedbackItemDocument, IFeedbackColumn } from "../../interfaces/feedback";
import { WorkflowPhase } from "../../interfaces/workItem";

jest.mock("../feedbackItem", () => ({
  __esModule: true,
  default: (props: any) => {
    const isContentEditable = props.title === "__contenteditable__";
    return (
      <div data-feedback-item-id={props.id} tabIndex={-1}>
        {isContentEditable ? (
          <div contentEditable={true} suppressContentEditableWarning={true} aria-label={`ce-${props.id}`}>
            Editable
          </div>
        ) : (
          <input aria-label={`input-${props.id}`} defaultValue={props.title ?? ""} />
        )}
      </div>
    );
  },
}));

jest.mock("../feedbackItemGroup", () => ({
  __esModule: true,
  default: function FeedbackItemGroupMock(): React.ReactElement | null {
    return null;
  },
}));

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {},
  appInsights: {
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
  TelemetryEvents: {},
}));

import FeedbackColumn from "../feedbackColumn";
import type { FeedbackColumnProps } from "../feedbackColumn";

const makeFeedbackItem = (partial: Partial<IFeedbackItemDocument>): IFeedbackItemDocument => ({
  boardId: "board-1",
  columnId: "col-1",
  originalColumnId: "col-1",
  createdBy: { id: "user-1", displayName: "User", _links: { avatar: { href: "https://example.test/avatar.png" } } } as any,
  createdDate: new Date("2023-01-01"),
  id: "item-1",
  title: "Title",
  voteCollection: {},
  upvotes: 0,
  userIdRef: "user-1",
  timerSecs: 0,
  timerState: false,
  timerId: null,
  groupIds: [],
  isGroupedCarouselItem: false,
  ...partial,
});

const makeProps = (items: IColumnItem[]): FeedbackColumnProps => {
  const team: WebApiTeam = { id: "team-1", name: "Team" } as any;
  const column: IFeedbackColumn = {
    id: "col-1",
    name: "Column",
    iconClass: "fas fa-chalkboard",
    accentColor: "#0078d4",
    notes: "",
  } as any;

  const columns: { [id: string]: IColumn } = {
    "col-1": {
      columnProperties: column,
      columnItems: items,
      shouldFocusOnCreateFeedback: false,
    },
  };

  return {
    columns,
    columnIds: ["col-1"],
    columnName: "Column",
    columnId: "col-1",
    accentColor: "#0078d4",
    iconClass: "fas fa-chalkboard",
    workflowPhase: WorkflowPhase.Collect,
    isDataLoaded: true,
    columnItems: items,
    team,
    boardId: "board-1",
    boardTitle: "Board",
    defaultActionItemIteration: "",
    defaultActionItemAreaPath: "",
    nonHiddenWorkItemTypes: [] as WorkItemType[],
    allWorkItemTypes: [] as WorkItemType[],
    isBoardAnonymous: false,
    shouldFocusOnCreateFeedback: false,
    hideFeedbackItems: false,
    groupIds: [] as string[],
    onVoteCasted: jest.fn(),
    showColumnEditButton: false,
    columnNotes: "",
    onColumnNotesChange: jest.fn(),
    activeTimerFeedbackItemId: null as string | null,
    requestTimerStart: jest.fn(async () => true),
    notifyTimerStopped: jest.fn(),
    addFeedbackItems: jest.fn(),
    removeFeedbackItemFromColumn: jest.fn(),
    refreshFeedbackItems: jest.fn(),
  };
};

describe("FeedbackColumn focus preservation (branch coverage)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("restores input focus and selection when item count changes", () => {
    const items: IColumnItem[] = [
      { feedbackItem: makeFeedbackItem({ id: "item-1", title: "Hello" }), actionItems: [] as any[] },
    ];

    const props = makeProps(items);
    const { rerender, getByLabelText } = render(<FeedbackColumn {...props} />);

    const input = getByLabelText("input-item-1") as HTMLInputElement;
    input.focus();
    input.setSelectionRange(1, 3);
    expect(document.activeElement).toBe(input);

    rerender(
      <FeedbackColumn
        {...makeProps([
          ...items,
          { feedbackItem: makeFeedbackItem({ id: "item-2", title: "World" }), actionItems: [] as any[] },
        ])}
      />,
    );

    jest.runOnlyPendingTimers();

    const inputAfter = getByLabelText("input-item-1") as HTMLInputElement;
    expect(document.activeElement).toBe(inputAfter);
    expect(inputAfter.selectionStart).toBe(1);
    expect(inputAfter.selectionEnd).toBe(3);
  });

  it("logs a warning if restoring contenteditable cursor throws", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const items: IColumnItem[] = [
      { feedbackItem: makeFeedbackItem({ id: "item-1", title: "__contenteditable__" }), actionItems: [] as any[] },
    ];

    const props = makeProps(items);
    const ref = React.createRef<FeedbackColumn>();
    const { getByLabelText } = render(<FeedbackColumn {...props} ref={ref} />);
    expect(ref.current).toBeTruthy();

    const contentEditable = getByLabelText("ce-item-1") as HTMLElement;
    contentEditable.focus();

    expect(document.activeElement).toBe(contentEditable);
    expect(contentEditable.getAttribute("contenteditable")).toBe("true");
    expect((contentEditable.parentElement as HTMLElement).querySelector('[contenteditable="true"]')).toBe(contentEditable);

    // Ensure isContentEditable is true for the element restoreFocus will act on.
    Object.defineProperty(contentEditable, "isContentEditable", { value: true });

    const createRangeSpy = jest.spyOn(document, "createRange").mockImplementation(() => {
      throw new Error("boom");
    });

    // Ignore any warnings from the initial render (e.g., FluentUI icons).
    warnSpy.mockClear();

    // Manually set focus preservation and call restoreFocus so its setTimeout callback runs.
    (ref.current as any).focusPreservation = {
      elementId: "item-1",
      selectionStart: null,
      selectionEnd: null,
      isContentEditable: true,
      cursorPosition: 2,
    };

    (ref.current as any).restoreFocus();

    jest.runOnlyPendingTimers();

    expect(createRangeSpy).toHaveBeenCalled();

    expect(warnSpy.mock.calls.some(call => call[0] === "Failed to restore cursor position:" && call[1] instanceof Error)).toBe(true);
  });
});
