import React from "react";
import { render, screen } from "@testing-library/react";
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

    const element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
    expect(element).toHaveAttribute("aria-label", "Sample Workflow Stage Text");
    expect(element).toHaveAttribute("aria-selected", "true");
    expect(element).toHaveClass("font-bold", "border-b-2", "border-[#0078d4]");
  });

  it("renders as inactive when isActive is false", () => {
    const inactiveProps = { ...mockedProps, isActive: false };
    render(<WorkflowStage {...inactiveProps} />);

    const element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
    expect(element).toHaveAttribute("aria-label", "Sample Workflow Stage Text");
    expect(element).toHaveAttribute("aria-selected", "false");
    expect(element).not.toHaveClass("font-bold");
    expect(element).toBeInTheDocument();
  });

  it("calls clickEventCallback when the Enter key is pressed", async () => {
    const user = userEvent.setup();
    render(<WorkflowStage {...mockedProps} />);

    const element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
    element.focus();

    await user.keyboard("{Enter}");

    expect(mockedProps.clickEventCallback).toHaveBeenCalledTimes(1);
  });

  it("calls clickEventCallback when the component is clicked", async () => {
    render(<WorkflowStage {...mockedProps} />);

    const element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
    await userEvent.click(element);

    expect(mockedProps.clickEventCallback).toHaveBeenCalledTimes(1);
  });

  it("displays the correct text", () => {
    render(<WorkflowStage {...mockedProps} />);

    expect(document.body.textContent).toContain("Sample Workflow Stage Text");
  });

  it("has correct ARIA attributes", () => {
    render(<WorkflowStage {...mockedProps} />);

    const element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
    expect(element).toHaveAttribute("role", "tab");
    expect(element).toHaveAttribute("aria-setsize", "4");
    expect(element).toHaveAttribute("aria-posinset", "1");
    expect(element).toHaveAttribute("tabindex", "0");
  });

  it("does not call clickEventCallback for non-Enter key presses", async () => {
    const user = userEvent.setup();
    render(<WorkflowStage {...mockedProps} />);

    const element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
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

    const element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
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

      const element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
      const ariaLabel = element.getAttribute("aria-label");

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

      let element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
      expect(element).toHaveAttribute("aria-selected", "true");

      // Change to inactive
      const inactiveProps = { ...mockedProps, isActive: false };
      rerender(<WorkflowStage {...inactiveProps} />);

      element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
      expect(element).toHaveAttribute("aria-selected", "false");
    });

    it("has simplified aria-labels for each workflow phase", () => {
      const collectProps = { ...mockedProps, display: "Collect", value: WorkflowPhase.Collect };
      const { rerender } = render(<WorkflowStage {...collectProps} />);

      let element = screen.getByRole("tab", { name: "Collect" });
      expect(element).toHaveAttribute("aria-label", "Collect");

      // Test Group
      const groupProps = { ...mockedProps, display: "Group", value: WorkflowPhase.Group };
      rerender(<WorkflowStage {...groupProps} />);
      element = screen.getByRole("tab", { name: "Group" });
      expect(element).toHaveAttribute("aria-label", "Group");

      // Test Vote
      const voteProps = { ...mockedProps, display: "Vote", value: WorkflowPhase.Vote };
      rerender(<WorkflowStage {...voteProps} />);
      element = screen.getByRole("tab", { name: "Vote" });
      expect(element).toHaveAttribute("aria-label", "Vote");

      // Test Act
      const actProps = { ...mockedProps, display: "Act", value: WorkflowPhase.Act };
      rerender(<WorkflowStage {...actProps} />);
      element = screen.getByRole("tab", { name: "Act" });
      expect(element).toHaveAttribute("aria-label", "Act");
    });

    it("maintains proper tab role and ARIA attributes", () => {
      render(<WorkflowStage {...mockedProps} />);

      const element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });

      // Verify all required ARIA attributes for tabs
      expect(element).toHaveAttribute("role", "tab");
      expect(element).toHaveAttribute("aria-label");
      expect(element).toHaveAttribute("aria-selected");
      expect(element).toHaveAttribute("aria-setsize", "4");
      expect(element).toHaveAttribute("aria-posinset");
      expect(element).toHaveAttribute("tabindex", "0");
    });

    it("correctly announces state changes when toggling between active/inactive", () => {
      const { rerender } = render(<WorkflowStage {...mockedProps} />);

      let element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
      expect(element).toHaveAttribute("aria-selected", "true");
      expect(element).toHaveClass("font-bold", "border-b-2");

      // Toggle to inactive
      rerender(<WorkflowStage {...mockedProps} isActive={false} />);
      element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
      expect(element).toHaveAttribute("aria-selected", "false");
      expect(element).not.toHaveClass("font-bold");

      // Toggle back to active
      rerender(<WorkflowStage {...mockedProps} isActive={true} />);
      element = screen.getByRole("tab", { name: "Sample Workflow Stage Text" });
      expect(element).toHaveAttribute("aria-selected", "true");
      expect(element).toHaveClass("font-bold", "border-b-2");
    });
  });
});
