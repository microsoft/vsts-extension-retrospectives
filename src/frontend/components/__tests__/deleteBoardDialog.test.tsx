import React from "react";
import { shallow } from "enzyme";
import DeleteBoardDialog from "../deleteBoardDialog";
import { IBoardSummaryTableItem } from "../boardSummaryTable";
import { Dialog, PrimaryButton, DefaultButton } from "office-ui-fabric-react";

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
  it("does not render when board is undefined", () => {
    const wrapper = shallow(<DeleteBoardDialog {...mockProps} board={undefined} />);
    expect(wrapper.html()).toBeNull();
  });

  it("renders dialog when visible", () => {
    const wrapper = shallow(<DeleteBoardDialog {...mockProps} />);
    expect(wrapper.find(Dialog).prop("hidden")).toBe(false);
    expect(wrapper.find("p.warning-text")).toHaveLength(1); // Ensure warning message exists
  });

  it("renders the correct board name and feedback count", () => {
    const wrapper = shallow(<DeleteBoardDialog {...mockProps} />);
    expect(wrapper.find("strong").at(0).text()).toBe(mockBoard.boardName);
    expect(wrapper.find("strong").at(1).text()).toBe(mockBoard.feedbackItemsCount.toString());
  });

  it("calls onConfirm when Delete is clicked", () => {
    const wrapper = shallow(<DeleteBoardDialog {...mockProps} />);
    wrapper.find(PrimaryButton).simulate("click");
    expect(mockProps.onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when Cancel is clicked", () => {
    const wrapper = shallow(<DeleteBoardDialog {...mockProps} />);
    wrapper.find(DefaultButton).simulate("click");
    expect(mockProps.onCancel).toHaveBeenCalled();
  });
});
