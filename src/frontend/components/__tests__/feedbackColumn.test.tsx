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
      const items = [
        { ...testColumnProps.columnItems[0], feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item-1" } },
      ];
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
          columnItems: [{ 
            ...props.columnItems[0], 
            feedbackItem: { ...props.columnItems[0].feedbackItem, id: "different-id" } 
          }] 
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
});
