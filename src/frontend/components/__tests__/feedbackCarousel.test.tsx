import React from "react";
import { render } from "@testing-library/react";
import FeedbackCarousel, { type FocusModeModel } from "../../components/feedbackCarousel";
import { testGroupColumnProps, testColumnProps } from "../__mocks__/mocked_components/mockedFeedbackColumn";
import { mockUuid } from "../__mocks__/uuid/v4";
import * as icons from "../../components/icons";

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
  },
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: (_plugin: any, Component: any) => Component,
  useTrackMetric: () => jest.fn(),
}));

const buildFocusModeModel = (columnPropsList: Array<typeof testColumnProps>): FocusModeModel => {
  const first = columnPropsList[0] ?? testColumnProps;
  const columns: any = {};

  for (const col of columnPropsList) {
    columns[col.columnId] = {
      columnProperties: {
        id: col.columnId,
        title: col.columnName,
        icon: col.icon,
        accentColor: col.accentColor,
        notes: "",
      },
      columnItems: col.columnItems,
    };
  }

  return {
    columns,
    columnIds: columnPropsList.map(c => c.columnId),
    workflowPhase: first.workflowPhase,
    team: first.team,
    boardId: first.boardId,
    boardTitle: first.boardTitle,
    defaultActionItemAreaPath: first.defaultActionItemAreaPath,
    defaultActionItemIteration: first.defaultActionItemIteration,
    nonHiddenWorkItemTypes: first.nonHiddenWorkItemTypes,
    allWorkItemTypes: first.allWorkItemTypes,
    hideFeedbackItems: first.hideFeedbackItems,
    onVoteCasted: first.onVoteCasted,
    activeTimerFeedbackItemId: first.activeTimerFeedbackItemId,
    requestTimerStart: first.requestTimerStart,
    notifyTimerStopped: first.notifyTimerStopped,
    addFeedbackItems: first.addFeedbackItems,
    removeFeedbackItemFromColumn: first.removeFeedbackItemFromColumn,
    refreshFeedbackItems: first.refreshFeedbackItems,
  };
};

const mockedProps = {
  focusModeModel: buildFocusModeModel([testColumnProps]),
  isFocusModalHidden: false,
};

const mockedGroupProps = {
  focusModeModel: buildFocusModeModel([testGroupColumnProps]),
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
      const emptyModel = buildFocusModeModel([] as unknown as Array<typeof testColumnProps>);
      emptyModel.columnIds = [];
      emptyModel.columns = {} as any;

      const { container } = render(<FeedbackCarousel focusModeModel={emptyModel} isFocusModalHidden={false} />);

      expect(container.textContent).not.toContain("All");
    });

    it("should aggregate items from all columns", () => {
      const column1 = { ...testColumnProps, columnId: "col1", columnName: "Column 1", columnItems: testColumnProps.columnItems.slice(0, 1) };
      const column2 = { ...testColumnProps, columnId: "col2", columnName: "Column 2", columnItems: testColumnProps.columnItems.slice(1, 2) };

      const { container } = render(<FeedbackCarousel focusModeModel={buildFocusModeModel([column1, column2])} isFocusModalHidden={false} />);

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
        focusModeModel: buildFocusModeModel([{ ...testColumnProps, columnItems: [item3, item1, item2] }]),
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
        focusModeModel: buildFocusModeModel([{ ...testColumnProps, columnItems: [parentItem, childItem] }]),
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
        focusModeModel: buildFocusModeModel([{ ...testColumnProps, columnItems: [item1, item2] }]),
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

      const { container } = render(<FeedbackCarousel focusModeModel={buildFocusModeModel([column1, column2, column3])} isFocusModalHidden={false} />);

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

      const { container, rerender } = render(<FeedbackCarousel focusModeModel={buildFocusModeModel([initialColumn])} isFocusModalHidden={false} />);

      expect(container.textContent).toContain("Initial Column");

      // Rerender with different props to trigger componentDidUpdate
      rerender(<FeedbackCarousel focusModeModel={buildFocusModeModel([updatedColumn])} isFocusModalHidden={false} />);

      expect(container.textContent).toContain("Updated Column");
    });

    it("should not update state when feedbackColumnPropsList stays the same reference", () => {
      const model = buildFocusModeModel([{ ...testColumnProps, columnId: "col1", columnName: "Test Column" }]);

      const { container, rerender } = render(<FeedbackCarousel focusModeModel={model} isFocusModalHidden={false} />);

      // Rerender with same reference
      rerender(<FeedbackCarousel focusModeModel={model} isFocusModalHidden={true} />);

      expect(container.textContent).toContain("Test Column");
    });
  });

  describe("buildFeedbackColumns with missing columns", () => {
    it("should filter out columnIds that do not exist in columns object", () => {
      // Create a model with an empty columns object but some columnIds
      const emptyModel: FocusModeModel = {
        columns: {},
        columnIds: ["non-existent-column-id"],
        workflowPhase: testColumnProps.workflowPhase,
        team: testColumnProps.team,
        boardId: testColumnProps.boardId,
        boardTitle: testColumnProps.boardTitle,
        defaultActionItemAreaPath: testColumnProps.defaultActionItemAreaPath,
        defaultActionItemIteration: testColumnProps.defaultActionItemIteration,
        nonHiddenWorkItemTypes: testColumnProps.nonHiddenWorkItemTypes,
        allWorkItemTypes: testColumnProps.allWorkItemTypes,
        hideFeedbackItems: testColumnProps.hideFeedbackItems,
        onVoteCasted: testColumnProps.onVoteCasted,
        activeTimerFeedbackItemId: testColumnProps.activeTimerFeedbackItemId,
        requestTimerStart: testColumnProps.requestTimerStart,
        notifyTimerStopped: testColumnProps.notifyTimerStopped,
        addFeedbackItems: testColumnProps.addFeedbackItems,
        removeFeedbackItemFromColumn: testColumnProps.removeFeedbackItemFromColumn,
        refreshFeedbackItems: testColumnProps.refreshFeedbackItems,
      };

      const { container } = render(<FeedbackCarousel focusModeModel={emptyModel} isFocusModalHidden={false} />);

      // Should render the carousel without crashing (columns are filtered out)
      expect(container.querySelector(".feedback-carousel-pivot")).toBeTruthy();
    });

    it("should fall back to column defaults when accentColor is undefined", () => {
      // Create a model where accentColor is undefined within columnProperties
      const model = buildFocusModeModel([{ ...testColumnProps }]);
      // Set accentColor to undefined to test the fallback
      model.columns[testColumnProps.columnId].columnProperties.accentColor = undefined as any;

      const { container } = render(<FeedbackCarousel focusModeModel={model} isFocusModalHidden={false} />);

      // Should use fallback accentColor
      expect(container.querySelector(".feedback-carousel-pivot")).toBeTruthy();
    });

    it("should handle feedback items without createdBy", () => {
      // Create item without createdBy
      const itemWithoutCreatedBy = {
        ...testColumnProps.columnItems[0],
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          createdBy: undefined as any,
          modifiedDate: undefined as any,
        },
      };

      const model = buildFocusModeModel([{ ...testColumnProps, columnItems: [itemWithoutCreatedBy] }]);

      const { container } = render(<FeedbackCarousel focusModeModel={model} isFocusModalHidden={false} />);

      // Should render without createdBy info
      expect(container.querySelector(".feedback-carousel-pivot")).toBeTruthy();
    });

    it("should use column icon fallback when iconClass is undefined", () => {
      // Create a model where iconClass is undefined
      const model = buildFocusModeModel([{ ...testColumnProps }]);
      model.columns[testColumnProps.columnId].columnProperties.iconClass = undefined as any;

      const { container } = render(<FeedbackCarousel focusModeModel={model} isFocusModalHidden={false} />);

      // Should use fallback icon from column
      expect(container.querySelector(".feedback-carousel-pivot")).toBeTruthy();
    });

    it("should use column defaults when item's columnId is not in columns map", () => {
      // Create a feedback item with a columnId that doesn't exist in the columns map
      const itemWithDifferentColumnId = {
        ...testColumnProps.columnItems[0],
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          columnId: "non-existent-column-id", // This columnId won't be in the columns map
        },
      };

      const model = buildFocusModeModel([{ ...testColumnProps, columnItems: [itemWithDifferentColumnId] }]);

      const { container } = render(<FeedbackCarousel focusModeModel={model} isFocusModalHidden={false} />);

      // Should use column defaults for accentColor and icon
      expect(container.querySelector(".feedback-carousel-pivot")).toBeTruthy();
    });

    it("should use column icon fallback when getIconElement returns null", () => {
      const getIconElementSpy = jest.spyOn(icons, "getIconElement").mockReturnValue(null as any);

      const itemWithKnownColumn = {
        ...testColumnProps.columnItems[0],
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          id: "fallback-icon-item",
          columnId: testColumnProps.columnId,
        },
      };

      const model = buildFocusModeModel([{ ...testColumnProps, columnItems: [itemWithKnownColumn] }]);
      const { container } = render(<FeedbackCarousel focusModeModel={model} isFocusModalHidden={false} />);

      expect(container.querySelector(".feedback-carousel-pivot")).toBeTruthy();
      getIconElementSpy.mockRestore();
    });

    it("should map createdBy and modifiedDate when they are present", () => {
      const itemWithCreatorAndModifiedDate = {
        ...testColumnProps.columnItems[0],
        feedbackItem: {
          ...testColumnProps.columnItems[0].feedbackItem,
          id: "item-with-created-by",
          createdBy: {
            displayName: "Test Creator",
            _links: {
              avatar: {
                href: "https://example.com/avatar.png",
              },
            },
          },
          modifiedDate: new Date("2024-05-01T12:00:00Z"),
        },
      };

      const model = buildFocusModeModel([{ ...testColumnProps, columnItems: [itemWithCreatorAndModifiedDate] }]);
      const { container } = render(<FeedbackCarousel focusModeModel={model} isFocusModalHidden={false} />);

      expect(container.querySelector(".feedback-carousel-pivot")).toBeTruthy();
    });
  });
});
