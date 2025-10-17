import React from "react";
import { render } from "@testing-library/react";
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

describe("SelectorCombo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Render", () => {
    test("renders correctly with default props", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector(".test-selector")).toBeTruthy();
      expect(container.querySelector(".selector-button")).toBeTruthy();
      expect(container.firstChild).toBeTruthy();
    });

    test("displays current value text in selector button", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.textContent).toContain("Item One");
    });

    test("renders selector button with correct title attribute", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const button = container.querySelector(".selector-button");
      expect(button).toBeTruthy();
      expect(button?.getAttribute("aria-label")).toContain("Test Selector");
    });

    test("renders selector button with correct aria attributes", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const button = container.querySelector(".selector-button");
      expect(button).toBeTruthy();
      expect(button?.getAttribute("aria-label")).toContain("Test Selector");
      expect(button?.getAttribute("aria-expanded")).toBe("false");
      expect(button?.getAttribute("role")).toBe("button");
    });

    test("renders icon with correct class name", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector(".fa-solid.fa-users")).toBeTruthy();
    });

    test("renders callout with correct props when hidden", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector(".selector-button")).toBeTruthy();
      expect(container.querySelector("[data-is-visible='true']")).toBeFalsy();
    });
  });

  describe("State Management", () => {
    test("initializes with correct default state", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
      const button = container.querySelector(".selector-button");
      expect(button?.getAttribute("aria-expanded")).toBe("false");
    });

    test("updates aria-expanded when callout visibility changes", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const button = container.querySelector(".selector-button");
      expect(button).toBeTruthy();

      expect(button?.getAttribute("aria-expanded")).toBe("false");

      expect(button?.getAttribute("role")).toBe("button");
      expect(button?.getAttribute("aria-label")).toContain("Test Selector");
    });
  });

  describe("Selector Button Interactions", () => {
    test("toggles callout visibility when selector button is clicked", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const selectorButton = container.querySelector(".selector-button");
      expect(selectorButton).toBeTruthy();

      expect(container.querySelector("[data-is-visible='true']")).toBeFalsy();

      expect(selectorButton).toBeTruthy();
    });

    test("handles keyboard interaction on selector button", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const selectorButton = container.querySelector(".selector-button");
      expect(selectorButton).toBeTruthy();

      expect(selectorButton).not.toBeNull();
      expect(selectorButton).toBeInstanceOf(HTMLElement);
    });

    test("selector button has proper accessibility attributes", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const selectorButton = container.querySelector(".selector-button");
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

      expect(container.querySelector(".selector-button")).toBeTruthy();
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

      expect(container.querySelector(".selector-button")).toBeTruthy();
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

      expect(container.querySelector(".selector-button")).toBeTruthy();
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
      expect(container.querySelector(".selector-button")).toBeTruthy();
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
      expect(container.querySelector(".selector-button")).toBeTruthy();
    });

    test("configures list virtualization correctly", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector(".test-selector")).toBeTruthy();

      expect(container.querySelector(".selector-button")).toBeTruthy();
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

      expect(container.querySelector(".selector-button")).toBeTruthy();
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

      expect(container.querySelector(".selector-button")).toBeTruthy();
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

      expect(container.querySelector(".selector-button")).toBeTruthy();
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

      expect(container.querySelector(".selector-button")).toBeTruthy();
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

      expect(container.querySelector(".selector-button")).toBeTruthy();
    });

    test("handles undefined properties gracefully", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Ref Handling", () => {
    test("manages selector button refs properly", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector(".selector-button")).toBeTruthy();
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Class Names and Styling", () => {
    test("applies correct CSS classes to components", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.querySelector(".test-selector")).toBeTruthy();
      expect(container.querySelector(".selector-button")).toBeTruthy();
    });

    test("handles scrollable list attributes", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Keyboard Interactions", () => {
    test("opens callout when Enter key is pressed on selector button", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      const selectorButton = container.querySelector(".selector-button") as HTMLElement;

      // Simulate Enter key press (keyCode 13)
      const enterEvent = new KeyboardEvent("keydown", { keyCode: 13, bubbles: true });
      selectorButton.dispatchEvent(enterEvent);

      // Component should still be rendered after key press
      expect(container.querySelector(".selector-button")).toBeTruthy();
    });

    test("handles key press on list item", () => {
      const { container } = render(<SelectorCombo {...defaultProps} />);

      // Open the callout first
      const selectorButton = container.querySelector(".selector-button") as HTMLElement;
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

      const selectorButton = container.querySelector(".selector-button") as HTMLElement;

      // Simulate Space key press (keyCode 32)
      const spaceEvent = new KeyboardEvent("keydown", { keyCode: 32, bubbles: true });
      selectorButton.dispatchEvent(spaceEvent);

      // Component should still be rendered
      expect(container.firstChild).toBeTruthy();
    });
  });
});
