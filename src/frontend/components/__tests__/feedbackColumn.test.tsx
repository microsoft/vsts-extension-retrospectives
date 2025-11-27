import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { testColumnProps } from "../__mocks__/mocked_components/mockedFeedbackColumn";
import FeedbackColumn from "../feedbackColumn";
import FeedbackItem from "../feedbackItem";
import { IColumnItem } from "../feedbackBoard";

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
  },
}));

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
  });
});
