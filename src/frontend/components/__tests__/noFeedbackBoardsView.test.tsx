import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import NoFeedbackBoardsView, { NoFeedbackBoardsViewProps } from "../noFeedbackBoardsView";

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
}));

const mockOnCreateBoardClick = jest.fn(() => {});

const defaultTestProps: NoFeedbackBoardsViewProps = {
  onCreateBoardClick: mockOnCreateBoardClick,
};

describe("No Feedback Boards View component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with proper text content", () => {
    render(<NoFeedbackBoardsView {...defaultTestProps} />);

    expect(document.querySelector(".no-boards-container")).toBeTruthy();

    expect(document.body.textContent).toContain("Get started with your first Retrospective");
    expect(document.body.textContent).toContain("Create a new board to start collecting feedback and create new work items.");
    expect(document.body.textContent).toContain("Create Board");
  });

  it("renders create board button", () => {
    render(<NoFeedbackBoardsView {...defaultTestProps} />);

    expect(document.querySelector(".create-new-board-button")).toBeTruthy();
  });

  it("calls onCreateBoardClick when button is clicked", async () => {
    render(<NoFeedbackBoardsView {...defaultTestProps} />);

    const button = document.querySelector(".create-new-board-button") as HTMLElement;
    await userEvent.click(button);

    expect(mockOnCreateBoardClick).toHaveBeenCalledTimes(1);
  });
});
