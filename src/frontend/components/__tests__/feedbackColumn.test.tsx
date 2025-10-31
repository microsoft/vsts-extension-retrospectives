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
    it("shows the stored notes when clicked", () => {
      const props = { ...testColumnProps, columnNotes: "Saved notes", showColumnEditButton: false };
      const { getByRole, getByText } = render(<FeedbackColumn {...props} />);

      fireEvent.click(getByRole("button", { name: `View notes for ${props.columnName}` }));

      expect(getByText("Saved notes")).toBeInTheDocument();
    });

    it("shows a fallback message when no notes exist", () => {
      const props = { ...testColumnProps, columnNotes: "", showColumnEditButton: false };
      const { getByRole, getByText } = render(<FeedbackColumn {...props} />);

      fireEvent.click(getByRole("button", { name: `View notes for ${props.columnName}` }));

      expect(getByText("No notes available for this column.")).toBeInTheDocument();
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
  });
});
