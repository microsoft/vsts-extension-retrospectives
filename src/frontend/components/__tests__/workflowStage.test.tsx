import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { mocked } from "jest-mock";
import WorkflowStage from "../../components/workflowStage";
import { WorkflowPhase } from "../../interfaces/workItem";

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
}));

const mockedProps = mocked({
  display: "Sample Workflow Stage Text",
  ariaPosInSet: 1,
  value: WorkflowPhase.Collect,
  isActive: true,
  clickEventCallback: jest.fn(() => {}),
});

describe("Workflow Stage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders as active when isActive is true", () => {
    const activeProps = { ...mockedProps, isActive: true };
    render(<WorkflowStage {...activeProps} />);

    const element = document.querySelector(".retrospective-workflowState");
    expect(element?.getAttribute("aria-label")).toBe("Sample Workflow Stage Text");
    expect(element?.getAttribute("aria-selected")).toBe("true");
    expect(document.querySelector(".retrospective-workflowState.active")).toBeTruthy();
  });

  it("renders as inactive when isActive is false", () => {
    const inactiveProps = { ...mockedProps, isActive: false };
    render(<WorkflowStage {...inactiveProps} />);

    const element = document.querySelector(".retrospective-workflowState");
    expect(element?.getAttribute("aria-label")).toBe("Sample Workflow Stage Text");
    expect(element?.getAttribute("aria-selected")).toBe("false");
    expect(document.querySelector(".retrospective-workflowState.active")).toBeFalsy();
    expect(document.querySelector(".retrospective-workflowState")).toBeTruthy();
  });

  it("calls clickEventCallback when the Enter key is pressed", async () => {
    const user = userEvent.setup();
    render(<WorkflowStage {...mockedProps} />);

    const element = document.querySelector(".retrospective-workflowState") as HTMLElement;

    await user.click(element);

    await user.keyboard("{Enter}");

    expect(mockedProps.clickEventCallback).toHaveBeenCalledTimes(1);
  });

  it("calls clickEventCallback when the component is clicked", async () => {
    render(<WorkflowStage {...mockedProps} />);

    const element = document.querySelector(".retrospective-workflowState") as HTMLElement;
    await userEvent.click(element);

    expect(mockedProps.clickEventCallback).toHaveBeenCalledTimes(1);
  });

  it("displays the correct text", () => {
    render(<WorkflowStage {...mockedProps} />);

    expect(document.body.textContent).toContain("Sample Workflow Stage Text");
  });

  it("has correct ARIA attributes", () => {
    render(<WorkflowStage {...mockedProps} />);

    const element = document.querySelector(".retrospective-workflowState");
    expect(element?.getAttribute("role")).toBe("tab");
    expect(element?.getAttribute("aria-setsize")).toBe("4");
    expect(element?.getAttribute("aria-posinset")).toBe("1");
    expect(element?.getAttribute("tabindex")).toBe("0");
  });

  it("does not call clickEventCallback for non-Enter key presses", async () => {
    const user = userEvent.setup();
    render(<WorkflowStage {...mockedProps} />);

    const element = document.querySelector(".retrospective-workflowState") as HTMLElement;
    element.focus();

    await user.keyboard("{Space}");
    await user.keyboard("{Escape}");
    await user.keyboard("a");

    // clickEventCallback should not have been called for these keys
    expect(mockedProps.clickEventCallback).not.toHaveBeenCalled();
  });

  it("returns early when non-Enter key is pressed", async () => {
    const user = userEvent.setup();
    render(<WorkflowStage {...mockedProps} />);

    const element = document.querySelector(".retrospective-workflowState") as HTMLElement;
    element.focus();

    // Press arrow key
    await user.keyboard("{ArrowDown}");

    // Should return early without calling callback
    expect(mockedProps.clickEventCallback).not.toHaveBeenCalled();
  });

  describe("Accessibility - Issue #1319", () => {
    it("has concise aria-label without 'Selected' or 'workflow stage' text", () => {
      const activeProps = { ...mockedProps, isActive: true };
      render(<WorkflowStage {...activeProps} />);

      const element = document.querySelector(".retrospective-workflowState");
      const ariaLabel = element?.getAttribute("aria-label");

      // Should only contain the display text
      expect(ariaLabel).toBe("Sample Workflow Stage Text");

      // Should not contain verbose text
      expect(ariaLabel).not.toContain("Selected");
      expect(ariaLabel).not.toContain("Not selected");
      expect(ariaLabel).not.toContain("workflow stage");
    });

    it("uses aria-selected attribute to indicate selected state", () => {
      const activeProps = { ...mockedProps, isActive: true };
      const { rerender } = render(<WorkflowStage {...activeProps} />);

      let element = document.querySelector(".retrospective-workflowState");
      expect(element?.getAttribute("aria-selected")).toBe("true");

      // Change to inactive
      const inactiveProps = { ...mockedProps, isActive: false };
      rerender(<WorkflowStage {...inactiveProps} />);

      element = document.querySelector(".retrospective-workflowState");
      expect(element?.getAttribute("aria-selected")).toBe("false");
    });

    it("has simplified aria-labels for each workflow phase", () => {
      const collectProps = { ...mockedProps, display: "Collect", value: WorkflowPhase.Collect };
      const { rerender } = render(<WorkflowStage {...collectProps} />);

      let element = document.querySelector(".retrospective-workflowState");
      expect(element?.getAttribute("aria-label")).toBe("Collect");

      // Test Group
      const groupProps = { ...mockedProps, display: "Group", value: WorkflowPhase.Group };
      rerender(<WorkflowStage {...groupProps} />);
      element = document.querySelector(".retrospective-workflowState");
      expect(element?.getAttribute("aria-label")).toBe("Group");

      // Test Vote
      const voteProps = { ...mockedProps, display: "Vote", value: WorkflowPhase.Vote };
      rerender(<WorkflowStage {...voteProps} />);
      element = document.querySelector(".retrospective-workflowState");
      expect(element?.getAttribute("aria-label")).toBe("Vote");

      // Test Act
      const actProps = { ...mockedProps, display: "Act", value: WorkflowPhase.Act };
      rerender(<WorkflowStage {...actProps} />);
      element = document.querySelector(".retrospective-workflowState");
      expect(element?.getAttribute("aria-label")).toBe("Act");
    });

    it("maintains proper tab role and ARIA attributes", () => {
      render(<WorkflowStage {...mockedProps} />);

      const element = document.querySelector(".retrospective-workflowState");

      // Verify all required ARIA attributes for tabs
      expect(element?.getAttribute("role")).toBe("tab");
      expect(element?.getAttribute("aria-label")).toBeTruthy();
      expect(element?.getAttribute("aria-selected")).toBeTruthy();
      expect(element?.getAttribute("aria-setsize")).toBe("4");
      expect(element?.getAttribute("aria-posinset")).toBeTruthy();
      expect(element?.getAttribute("tabindex")).toBe("0");
    });

    it("correctly announces state changes when toggling between active/inactive", () => {
      const { rerender } = render(<WorkflowStage {...mockedProps} />);

      let element = document.querySelector(".retrospective-workflowState");
      expect(element?.getAttribute("aria-selected")).toBe("true");
      expect(element?.classList.contains("active")).toBe(true);

      // Toggle to inactive
      rerender(<WorkflowStage {...mockedProps} isActive={false} />);
      element = document.querySelector(".retrospective-workflowState");
      expect(element?.getAttribute("aria-selected")).toBe("false");
      expect(element?.classList.contains("active")).toBe(false);

      // Toggle back to active
      rerender(<WorkflowStage {...mockedProps} isActive={true} />);
      element = document.querySelector(".retrospective-workflowState");
      expect(element?.getAttribute("aria-selected")).toBe("true");
      expect(element?.classList.contains("active")).toBe(true);
    });
  });
});
