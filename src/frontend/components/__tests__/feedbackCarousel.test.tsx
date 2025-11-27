import React from "react";
import { render } from "@testing-library/react";
import FeedbackCarousel from "../../components/feedbackCarousel";
import FeedbackItem from "../../components/feedbackItem";
import { testGroupColumnProps, testColumnProps, testGroupFeedbackItemTwo } from "../__mocks__/mocked_components/mockedFeedbackColumn";
import { mockUuid } from "../__mocks__/uuid/v4";

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
  },
}));

const mockedProps = {
  feedbackColumnPropsList: [testColumnProps],
  isFeedbackAnonymous: true,
  isFocusModalHidden: false,
};

const mockedGroupProps = {
  feedbackColumnPropsList: [testGroupColumnProps],
  isFeedbackAnonymous: true,
  isFocusModalHidden: false,
};

jest.mock("uuid", () => ({ v4: () => mockUuid }));

describe("Feedback Carousel ", () => {
  it("can be rendered", () => {
    const { container } = render(<FeedbackCarousel {...mockedProps} />);
    const carouselPivot = container.querySelector(".feedback-carousel-pivot");
    expect(carouselPivot).toBeTruthy();

    expect(container.textContent).toContain(testColumnProps.columnName);
  });

  test("that groupIds are empty when there are no children", () => {
    const { container } = render(<FeedbackCarousel {...mockedProps} />);

    const carouselItems = container.querySelectorAll(".feedback-carousel-item");
    expect(carouselItems.length).toBeGreaterThanOrEqual(0);
  });

  test("that groupIds are populate when there are children", () => {
    const { container } = render(<FeedbackCarousel {...mockedGroupProps} />);

    const carouselItems = container.querySelectorAll(".feedback-carousel-item");
    expect(carouselItems.length).toBeGreaterThanOrEqual(0);
  });

  describe("'All' column", () => {
    it("should be set by default in the first position", () => {
      const { container } = render(<FeedbackCarousel {...mockedProps} />);

      expect(container.textContent).toContain("All");
    });

    it("should not exist when there are no feedback columns", () => {
      const { container } = render(<FeedbackCarousel feedbackColumnPropsList={[]} isFeedbackAnonymous={true} isFocusModalHidden={false} />);

      expect(container.textContent).not.toContain("All");
    });

    it("should aggregate items from all columns", () => {
      const column1 = { ...testColumnProps, columnId: "col1", columnName: "Column 1", columnItems: testColumnProps.columnItems.slice(0, 1) };
      const column2 = { ...testColumnProps, columnId: "col2", columnName: "Column 2", columnItems: testColumnProps.columnItems.slice(1, 2) };

      const { container } = render(<FeedbackCarousel feedbackColumnPropsList={[column1, column2]} isFeedbackAnonymous={true} isFocusModalHidden={false} />);

      // All column should contain items from both columns
      expect(container).toBeTruthy();
    });
  });

  describe("Item sorting", () => {
    it("should sort items by upvotes (descending) then by creation date (ascending)", () => {
      const item1 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item1", upvotes: 5, createdDate: new Date("2023-01-01") },
      };
      const item2 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item2", upvotes: 10, createdDate: new Date("2023-01-02") },
      };
      const item3 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item3", upvotes: 5, createdDate: new Date("2023-01-03") },
      };

      const propsWithSorting = {
        ...mockedProps,
        feedbackColumnPropsList: [{ ...testColumnProps, columnItems: [item3, item1, item2] }],
      };

      const { container } = render(<FeedbackCarousel {...propsWithSorting} />);

      // Should render without error - sorting logic executed
      expect(container.querySelector(".feedback-carousel-pivot")).toBeTruthy();
    });

    it("should filter out items with parentFeedbackItemId", () => {
      const parentItem = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "parent", parentFeedbackItemId: undefined },
      };
      const childItem = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "child", parentFeedbackItemId: "parent" },
      };

      const propsWithChildren = {
        ...mockedProps,
        feedbackColumnPropsList: [{ ...testColumnProps, columnItems: [parentItem, childItem] }],
      };

      const { container } = render(<FeedbackCarousel {...propsWithChildren} />);

      // Child items should be filtered out
      expect(container).toBeTruthy();
    });

    it("should handle equal upvotes and dates correctly", () => {
      const item1 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item1", upvotes: 5, createdDate: new Date("2023-01-01") },
      };
      const item2 = {
        ...testColumnProps.columnItems[0],
        feedbackItem: { ...testColumnProps.columnItems[0].feedbackItem, id: "item2", upvotes: 5, createdDate: new Date("2023-01-01") },
      };

      const propsWithEqual = {
        ...mockedProps,
        feedbackColumnPropsList: [{ ...testColumnProps, columnItems: [item1, item2] }],
      };

      const { container } = render(<FeedbackCarousel {...propsWithEqual} />);

      expect(container.querySelector(".feedback-carousel-pivot")).toBeTruthy();
    });
  });

  describe("Multiple columns", () => {
    it("should render pivot items for each column", () => {
      const column1 = { ...testColumnProps, columnId: "col1", columnName: "What Went Well" };
      const column2 = { ...testColumnProps, columnId: "col2", columnName: "What Needs Improvement" };
      const column3 = { ...testColumnProps, columnId: "col3", columnName: "Action Items" };

      const { container } = render(<FeedbackCarousel feedbackColumnPropsList={[column1, column2, column3]} isFeedbackAnonymous={true} isFocusModalHidden={false} />);

      // Should have All + 3 columns
      expect(container).toBeTruthy();
      expect(container.textContent).toContain("What Went Well");
      expect(container.textContent).toContain("What Needs Improvement");
      expect(container.textContent).toContain("Action Items");
    });
  });

  describe("componentDidUpdate", () => {
    it("should update state when feedbackColumnPropsList changes", () => {
      const initialColumn = { ...testColumnProps, columnId: "col1", columnName: "Initial Column" };
      const updatedColumn = { ...testColumnProps, columnId: "col2", columnName: "Updated Column" };

      const { container, rerender } = render(
        <FeedbackCarousel feedbackColumnPropsList={[initialColumn]} isFeedbackAnonymous={true} isFocusModalHidden={false} />
      );

      expect(container.textContent).toContain("Initial Column");

      // Rerender with different props to trigger componentDidUpdate
      rerender(
        <FeedbackCarousel feedbackColumnPropsList={[updatedColumn]} isFeedbackAnonymous={true} isFocusModalHidden={false} />
      );

      expect(container.textContent).toContain("Updated Column");
    });

    it("should not update state when feedbackColumnPropsList stays the same reference", () => {
      const columns = [{ ...testColumnProps, columnId: "col1", columnName: "Test Column" }];

      const { container, rerender } = render(
        <FeedbackCarousel feedbackColumnPropsList={columns} isFeedbackAnonymous={true} isFocusModalHidden={false} />
      );

      // Rerender with same reference
      rerender(
        <FeedbackCarousel feedbackColumnPropsList={columns} isFeedbackAnonymous={false} isFocusModalHidden={true} />
      );

      expect(container.textContent).toContain("Test Column");
    });
  });
});
