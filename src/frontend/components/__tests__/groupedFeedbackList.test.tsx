import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupedFeedbackList, { IGroupedFeedbackListProps } from "../groupedFeedbackList";
import { IColumn, IColumnItem } from "../feedbackBoard";
import { IFeedbackItemDocument } from "../../interfaces/feedback";

// Mock the icons module
jest.mock("../icons", () => {
  const React = require("react");
  return {
    __esModule: true,
    getIconElement: jest.fn((name: string) => React.createElement("span", { "data-testid": `icon-${name}` }, name)),
  };
});

// Mock getUserIdentity
jest.mock("../../utilities/userIdentityHelper", () => ({
  getUserIdentity: () => ({ id: "current-user-id", displayName: "Current User" }),
}));

describe("GroupedFeedbackList", () => {
  const createFeedbackItem = (overrides: Partial<IFeedbackItemDocument> = {}): IFeedbackItemDocument => ({
    id: "item-1",
    boardId: "board-1",
    title: "Test Feedback",
    columnId: "column-1",
    originalColumnId: "column-1",
    upvotes: 0,
    voteCollection: {},
    createdDate: new Date(),
    userIdRef: "user-1",
    timerSecs: 0,
    timerState: false,
    timerId: null,
    groupIds: [],
    isGroupedCarouselItem: false,
    ...overrides,
  });

  const createColumnItem = (feedbackItem: IFeedbackItemDocument): IColumnItem => ({
    feedbackItem,
    actionItems: [],
  });

  const createColumn = (id: string, title: string, accentColor: string = "#0078d4"): IColumn => ({
    columnProperties: {
      id,
      title,
      accentColor,
      iconClass: "icon-class",
    },
    columnItems: [],
  });

  const defaultColumns: { [id: string]: IColumn } = {
    "column-1": createColumn("column-1", "Column 1", "#ff0000"),
    "column-2": createColumn("column-2", "Column 2", "#00ff00"),
  };

  const defaultProps: IGroupedFeedbackListProps = {
    childrenIds: [],
    columnItems: [],
    columns: defaultColumns,
    currentColumnId: "column-1",
    hideFeedbackItems: false,
    isFocusModalHidden: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the grouped feedback header", () => {
      render(<GroupedFeedbackList {...defaultProps} />);

      expect(screen.getByText("Grouped Feedback")).toBeInTheDocument();
      // Verify the header div exists with appropriate class
      const header = screen.getByText("Grouped Feedback").closest(".grouped-feedback-header");
      expect(header).toBeInTheDocument();
    });

    it("should render a list with proper aria attributes", () => {
      render(<GroupedFeedbackList {...defaultProps} />);

      const list = screen.getByRole("list");
      expect(list).toHaveAttribute("aria-label", "List of Grouped Feedback");
    });

    it("should render nothing in list when no children ids provided", () => {
      render(<GroupedFeedbackList {...defaultProps} childrenIds={[]} />);

      const list = screen.getByRole("list");
      expect(list.children).toHaveLength(0);
    });

    it("should render child feedback items when ids and items are provided", () => {
      const childItem = createFeedbackItem({ id: "child-1", title: "Child Feedback" });
      const columnItems = [createColumnItem(childItem)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={columnItems} />);

      expect(screen.getByText("Child Feedback")).toBeInTheDocument();
    });

    it("should render multiple child items", () => {
      const child1 = createFeedbackItem({ id: "child-1", title: "First Child" });
      const child2 = createFeedbackItem({ id: "child-2", title: "Second Child" });
      const columnItems = [createColumnItem(child1), createColumnItem(child2)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1", "child-2"]} columnItems={columnItems} />);

      expect(screen.getByText("First Child")).toBeInTheDocument();
      expect(screen.getByText("Second Child")).toBeInTheDocument();
    });

    it("should render each child item as a list item", () => {
      const childItem = createFeedbackItem({ id: "child-1", title: "Child" });
      const columnItems = [createColumnItem(childItem)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={columnItems} />);

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(1);
    });
  });

  describe("Hidden feedback items", () => {
    it("should show [Hidden Feedback] when hideFeedbackItems is true and item belongs to different user", () => {
      const childItem = createFeedbackItem({
        id: "child-1",
        title: "Secret Feedback",
        userIdRef: "other-user-id",
      });
      const columnItems = [createColumnItem(childItem)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={columnItems} hideFeedbackItems={true} />);

      expect(screen.getByText("[Hidden Feedback]")).toBeInTheDocument();
      expect(screen.queryByText("Secret Feedback")).not.toBeInTheDocument();
    });

    it("should show actual title when hideFeedbackItems is true but item belongs to current user", () => {
      const childItem = createFeedbackItem({
        id: "child-1",
        title: "My Feedback",
        userIdRef: "current-user-id",
      });
      const columnItems = [createColumnItem(childItem)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={columnItems} hideFeedbackItems={true} />);

      expect(screen.getByText("My Feedback")).toBeInTheDocument();
    });

    it("should have aria-hidden attribute when item is hidden", () => {
      const childItem = createFeedbackItem({
        id: "child-1",
        title: "Hidden Item",
        userIdRef: "other-user-id",
      });
      const columnItems = [createColumnItem(childItem)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={columnItems} hideFeedbackItems={true} />);

      const titleElement = screen.getByTitle("[Hidden Feedback]");
      expect(titleElement).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Original column info", () => {
    it("should show original column info when item was moved and focus modal is hidden", () => {
      const childItem = createFeedbackItem({
        id: "child-1",
        title: "Moved Feedback",
        originalColumnId: "column-2",
        columnId: "column-1",
      });
      const columnItems = [createColumnItem(childItem)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={columnItems} isFocusModalHidden={true} />);

      expect(screen.getByText("Original Column: Column 2")).toBeInTheDocument();
    });

    it("should not show original column info when item was not moved", () => {
      const childItem = createFeedbackItem({
        id: "child-1",
        title: "Not Moved",
        originalColumnId: "column-1",
        columnId: "column-1",
      });
      const columnItems = [createColumnItem(childItem)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={columnItems} currentColumnId="column-1" />);

      expect(screen.queryByText(/Original Column:/)).not.toBeInTheDocument();
    });

    it("should not show original column info when focus modal is not hidden", () => {
      const childItem = createFeedbackItem({
        id: "child-1",
        title: "Moved Feedback",
        originalColumnId: "column-2",
        columnId: "column-1",
      });
      const columnItems = [createColumnItem(childItem)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={columnItems} isFocusModalHidden={false} />);

      expect(screen.queryByText(/Original Column:/)).not.toBeInTheDocument();
    });
  });

  describe("Accent color styling", () => {
    it("should apply original column accent color to icon border", () => {
      const childItem = createFeedbackItem({
        id: "child-1",
        title: "Styled Feedback",
        originalColumnId: "column-2",
      });
      const columnItems = [createColumnItem(childItem)];

      const { container } = render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={columnItems} />);

      const iconDiv = container.querySelector(".icon");
      expect(iconDiv).toHaveStyle({ borderRightColor: "#00ff00" });
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label for related feedback", () => {
      const childItem = createFeedbackItem({
        id: "child-1",
        title: "Accessible Feedback",
      });
      const columnItems = [createColumnItem(childItem)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={columnItems} />);

      const titleElement = screen.getByTitle("Accessible Feedback");
      expect(titleElement).toHaveAttribute("aria-label", "Related feedback: Accessible Feedback");
    });

    it("should render list items with listitem role", () => {
      const childItem = createFeedbackItem({ id: "child-1", title: "Child" });
      const columnItems = [createColumnItem(childItem)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={columnItems} />);

      expect(screen.getByRole("listitem")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle missing column items gracefully", () => {
      render(<GroupedFeedbackList {...defaultProps} childrenIds={["non-existent-id"]} columnItems={[]} />);

      // Should not crash and should render empty list
      const list = screen.getByRole("list");
      expect(list.children).toHaveLength(0);
    });

    it("should handle undefined columnItems", () => {
      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1"]} columnItems={undefined} />);

      const list = screen.getByRole("list");
      expect(list.children).toHaveLength(0);
    });

    it("should skip rendering items that are not found in columnItems", () => {
      const childItem = createFeedbackItem({ id: "child-1", title: "Found Item" });
      const columnItems = [createColumnItem(childItem)];

      render(<GroupedFeedbackList {...defaultProps} childrenIds={["child-1", "non-existent"]} columnItems={columnItems} />);

      expect(screen.getByText("Found Item")).toBeInTheDocument();
      const list = screen.getByRole("list");
      expect(list.querySelectorAll("li")).toHaveLength(1);
    });
  });
});
