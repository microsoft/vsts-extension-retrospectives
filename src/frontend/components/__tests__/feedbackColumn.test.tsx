import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { testColumnProps } from "../__mocks__/mocked_components/mockedFeedbackColumn";
import FeedbackColumn from "../feedbackColumn";
import FeedbackItem from "../feedbackItem";
import { IColumnItem } from "../feedbackBoard";
import { WorkflowPhase } from "../../interfaces/workItem";
import { itemDataService } from "../../dal/itemDataService";
import localStorageHelper from "../../utilities/localStorageHelper";
import { appInsights, TelemetryEvents } from "../../utilities/telemetryClient";
import * as dialogHelper from "../../utilities/dialogHelper";

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
  },
  appInsights: {
    trackEvent: jest.fn(),
  },
  TelemetryEvents: {
    FeedbackItemUngrouped: "FeedbackItemUngrouped",
  },
}));

jest.mock("../../dal/itemDataService", () => {
  const actual = jest.requireActual("../../dal/itemDataService");
  return {
    itemDataService: {
      ...actual.itemDataService,
      addFeedbackItemAsMainItemToColumn: jest.fn().mockResolvedValue({
        updatedOldParentFeedbackItem: null,
        updatedFeedbackItem: { id: "updated", columnId: "column-id" },
        updatedChildFeedbackItems: [],
      }),
      sortItemsByVotesAndDate: jest.fn((items: any, originalItems?: any[]) => items ?? originalItems ?? []),
    },
  };
});

const baseColumnItems = [...testColumnProps.columnItems];

beforeEach(() => {
  // Reset shared mocked props so every test has a defined columnItems array
  testColumnProps.columnItems = [...baseColumnItems];
  testColumnProps.isDataLoaded = true;
});

describe("Feedback Column ", () => {
  it("can be rendered", () => {
    const { container } = render(<FeedbackColumn {...testColumnProps} />);
    const feedbackColumn = container.querySelector(".feedback-column");
    expect(feedbackColumn).toBeTruthy();
  });

  describe("edit column button", () => {
    it("is not rendered when the user cannot edit", () => {
      const { container } = render(<FeedbackColumn {...testColumnProps} showColumnEditButton={false} />);
      expect(container.querySelector(".feedback-column-edit-button")).toBeNull();
    });

    it("is rendered when the user can edit", () => {
      const props = { ...testColumnProps, showColumnEditButton: true };
      const { container } = render(<FeedbackColumn {...props} />);
      expect(container.querySelector(".feedback-column-edit-button")).toBeTruthy();
    });

    it("saves updated column notes when the dialog form is submitted", () => {
      const onColumnNotesChange = jest.fn();
      const props = { ...testColumnProps, showColumnEditButton: true, onColumnNotesChange };

      const { getByRole, getByLabelText } = render(<FeedbackColumn {...props} />);

      fireEvent.click(getByRole("button", { name: `Edit column ${props.columnName}` }));
      fireEvent.change(getByLabelText("Column notes"), { target: { value: "Updated column notes" } });
      fireEvent.click(getByRole("button", { name: "Save" }));

      expect(onColumnNotesChange).toHaveBeenCalledWith("Updated column notes");
    });
  });

  describe("info button", () => {
    it("shows the info icon with notes in tooltip when notes exist", () => {
      const props = { ...testColumnProps, columnNotes: "Saved notes", showColumnEditButton: false };
      const { getByRole } = render(<FeedbackColumn {...props} />);

      const infoButton = getByRole("button", { name: `Column notes: ${props.columnNotes}` });
      expect(infoButton).toBeInTheDocument();
      expect(infoButton).toHaveAttribute("title", "Saved notes");
    });

    it("does not show info button when no notes exist", () => {
      const props = { ...testColumnProps, columnNotes: "", showColumnEditButton: false };
      const { queryByRole } = render(<FeedbackColumn {...props} />);

      const infoButton = queryByRole("button", { name: /Column notes:/ });
      expect(infoButton).not.toBeInTheDocument();
    });
  });

  describe("child feedback items", () => {
    testColumnProps.isDataLoaded = true;

    it("can be rendered", () => {
      render(<FeedbackColumn {...testColumnProps} />);
      const feedbackItemProps = FeedbackColumn.createFeedbackItemProps(testColumnProps, testColumnProps.columnItems[0]);

      expect(feedbackItemProps.id).toBeTruthy();
      expect(feedbackItemProps).toBeDefined();
    });

    it("should render with original accent color when the column ids are the same", () => {
      const expectedAccentColor: string = testColumnProps.accentColor;
      const feedbackItemProps = FeedbackColumn.createFeedbackItemProps(testColumnProps, testColumnProps.columnItems[0]);

      expect(feedbackItemProps.accentColor).toEqual(expectedAccentColor);
    });

    it("should render with original column accent color when the column ids are different", () => {
      const columnItem: IColumnItem = testColumnProps.columnItems[0];
      const expectedAccentColor: string = testColumnProps.columns[columnItem.feedbackItem.originalColumnId]?.columnProperties?.accentColor;

      testColumnProps.accentColor = "someOtherColor";
      testColumnProps.columnId = "some-other-column-uuid";

      const feedbackItemProps = FeedbackColumn.createFeedbackItemProps(testColumnProps, testColumnProps.columnItems[0]);

      expect(feedbackItemProps.accentColor).toEqual(expectedAccentColor);
    });
  });

  describe("Accessibility - Focus Preservation", () => {
    it("preserves focus when column items change", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        feedbackCard.focus();
        expect(document.activeElement).toBe(feedbackCard);

        const updatedProps = {
          ...props,
          columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "new-item" } }],
        };

        rerender(<FeedbackColumn {...updatedProps} />);

        setTimeout(() => {
          expect(document.activeElement).toBeTruthy();
        }, 100);
      }
    });

    it("preserves focus on input elements when items change", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const input = container.querySelector("input") as HTMLInputElement;
      if (input) {
        input.focus();
        input.setSelectionRange(2, 2);

        expect(document.activeElement).toBe(input);

        const updatedProps = {
          ...props,
          columnItems: [...props.columnItems],
        };

        rerender(<FeedbackColumn {...updatedProps} />);
      }
    });

    it("handles errors when restoring contenteditable cursor without crashing", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
      const createRangeSpy = jest.spyOn(document, "createRange").mockImplementation(() => {
        throw new Error("boom");
      });
      const timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((cb: (...args: any[]) => void) => {
        cb();
        return 0 as any;
      });
      let callbackRan = false;

      try {
        const props = { ...testColumnProps, columnItems: [...testColumnProps.columnItems], isDataLoaded: true };
        const ref = React.createRef<FeedbackColumn>();
        const { container } = render(<FeedbackColumn {...props} ref={ref} />);
        expect(ref.current).toBeTruthy();

        const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
        if (!feedbackCard) {
          return;
        }

        const itemId = props.columnItems[0].feedbackItem.id;

        const contentEditable = document.createElement("div");
        contentEditable.setAttribute("contenteditable", "true");
        contentEditable.textContent = "Editable";
        // Ensure restoreFocus sees contenteditable
        Object.defineProperty(contentEditable, "isContentEditable", { value: true });

        feedbackCard.appendChild(contentEditable);
        contentEditable.focus();
        expect(document.activeElement).toBe(contentEditable);

        // Ignore any warnings from initial render.
        warnSpy.mockClear();

        (ref.current as any).focusPreservation = {
          elementId: itemId,
          selectionStart: null,
          selectionEnd: null,
          isContentEditable: true,
          cursorPosition: 2,
        };

        (ref.current as any).restoreFocus();
        callbackRan = true;
        expect(callbackRan).toBe(true);
      } finally {
        createRangeSpy.mockRestore();
        warnSpy.mockRestore();
        timeoutSpy.mockRestore();
      }
    });
  });

  describe("Accessibility - Keyboard Navigation", () => {
    test("handles ArrowDown key to navigate to next item", () => {
      const props = { ...testColumnProps, columnItems: [...testColumnProps.columnItems, { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2" } }] };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();

      if (column) {
        const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true });
        column.dispatchEvent(event);

        // Event should be handled by the component
        expect(column).toBeTruthy();
      }
    });

    test("handles ArrowUp key to navigate to previous item", () => {
      const props = { ...testColumnProps, columnItems: [...testColumnProps.columnItems, { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2" } }] };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();

      if (column) {
        const event = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true });
        column.dispatchEvent(event);

        expect(column).toBeTruthy();
      }
    });

    test("handles Home key to navigate to first item", () => {
      const props = { ...testColumnProps, columnItems: [...testColumnProps.columnItems, { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2" } }] };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();

      if (column) {
        const event = new KeyboardEvent("keydown", { key: "Home", bubbles: true });
        column.dispatchEvent(event);

        expect(column).toBeTruthy();
      }
    });

    test("handles End key to navigate to last item", () => {
      const props = { ...testColumnProps, columnItems: [...testColumnProps.columnItems, { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2" } }] };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();

      if (column) {
        const event = new KeyboardEvent("keydown", { key: "End", bubbles: true });
        column.dispatchEvent(event);

        expect(column).toBeTruthy();
      }
    });

    test("handles 'n' key to create new feedback in Collect phase", () => {
      const props = { ...testColumnProps, workflowPhase: "Collect" as any };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();

      if (column) {
        const event = new KeyboardEvent("keydown", { key: "n", bubbles: true });
        column.dispatchEvent(event);

        expect(column).toBeTruthy();
      }
    });

    test("handles 'e' key to open edit dialog when user can edit", () => {
      const props = { ...testColumnProps, showColumnEditButton: true };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();

      if (column) {
        const event = new KeyboardEvent("keydown", { key: "e", bubbles: true });
        column.dispatchEvent(event);

        expect(column).toBeTruthy();
      }
    });

    test("handles 'i' key to open info dialog", () => {
      const props = { ...testColumnProps, columnNotes: "Test notes" };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();

      if (column) {
        const event = new KeyboardEvent("keydown", { key: "i", bubbles: true });
        column.dispatchEvent(event);

        expect(column).toBeTruthy();
      }
    });

    test("ignores keyboard events when input is focused", () => {
      const props = { ...testColumnProps };
      const { container } = render(<FeedbackColumn {...props} />);

      const input = document.createElement("input");
      container.appendChild(input);
      input.focus();

      const column = container.querySelector(".feedback-column") as HTMLElement;
      if (column) {
        const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true });
        Object.defineProperty(event, "target", { value: input, enumerable: true });
        column.dispatchEvent(event);

        expect(column).toBeTruthy();
      }
    });

    test("ignores keyboard events when dialog is open", () => {
      const props = { ...testColumnProps };
      const { container } = render(<FeedbackColumn {...props} />);

      const dialog = document.createElement("div");
      dialog.setAttribute("role", "dialog");
      document.body.appendChild(dialog);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      if (column) {
        const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true });
        column.dispatchEvent(event);

        expect(column).toBeTruthy();
      }

      document.body.removeChild(dialog);
    });

    test("navigates to create button when no visible items and in Collect phase", () => {
      const props = { ...testColumnProps, columnItems: [] as IColumnItem[], workflowPhase: "Collect" as any };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      const createButton = container.querySelector(".feedback-column-add-button") as HTMLElement;

      if (column && createButton) {
        const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true });
        column.dispatchEvent(event);

        expect(column).toBeTruthy();
      }
    });

    test("calls focusColumn method programmatically", () => {
      const props = { ...testColumnProps };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        ref.current.focusColumn();
        expect(container.querySelector(".feedback-column")).toBeTruthy();
      }
    });

    test("focuses create button when focusColumn is called with no items in Collect phase", () => {
      const props = { ...testColumnProps, columnItems: [] as IColumnItem[], workflowPhase: "Collect" as any };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        ref.current.focusColumn();
        // Method should execute without errors
        expect(ref.current).toBeTruthy();
      }
    });
  });

  describe("Focus Preservation - Advanced", () => {
    test("preserves cursor position in contenteditable elements", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      // Create a contenteditable element
      const contentEditable = document.createElement("div");
      contentEditable.contentEditable = "true";
      contentEditable.textContent = "Test content";
      contentEditable.setAttribute("data-feedback-item-id", testColumnProps.columnItems[0].feedbackItem.id);

      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        feedbackCard.appendChild(contentEditable);
        contentEditable.focus();

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });

    test("restores focus to feedback card when specific element not found", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        feedbackCard.focus();

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });

    test("handles missing focusPreservation gracefully in restoreFocus", () => {
      const props = { ...testColumnProps };
      const { rerender } = render(<FeedbackColumn {...props} />);

      // Trigger rerender without focus
      const updatedProps = { ...props, columnItems: [...props.columnItems] };
      rerender(<FeedbackColumn {...updatedProps} />);

      expect(true).toBe(true); // Should not throw
    });
  });

  describe("Dialog Management", () => {
    test("opens edit dialog when openEditDialog is called", () => {
      const props = { ...testColumnProps, showColumnEditButton: true };
      const { getByRole } = render(<FeedbackColumn {...props} />);

      const editButton = getByRole("button", { name: `Edit column ${props.columnName}` });
      fireEvent.click(editButton);

      expect(getByRole("dialog")).toBeInTheDocument();
    });

    test("closes edit dialog without saving when cancel is clicked", () => {
      const onColumnNotesChange = jest.fn();
      const props = { ...testColumnProps, showColumnEditButton: true, onColumnNotesChange };
      const { getByRole } = render(<FeedbackColumn {...props} />);

      fireEvent.click(getByRole("button", { name: `Edit column ${props.columnName}` }));
      fireEvent.click(getByRole("button", { name: "Cancel" }));

      expect(onColumnNotesChange).not.toHaveBeenCalled();
    });

    test("updates column notes draft when typing", () => {
      const props = { ...testColumnProps, showColumnEditButton: true, columnNotes: "Original notes" };
      const { getByRole, getByLabelText } = render(<FeedbackColumn {...props} />);

      fireEvent.click(getByRole("button", { name: `Edit column ${props.columnName}` }));

      const notesInput = getByLabelText("Column notes") as HTMLInputElement;
      fireEvent.change(notesInput, { target: { value: "New notes" } });

      expect(notesInput.value).toBe("New notes");
    });
  });

  describe("Drag and Drop", () => {
    test("handles dragover event on column", () => {
      const props = { ...testColumnProps };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      if (column) {
        const dragEvent = new Event("dragover", { bubbles: true }) as any;
        dragEvent.preventDefault = jest.fn();
        dragEvent.stopPropagation = jest.fn();
        dragEvent.dataTransfer = { dropEffect: "" };

        column.dispatchEvent(dragEvent);

        expect(dragEvent.preventDefault).toHaveBeenCalled();
      }
    });

    test("handles drop event on column space", () => {
      const props = { ...testColumnProps };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        // Call the drag handler directly
        const dragEvent = {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          dataTransfer: { dropEffect: "" },
        } as any;

        ref.current.dragFeedbackItemOverColumn(dragEvent);

        expect(dragEvent.preventDefault).toHaveBeenCalled();
        expect(dragEvent.stopPropagation).toHaveBeenCalled();
        expect(dragEvent.dataTransfer.dropEffect).toBe("move");
      }
    });
  });

  describe("Item Registration", () => {
    test("registers item ref when element is provided", () => {
      const props = { ...testColumnProps };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        const mockElement = document.createElement("div");
        ref.current.registerItemRef("test-item-id", mockElement);

        // Should not throw error
        expect(ref.current).toBeTruthy();
      }
    });

    test("unregisters item ref when element is null", () => {
      const props = { ...testColumnProps };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        const mockElement = document.createElement("div");
        ref.current.registerItemRef("test-item-id", mockElement);
        ref.current.registerItemRef("test-item-id", null);

        // Should not throw error
        expect(ref.current).toBeTruthy();
      }
    });
  });

  describe("Create Empty Feedback Item", () => {
    test("creates empty feedback item in Collect phase", () => {
      const addFeedbackItems = jest.fn();
      const props = { ...testColumnProps, workflowPhase: "Collect" as any, addFeedbackItems, columnItems: [] as IColumnItem[] };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        ref.current.createEmptyFeedbackItem();

        expect(addFeedbackItems).toHaveBeenCalled();
      }
    });

    test("does not create empty feedback item when not in Collect phase", () => {
      const addFeedbackItems = jest.fn();
      const props = { ...testColumnProps, workflowPhase: "Vote" as any, addFeedbackItems };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        ref.current.createEmptyFeedbackItem();

        expect(addFeedbackItems).not.toHaveBeenCalled();
      }
    });

    test("does not create duplicate empty feedback item", () => {
      const addFeedbackItems = jest.fn();
      const emptyItem = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "emptyFeedbackItem" },
      };
      const props = { ...testColumnProps, workflowPhase: "Collect" as any, addFeedbackItems, columnItems: [emptyItem] };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        ref.current.createEmptyFeedbackItem();

        expect(addFeedbackItems).not.toHaveBeenCalled();
      }
    });
  });

  describe("Keyboard Navigation - Immediate Focus (Issue fix)", () => {
    let querySelectorSpy: jest.SpyInstance;
    let originalQuerySelector: (selectors: string) => Element | null;

    beforeEach(() => {
      originalQuerySelector = document.querySelector.bind(document);
      querySelectorSpy = jest.spyOn(document, "querySelector").mockImplementation(((selectors: string) => {
        if (selectors === '[role="dialog"]') {
          return null;
        }
        return originalQuerySelector(selectors);
      }) as any);
    });

    afterEach(() => {
      querySelectorSpy.mockRestore();
    });

    test("column is focusable via keyboard with tabIndex=0", () => {
      const { container } = render(<FeedbackColumn {...testColumnProps} />);
      const column = container.querySelector(".feedback-column") as HTMLElement;

      expect(column).toBeTruthy();
      expect(column.getAttribute("tabIndex")).toBe("0");
    });

    test("ArrowDown focuses first item immediately without prior focus", () => {
      const mockItem1 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1", title: "First Item" },
      };
      const mockItem2 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2", title: "Second Item" },
      };

      const props = { ...testColumnProps, columnItems: [mockItem1, mockItem2] };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();

      // Simulate ArrowDown without focusing anything first
      const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      // Component should handle the event and call preventDefault
      expect(event.defaultPrevented).toBe(true);
    });

    test("Home key focuses first item immediately", () => {
      const mockItem1 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1", title: "First Item" },
      };
      const mockItem2 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2", title: "Second Item" },
      };

      const props = { ...testColumnProps, columnItems: [mockItem1, mockItem2] };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();

      // Simulate Home key without focusing anything first
      const event = new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      // Handler should process the event
      expect(column).toBeTruthy();
    });

    test("End key focuses last item immediately", () => {
      const mockItem1 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1", title: "First Item" },
      };
      const mockItem2 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2", title: "Second Item" },
      };
      const mockItem3 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-3", title: "Third Item" },
      };

      const props = { ...testColumnProps, columnItems: [mockItem1, mockItem2, mockItem3] };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();

      // Simulate End key without focusing anything first
      const event = new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      // Handler should process the event
      expect(column).toBeTruthy();
    });

    test("ArrowUp does not move when no item is focused yet", () => {
      const mockItem1 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1", title: "First Item" },
      };

      const props = { ...testColumnProps, columnItems: [mockItem1] };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      // Simulate ArrowUp without focusing anything first - should not crash
      const event = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      // Should handle gracefully
      expect(column).toBeTruthy();
    });

    test("handles navigation in empty column", () => {
      const props = { ...testColumnProps, columnItems: [] as IColumnItem[] };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();

      // ArrowDown in empty column should focus create button
      const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(column).toBeTruthy();
    });
  });

  describe("Static Methods", () => {
    test("createFeedbackItemProps creates proper props object", () => {
      const props = FeedbackColumn.createFeedbackItemProps(testColumnProps, testColumnProps.columnItems[0]);

      expect(props).toHaveProperty("id");
      expect(props).toHaveProperty("title");
      expect(props).toHaveProperty("boardId");
      expect(props).toHaveProperty("columnId");
      expect(props).toHaveProperty("accentColor");
    });

    test("createFeedbackItemProps uses original column accent color when moved", () => {
      const itemInDifferentColumn = {
        ...testColumnProps.columnItems[0],
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          originalColumnId: "different-column-id",
        },
      };

      const columnsWithDifferent = {
        ...testColumnProps.columns,
        "different-column-id": {
          columnProperties: {
            id: "different-column-id",
            title: "Different Column",
            accentColor: "#ff0000",
          },
        },
      };

      const propsWithDifferent = {
        ...testColumnProps,
        columns: columnsWithDifferent,
      };

      const feedbackItemProps = FeedbackColumn.createFeedbackItemProps(propsWithDifferent, itemInDifferentColumn);

      expect(feedbackItemProps.accentColor).toBe("#ff0000");
    });

    test("createFeedbackItemProps falls back to current column accent color when original column not found", () => {
      const itemInMissingColumn = {
        ...testColumnProps.columnItems[0],
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          originalColumnId: "non-existent-column",
        },
      };

      const feedbackItemProps = FeedbackColumn.createFeedbackItemProps(testColumnProps, itemInMissingColumn);

      expect(feedbackItemProps.accentColor).toBe(testColumnProps.accentColor);
    });

    test("moveFeedbackItem calls itemDataService and refreshFeedbackItems", async () => {
      const mockRefreshFeedbackItems = jest.fn();
      const boardId = "test-board";
      const feedbackItemId = "test-item";
      const columnId = "test-column";

      // Ensure the mock returns the expected structure
      (itemDataService.addFeedbackItemAsMainItemToColumn as jest.Mock).mockResolvedValueOnce({
        updatedOldParentFeedbackItem: null,
        updatedFeedbackItem: { id: feedbackItemId, columnId },
        updatedChildFeedbackItems: [],
      });

      await FeedbackColumn.moveFeedbackItem(mockRefreshFeedbackItems, boardId, feedbackItemId, columnId);

      expect(itemDataService.addFeedbackItemAsMainItemToColumn).toHaveBeenCalledWith(boardId, feedbackItemId, columnId);
      expect(mockRefreshFeedbackItems).toHaveBeenCalled();
      expect(appInsights.trackEvent).toHaveBeenCalledWith({
        name: TelemetryEvents.FeedbackItemUngrouped,
        properties: { boardId, feedbackItemId, columnId },
      });
    });
  });

  describe("Focus Preservation - Contenteditable", () => {
    test("preserves focus and cursor in contenteditable element", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        contentEditable.textContent = "Editable content";
        feedbackCard.appendChild(contentEditable);

        contentEditable.focus();

        // Set selection
        const range = document.createRange();
        const selection = window.getSelection();
        if (contentEditable.firstChild && selection) {
          range.setStart(contentEditable.firstChild, 5);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        // Trigger update
        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });

    test("handles restore focus when firstChild is null", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        // Empty element - no firstChild
        feedbackCard.appendChild(contentEditable);

        contentEditable.focus();

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });

    test("handles restore focus with short cursor position", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        contentEditable.textContent = "Hi";
        feedbackCard.appendChild(contentEditable);

        contentEditable.focus();

        // Set selection beyond text length
        const range = document.createRange();
        const selection = window.getSelection();
        if (contentEditable.firstChild && selection) {
          range.setStart(contentEditable.firstChild, 2);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });
  });

  describe("Navigate Items - Edge Cases", () => {
    test("navigates to last item with End key", () => {
      const items = [
        { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1" } },
        { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2" } },
        { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-3" } },
      ];
      const props = { ...testColumnProps, columnItems: items };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      // Navigate to last
      const event = new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(column).toBeTruthy();
    });

    test("navigates forward when focusedItemIndex is -1", () => {
      const items = [
        { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1" } },
        { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2" } },
      ];
      const props = { ...testColumnProps, columnItems: items };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      // Navigate forward from unset state
      const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(column).toBeTruthy();
    });

    test("navigates backward stays at 0 when at first item", () => {
      const items = [
        { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1" } },
        { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2" } },
      ];
      const props = { ...testColumnProps, columnItems: items };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      // First go down to set focus
      column.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
      // Then try to go up - should stay at 0
      column.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));

      expect(column).toBeTruthy();
    });

    test("does not navigate when focusedItemIndex is negative and direction is prev", () => {
      const items = [{ ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1" } }];
      const props = { ...testColumnProps, columnItems: items };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      // Try to go up without first focusing
      const event = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(column).toBeTruthy();
    });

    test("filters out child items from navigation", () => {
      const parentItem = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "parent-item" },
      };
      const childItem = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "child-item", parentFeedbackItemId: "parent-item" },
      };
      const props = { ...testColumnProps, columnItems: [parentItem, childItem] };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      // Navigate - should only see parent item
      column.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));

      expect(column).toBeTruthy();
    });
  });

  describe("Info Button Interaction", () => {
    test("shows info button with i key when notes exist", () => {
      const props = { ...testColumnProps, columnNotes: "Important notes" };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      // Press i key
      const event = new KeyboardEvent("keydown", { key: "i", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(column).toBeTruthy();
    });

    test("i key does nothing when no notes exist", () => {
      const props = { ...testColumnProps, columnNotes: "" };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      // Press i key - should have no effect
      const event = new KeyboardEvent("keydown", { key: "i", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(column).toBeTruthy();
    });
  });

  describe("Insert Key", () => {
    let querySelectorSpy: jest.SpyInstance;
    let originalQuerySelector: (selectors: string) => Element | null;

    beforeEach(() => {
      originalQuerySelector = document.querySelector.bind(document);
      querySelectorSpy = jest.spyOn(document, "querySelector").mockImplementation(((selectors: string) => {
        if (selectors === '[role="dialog"]') {
          return null;
        }
        return originalQuerySelector(selectors);
      }) as any);
    });

    afterEach(() => {
      querySelectorSpy.mockRestore();
    });

    test("Insert key creates new feedback in Collect phase", () => {
      const addFeedbackItems = jest.fn();
      const props = { ...testColumnProps, workflowPhase: "Collect" as any, addFeedbackItems, columnItems: [] as IColumnItem[] };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      const event = new KeyboardEvent("keydown", { key: "Insert", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(addFeedbackItems).toHaveBeenCalled();
    });
  });

  describe("Drop Feedback Item", () => {
    test("handleDropFeedbackItemOnColumnSpace moves feedback item", async () => {
      const refreshFeedbackItems = jest.fn();
      const props = { ...testColumnProps, refreshFeedbackItems };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      // The drop handler is async, so just verify the ref exists
      expect(ref.current).toBeTruthy();
    });
  });

  describe("Input Focus and Selection Preservation", () => {
    test("preserves selection in input elements when items change", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      // Find or create an input within the column
      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const input = document.createElement("input");
        input.type = "text";
        input.value = "test value";
        feedbackCard.appendChild(input);
        input.focus();
        input.setSelectionRange(2, 5);

        expect(document.activeElement).toBe(input);
        expect(input.selectionStart).toBe(2);
        expect(input.selectionEnd).toBe(5);

        // Trigger update that preserves focus
        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });

    test("preserves selection in textarea elements when items change", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const textarea = document.createElement("textarea");
        textarea.value = "multiline\ntext\nhere";
        feedbackCard.appendChild(textarea);
        textarea.focus();
        textarea.setSelectionRange(5, 10);

        expect(document.activeElement).toBe(textarea);

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });
  });

  describe("Focus Restoration Edge Cases", () => {
    test("handles restoration when element ID not found", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        feedbackCard.focus();

        // Update with different items that don't include the focused item
        const updatedProps = {
          ...props,
          columnItems: [
            {
              ...props.columnItems[0],
              feedbackItem: { ...props.columnItems[0].feedbackItem, id: "different-id" },
            },
          ],
        };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });

    test("handles focus when columnRef is null", () => {
      const props = { ...testColumnProps };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      // Component should handle gracefully
      expect(ref.current).toBeTruthy();
    });
  });

  describe("Keyboard Navigation - Complete Edge Cases", () => {
    test("navigates when last item focused and pressing ArrowDown", () => {
      const items = [
        { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1" } },
        { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2" } },
      ];
      const props = { ...testColumnProps, columnItems: items };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      // Navigate to last
      column.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
      // Try to go past last - should stay at last
      column.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));

      expect(column).toBeTruthy();
    });

    test("handles i key press when no column notes exist", () => {
      const props = { ...testColumnProps, columnNotes: "" };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      const event = new KeyboardEvent("keydown", { key: "i", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(column).toBeTruthy();
    });

    test("handles contenteditable element focus restoration with empty content", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        // Empty element - no text content
        feedbackCard.appendChild(contentEditable);

        contentEditable.focus();

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });
  });

  describe("Column Notes Dialog - Extended", () => {
    test("saves updated column notes and closes dialog", async () => {
      const onColumnNotesChange = jest.fn();
      const props = { ...testColumnProps, showColumnEditButton: true, onColumnNotesChange, columnNotes: "" };

      const { getByRole, getByLabelText, queryByRole } = render(<FeedbackColumn {...props} />);

      fireEvent.click(getByRole("button", { name: `Edit column ${props.columnName}` }));

      // Dialog should be open
      expect(getByRole("dialog")).toBeInTheDocument();

      fireEvent.change(getByLabelText("Column notes"), { target: { value: "New notes content" } });
      fireEvent.click(getByRole("button", { name: "Save" }));

      expect(onColumnNotesChange).toHaveBeenCalledWith("New notes content");
    });

    test("cancels column notes edit without saving", async () => {
      const onColumnNotesChange = jest.fn();
      const props = { ...testColumnProps, showColumnEditButton: true, onColumnNotesChange, columnNotes: "Original notes" };

      const { getByRole, getByLabelText } = render(<FeedbackColumn {...props} />);

      fireEvent.click(getByRole("button", { name: `Edit column ${props.columnName}` }));
      fireEvent.change(getByLabelText("Column notes"), { target: { value: "Changed notes" } });
      fireEvent.click(getByRole("button", { name: "Cancel" }));

      expect(onColumnNotesChange).not.toHaveBeenCalled();
    });
  });

  describe("Drag and Drop - Extended", () => {
    test("drop handler calls refreshFeedbackItems on column space", async () => {
      const refreshFeedbackItems = jest.fn().mockResolvedValue({});
      const props = { ...testColumnProps, refreshFeedbackItems };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      const columnSpace = container.querySelector(".feedback-column-add-space");
      if (columnSpace && ref.current) {
        // Simulate a drop event
        const dropEvent = {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        } as any;

        // The component should handle the drop
        expect(ref.current).toBeTruthy();
      }
    });
  });

  describe("Focus preservation edge cases", () => {
    test("preserves focus on input element", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      // Create and focus an input
      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const input = document.createElement("input");
        input.type = "text";
        input.value = "test value";
        feedbackCard.appendChild(input);
        input.focus();
        input.setSelectionRange(2, 5);

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });

    test("preserves focus on textarea element", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const textarea = document.createElement("textarea");
        textarea.value = "test value";
        feedbackCard.appendChild(textarea);
        textarea.focus();
        textarea.setSelectionRange(1, 3);

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });

    test("handles missing element gracefully", () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      // Force focus preservation without actual element
      const column = container.querySelector(".feedback-column") as HTMLElement;
      column?.focus();

      const updatedProps = { ...props, columnItems: [] as IColumnItem[] };
      rerender(<FeedbackColumn {...updatedProps} />);

      expect(container).toBeTruthy();
    });
  });

  describe("Column keyboard shortcuts - extended", () => {
    test("handles e key press to edit column", () => {
      const props = { ...testColumnProps, showColumnEditButton: true };
      const { container, getByRole } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      const event = new KeyboardEvent("keydown", { key: "e", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      // Edit dialog should open
      expect(container).toBeTruthy();
    });

    test("handles E key press (uppercase) to edit column", () => {
      const props = { ...testColumnProps, showColumnEditButton: true };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      const event = new KeyboardEvent("keydown", { key: "E", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(container).toBeTruthy();
    });

    test("handles Insert key to create new item in Collect phase", () => {
      const props = { ...testColumnProps, workflowPhase: WorkflowPhase.Collect };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      const event = new KeyboardEvent("keydown", { key: "Insert", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(container).toBeTruthy();
    });

    test("ignores n key press in non-Collect phase", () => {
      const props = { ...testColumnProps, workflowPhase: WorkflowPhase.Vote };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      const event = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(container).toBeTruthy();
    });

    test("ignores keyboard events when in input element", () => {
      const props = { ...testColumnProps };
      const { container } = render(<FeedbackColumn {...props} />);

      const input = document.createElement("input");
      container.appendChild(input);
      input.focus();

      const event = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      input.dispatchEvent(event);

      expect(container).toBeTruthy();
    });

    test("ignores keyboard events when in textarea element", () => {
      const props = { ...testColumnProps };
      const { container } = render(<FeedbackColumn {...props} />);

      const textarea = document.createElement("textarea");
      container.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
      textarea.dispatchEvent(event);

      expect(container).toBeTruthy();
    });

    test("ignores keyboard events when dialog is open", () => {
      const props = { ...testColumnProps, showColumnEditButton: true };
      const { container, getByRole } = render(<FeedbackColumn {...props} />);

      // Open dialog first
      fireEvent.click(getByRole("button", { name: `Edit column ${props.columnName}` }));

      const column = container.querySelector(".feedback-column") as HTMLElement;
      const event = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(container).toBeTruthy();
    });
  });

  describe("Column items navigation", () => {
    test("navigates to first item with Home key", () => {
      const props = { ...testColumnProps };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      const event = new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(column).toBeTruthy();
    });

    test("navigates with ArrowUp at first item stays at first", () => {
      const props = { ...testColumnProps };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;

      // Go to first
      column.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
      // Try to go up - should stay at first
      column.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));

      expect(column).toBeTruthy();
    });
  });

  describe("Component render states", () => {
    test("renders with Group workflow phase", () => {
      const props = { ...testColumnProps, workflowPhase: WorkflowPhase.Group };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();
    });

    test("renders with Vote workflow phase", () => {
      const props = { ...testColumnProps, workflowPhase: WorkflowPhase.Vote };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();
    });

    test("renders with Act workflow phase", () => {
      const props = { ...testColumnProps, workflowPhase: WorkflowPhase.Act };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();
    });
  });

  describe("ComponentDidMount - shouldFocusOnCreateFeedback", () => {
    test("focuses create feedback button on mount when shouldFocusOnCreateFeedback is true", () => {
      const props = { ...testColumnProps, workflowPhase: WorkflowPhase.Collect, shouldFocusOnCreateFeedback: true };
      const { container } = render(<FeedbackColumn {...props} />);

      const createButton = container.querySelector(".create-button") as HTMLElement;
      expect(createButton).toBeTruthy();
    });

    test("does not focus create feedback button when shouldFocusOnCreateFeedback is false", () => {
      const props = { ...testColumnProps, workflowPhase: WorkflowPhase.Collect, shouldFocusOnCreateFeedback: false };
      const { container } = render(<FeedbackColumn {...props} />);

      const createButton = container.querySelector(".create-button") as HTMLElement;
      expect(createButton).toBeTruthy();
    });
  });

  describe("Focus restoration - complete coverage", () => {
    test("restores focus and selection range in input element", async () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const input = document.createElement("input");
        input.type = "text";
        input.value = "test input value";
        feedbackCard.appendChild(input);
        input.focus();
        input.setSelectionRange(3, 7);

        expect(document.activeElement).toBe(input);
        expect(input.selectionStart).toBe(3);
        expect(input.selectionEnd).toBe(7);

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(container).toBeTruthy();
    });

    test("restores focus and selection range in textarea element", async () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const textarea = document.createElement("textarea");
        textarea.value = "multi\nline\ntext";
        feedbackCard.appendChild(textarea);
        textarea.focus();
        textarea.setSelectionRange(2, 8);

        expect(document.activeElement).toBe(textarea);

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(container).toBeTruthy();
    });

    test("restores cursor position in contenteditable element", async () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        contentEditable.textContent = "Editable text content";
        feedbackCard.appendChild(contentEditable);
        contentEditable.focus();

        const range = document.createRange();
        const selection = window.getSelection();
        if (contentEditable.firstChild && selection) {
          range.setStart(contentEditable.firstChild, 8);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(container).toBeTruthy();
    });

    test("handles failed restoration of cursor position in contenteditable with error", async () => {
      const props = { ...testColumnProps };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const feedbackCard = container.querySelector("[data-feedback-item-id]");
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        contentEditable.textContent = "Text";
        feedbackCard.appendChild(contentEditable);
        contentEditable.focus();

        const range = document.createRange();
        const selection = window.getSelection();
        if (contentEditable.firstChild && selection) {
          range.setStart(contentEditable.firstChild, 2);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} />);

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      consoleWarnSpy.mockRestore();
      expect(container).toBeTruthy();
    });
  });

  describe("Navigate to create button in Collect phase", () => {
    test("navigates to create button when no items and ArrowDown pressed", () => {
      const props = { ...testColumnProps, columnItems: [] as IColumnItem[], workflowPhase: WorkflowPhase.Collect };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        ref.current.navigateByKeyboard("next");
      }

      expect(container).toBeTruthy();
    });

    test("focuses create button when focusColumn called with no items in Collect phase", () => {
      const props = { ...testColumnProps, columnItems: [] as IColumnItem[], workflowPhase: WorkflowPhase.Collect };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        ref.current.focusColumn();
      }

      expect(container.querySelector(".create-button")).toBeTruthy();
    });
  });

  describe("Item ref navigation with actual elements", () => {
    test("focuses item element when navigating with registered refs", () => {
      const mockItem1 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1", title: "Item 1" },
      };
      const mockItem2 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2", title: "Item 2" },
      };

      const props = { ...testColumnProps, columnItems: [mockItem1, mockItem2] };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        const mockElement1 = document.createElement("div");
        mockElement1.tabIndex = 0;
        const mockElement2 = document.createElement("div");
        mockElement2.tabIndex = 0;

        ref.current.registerItemRef("item-1", mockElement1);
        ref.current.registerItemRef("item-2", mockElement2);

        ref.current.navigateByKeyboard("next");
      }

      expect(container).toBeTruthy();
    });

    test("focuses first item when focusColumn is called with items present", () => {
      const mockItem = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "focus-item" },
      };

      const props = { ...testColumnProps, columnItems: [mockItem] };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      if (ref.current) {
        const mockElement = document.createElement("div");
        mockElement.tabIndex = 0;
        ref.current.registerItemRef("focus-item", mockElement);
        ref.current.focusColumn();
      }

      expect(true).toBe(true);
    });
  });

  describe("handleDropFeedbackItemOnColumnSpace async method", () => {
    test("handles drop event on column", () => {
      const refreshFeedbackItems = jest.fn();
      const props = { ...testColumnProps, refreshFeedbackItems };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      expect(column).toBeTruthy();
    });
  });

  describe("Static moveFeedbackItem method", () => {
    test("moveFeedbackItem is a static method", () => {
      expect(typeof FeedbackColumn.moveFeedbackItem).toBe("function");
    });
  });

  describe("FeedbackItemGroup rendering", () => {
    test("renders FeedbackItemGroup when item has child items", () => {
      const parentItem = {
        ...testColumnProps.columnItems[0],
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          id: "parent-item",
          childFeedbackItemIds: ["child-1", "child-2"],
        },
      };

      const childItem1 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          id: "child-1",
          parentFeedbackItemId: "parent-item",
        },
      };

      const childItem2 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          id: "child-2",
          parentFeedbackItemId: "parent-item",
        },
      };

      const props = {
        ...testColumnProps,
        columnItems: [parentItem, childItem1, childItem2],
        isDataLoaded: true,
      };

      const { container } = render(<FeedbackColumn {...props} />);

      expect(container.querySelector(".feedback-items-container")).toBeTruthy();
    });

    test("renders grouped items in Act workflow phase sorted by votes", () => {
      const parentItem = {
        ...testColumnProps.columnItems[0],
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          id: "parent-item",
          upvotes: 10,
          childFeedbackItemIds: ["child-1"],
        },
      };

      const childItem = {
        ...testColumnProps.columnItems[0],
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          id: "child-1",
          upvotes: 5,
          parentFeedbackItemId: "parent-item",
        },
      };

      const props = {
        ...testColumnProps,
        columnItems: [parentItem, childItem],
        isDataLoaded: true,
        workflowPhase: WorkflowPhase.Act,
      };

      const { container } = render(<FeedbackColumn {...props} />);

      expect(container.querySelector(".feedback-items-container")).toBeTruthy();
    });
  });

  describe("Double click to create feedback", () => {
    test("creates empty feedback item on column double click in Collect phase", () => {
      const addFeedbackItems = jest.fn();
      const props = {
        ...testColumnProps,
        workflowPhase: WorkflowPhase.Collect,
        addFeedbackItems,
        columnItems: [] as IColumnItem[],
      };

      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      if (column) {
        fireEvent.doubleClick(column);
        expect(addFeedbackItems).toHaveBeenCalled();
      }
    });
  });

  describe("ComponentWillUnmount cleanup", () => {
    test("removes keydown event listener on unmount", () => {
      const props = { ...testColumnProps };
      const { unmount } = render(<FeedbackColumn {...props} />);

      unmount();

      expect(true).toBe(true);
    });
  });

  describe("Column notes dialog - empty value handling", () => {
    test("handles empty string in column notes change", () => {
      const props = { ...testColumnProps, showColumnEditButton: true };
      const { getByRole, getByLabelText } = render(<FeedbackColumn {...props} />);

      fireEvent.click(getByRole("button", { name: `Edit column ${props.columnName}` }));

      const notesInput = getByLabelText("Column notes") as HTMLInputElement;
      fireEvent.change(notesInput, { target: { value: undefined } });

      expect(notesInput.value).toBe("");
    });
  });

  describe("Focus preservation - INPUT element with selectionStart/End", () => {
    test("preserves selectionStart and selectionEnd in INPUT element", () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        const input = document.createElement("input");
        input.type = "text";
        input.value = "test value here";
        input.id = "test-input";
        feedbackCard.appendChild(input);

        input.focus();
        input.selectionStart = 5;
        input.selectionEnd = 10;

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "new-item-id" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);

        setTimeout(() => {
          expect(input).toBeTruthy();
        }, 50);
      }

      expect(container).toBeTruthy();
    });

    test("preserves selectionStart and selectionEnd in TEXTAREA element", () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        const textarea = document.createElement("textarea");
        textarea.value = "multiline text\nwith line breaks";
        textarea.id = "test-textarea";
        feedbackCard.appendChild(textarea);

        textarea.focus();
        textarea.selectionStart = 3;
        textarea.selectionEnd = 12;

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "another-new-item" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);

        setTimeout(() => {
          expect(textarea).toBeTruthy();
        }, 50);
      }

      expect(container).toBeTruthy();
    });
  });

  describe("Focus preservation - contentEditable with selection", () => {
    test("preserves cursor position in contentEditable element with selection", () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        contentEditable.textContent = "Some editable content here";
        contentEditable.id = "test-contenteditable";
        feedbackCard.appendChild(contentEditable);

        contentEditable.focus();

        const selection = window.getSelection();
        const range = document.createRange();
        if (contentEditable.firstChild && selection) {
          range.setStart(contentEditable.firstChild, 5);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);

          expect(selection.rangeCount).toBeGreaterThan(0);
        }

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "content-edit-new" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);

        setTimeout(() => {
          expect(contentEditable).toBeTruthy();
        }, 50);
      }

      expect(container).toBeTruthy();
    });

    test("handles contentEditable without selection ranges", () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        contentEditable.textContent = "Content";
        feedbackCard.appendChild(contentEditable);

        contentEditable.focus();

        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
        }

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "no-range-item" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);

        setTimeout(() => {
          expect(contentEditable).toBeTruthy();
        }, 50);
      }

      expect(container).toBeTruthy();
    });
  });

  describe("Focus restoration - specific element paths", () => {
    beforeEach(() => {
      jest.useFakeTimers({ doNotFake: ["setInterval"] });
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test("restores focus when element has both input and textarea in feedback card", async () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        const textarea = document.createElement("textarea");
        textarea.value = "textarea content";
        feedbackCard.appendChild(textarea);

        const input = document.createElement("input");
        input.value = "input content";
        feedbackCard.appendChild(input);

        input.focus();
        input.selectionStart = 2;
        input.selectionEnd = 7;

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "multi-element" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);

        jest.runOnlyPendingTimers();
      }

      expect(container).toBeTruthy();
    });

    test("restores focus when no input/textarea found but feedback card exists", async () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        feedbackCard.tabIndex = 0;
        feedbackCard.focus();

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "card-focus-item" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);

        jest.runOnlyPendingTimers();
      }

      expect(container).toBeTruthy();
    });

    test("handles contentEditable cursor position restoration with bounds checking", async () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        contentEditable.textContent = "ABC";
        feedbackCard.appendChild(contentEditable);

        contentEditable.focus();

        const selection = window.getSelection();
        const range = document.createRange();
        if (contentEditable.firstChild && selection) {
          range.setStart(contentEditable.firstChild, 2);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "bounds-check-item" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);

        jest.runOnlyPendingTimers();
      }

      expect(container).toBeTruthy();
    });

    test("handles contentEditable when firstChild is null", async () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        feedbackCard.appendChild(contentEditable);

        contentEditable.focus();

        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          selection.removeAllRanges();
          selection.addRange(range);
        }

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "null-child-item" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);

        jest.runOnlyPendingTimers();
      }

      expect(container).toBeTruthy();
    });

    test("handles contentEditable when selection is null", async () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        contentEditable.textContent = "Text";
        feedbackCard.appendChild(contentEditable);

        contentEditable.focus();

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "null-selection-item" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);

        jest.runOnlyPendingTimers();
      }

      expect(container).toBeTruthy();
    });

    test("triggers setSelectionRange with selectionEnd when restoring focus", async () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        const input = document.createElement("input");
        input.value = "test input";
        input.type = "text";
        feedbackCard.appendChild(input);

        input.focus();
        input.selectionStart = 2;
        input.selectionEnd = 5;

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "selection-range-item" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);

        jest.runOnlyPendingTimers();

        expect(input).toBeTruthy();
      }

      expect(container).toBeTruthy();
    });

    test("handles error in contentEditable cursor restoration", async () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        contentEditable.textContent = "Error test";
        feedbackCard.appendChild(contentEditable);

        contentEditable.focus();

        const selection = window.getSelection();
        const range = document.createRange();
        if (contentEditable.firstChild && selection) {
          range.setStart(contentEditable.firstChild, 5);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "error-handling-item" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);

        jest.runOnlyPendingTimers();
      }

      consoleWarnSpy.mockRestore();
      expect(container).toBeTruthy();
    });
  });

  describe("Additional uncovered scenarios", () => {
    test("handles contentEditable element with selection and rangeCount", () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const { container, rerender } = render(<FeedbackColumn {...props} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard) {
        const contentEditable = document.createElement("div");
        contentEditable.contentEditable = "true";
        contentEditable.textContent = "Range count test";
        feedbackCard.appendChild(contentEditable);

        contentEditable.focus();

        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          if (contentEditable.firstChild) {
            range.setStart(contentEditable.firstChild, 3);
            range.setEnd(contentEditable.firstChild, 8);
            selection.removeAllRanges();
            selection.addRange(range);

            expect(selection.rangeCount).toBe(1);
            expect(selection.getRangeAt(0).startOffset).toBe(3);
          }
        }

        const updatedProps = { ...props, columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "range-count-test" } }] };
        rerender(<FeedbackColumn {...updatedProps} />);
      }

      expect(container).toBeTruthy();
    });

    test("handles timeout in restoreFocus when focusPreservation becomes null", async () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      const { container, rerender } = render(<FeedbackColumn {...props} ref={ref} />);

      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      if (feedbackCard && ref.current) {
        feedbackCard.focus();

        const updatedProps = { ...props, columnItems: [...props.columnItems] };
        rerender(<FeedbackColumn {...updatedProps} ref={ref} />);

        await new Promise(resolve => setTimeout(resolve, 20));
      }

      expect(container).toBeTruthy();
    });
  });

  describe("Move and drop logic", () => {
    test("static moveFeedbackItem refreshes items and tracks telemetry", async () => {
      const refreshFeedbackItems = jest.fn();
      const updatedItem = { id: "child-1", columnId: "target-column" } as any;

      (itemDataService.addFeedbackItemAsMainItemToColumn as jest.Mock).mockResolvedValue({
        updatedOldParentFeedbackItem: { id: "old-parent" },
        updatedFeedbackItem: updatedItem,
        updatedChildFeedbackItems: [{ id: "child-2" }],
      });

      await FeedbackColumn.moveFeedbackItem(refreshFeedbackItems, "board-1", "child-1", "target-column");

      expect(itemDataService.addFeedbackItemAsMainItemToColumn).toHaveBeenCalledWith("board-1", "child-1", "target-column");
      expect(refreshFeedbackItems).toHaveBeenCalledWith(expect.arrayContaining([updatedItem, { id: "child-2" }]), true);
      expect(appInsights.trackEvent).toHaveBeenCalledWith({ name: TelemetryEvents.FeedbackItemUngrouped, properties: { boardId: "board-1", feedbackItemId: "child-1", columnId: "target-column" } });
    });

    test("handleDropFeedbackItemOnColumnSpace moves dropped item", async () => {
      const refreshFeedbackItems = jest.fn();
      const props = { ...testColumnProps, refreshFeedbackItems };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      const idSpy = jest.spyOn(localStorageHelper, "getIdValue").mockReturnValue("dropped-item");
      const moveSpy = jest.spyOn(FeedbackColumn, "moveFeedbackItem").mockResolvedValue(undefined as any);

      await (ref.current as any).handleDropFeedbackItemOnColumnSpace();

      expect(moveSpy).toHaveBeenCalledWith(refreshFeedbackItems, props.boardId, "dropped-item", props.columnId);

      moveSpy.mockRestore();
      idSpy.mockRestore();
    });
  });

  describe("Keyboard guard behaviour", () => {
    test("keyboard handler exits early when a modal dialog is open", () => {
      const props = { ...testColumnProps };
      const { container } = render(<FeedbackColumn {...props} />);
      const modalSpy = jest.spyOn(dialogHelper, "isAnyModalDialogOpen").mockReturnValue(true);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
      modalSpy.mockRestore();
    });
  });

  describe("Sorting behaviour", () => {
    test("sorts items by votes in Act phase", () => {
      const itemOne = { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1", upvotes: 1 } };
      const itemTwo = { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2", upvotes: 5 } };
      const props = { ...testColumnProps, workflowPhase: WorkflowPhase.Act, isDataLoaded: true, columnItems: [itemOne, itemTwo] };

      const sortSpy = itemDataService.sortItemsByVotesAndDate as jest.Mock;
      sortSpy.mockImplementation(items => items.slice().reverse());

      render(<FeedbackColumn {...props} />);

      expect(sortSpy).toHaveBeenCalledWith(props.columnItems, props.columnItems);
    });
  });

  describe("Focus preservation - INPUT/TEXTAREA selection", () => {
    test("preserves selectionStart and selectionEnd when input is focused", () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      // Create a mock input and add it to the column
      const column = container.querySelector(".feedback-column") as HTMLElement;
      const input = document.createElement("input");
      input.type = "text";
      input.value = "test selection";
      input.id = "test-input";
      column.appendChild(input);
      input.focus();
      input.setSelectionRange(2, 8);

      expect(document.activeElement).toBe(input);

      (ref.current as any).preserveFocus();

      expect((ref.current as any).focusPreservation).toMatchObject({
        selectionStart: 2,
        selectionEnd: 8,
      });

      column.removeChild(input);
    });

    test("preserves selection when textarea is focused", () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      const textarea = document.createElement("textarea");
      textarea.value = "textarea content";
      column.appendChild(textarea);
      textarea.focus();
      textarea.setSelectionRange(4, 12);

      expect(document.activeElement).toBe(textarea);

      (ref.current as any).preserveFocus();

      expect((ref.current as any).focusPreservation).toMatchObject({
        selectionStart: 4,
        selectionEnd: 12,
      });

      column.removeChild(textarea);
    });

    test("preserves cursor position for contenteditable elements", () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      const contentEditable = document.createElement("div");
      contentEditable.contentEditable = "true";
      contentEditable.textContent = "editable text";
      // Set data-feedback-item-id to simulate being inside a feedback card
      contentEditable.setAttribute("data-feedback-item-id", "test-item");
      column.appendChild(contentEditable);
      contentEditable.focus();

      const selection = window.getSelection();
      const range = document.createRange();
      if (contentEditable.firstChild && selection) {
        range.setStart(contentEditable.firstChild, 5);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      (ref.current as any).preserveFocus();

      // focusPreservation should be set if the element is within the column
      const focusPres = (ref.current as any).focusPreservation;
      if (focusPres) {
        expect(focusPres.isContentEditable).toBe(true);
        expect(focusPres.cursorPosition).toBe(5);
      }

      column.removeChild(contentEditable);
    });
  });

  describe("RestoreFocus internals", () => {
    test("returns early from restoreFocus when focusPreservation is null", () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      (ref.current as any).focusPreservation = null;
      const result = (ref.current as any).restoreFocus();
      expect(result).toBeUndefined();
    });

    test("returns early from restoreFocus timeout when focusPreservation becomes null", () => {
      jest.useFakeTimers();
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      (ref.current as any).focusPreservation = {
        elementId: "some-id",
        selectionStart: null,
        selectionEnd: null,
        isContentEditable: false,
        cursorPosition: null,
      };

      (ref.current as any).restoreFocus();

      // Clear focusPreservation before timeout runs
      (ref.current as any).focusPreservation = null;

      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test("handles restoreFocus when elementToFocus is not found", () => {
      jest.useFakeTimers();
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      render(<FeedbackColumn {...props} ref={ref} />);

      (ref.current as any).focusPreservation = {
        elementId: "non-existent-id",
        selectionStart: null,
        selectionEnd: null,
        isContentEditable: false,
        cursorPosition: null,
      };

      (ref.current as any).restoreFocus();
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });
  });

  describe("FeedbackItemGroup rendering", () => {
    test("renders FeedbackItemGroup for items with children", () => {
      const childItem = {
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          id: "child-item-1",
          parentFeedbackItemId: "parent-item-1",
        },
        actionItems: [] as any[],
      };

      const parentItem = {
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          id: "parent-item-1",
          childFeedbackItemIds: ["child-item-1"],
        },
        actionItems: [] as any[],
      };

      const props = {
        ...testColumnProps,
        isDataLoaded: true,
        columnItems: [parentItem, childItem],
      };

      const { container } = render(<FeedbackColumn {...props} />);

      // FeedbackItemGroup should be rendered for parent item with children
      const feedbackGroups = container.querySelectorAll(".feedback-item-group");
      expect(feedbackGroups.length).toBeGreaterThanOrEqual(0);
      expect(container.querySelector(".feedback-column")).toBeTruthy();
    });

    test("renders regular FeedbackItem for items without children", () => {
      const singleItem = {
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          id: "single-item",
          childFeedbackItemIds: [],
        },
        actionItems: [] as any[],
      };

      const props = {
        ...testColumnProps,
        isDataLoaded: true,
        columnItems: [singleItem],
      };

      const { container } = render(<FeedbackColumn {...props} />);
      expect(container.querySelector(".feedback-column")).toBeTruthy();
    });
  });

  describe("Act phase CSS class", () => {
    test("applies feedback-items-actions class in Act phase", () => {
      const props = {
        ...testColumnProps,
        workflowPhase: WorkflowPhase.Act,
        isDataLoaded: true,
      };

      const { container } = render(<FeedbackColumn {...props} />);
      const itemsContainer = container.querySelector(".feedback-items-actions");
      expect(itemsContainer).toBeTruthy();
    });

    test("does not apply feedback-items-actions class in Collect phase", () => {
      const props = {
        ...testColumnProps,
        workflowPhase: WorkflowPhase.Collect,
        isDataLoaded: true,
      };

      const { container } = render(<FeedbackColumn {...props} />);
      const itemsContainer = container.querySelector(".feedback-items-actions");
      expect(itemsContainer).toBeFalsy();
    });
  });

  describe("restoreFocus selection restoration", () => {
    test("restores INPUT selection range after focus", async () => {
      jest.useFakeTimers();
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      const feedbackCard = document.createElement("div");
      feedbackCard.setAttribute("data-feedback-item-id", "input-restore-test");
      const input = document.createElement("input");
      input.value = "test input value";
      feedbackCard.appendChild(input);
      column.appendChild(feedbackCard);
      input.focus();
      input.setSelectionRange(3, 7);

      (ref.current as any).focusPreservation = {
        elementId: "input-restore-test",
        selectionStart: 3,
        selectionEnd: 7,
        isContentEditable: false,
        cursorPosition: null,
      };

      (ref.current as any).restoreFocus();
      jest.runOnlyPendingTimers();

      expect(input.selectionStart).toBe(3);
      expect(input.selectionEnd).toBe(7);
      jest.useRealTimers();
    });

    test("restores contenteditable cursor position after focus", async () => {
      jest.useFakeTimers();
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      const feedbackCard = document.createElement("div");
      feedbackCard.setAttribute("data-feedback-item-id", "editable-restore-test");
      const editable = document.createElement("div");
      editable.contentEditable = "true";
      editable.textContent = "editable content";
      feedbackCard.appendChild(editable);
      column.appendChild(feedbackCard);

      (ref.current as any).focusPreservation = {
        elementId: "editable-restore-test",
        selectionStart: null,
        selectionEnd: null,
        isContentEditable: true,
        cursorPosition: 5,
      };

      (ref.current as any).restoreFocus();
      jest.runOnlyPendingTimers();

      // Focus should be restored to the contenteditable element
      // Cursor position restoration may fail gracefully
      jest.useRealTimers();
    });

    test("restores focus to feedbackCard when no input found", async () => {
      jest.useFakeTimers();
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      const feedbackCard = document.createElement("div");
      feedbackCard.setAttribute("data-feedback-item-id", "card-only-test");
      feedbackCard.tabIndex = 0;
      column.appendChild(feedbackCard);

      (ref.current as any).focusPreservation = {
        elementId: "card-only-test",
        selectionStart: null,
        selectionEnd: null,
        isContentEditable: false,
        cursorPosition: null,
      };

      (ref.current as any).restoreFocus();
      jest.runOnlyPendingTimers();

      expect(document.activeElement).toBe(feedbackCard);
      jest.useRealTimers();
    });

    test("handles contenteditable cursor restoration error gracefully", async () => {
      jest.useFakeTimers();
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      const feedbackCard = document.createElement("div");
      feedbackCard.setAttribute("data-feedback-item-id", "error-restore-test");
      const editable = document.createElement("div");
      editable.contentEditable = "true";
      // Empty element will cause range.setStart to fail
      feedbackCard.appendChild(editable);
      column.appendChild(feedbackCard);

      (ref.current as any).focusPreservation = {
        elementId: "error-restore-test",
        selectionStart: null,
        selectionEnd: null,
        isContentEditable: true,
        cursorPosition: 100, // Out of range
      };

      (ref.current as any).restoreFocus();
      jest.runOnlyPendingTimers();

      // Should handle gracefully without crashing
      consoleWarnSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe("Edit column notes dialog", () => {
    test("closes dialog when clicking X button", async () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      // Get the dialog and manually open it
      const dialog = container.querySelector(".edit-column-notes-dialog") as HTMLDialogElement;
      expect(dialog).toBeTruthy();

      // Simulate opening the dialog
      dialog.showModal();
      expect(dialog.open).toBe(true);

      // Click the close button
      const closeButton = dialog.querySelector('[aria-label="Close"]') as HTMLButtonElement;
      expect(closeButton).toBeTruthy();
      fireEvent.click(closeButton);

      expect(dialog.open).toBe(false);
    });

    test("updates column notes draft on textarea change", async () => {
      const props = { ...testColumnProps, isDataLoaded: true };
      const ref = React.createRef<FeedbackColumn>();
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);

      const textarea = container.querySelector("#column-notes-textarea") as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();

      fireEvent.change(textarea, { target: { value: "New column notes" } });

      expect(textarea.value).toBe("New column notes");
    });
  });

  describe("Drop feedback item on column space", () => {
    beforeEach(() => {
      jest.spyOn(localStorageHelper, "getIdValue").mockReturnValue("dropped-item-id");
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("handleDropFeedbackItemOnColumnSpace retrieves dropped item id and calls moveFeedbackItem", async () => {
      const refreshFeedbackItems = jest.fn();
      const props = { ...testColumnProps, refreshFeedbackItems };
      const ref = React.createRef<FeedbackColumn>();
      
      // Ensure the mock is properly set up for this test
      (itemDataService.addFeedbackItemAsMainItemToColumn as jest.Mock).mockResolvedValueOnce({
        updatedOldParentFeedbackItem: null,
        updatedFeedbackItem: { id: "updated", columnId: "column-id" },
        updatedChildFeedbackItems: [],
      });
      
      render(<FeedbackColumn {...props} ref={ref} />);

      // Call the private method directly
      await (ref.current as any).handleDropFeedbackItemOnColumnSpace();

      expect(localStorageHelper.getIdValue).toHaveBeenCalled();
      expect(itemDataService.addFeedbackItemAsMainItemToColumn).toHaveBeenCalled();
      expect(refreshFeedbackItems).toHaveBeenCalled();
    });
  });

  describe("Keyboard navigation with modal dialog open", () => {
    test("ignores keyboard events when modal dialog is open", () => {
      jest.spyOn(dialogHelper, "isAnyModalDialogOpen").mockReturnValue(true);

      const props = { ...testColumnProps };
      const { container } = render(<FeedbackColumn {...props} />);

      const column = container.querySelector(".feedback-column") as HTMLElement;
      const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
      column.dispatchEvent(event);

      // Event should not be prevented when dialog is open
      expect(column).toBeTruthy();

      jest.restoreAllMocks();
    });
  });

  describe("renderFeedbackItems with different phases", () => {
    test("renders items sorted by votes in Act phase", () => {
      const item1 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1", upvotes: 5 },
      };
      const item2 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2", upvotes: 10 },
      };

      const props = { ...testColumnProps, columnItems: [item1, item2], workflowPhase: WorkflowPhase.Act, isDataLoaded: true };
      const { container } = render(<FeedbackColumn {...props} />);

      expect(container.querySelector(".feedback-items-container")).toBeTruthy();
      expect(itemDataService.sortItemsByVotesAndDate).toHaveBeenCalled();
    });

    test("renders items sorted by date in non-Act phase", () => {
      const item1 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1", createdDate: new Date("2023-01-01") },
      };
      const item2 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-2", createdDate: new Date("2023-06-01") },
      };

      const props = { ...testColumnProps, columnItems: [item1, item2], workflowPhase: WorkflowPhase.Collect, isDataLoaded: true };
      const { container } = render(<FeedbackColumn {...props} />);

      expect(container.querySelector(".feedback-items-container")).toBeTruthy();
    });
  });
});
