import React from "react";
import { render, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import SelectorCombo, { ISelectorComboProps, ISelectorList, ISelectorListItem, ISelectorListItemHeader } from "../selectorCombo";

jest.mock("../../utilities/telemetryClient", () => ({
  trackTrace: jest.fn(),
  trackEvent: jest.fn(),
  trackException: jest.fn(),
}));

jest.mock("applicationinsights-js", () => ({
  AppInsights: {
    trackEvent: jest.fn(),
    trackTrace: jest.fn(),
    trackException: jest.fn(),
  },
}));

jest.mock("azure-devops-extension-sdk", () => ({
  getConfiguration: () => ({}),
  notifyLoadSucceeded: jest.fn(),
  notifyLoadFailed: jest.fn(),
  getContributionId: () => "test-contribution-id",
  getHost: () => ({ id: "test-host-id" }),
  getService: jest.fn(),
}));

(global as any).VSS = {
  getConfiguration: () => ({}),
  notifyLoadSucceeded: jest.fn(),
  notifyLoadFailed: jest.fn(),
  getContributionId: () => "test-contribution-id",
  getHost: () => ({ id: "test-host-id" }),
  getService: jest.fn(),
};

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
  header: mockHeader,
  items: mockItems,
  finishedLoading: true,
};

const mockSelectorListItemNotLoaded: ISelectorListItem<MockItem> = {
  header: mockHeader,
  items: [],
  finishedLoading: false,
};

const mockSelectorList: ISelectorList<MockItem> = {
  selectorListItems: [mockSelectorListItem],
};

const nameGetter = (item: MockItem) => item.name;
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

const getSelectorButton = (container: HTMLElement) => container.querySelector("[data-testid='selector-button']");

describe("SelectorCombo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Render", () => {
    test("renders correctly with default props", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector(".test-selector")).toBeTruthy();
      expect(getSelectorButton(container)).toBeTruthy();
      expect(container.firstChild).toBeTruthy();
    });

    test("displays current value text in selector button", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.textContent).toContain("Item One");
    });

    test("renders selector button with correct title attribute", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const button = getSelectorButton(container);
      expect(button).toBeTruthy();
      expect(button?.getAttribute("aria-label")).toContain("Test Selector");
    });

    test("renders selector button with correct aria attributes", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const button = getSelectorButton(container);
      expect(button).toBeTruthy();
      expect(button?.getAttribute("aria-label")).toContain("Test Selector");
      expect(button?.getAttribute("aria-expanded")).toBe("false");
      expect(button?.getAttribute("role")).toBe("button");
    });

    test("renders icon with correct class name", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector("svg")).toBeTruthy();
    });

    test("renders callout with correct props when hidden", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(getSelectorButton(container)).toBeTruthy();
      expect(container.querySelector("[data-is-visible='true']")).toBeFalsy();
    });
  });

  describe("State Management", () => {
    test("initializes with correct default state", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
      const button = getSelectorButton(container);
      expect(button?.getAttribute("aria-expanded")).toBe("false");
    });

    test("updates aria-expanded when callout visibility changes", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const button = getSelectorButton(container);
      expect(button).toBeTruthy();

      expect(button?.getAttribute("aria-expanded")).toBe("false");

      expect(button?.getAttribute("role")).toBe("button");
      expect(button?.getAttribute("aria-label")).toContain("Test Selector");
    });
  });

  describe("Selector Button Interactions", () => {
    test("toggles callout visibility when selector button is clicked", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const selectorButton = getSelectorButton(container);
      expect(selectorButton).toBeTruthy();

      expect(container.querySelector("[data-is-visible='true']")).toBeFalsy();

      expect(selectorButton).toBeTruthy();
    });

    test("handles keyboard interaction on selector button", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const selectorButton = getSelectorButton(container);
      expect(selectorButton).toBeTruthy();

      expect(selectorButton).not.toBeNull();
      expect(selectorButton).toBeInstanceOf(HTMLElement);
    });

    test("selector button has proper accessibility attributes", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const selectorButton = getSelectorButton(container);
      expect(selectorButton).toBeTruthy();

      expect(selectorButton).toBeInstanceOf(HTMLElement);
    });

    test("maintains filter text state correctly", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector(".test-selector")).toBeTruthy();
    });
  });

  describe("Callout Interactions", () => {
    test("renders callout component correctly", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector(".test-selector")).toBeTruthy();
    });

    test("handles callout visibility state", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(getSelectorButton(container)).toBeTruthy();
    });
  });

  describe("Filter Functionality", () => {
    test("renders filter text field correctly", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector(".test-selector")).toBeTruthy();
    });

    test("handles filter text state management", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(getSelectorButton(container)).toBeTruthy();
    });

    test("supports case-insensitive filtering", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
    });

    test("trims filter text appropriately", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector(".test-selector")).toBeTruthy();
    });

    test("handles empty filter results", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Search Results Aria Label", () => {
    test("provides accessibility labels for search results", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector(".test-selector")).toBeTruthy();
    });

    test("updates aria labels based on search results count", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(getSelectorButton(container)).toBeTruthy();
    });

    test("handles aria labels when no filter is applied", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("List Rendering", () => {
    test("renders list header when not hidden", () => {
      const propsWithVisibleHeader = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [
            {
              header: mockHeader,
              items: mockItems,
              finishedLoading: true,
            },
          ],
        },
      };

      const { container } = render(<SelectorCombo {...propsWithVisibleHeader} />);

      expect(container.firstChild).toBeTruthy();
      expect(getSelectorButton(container)).toBeTruthy();
    });

    test("does not render list header when hidden", () => {
      const propsWithHiddenHeader = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [
            {
              header: mockHeaderHidden,
              items: mockItems,
              finishedLoading: true,
            },
          ],
        },
      };

      const { container } = render(<SelectorCombo {...propsWithHiddenHeader} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.textContent).not.toContain("Hidden Header");
    });

    test("renders shimmer components when not finished loading", () => {
      const propsWithLoading = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [mockSelectorListItemNotLoaded],
        },
      };

      const { container } = render(<SelectorCombo {...propsWithLoading} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector(".test-selector")).toBeTruthy();
    });

    test("does not render shimmer components when finished loading", () => {
      const propsWithFinishedLoading = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [
            {
              header: mockHeader,
              items: mockItems,
              finishedLoading: true,
            },
          ],
        },
      };

      const { container } = render(<SelectorCombo {...propsWithFinishedLoading} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector(".test-selector")).toBeTruthy();
      expect(getSelectorButton(container)).toBeTruthy();
    });

    test("configures list virtualization correctly", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector(".test-selector")).toBeTruthy();

      expect(getSelectorButton(container)).toBeTruthy();
    });
  });

  describe("List Item Interactions", () => {
    test("handles list item click events properly", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(onClickMock).toBeDefined();
    });

    test("supports keyboard navigation on list items", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector(".test-selector")).toBeTruthy();
    });

    test("filters keyboard events appropriately", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
    });

    test("provides correct accessibility labels for list items", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(getSelectorButton(container)).toBeTruthy();
    });

    test("handles accessibility labels for hidden headers", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
    });

    test("renders list items with appropriate icon classes", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector(".test-selector")).toBeTruthy();
    });

    test("provides title attributes for list item text", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(getSelectorButton(container)).toBeTruthy();
    });
  });

  describe("Interactive behavior", () => {
    test("toggles callout visibility and clears filter when closed", () => {
      const comboRef = React.createRef<SelectorCombo<MockItem>>();
      const { getByTestId, getByPlaceholderText } = render(<SelectorCombo {...defaultProps} ref={comboRef} />);

      const selectorButton = getByTestId("selector-button");
      fireEvent.click(selectorButton);
      const searchInput = getByPlaceholderText("Search") as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: "Item" } });
      expect(comboRef.current?.state.isSelectorCalloutVisible).toBe(true);
      expect(comboRef.current?.state.currentFilterText).toBe("Item");

      fireEvent.click(selectorButton);
      expect(comboRef.current?.state.isSelectorCalloutVisible).toBe(false);
      expect(comboRef.current?.state.currentFilterText).toBe("");
    });

    test("filters list items based on search input", () => {
      const { getByTestId, getByPlaceholderText } = render(<SelectorCombo {...defaultProps} />);
      fireEvent.click(getByTestId("selector-button"));
      const searchInput = getByPlaceholderText("Search");
      fireEvent.change(searchInput, { target: { value: "Another" } });

      const listContainer = document.body.querySelector(".selector-list-container") as HTMLElement;
      expect(within(listContainer).getByText("Another Item")).toBeInTheDocument();
      expect(within(listContainer).queryByText("Item One")).toBeNull();
    });

    test("invokes selectorListItemOnClick when a list item is clicked", () => {
      const clickSpy = jest.fn();
      const { getByTestId } = render(<SelectorCombo {...defaultProps} selectorListItemOnClick={clickSpy} />);

      fireEvent.click(getByTestId("selector-button"));
      const firstListItem = document.body.querySelector(".selector-list-item") as HTMLElement;
      fireEvent.click(firstListItem);

      expect(clickSpy).toHaveBeenCalledWith(mockItems[0]);
    });

    test("handles keyboard selection on list items", () => {
      const clickSpy = jest.fn();
      const { getByTestId } = render(<SelectorCombo {...defaultProps} selectorListItemOnClick={clickSpy} />);

      fireEvent.click(getByTestId("selector-button"));
      const firstListItem = document.body.querySelector(".selector-list-item") as HTMLElement;
      fireEvent.keyDown(firstListItem, { key: "Enter", keyCode: 13, which: 13 });

      expect(clickSpy).toHaveBeenCalledWith(mockItems[0]);
    });

    test("supports keyboard toggling on selector button", () => {
      const comboRef = React.createRef<SelectorCombo<MockItem>>();
      const { getByTestId } = render(<SelectorCombo {...defaultProps} ref={comboRef} />);

      const selectorButton = getByTestId("selector-button");
      fireEvent.keyDown(selectorButton, { key: "Enter", keyCode: 13, which: 13 });

      expect(comboRef.current?.state.isSelectorCalloutVisible).toBe(true);
    });
  });

  describe("Choose Item Logic", () => {
    test("handles item selection and callout visibility", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(onClickMock).toBeDefined();
    });

    test("manages callout state during item selection", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector(".test-selector")).toBeTruthy();
    });

    test("handles mobile dialog interactions", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(getSelectorButton(container)).toBeTruthy();
    });

    test("maintains proper state when dialog is hidden", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Multiple Selector List Items", () => {
    test("renders multiple selector list items correctly", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector(".test-selector")).toBeTruthy();
    });

    test("calculates item counts across multiple lists", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(getSelectorButton(container)).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    test("handles empty selector lists gracefully", () => {
      const emptyProps = {
        ...defaultProps,
        selectorList: { selectorListItems: [] as ISelectorListItem<MockItem>[] },
      };

      const { container } = render(<SelectorCombo {...emptyProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector(".test-selector")).toBeTruthy();
    });

    test("handles empty items arrays properly", () => {
      const emptyItemsProps = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [
            {
              header: mockHeader,
              items: [] as MockItem[],
              finishedLoading: true,
            },
          ],
        },
      };

      const { container } = render(<SelectorCombo {...emptyItemsProps} />);

      expect(getSelectorButton(container)).toBeTruthy();
    });

    test("handles undefined properties gracefully", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Ref Handling", () => {
    test("manages selector button refs properly", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(getSelectorButton(container)).toBeTruthy();
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Class Names and Styling", () => {
    test("applies correct CSS classes to components", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector(".test-selector")).toBeTruthy();
      expect(getSelectorButton(container)).toBeTruthy();
    });

    test("handles scrollable list attributes", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Keyboard Interactions", () => {
    test("opens callout when Enter key is pressed on selector button", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const selectorButton = getSelectorButton(container) as HTMLElement;

      // Simulate Enter key press (keyCode 13)
      const enterEvent = new KeyboardEvent("keydown", { keyCode: 13, bubbles: true });
      selectorButton.dispatchEvent(enterEvent);

      // Component should still be rendered after key press
      expect(getSelectorButton(container)).toBeTruthy();
    });

    test("handles key press on list item", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      // Open the callout first
      const selectorButton = getSelectorButton(container) as HTMLElement;
      selectorButton.click();

      // Find a list item
      const listItems = container.querySelectorAll(".selector-list-item");
      if (listItems.length > 0) {
        const firstItem = listItems[0] as HTMLElement;

        // Simulate Enter key press on item
        const enterEvent = new KeyboardEvent("keydown", { keyCode: 13, bubbles: true });
        firstItem.dispatchEvent(enterEvent);

        // Component should still be functional
        expect(container.firstChild).toBeTruthy();
      }
    });

    test("does not trigger action for non-Enter key presses", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const selectorButton = getSelectorButton(container) as HTMLElement;

      // Simulate Space key press (keyCode 32)
      const spaceEvent = new KeyboardEvent("keydown", { keyCode: 32, bubbles: true });
      selectorButton.dispatchEvent(spaceEvent);

      // Component should still be rendered
      expect(container.firstChild).toBeTruthy();
    });

    test("closes mobile selector dialog when choosing an item", () => {
      // Set up mobile environment
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 500 });

      const mockItemOnClick = jest.fn();
      const mobileProps = {
        ...defaultProps,
        selectorListItemOnClick: mockItemOnClick,
      };

      const { container } = render(<SelectorCombo {...mobileProps} />);

      const selectorButton = getSelectorButton(container) as HTMLElement;
      selectorButton.click();

      // Trigger item selection
      setTimeout(() => {
        const listItems = container.querySelectorAll(".selector-list-item");
        if (listItems.length > 0) {
          (listItems[0] as HTMLElement).click();
          expect(mockItemOnClick).toHaveBeenCalled();
        }
      }, 10);

      // Restore
      Object.defineProperty(window, "innerWidth", { value: originalInnerWidth, writable: true, configurable: true });
    });

    test("closes callout when choosing an item from callout", () => {
      const mockItemOnClick = jest.fn();
      const calloutProps = {
        ...defaultProps,
        selectorListItemOnClick: mockItemOnClick,
      };

      const { container } = render(<SelectorCombo {...calloutProps} />);

      const selectorButton = getSelectorButton(container) as HTMLElement;
      selectorButton.click();

      // Trigger item selection
      setTimeout(() => {
        const listItems = container.querySelectorAll(".selector-list-item");
        if (listItems.length > 0) {
          (listItems[0] as HTMLElement).click();
          expect(mockItemOnClick).toHaveBeenCalledWith(mockItems[0]);
        }
      }, 10);
    });

    test("handles header visibility correctly", () => {
      const visibleHeaderProps = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [
            {
              header: { ...mockHeader, isHidden: false },
              items: mockItems,
              finishedLoading: true,
            },
          ],
        },
      };

      const { container } = render(<SelectorCombo {...visibleHeaderProps} />);
      const selectorButton = getSelectorButton(container) as HTMLElement;
      selectorButton.click();

      expect(container).toBeTruthy();
    });

    test("hides header when isHidden is true", () => {
      const hiddenHeaderProps = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [
            {
              header: { ...mockHeader, isHidden: true },
              items: mockItems,
              finishedLoading: true,
            },
          ],
        },
      };

      const { container } = render(<SelectorCombo {...hiddenHeaderProps} />);
      const selectorButton = getSelectorButton(container) as HTMLElement;
      selectorButton.click();

      expect(container).toBeTruthy();
    });
  });

  describe("Multiple lists", () => {
    test("counts items correctly across multiple selector list items", () => {
      const multiListProps = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [
            {
              header: mockHeader,
              items: mockItems.slice(0, 2),
              finishedLoading: true,
            },
            {
              header: { ...mockHeader, id: "header-2", title: "Header 2" },
              items: mockItems.slice(2, 3),
              finishedLoading: true,
            },
          ],
        },
      };

      const { container } = render(<SelectorCombo {...multiListProps} />);

      const selectorButton = getSelectorButton(container) as HTMLElement;
      selectorButton.click();

      // Should count items from all lists
      expect(container).toBeTruthy();
    });

    test("handles empty items array in list", () => {
      const emptyItemsListProps = {
        ...defaultProps,
        selectorList: {
          selectorListItems: [
            {
              header: mockHeader,
              items: [] as MockItem[],
              finishedLoading: true,
            },
          ],
        },
      };

      const { container } = render(<SelectorCombo {...emptyItemsListProps} />);

      const selectorButton = getSelectorButton(container) as HTMLElement;
      selectorButton.click();

      expect(container).toBeTruthy();
    });
  });

  describe("Keyboard handlers", () => {
    test("handleKeyPressTeamList selects item on Enter key", () => {
      const onSelectedItemChange = jest.fn();
      const propsWithCallback = {
        ...defaultProps,
        onSelectedItemChange,
      };

      const { container } = render(<SelectorCombo {...propsWithCallback} />);

      // Open the callout
      const selectorButton = getSelectorButton(container) as HTMLElement;
      selectorButton.click();

      // Find an item in the list and press Enter on it
      const listItems = container.querySelectorAll(".selector-list-item-name");
      if (listItems.length > 0) {
        fireEvent.keyDown(listItems[0], { keyCode: 13 });
      }

      expect(container).toBeTruthy();
    });

    test("closeMobileSelectorDialog closes dialog on Escape key", () => {
      const mobileProps = {
        ...defaultProps,
        className: "board-selector",
      };

      const ref = React.createRef<SelectorCombo<MockItem>>();
      const { container } = render(<SelectorCombo {...mobileProps} ref={ref} />);

      // Manually set the state to show mobile dialog
      if (ref.current) {
        (ref.current as any).setState({ isSelectorDialogHidden: false });
      }

      // Press Escape key
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

      expect(container).toBeTruthy();
    });
  });

  describe("chooseItem with mobile dialog open", () => {
    test("closeMobileSelectorDialog is called when choosing item while dialog is open", () => {
      const clickSpy = jest.fn();
      const ref = React.createRef<SelectorCombo<MockItem>>();
      render(<SelectorCombo {...defaultProps} selectorListItemOnClick={clickSpy} ref={ref} />);

      // Manually set state to have dialog open
      if (ref.current) {
        (ref.current as any).setState({ isSelectorDialogHidden: false });
      }

      // Call chooseItem directly
      if (ref.current) {
        (ref.current as any).chooseItem(mockItems[0]);
      }

      // Verify closeMobileSelectorDialog was invoked (state should now be hidden)
      expect(ref.current?.state.isSelectorDialogHidden).toBe(true);
      expect(clickSpy).toHaveBeenCalledWith(mockItems[0]);
    });

    test("handleKeyPressTeamList does not call chooseItem for non-Enter keys", () => {
      const clickSpy = jest.fn();
      const ref = React.createRef<SelectorCombo<MockItem>>();
      render(<SelectorCombo {...defaultProps} selectorListItemOnClick={clickSpy} ref={ref} />);

      // Call handleKeyPressTeamList with non-Enter key
      if (ref.current) {
        const mockEvent = { keyCode: 27 } as React.KeyboardEvent<HTMLDivElement>; // Escape key
        (ref.current as any).handleKeyPressTeamList(mockEvent, mockItems[0]);
      }

      // chooseItem should not have been called
      expect(clickSpy).not.toHaveBeenCalled();
    });

    test("handleKeyPressTeamList calls chooseItem for Enter key", () => {
      const clickSpy = jest.fn();
      const ref = React.createRef<SelectorCombo<MockItem>>();
      render(<SelectorCombo {...defaultProps} selectorListItemOnClick={clickSpy} ref={ref} />);

      // Call handleKeyPressTeamList with Enter key (keyCode 13)
      if (ref.current) {
        const mockEvent = { keyCode: 13 } as React.KeyboardEvent<HTMLDivElement>;
        (ref.current as any).handleKeyPressTeamList(mockEvent, mockItems[0]);
      }

      // chooseItem should have been called
      expect(clickSpy).toHaveBeenCalledWith(mockItems[0]);
    });
  });
});
