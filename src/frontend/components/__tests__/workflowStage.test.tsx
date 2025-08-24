import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
// @ts-ignore - user-event types seem to have issues
import userEvent from "@testing-library/user-event";
import { mocked } from "jest-mock";
import WorkflowStage from "../../components/workflowStage";
import { WorkflowPhase } from "../../interfaces/workItem";

// Mock the telemetry client to avoid dependency issues
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

    // Check aria-label for active state
    expect(document.querySelector('[aria-label="Selected Sample Workflow Stage Text workflow stage"]')).toBeTruthy();
    // Check active class
    expect(document.querySelector(".retrospective-workflowState.active")).toBeTruthy();
  });

  it("renders as inactive when isActive is false", () => {
    const inactiveProps = { ...mockedProps, isActive: false };
    render(<WorkflowStage {...inactiveProps} />);

    // Check aria-label for inactive state
    expect(document.querySelector('[aria-label="Not selected Sample Workflow Stage Text workflow stage"]')).toBeTruthy();
    // Check that active class is not present
    expect(document.querySelector(".retrospective-workflowState.active")).toBeFalsy();
    expect(document.querySelector(".retrospective-workflowState")).toBeTruthy();
  });

  it("calls clickEventCallback when the Enter key is pressed", async () => {
    const user = userEvent.setup();
    render(<WorkflowStage {...mockedProps} />);

    const element = document.querySelector(".retrospective-workflowState") as HTMLElement;

    // Focus the element first
    await user.click(element);

    // Press Enter key using keyboard method with keyCode
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
});
