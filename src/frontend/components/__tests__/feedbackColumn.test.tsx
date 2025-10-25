import React from "react";
import { fireEvent, render } from "@testing-library/react";
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
});
