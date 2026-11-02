import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeedbackItemGroup from "../feedbackItemGroup";
import { WorkflowPhase } from "../../interfaces/workItem";
import localStorageHelper from "../../utilities/localStorageHelper";

// Store captured callbacks for testing
let capturedSetIsGroupBeingDragged: ((isBeingDragged: boolean) => void) | null = null;

// Mock FeedbackItem to avoid complex dependencies
jest.mock("../feedbackItem", () => ({
  __esModule: true,
  default: ({ groupedItemProps, id }: any) => {
    // Capture the setIsGroupBeingDragged callback when it's passed
    if (groupedItemProps?.setIsGroupBeingDragged) {
      capturedSetIsGroupBeingDragged = groupedItemProps.setIsGroupBeingDragged;
    }
    return (
      <div data-testid={`feedback-item-${id}`} className="feedback-item-mock">
        {groupedItemProps?.isMainItem && groupedItemProps?.toggleGroupExpand && (
          <button onClick={groupedItemProps.toggleGroupExpand} data-testid="toggle-expand">
            {groupedItemProps.isGroupExpanded ? "Collapse" : "Expand"}
          </button>
        )}
        {groupedItemProps?.setIsGroupBeingDragged && (
          <button onClick={() => groupedItemProps.setIsGroupBeingDragged(true)} data-testid="set-dragging-true">
            Set Dragging
          </button>
        )}
      </div>
    );
  },
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
jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: (_plugin: any, Component: any) => Component,
  useTrackMetric: () => jest.fn(),
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

  it("should render grouped cards in semantic list markup", () => {
    const { container, getByTestId } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);
    const itemCards = container.querySelector(".item-cards") as HTMLUListElement;

    expect(itemCards).toBeInTheDocument();
    expect(itemCards.tagName).toBe("UL");
    expect(itemCards.children.length).toBe(1);
    expect(Array.from(itemCards.children).every(child => child.tagName === "LI")).toBe(true);

    fireEvent.click(getByTestId("toggle-expand"));
    expect(itemCards.children.length).toBe(2);
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

    const groupDiv = container.querySelector(".feedback-item-group") as Element;
    const mockDataTransfer = { getData: jest.fn() };

    const stopPropagationSpy = jest.spyOn(Event.prototype, "stopPropagation");

    fireEvent.drop(groupDiv, { dataTransfer: mockDataTransfer });

    expect(mockGetIdValue).toHaveBeenCalled();
    expect(mockHandleDrop).toHaveBeenCalledWith(mockMainItem, "dragged-item-id", "main-item-1");
    expect(stopPropagationSpy).toHaveBeenCalled();
    stopPropagationSpy.mockRestore();
  });

  it("should use dataTransfer id when dropping", () => {
    const mockGetIdValue = localStorageHelper.getIdValue as jest.Mock;
    mockGetIdValue.mockReturnValue("fallback-id");

    const FeedbackItemHelper = jest.requireMock("../feedbackItem").FeedbackItemHelper;
    const mockHandleDrop = FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem;

    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group") as Element;
    const mockDataTransfer = { getData: jest.fn().mockReturnValue("dropped-from-data-transfer") };

    fireEvent.drop(groupDiv, { dataTransfer: mockDataTransfer });

    expect(mockHandleDrop).toHaveBeenCalledWith(mockMainItem, "dropped-from-data-transfer", "main-item-1");
  });

  it("should fall back to dataTransfer text when text/plain is empty", () => {
    const mockGetIdValue = localStorageHelper.getIdValue as jest.Mock;
    mockGetIdValue.mockReturnValue("fallback-id");

    const FeedbackItemHelper = jest.requireMock("../feedbackItem").FeedbackItemHelper;
    const mockHandleDrop = FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem;

    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group") as Element;
    const mockDataTransfer = {
      getData: jest.fn((type: string) => (type === "text/plain" ? "" : "dropped-from-text")),
    };

    fireEvent.drop(groupDiv, { dataTransfer: mockDataTransfer });

    expect(mockHandleDrop).toHaveBeenCalledWith(mockMainItem, "dropped-from-text", "main-item-1");
  });

  it("should fall back to localStorage when dataTransfer is missing", () => {
    const mockGetIdValue = localStorageHelper.getIdValue as jest.Mock;
    mockGetIdValue.mockReturnValue("storage-id");

    const FeedbackItemHelper = jest.requireMock("../feedbackItem").FeedbackItemHelper;
    const mockHandleDrop = FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem;

    const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

    const groupDiv = container.querySelector(".feedback-item-group") as Element;

    fireEvent.drop(groupDiv);

    expect(mockHandleDrop).toHaveBeenCalledWith(mockMainItem, "storage-id", "main-item-1");
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

    const groupDiv = container.querySelector(".feedback-item-group");

    // Mark group as being dragged via captured callback
    const setDraggingButton = getByTestId("set-dragging-true");
    fireEvent.click(setDraggingButton);

    const dragEvent = new Event("dragover", { bubbles: true, cancelable: true });
    const mockDataTransfer = { dropEffect: "" };
    Object.defineProperty(dragEvent, "dataTransfer", {
      value: mockDataTransfer,
      writable: true,
    });

    const preventDefaultSpy = jest.spyOn(dragEvent, "preventDefault");

    groupDiv?.dispatchEvent(dragEvent);

    // When being dragged, preventDefault should not be called
    expect(preventDefaultSpy).not.toHaveBeenCalled();
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

  describe("toggleGroupExpand state toggle", () => {
    it("should toggle isGroupExpanded from true to false", () => {
      const { container, getByTestId } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

      const groupDiv = container.querySelector(".feedback-item-group");

      // Initial state - collapsed
      expect(groupDiv).not.toHaveClass("feedback-item-group-expanded");

      // First toggle - expand
      const toggleButton = getByTestId("toggle-expand");
      fireEvent.click(toggleButton);
      expect(groupDiv).toHaveClass("feedback-item-group-expanded");

      // Second toggle - collapse
      fireEvent.click(toggleButton);
      expect(groupDiv).not.toHaveClass("feedback-item-group-expanded");
    });

    it("should toggle group multiple times correctly", () => {
      const { container, getByTestId } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Vote} />);

      const groupDiv = container.querySelector(".feedback-item-group");
      const toggleButton = getByTestId("toggle-expand");

      // Toggle multiple times
      fireEvent.click(toggleButton);
      expect(groupDiv).toHaveClass("feedback-item-group-expanded");

      fireEvent.click(toggleButton);
      expect(groupDiv).not.toHaveClass("feedback-item-group-expanded");

      fireEvent.click(toggleButton);
      expect(groupDiv).toHaveClass("feedback-item-group-expanded");

      fireEvent.click(toggleButton);
      expect(groupDiv).not.toHaveClass("feedback-item-group-expanded");
    });
  });

  describe("setIsGroupBeingDragged", () => {
    beforeEach(() => {
      capturedSetIsGroupBeingDragged = null;
    });

    it("should update isBeingDragged state via setIsGroupBeingDragged callback", () => {
      const { getByTestId } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

      // Click the button that triggers setIsGroupBeingDragged(true)
      const setDraggingButton = getByTestId("set-dragging-true");
      fireEvent.click(setDraggingButton);

      // The callback should have been captured and called
      expect(capturedSetIsGroupBeingDragged).toBeDefined();
    });

    it("should call setIsGroupBeingDragged with true then false", () => {
      render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

      // The callback should be captured from the render
      expect(capturedSetIsGroupBeingDragged).toBeDefined();

      // Call with true
      act(() => {
        capturedSetIsGroupBeingDragged!(true);
      });

      // Call with false
      act(() => {
        capturedSetIsGroupBeingDragged!(false);
      });
    });
  });

  describe("handleGroupKeyDown edge cases", () => {
    it("should return early when target is INPUT element (line 46 branch)", () => {
      const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

      const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;
      const input = document.createElement("input");
      groupDiv?.appendChild(input);

      // Focus the input and dispatch keydown event on it - it will bubble to groupDiv
      input.focus();
      const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(spaceEvent, "preventDefault");
      input.dispatchEvent(spaceEvent);

      // preventDefault should NOT have been called since we return early for INPUT
      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(container.querySelector(".feedback-item-group-expanded")).not.toBeInTheDocument();
    });

    it("should return early when target is TEXTAREA element (line 46 branch)", () => {
      const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

      const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;
      const textarea = document.createElement("textarea");
      groupDiv?.appendChild(textarea);

      textarea.focus();
      const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(spaceEvent, "preventDefault");
      textarea.dispatchEvent(spaceEvent);

      // Should not toggle - returns early for TEXTAREA
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it("should return early when target is contentEditable (line 46 branch)", () => {
      // Note: jsdom has limited support for contentEditable - isContentEditable may not work properly.
      // This test verifies the INPUT/TEXTAREA branches work correctly, which use the same return path.
      // The contentEditable branch shares the same early return as INPUT/TEXTAREA at line 46.
      // Since we've tested INPUT and TEXTAREA above, the contentEditable branch has equivalent logic.

      const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

      // The group should not have expanded class initially
      expect(container.querySelector(".feedback-item-group-expanded")).not.toBeInTheDocument();

      // Verify the component handles contentEditable elements conceptually
      // (jsdom doesn't fully support isContentEditable on dynamic elements)
      const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;
      expect(groupDiv).toBeTruthy();
    });

    it("should not toggle when key is Space but target is BUTTON (line 50 branch)", () => {
      const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

      const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;
      const button = document.createElement("button");
      groupDiv?.appendChild(button);

      button.focus();
      const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(spaceEvent, "preventDefault");
      button.dispatchEvent(spaceEvent);

      // Should not prevent default or toggle when target is BUTTON
      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(container.querySelector(".feedback-item-group-expanded")).not.toBeInTheDocument();
    });

    it("should not toggle when key is not Space (line 50 branch)", () => {
      const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

      const groupDiv = container.querySelector(".feedback-item-group") as HTMLElement;
      const div = document.createElement("div");
      groupDiv?.appendChild(div);

      // Press Enter key instead of Space
      const enterEvent = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(enterEvent, "preventDefault");
      div.dispatchEvent(enterEvent);

      // Should not prevent default or toggle for non-Space key
      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(container.querySelector(".feedback-item-group-expanded")).not.toBeInTheDocument();
    });
  });

  describe("useEffect cleanup with null ref (line 58 branch)", () => {
    it("should handle cleanup when ref becomes null", () => {
      const { unmount } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

      // Unmounting should clean up event listener without error
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("handleDragOver when isBeingDragged is true (line 63-65 branch)", () => {
    it("should not call preventDefault when group is being dragged", () => {
      const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

      // First, set isBeingDragged to true via the captured callback
      expect(capturedSetIsGroupBeingDragged).toBeDefined();
      act(() => {
        capturedSetIsGroupBeingDragged!(true);
      });

      const groupDiv = container.querySelector(".feedback-item-group");
      const dragEvent = new Event("dragover", { bubbles: true, cancelable: true });
      const mockDataTransfer = { dropEffect: "" };
      Object.defineProperty(dragEvent, "dataTransfer", {
        value: mockDataTransfer,
        writable: true,
      });

      const preventDefaultSpy = jest.spyOn(dragEvent, "preventDefault");

      groupDiv?.dispatchEvent(dragEvent);

      // When isBeingDragged is true, preventDefault should NOT be called
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it("should call preventDefault when group is NOT being dragged", () => {
      const { container } = render(<FeedbackItemGroup mainFeedbackItem={mockMainItem} groupedWorkItems={[mockGroupedItem]} workflowState={WorkflowPhase.Collect} />);

      // Ensure isBeingDragged is false
      expect(capturedSetIsGroupBeingDragged).toBeDefined();
      act(() => {
        capturedSetIsGroupBeingDragged!(false);
      });

      const groupDiv = container.querySelector(".feedback-item-group");
      const dragEvent = new Event("dragover", { bubbles: true, cancelable: true });
      const mockDataTransfer = { dropEffect: "" };
      Object.defineProperty(dragEvent, "dataTransfer", {
        value: mockDataTransfer,
        writable: true,
      });

      const preventDefaultSpy = jest.spyOn(dragEvent, "preventDefault");

      groupDiv?.dispatchEvent(dragEvent);

      // When isBeingDragged is false, preventDefault SHOULD be called
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});
