import React from "react";
import { shallow, mount, ReactWrapper } from "enzyme";
import { FocusTrapCallout } from "office-ui-fabric-react/lib/Callout";
import { List } from "office-ui-fabric-react/lib/List";
import { Shimmer } from "office-ui-fabric-react/lib/Shimmer";
import { TextField } from "office-ui-fabric-react/lib/TextField";

import SelectorCombo, { ISelectorComboProps, ISelectorList, ISelectorListItem, ISelectorListItemHeader } from "../selectorCombo";

interface MockItem {
  id: string;
  name: string;
}

const mockItems: MockItem[] = [
  { id: "1", name: "Item One" },
  { id: "2", name: "Item Two" },
  { id: "3", name: "Another Item" },
];

const mockHeader: ISelectorListItemHeader = {
  id: "header-1",
  title: "Test Header",
  isHidden: false,
};

const mockHeaderHidden: ISelectorListItemHeader = {
  id: "header-2",
  title: "Hidden Header",
  isHidden: true,
};

const mockSelectorListItem: ISelectorListItem<MockItem> = {
  finishedLoading: true,
  header: mockHeader,
  items: mockItems,
};

const mockSelectorListItemNotLoaded: ISelectorListItem<MockItem> = {
  finishedLoading: false,
  header: mockHeader,
  items: mockItems,
};

const mockSelectorListItemHidden: ISelectorListItem<MockItem> = {
  finishedLoading: true,
  header: mockHeaderHidden,
  items: mockItems,
};

const mockSelectorList: ISelectorList<MockItem> = {
  selectorListItems: [mockSelectorListItem],
};

const nameGetter = (item: MockItem): string => item.name;
const onClickMock = jest.fn();

const defaultProps: ISelectorComboProps<MockItem> = {
  className: "test-selector",
  currentValue: mockItems[0],
  iconName: "users",
  selectorList: mockSelectorList,
  title: "Test Selector",
  nameGetter,
  selectorListItemOnClick: onClickMock,
};

describe("SelectorCombo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Render", () => {
    it("renders correctly with default props", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      expect(wrapper.find("div").first().hasClass("test-selector")).toBe(true);
      expect(wrapper.find(".selector-button")).toHaveLength(1);
      expect(wrapper.find(FocusTrapCallout)).toHaveLength(1);
    });

    it("displays current value text in selector button", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const buttonText = wrapper.find(".selector-button-text");
      expect(buttonText.text()).toBe("Item One");
    });

    it("renders selector button with correct aria attributes", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const button = wrapper.find(".selector-button");

      expect(button.prop("aria-label")).toBe("Click to search and select Test Selector. Current selection is Item One");
      expect(button.prop("aria-expanded")).toBe(false);
      expect(button.prop("aria-haspopup")).toBe("true");
      expect(button.prop("role")).toBe("button");
      expect(button.prop("tabIndex")).toBe(0);
    });

    it("renders icon with correct class name", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const icon = wrapper.find(".selector-button-icon");
      expect(icon.hasClass("fa-solid")).toBe(true);
      expect(icon.hasClass("fa-users")).toBe(true);
    });

    it("renders callout with correct props when hidden", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const callout = wrapper.find(FocusTrapCallout);

      expect(callout.prop("hidden")).toBe(true);
      expect(callout.prop("isBeakVisible")).toBe(false);
      expect(callout.prop("gapSpace")).toBe(0);
    });
  });

  describe("State Management", () => {
    it("initializes with correct default state", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const instance = wrapper.instance() as SelectorCombo<MockItem>;

      expect(instance.state.currentFilterText).toBe("");
      expect(instance.state.isSelectorCalloutVisible).toBe(false);
      expect(instance.state.isSelectorDialogHidden).toBe(true);
    });

    it("updates aria-expanded when callout visibility changes", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const button = wrapper.find(".selector-button");

      expect(button.prop("aria-expanded")).toBe(false);

      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const updatedButton = wrapper.find(".selector-button");
      expect(updatedButton.prop("aria-expanded")).toBe(true);
    });
  });

  describe("Selector Button Interactions", () => {
    it("toggles callout visibility when selector button is clicked", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const button = wrapper.find(".selector-button");

      expect(wrapper.state("isSelectorCalloutVisible")).toBe(false);

      button.simulate("click");
      expect(wrapper.state("isSelectorCalloutVisible")).toBe(true);

      button.simulate("click");
      expect(wrapper.state("isSelectorCalloutVisible")).toBe(false);
    });

    it("toggles callout when Enter key is pressed on selector button", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const button = wrapper.find(".selector-button");

      expect(wrapper.state("isSelectorCalloutVisible")).toBe(false);

      button.simulate("keyDown", { keyCode: 13 });
      expect(wrapper.state("isSelectorCalloutVisible")).toBe(true);
    });

    it("does not toggle callout when other keys are pressed on selector button", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const button = wrapper.find(".selector-button");

      expect(wrapper.state("isSelectorCalloutVisible")).toBe(false);

      button.simulate("keyDown", { keyCode: 32 });
      expect(wrapper.state("isSelectorCalloutVisible")).toBe(false);
    });

    it("clears filter text when callout is closed", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);

      wrapper.setState({
        currentFilterText: "test filter",
        isSelectorCalloutVisible: true,
      });

      const button = wrapper.find(".selector-button");
      button.simulate("click");

      setTimeout(() => {
        expect(wrapper.state("currentFilterText")).toBe("");
      }, 0);
    });
  });

  describe("Callout Interactions", () => {
    it("hides callout when onDismiss is called", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });

      const callout = wrapper.find(FocusTrapCallout);
      callout.prop("onDismiss")!();

      expect(wrapper.state("isSelectorCalloutVisible")).toBe(false);
    });

    it("shows callout content when visible", () => {
      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const callout = wrapper.find(FocusTrapCallout);
      expect(callout.prop("hidden")).toBe(false);
    });
  });

  describe("Filter Functionality", () => {
    it("updates filter text when TextField value changes", () => {
      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const textField = wrapper.find(TextField);
      textField.prop("onChange")!({} as React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, "test filter");

      expect(wrapper.state("currentFilterText")).toBe("test filter");
    });

    it("filters items based on filter text", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const instance = wrapper.instance() as SelectorCombo<MockItem>;

      wrapper.setState({ currentFilterText: "Item" });
      const filteredList = instance["getFilteredValues"]();

      expect(filteredList.selectorListItems[0].items).toHaveLength(3);

      wrapper.setState({ currentFilterText: "One" });
      const filteredListSpecific = instance["getFilteredValues"]();

      expect(filteredListSpecific.selectorListItems[0].items).toHaveLength(1);
      expect(filteredListSpecific.selectorListItems[0].items[0].name).toBe("Item One");
    });

    it("filters items case-insensitively", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const instance = wrapper.instance() as SelectorCombo<MockItem>;

      wrapper.setState({ currentFilterText: "item one" });
      const filteredList = instance["getFilteredValues"]();

      expect(filteredList.selectorListItems[0].items).toHaveLength(1);
      expect(filteredList.selectorListItems[0].items[0].name).toBe("Item One");
    });

    it("trims filter text before filtering", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const instance = wrapper.instance() as SelectorCombo<MockItem>;

      wrapper.setState({ currentFilterText: "  One  " });
      const filteredList = instance["getFilteredValues"]();

      expect(filteredList.selectorListItems[0].items).toHaveLength(1);
      expect(filteredList.selectorListItems[0].items[0].name).toBe("Item One");
    });

    it("returns empty results when no items match filter", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const instance = wrapper.instance() as SelectorCombo<MockItem>;

      wrapper.setState({ currentFilterText: "nonexistent" });
      const filteredList = instance["getFilteredValues"]();

      expect(filteredList.selectorListItems[0].items).toHaveLength(0);
    });
  });

  describe("Search Results Aria Label", () => {
    it("shows correct aria label for single search result", () => {
      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      wrapper.setState({
        isSelectorCalloutVisible: true,
        currentFilterText: "Item One",
      });
      wrapper.update();

      const textField = wrapper.find(TextField);
      expect(textField.prop("ariaLabel")).toContain("Found 1 result.");
    });

    it("shows correct aria label for multiple search results", () => {
      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      wrapper.setState({
        isSelectorCalloutVisible: true,
        currentFilterText: "Item",
      });
      wrapper.update();

      const textField = wrapper.find(TextField);
      expect(textField.prop("ariaLabel")).toContain("Found 3 results.");
    });

    it("shows correct aria label when no filter text is entered", () => {
      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const textField = wrapper.find(TextField);
      expect(textField.prop("ariaLabel")).toBe(" Please enter text here to search.");
    });
  });

  describe("List Rendering", () => {
    it("renders list with correct items", () => {
      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const list = wrapper.find(List);
      expect(list).toHaveLength(1);
      expect(list.prop("items")).toEqual(mockItems);
    });

    it("renders list header when not hidden", () => {
      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const headerText = wrapper.find(".selector-list-header-text");
      expect(headerText).toHaveLength(1);
      expect(headerText.text()).toBe("Test Header");
    });

    it("does not render list header when hidden", () => {
      const propsWithHiddenHeader = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [mockSelectorListItemHidden],
        },
      };

      const wrapper = mount(<SelectorCombo {...propsWithHiddenHeader} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const headerText = wrapper.find(".selector-list-header-text");
      expect(headerText).toHaveLength(0);
    });

    it("renders shimmer components when not finished loading", () => {
      const propsWithLoading = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [mockSelectorListItemNotLoaded],
        },
      };

      const wrapper = mount(<SelectorCombo {...propsWithLoading} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const shimmers = wrapper.find(Shimmer);
      expect(shimmers).toHaveLength(5);
    });

    it("does not render shimmer components when finished loading", () => {
      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const shimmers = wrapper.find(Shimmer);
      expect(shimmers).toHaveLength(0);
    });

    it("configures list virtualization correctly", () => {
      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const list = wrapper.find(List);
      const shouldVirtualize = list.prop("onShouldVirtualize");
      expect(shouldVirtualize!({} as React.ComponentProps<typeof List>)).toBe(true);
    });
  });

  describe("List Item Interactions", () => {
    let wrapper: ReactWrapper;

    beforeEach(() => {
      wrapper = mount(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();
    });

    it("calls selectorListItemOnClick when list item is clicked", () => {
      const list = wrapper.find(List);
      const onRenderCell = list.prop("onRenderCell");
      const cellWrapper = mount(onRenderCell!(mockItems[1], 1) as React.ReactElement);

      const listItem = cellWrapper.find(".selector-list-item");
      listItem.simulate("click");

      expect(onClickMock).toHaveBeenCalledWith(mockItems[1]);
    });

    it("calls chooseItem when Enter key is pressed on list item", () => {
      const list = wrapper.find(List);
      const onRenderCell = list.prop("onRenderCell");
      const cellWrapper = mount(onRenderCell!(mockItems[1], 1) as React.ReactElement);

      const listItem = cellWrapper.find(".selector-list-item");
      listItem.simulate("keyDown", { keyCode: 13 });

      expect(onClickMock).toHaveBeenCalledWith(mockItems[1]);
    });

    it("does not call chooseItem when other keys are pressed on list item", () => {
      const list = wrapper.find(List);
      const onRenderCell = list.prop("onRenderCell");
      const cellWrapper = mount(onRenderCell!(mockItems[1], 1) as React.ReactElement);

      const listItem = cellWrapper.find(".selector-list-item");
      listItem.simulate("keyDown", { keyCode: 32 });

      expect(onClickMock).not.toHaveBeenCalled();
    });

    it("renders list item with correct aria label when header is not hidden", () => {
      const list = wrapper.find(List);
      const onRenderCell = list.prop("onRenderCell");
      const cellWrapper = mount(onRenderCell!(mockItems[1], 1) as React.ReactElement);

      const listItem = cellWrapper.find(".selector-list-item");
      expect(listItem.prop("aria-label")).toBe("Test Header collection. Test Selector 2 of 3. Item Two");
    });

    it("renders list item with correct aria label when header is hidden", () => {
      const propsWithHiddenHeader = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [mockSelectorListItemHidden],
        },
      };

      const wrapperHidden = mount(<SelectorCombo {...propsWithHiddenHeader} />);
      wrapperHidden.setState({ isSelectorCalloutVisible: true });
      wrapperHidden.update();

      const list = wrapperHidden.find(List);
      const onRenderCell = list.prop("onRenderCell");
      const cellWrapper = mount(onRenderCell!(mockItems[1], 1) as React.ReactElement);

      const listItem = cellWrapper.find(".selector-list-item");
      expect(listItem.prop("aria-label")).toBe("Test Selector 2 of 3. Item Two");
    });

    it("renders list item with correct icon class", () => {
      const list = wrapper.find(List);
      const onRenderCell = list.prop("onRenderCell");
      const cellWrapper = mount(onRenderCell!(mockItems[0], 0) as React.ReactElement);

      const icon = cellWrapper.find("i");
      expect(icon.hasClass("fa-solid")).toBe(true);
      expect(icon.hasClass("fa-users")).toBe(true);
    });

    it("renders list item text with correct title attribute", () => {
      const list = wrapper.find(List);
      const onRenderCell = list.prop("onRenderCell");
      const cellWrapper = mount(onRenderCell!(mockItems[0], 0) as React.ReactElement);

      const textDiv = cellWrapper.find(".selector-list-item-text");
      expect(textDiv.prop("title")).toBe("Item One");
      expect(textDiv.text()).toBe("Item One");
    });
  });

  describe("Choose Item Logic", () => {
    it("hides callout when item is chosen and callout is visible", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });

      const instance = wrapper.instance() as SelectorCombo<MockItem>;
      instance["chooseItem"](mockItems[1]);

      expect(wrapper.state("isSelectorCalloutVisible")).toBe(false);
      expect(onClickMock).toHaveBeenCalledWith(mockItems[1]);
    });

    it("does not hide callout when item is chosen and callout is not visible", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: false });

      const instance = wrapper.instance() as SelectorCombo<MockItem>;
      instance["chooseItem"](mockItems[1]);

      expect(wrapper.state("isSelectorCalloutVisible")).toBe(false);
      expect(onClickMock).toHaveBeenCalledWith(mockItems[1]);
    });

    it("closes mobile selector dialog when item is chosen and dialog is not hidden", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorDialogHidden: false });

      const instance = wrapper.instance() as SelectorCombo<MockItem>;
      instance["chooseItem"](mockItems[1]);

      expect(wrapper.state("isSelectorDialogHidden")).toBe(true);
      expect(onClickMock).toHaveBeenCalledWith(mockItems[1]);
    });

    it("does not change dialog state when item is chosen and dialog is already hidden", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorDialogHidden: true });

      const instance = wrapper.instance() as SelectorCombo<MockItem>;
      instance["chooseItem"](mockItems[1]);

      expect(wrapper.state("isSelectorDialogHidden")).toBe(true);
      expect(onClickMock).toHaveBeenCalledWith(mockItems[1]);
    });
  });

  describe("Multiple Selector List Items", () => {
    const multipleSelectorList: ISelectorList<MockItem> = {
      selectorListItems: [
        mockSelectorListItem,
        {
          finishedLoading: true,
          header: { id: "header-2", title: "Second Header", isHidden: false },
          items: [{ id: "4", name: "Item Four" }],
        },
      ],
    };

    it("renders multiple selector list items", () => {
      const propsWithMultiple = {
        ...defaultProps,
        selectorList: multipleSelectorList,
      };

      const wrapper = mount(<SelectorCombo {...propsWithMultiple} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const lists = wrapper.find(".selector-list");
      expect(lists).toHaveLength(2);
    });

    it("calculates correct item count for multiple lists in search results", () => {
      const propsWithMultiple = {
        ...defaultProps,
        selectorList: multipleSelectorList,
      };

      const wrapper = mount(<SelectorCombo {...propsWithMultiple} />);
      wrapper.setState({
        isSelectorCalloutVisible: true,
        currentFilterText: "Item",
      });
      wrapper.update();

      const textField = wrapper.find(TextField);
      expect(textField.prop("ariaLabel")).toContain("Found 4 results.");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty selector list", () => {
      const emptyProps = {
        ...defaultProps,
        selectorList: { selectorListItems: [] as ISelectorListItem<MockItem>[] },
      };

      const wrapper = mount(<SelectorCombo {...emptyProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const lists = wrapper.find(".selector-list");
      expect(lists).toHaveLength(0);
    });

    it("handles selector list item with empty items array", () => {
      const emptyItemsProps = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [
            {
              finishedLoading: true,
              header: mockHeader,
              items: [] as MockItem[],
            },
          ],
        },
      };

      const wrapper = mount(<SelectorCombo {...emptyItemsProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const list = wrapper.find(List);
      expect(list.prop("items")).toEqual([]);
    });

    it("handles selector list items with undefined properties gracefully", () => {
      const selectorListWithPartialData: ISelectorList<MockItem> = {
        selectorListItems: [
          {
            finishedLoading: true,
            header: mockHeader,
            items: mockItems,
          },
          {
            finishedLoading: false,
            header: mockHeader,
            items: [],
          },
        ],
      };

      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      const instance = wrapper.instance() as SelectorCombo<MockItem>;

      wrapper.setState({ currentFilterText: "test" });

      expect(() => {
        instance["renderSelectorCombo"](selectorListWithPartialData, true);
      }).not.toThrow();
    });
  });

  describe("Ref Handling", () => {
    it("sets selectorButton ref correctly", () => {
      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      const instance = wrapper.instance() as SelectorCombo<MockItem>;

      const buttonElement = wrapper.find(".selector-button").getDOMNode();
      expect(instance["selectorButton"]).toBe(buttonElement);
    });
  });

  describe("Class Names and Styling", () => {
    it("applies correct class names to callout", () => {
      const wrapper = shallow(<SelectorCombo {...defaultProps} />);
      const callout = wrapper.find(FocusTrapCallout);

      expect(callout.hasClass("selector-callout")).toBe(true);
      expect(callout.hasClass("test-selector")).toBe(true);
    });

    it("sets data-is-scrollable attribute on list container", () => {
      const wrapper = mount(<SelectorCombo {...defaultProps} />);
      wrapper.setState({ isSelectorCalloutVisible: true });
      wrapper.update();

      const listContainer = wrapper.find(".selector-list-container");
      expect(listContainer.prop("data-is-scrollable")).toBe(true);
    });
  });
});
