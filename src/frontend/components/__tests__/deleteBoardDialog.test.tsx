import React from "react";
import { render } from "@testing-library/react";
// @ts-ignore - user-event types seem to have issues
import userEvent from "@testing-library/user-event";
import DeleteBoardDialog from "../deleteBoardDialog";
import { IBoardSummaryTableItem } from "../boardSummaryTable";

const mockBoard: IBoardSummaryTableItem = {
  id: "board-1",
  boardName: "Sprint Retro",
  createdDate: new Date(),
  feedbackItemsCount: 12,
  totalWorkItemsCount: 3,
  pendingWorkItemsCount: 1,
  teamId: "team-1",
  ownerId: "user-1",
};

const mockProps = {
  board: mockBoard,
  hidden: false,
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

describe("DeleteBoardDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when board is undefined", () => {
    const { container } = render(<DeleteBoardDialog {...mockProps} board={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog when visible", () => {
    render(<DeleteBoardDialog {...mockProps} />);
    // FluentUI Dialog renders to document body, so we need to search the whole document
    expect(document.body.textContent).toContain("Delete Retrospective");
    expect(document.body.textContent).toContain("Warning:");
  });

  it("renders the correct board name and feedback count", () => {
    render(<DeleteBoardDialog {...mockProps} />);
    expect(document.body.textContent).toContain(mockBoard.boardName);
    expect(document.body.textContent).toContain(mockBoard.feedbackItemsCount.toString());
  });

  it("calls onConfirm when Delete is clicked", async () => {
    const user = userEvent.setup();
    render(<DeleteBoardDialog {...mockProps} />);

    // Find button by text content in the document
    const deleteButton = Array.from(document.querySelectorAll("button")).find(button => button.textContent === "Delete");
    expect(deleteButton).toBeDefined();

    await user.click(deleteButton!);

    expect(mockProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<DeleteBoardDialog {...mockProps} />);

    // Find button by text content in the document
    const cancelButton = Array.from(document.querySelectorAll("button")).find(button => button.textContent === "Cancel");
    expect(cancelButton).toBeDefined();

    await user.click(cancelButton!);

    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
