import * as React from "react";
import { shallow } from 'enzyme';
import toJson from "enzyme-to-json";
import { ActionItem, ActionItemProps } from "../actionItem";

const mockOnUpdateActionItem = jest.fn(() => {});

const defaultTestProps: ActionItemProps = {
  feedbackItemId: "101",
  boardId: "Test Board Id",
  nonHiddenWorkItemTypes: [],
  allWorkItemTypes: [
    {
      color: "red",
      description: "Test description",
      icon: { id: "1", url: "testUrl" },
      isDisabled: false,
      name: "Test Work Item Type",
      referenceName: "Test Reference Name",
      fieldInstances: [],
      fields: [],
      states: [],
      transitions: {},
      xmlForm: "Test xmlForm",
      _links: {},
      url: "Test url"
    }
  ],
  onUpdateActionItem: mockOnUpdateActionItem,
  actionItem: {
    _links: {},
    url: "Test url",
    id: 1,
    commentVersionRef: { commentId: 1, version: 1, url: "Test url", createdInRevision: 1, isDeleted: false, text: "Test text" },
    relations: [],
    rev: 1,
    fields: {
      "System.Title": "Test Title",
      "System.WorkItemType": "Test Work Item Type",
    },
  },
  areActionIconsHidden: false,
  shouldFocus: false
};

describe("Action Item component", () => {
  it("renders correctly when there are no action items.", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it("renders correctly when action items exist and areActionIconsHidden is true", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} areActionIconsHidden={true} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it("renders correctly when action items exist and shouldFocus is true", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} shouldFocus={true} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it("renders correctly when action items exist and areActionIconsHidden is false", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} areActionIconsHidden={false} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it("renders correctly when action items exist and shouldFocus is false", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} shouldFocus={false} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it("focuses the openWorkItemButton when shouldFocus is true", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} shouldFocus={true} />);
    const instance = wrapper.instance() as ActionItem;
    const mockFocus = jest.fn();
    instance.openWorkItemButton = { focus: mockFocus } as unknown as HTMLButtonElement;
    instance.componentDidMount();
    expect(mockFocus).toHaveBeenCalled();
  });
});
