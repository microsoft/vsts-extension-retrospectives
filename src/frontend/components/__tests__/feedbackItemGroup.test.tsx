import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeedbackItemGroup from "../feedbackItemGroup";
import { WorkflowPhase } from "../../interfaces/workItem";
import localStorageHelper from "../../utilities/localStorageHelper";

// Mock FeedbackItem to avoid complex dependencies
jest.mock("../feedbackItem", () => ({
  __esModule: true,
  default: ({ groupedItemProps, id }: any) => (
    <div data-testid={`feedback-item-${id}`} className="feedback-item-mock">
      {groupedItemProps?.isMainItem && groupedItemProps?.toggleGroupExpand && (
        <button onClick={groupedItemProps.toggleGroupExpand} data-testid="toggle-expand">
          {groupedItemProps.isGroupExpanded ? "Collapse" : "Expand"}
        </button>
      )}
    </div>
  ),
  FeedbackItemHelper: {
    handleDropFeedbackItemOnFeedbackItem: jest.fn(),
  },
}));

jest.mock("../../utilities/localStorageHelper");
jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {},
}));

describe("FeedbackItemGroup", () => {
  const mockMainItem: any = {
    id: "main-item-1",
    title: "Main feedback",
  };

  const mockGroupedItem: any = {
    id: "grouped-item-1",
    title: "Grouped feedback",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    expect(container.querySelector(".feedback-item-group")).toBeInTheDocument();
  });

  it("should render the main feedback item", () => {
    const { getByTestId } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    expect(getByTestId("feedback-item-main-item-1")).toBeInTheDocument();
  });

  it("should not render grouped items initially", () => {
    const { queryByTestId } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    expect(queryByTestId("feedback-item-grouped-item-1")).not.toBeInTheDocument();
  });

  it("should expand and show grouped items when toggle is clicked", () => {
    const { getByTestId, queryByTestId } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const toggleButton = getByTestId("toggle-expand");
    fireEvent.click(toggleButton);

    expect(queryByTestId("feedback-item-grouped-item-1")).toBeInTheDocument();
  });

  it("should add expanded class when group is expanded", () => {
    const { container, getByTestId } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group");
    expect(groupDiv).not.toHaveClass("feedback-item-group-expanded");

    const toggleButton = getByTestId("toggle-expand");
    fireEvent.click(toggleButton);

    expect(groupDiv).toHaveClass("feedback-item-group-expanded");
  });

  it("should handle dragover event", () => {
    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group");
    const dragEvent = new Event("dragover", { bubbles: true, cancelable: true });
    const mockDataTransfer = { dropEffect: "" };
    Object.defineProperty(dragEvent, "dataTransfer", {
      value: mockDataTransfer,
      writable: true,
    });

    const preventDefaultSpy = jest.spyOn(dragEvent, "preventDefault");
    const stopPropagationSpy = jest.spyOn(dragEvent, "stopPropagation");

    groupDiv?.dispatchEvent(dragEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it("should handle drop event", () => {
    const mockGetIdValue = localStorageHelper.getIdValue as jest.Mock;
    mockGetIdValue.mockReturnValue("dragged-item-id");

    // Access the mocked module
    const FeedbackItemHelper = jest.requireMock("../feedbackItem").FeedbackItemHelper;
    const mockHandleDrop = FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem;

    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group");
    const dropEvent = new Event("drop", { bubbles: true });
    const mockDataTransfer = { getData: jest.fn() };
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: mockDataTransfer,
      writable: true,
    });

    const stopPropagationSpy = jest.spyOn(dropEvent, "stopPropagation");

    groupDiv?.dispatchEvent(dropEvent);

    expect(mockGetIdValue).toHaveBeenCalled();
    expect(mockHandleDrop).toHaveBeenCalledWith(mockMainItem, "dragged-item-id", "main-item-1");
    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
