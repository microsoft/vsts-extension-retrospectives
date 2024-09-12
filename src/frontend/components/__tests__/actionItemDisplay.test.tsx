import * as React from "react";
import { shallow } from 'enzyme';
import toJson from "enzyme-to-json";
import ActionItemDisplay, {
  ActionItemDisplayProps,
} from "../actionItemDisplay";

const mockOnUpdateActionItem = jest.fn(() => {});

const defaultTestProps: ActionItemDisplayProps = {
  feedbackItemId: "101",
  feedbackItemTitle: "Test Feedback Item Title",
  team: undefined,
  boardId: "Test Board Id",
  boardTitle: "Test Board Title",
  defaultIteration: "1",
  defaultAreaPath: "/testPath",
  actionItems: [],
  nonHiddenWorkItemTypes: [],
  allWorkItemTypes: [],
  allowAddNewActionItem: false,
  onUpdateActionItem: mockOnUpdateActionItem,
};

describe("Action Item Display component", () => {
  it("renders correctly when there are no action items.", () => {
    const wrapper = shallow(<ActionItemDisplay {...defaultTestProps} />);
    const component = wrapper.children().dive();
    expect(toJson(component)).toMatchSnapshot();
  });

  it("renders correctly when action items exist", () => {});
});
