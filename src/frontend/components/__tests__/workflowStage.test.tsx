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

    expect(document.querySelector('[aria-label="Selected Sample Workflow Stage Text workflow stage"]')).toBeTruthy();
    expect(document.querySelector(".retrospective-workflowState.active")).toBeTruthy();
  });

  it("renders as inactive when isActive is false", () => {
    const inactiveProps = { ...mockedProps, isActive: false };
    render(<WorkflowStage {...inactiveProps} />);

    expect(document.querySelector('[aria-label="Not selected Sample Workflow Stage Text workflow stage"]')).toBeTruthy();
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
});
