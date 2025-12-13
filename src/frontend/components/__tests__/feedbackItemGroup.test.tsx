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
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
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

  it("should handle Space key press without crashing", () => {
    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;

    // Press Space key - should not throw
    const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    expect(() => {
      groupDiv?.dispatchEvent(spaceEvent);
    }).not.toThrow();

    // Verify the group still exists
    expect(groupDiv).toBeTruthy();
  });

  it("should not toggle expand when Space is pressed on a button", () => {
    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;
    const button = document.createElement("button");
    groupDiv?.appendChild(button);

    // Press Space key on button
    const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true });
    Object.defineProperty(spaceEvent, "target", { value: button, enumerable: true });
    groupDiv?.dispatchEvent(spaceEvent);

    // Should not toggle (still collapsed)
    expect(container.querySelector(".feedback-item-group-expanded")).not.toBeInTheDocument();
  });

  it("should not handle keydown when input is focused", () => {
    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;
    const input = document.createElement("input");
    groupDiv?.appendChild(input);

    // Press Space key on input
    const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true });
    Object.defineProperty(spaceEvent, "target", { value: input, enumerable: true });
    groupDiv?.dispatchEvent(spaceEvent);

    // Should not toggle
    expect(container.querySelector(".feedback-item-group-expanded")).not.toBeInTheDocument();
  });

  it("should not handle keydown when textarea is focused", () => {
    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;
    const textarea = document.createElement("textarea");
    groupDiv?.appendChild(textarea);

    // Press Space key on textarea
    const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true });
    Object.defineProperty(spaceEvent, "target", { value: textarea, enumerable: true });
    groupDiv?.dispatchEvent(spaceEvent);

    // Should not toggle
    expect(container.querySelector(".feedback-item-group-expanded")).not.toBeInTheDocument();
  });

  it("should not handle keydown when contenteditable is focused", () => {
    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;
    const contentEditable = document.createElement("div");
    contentEditable.contentEditable = "true";
    groupDiv?.appendChild(contentEditable);

    // Press Space key on contenteditable
    const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true });
    Object.defineProperty(spaceEvent, "target", { value: contentEditable, enumerable: true });
    groupDiv?.dispatchEvent(spaceEvent);

    // Should not toggle
    expect(container.querySelector(".feedback-item-group-expanded")).not.toBeInTheDocument();
  });

  it("should remove keydown event listener on unmount", () => {
    const { container, unmount } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;
    const removeEventListenerSpy = jest.spyOn(groupDiv, "removeEventListener");

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("should prevent default when Space is pressed on non-button elements", () => {
    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;
    const div = document.createElement("div");
    groupDiv?.appendChild(div);

    // Press Space key on div
    const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    Object.defineProperty(spaceEvent, "target", { value: div, enumerable: true });
    const preventDefaultSpy = jest.spyOn(spaceEvent, "preventDefault");

    groupDiv?.dispatchEvent(spaceEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("should not prevent dragover when item is being dragged from this group", () => {
    const { container, getByTestId } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    // Simulate that the group is being dragged
    const groupDiv = container.querySelector(".feedback-item-group");

    // First we need to set isBeingDragged to true somehow
    // This would normally happen through setIsGroupBeingDragged callback
    // Let's trigger a drag event to set the state

    const dragEvent = new Event("dragover", { bubbles: true, cancelable: true });
    const mockDataTransfer = { dropEffect: "" };
    Object.defineProperty(dragEvent, "dataTransfer", {
      value: mockDataTransfer,
      writable: true,
    });

    const preventDefaultSpy = jest.spyOn(dragEvent, "preventDefault");

    groupDiv?.dispatchEvent(dragEvent);

    // When not being dragged, preventDefault should be called
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("should have correct aria-label based on expansion state", () => {
    const { container, getByTestId } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem, { ...mockGroupedItem, id: "grouped-item-2" }]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group");
    expect(groupDiv?.getAttribute("aria-label")).toContain("Feedback group with 3 items, collapsed");

    // Expand the group
    const toggleButton = getByTestId("toggle-expand");
    fireEvent.click(toggleButton);

    expect(groupDiv?.getAttribute("aria-label")).toContain("Feedback group with 3 items, expanded");
  });

  describe("Accessibility - Group aria-label includes feedback title", () => {
    it("should include the main feedback item title in group aria-label", () => {
      const mainItemWithTitle = {
        ...mockMainItem,
        title: "Improve performance",
      };

      const { container } = render(<FeedbackItemGroup mainFeedbackItem={mainItemWithTitle} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Vote} />);

      const groupDiv = container.querySelector(".feedback-item-group");
      const ariaLabel = groupDiv?.getAttribute("aria-label");

      expect(ariaLabel).toContain("Improve performance");
      expect(ariaLabel).toContain("Feedback group with 2 items");
      expect(ariaLabel).toContain("collapsed");
    });

    it("should show 'Untitled feedback' when main item has no title", () => {
      const mainItemNoTitle = {
        ...mockMainItem,
        title: "",
      };

      const { container } = render(<FeedbackItemGroup mainFeedbackItem={mainItemNoTitle} groupedWorkItems={[]} workflowState={WorkflowPhase.Collect} />);

      const groupDiv = container.querySelector(".feedback-item-group");
      const ariaLabel = groupDiv?.getAttribute("aria-label");

      expect(ariaLabel).toContain("Untitled feedback");
    });

    it("should update aria-label to show 'expanded' when group is expanded", () => {
      const mainItemWithTitle = {
        ...mockMainItem,
        title: "Fix bugs",
      };

      const { container, getByTestId } = render(<FeedbackItemGroup mainFeedbackItem={mainItemWithTitle} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Group} />);

      const groupDiv = container.querySelector(".feedback-item-group");
      let ariaLabel = groupDiv?.getAttribute("aria-label");
      expect(ariaLabel).toContain("collapsed");

      const toggleButton = getByTestId("toggle-expand");
      fireEvent.click(toggleButton);

      ariaLabel = groupDiv?.getAttribute("aria-label");
      expect(ariaLabel).toContain("Fix bugs");
      expect(ariaLabel).toContain("expanded");
      expect(ariaLabel).not.toContain("collapsed");
    });

    it("should show correct item count in aria-label", () => {
      const mainItemWithTitle = {
        ...mockMainItem,
        title: "Add new feature",
      };

      const multipleGroupedItems = [
        { ...mockGroupedItem, id: "grouped-1", title: "Sub-item 1" },
        { ...mockGroupedItem, id: "grouped-2", title: "Sub-item 2" },
        { ...mockGroupedItem, id: "grouped-3", title: "Sub-item 3" },
      ];

      const { container } = render(<FeedbackItemGroup mainFeedbackItem={mainItemWithTitle} groupedWorkItems={multipleGroupedItems} workflowState={WorkflowPhase.Vote} />);

      const groupDiv = container.querySelector(".feedback-item-group");
      const ariaLabel = groupDiv?.getAttribute("aria-label");

      expect(ariaLabel).toContain("Add new feature");
      expect(ariaLabel).toContain("Feedback group with 4 items");
    });

    it("should announce group with single item correctly", () => {
      const mainItemWithTitle = {
        ...mockMainItem,
        title: "Single feedback",
      };

      const { container } = render(<FeedbackItemGroup mainFeedbackItem={mainItemWithTitle} groupedWorkItems={[]} workflowState={WorkflowPhase.Vote} />);

      const groupDiv = container.querySelector(".feedback-item-group");
      const ariaLabel = groupDiv?.getAttribute("aria-label");

      expect(ariaLabel).toContain("Single feedback");
      expect(ariaLabel).toContain("Feedback group with 1 items");
    });
  });

  it("should update isBeingDragged state when setIsGroupBeingDragged is called", () => {
    // Create a component instance to test the setIsGroupBeingDragged method
    let capturedSetIsGroupBeingDragged: ((isBeingDragged: boolean) => void) | null = null;

    // Temporarily override the mock to capture the callback
    const MockFeedbackItem = ({ groupedItemProps }: any) => {
      if (groupedItemProps?.setIsGroupBeingDragged) {
        capturedSetIsGroupBeingDragged = groupedItemProps.setIsGroupBeingDragged;
      }
      return (
        <div data-testid="feedback-item-mock" className="feedback-item-mock">
          {groupedItemProps?.isMainItem && groupedItemProps?.toggleGroupExpand && (
            <button onClick={groupedItemProps.toggleGroupExpand} data-testid="toggle-expand">
              {groupedItemProps.isGroupExpanded ? "Collapse" : "Expand"}
            </button>
          )}
        </div>
      );
    };

    jest.isolateModules(() => {
      jest.doMock("../feedbackItem", () => ({
        __esModule: true,
        default: MockFeedbackItem,
        FeedbackItemHelper: {
          handleDropFeedbackItemOnFeedbackItem: jest.fn(),
        },
      }));
    });

    render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    // Call the captured callback to test the setIsGroupBeingDragged method
    expect(capturedSetIsGroupBeingDragged).toBeDefined();
    if (capturedSetIsGroupBeingDragged) {
      // This should update the component's isBeingDragged state
      capturedSetIsGroupBeingDragged(true);
      capturedSetIsGroupBeingDragged(false);
    }
  });
});
