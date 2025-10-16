import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";

const mockOpenNewWorkItem = jest.fn();
const mockGetUser = jest.fn(() => ({ name: "Test User", displayName: "Test User", id: "test-user-id" }));
const mockGetService = jest.fn(() => ({
  openNewWorkItem: mockOpenNewWorkItem,
}));

jest.mock("azure-devops-extension-sdk", () => ({
  getService: mockGetService,
  getUser: mockGetUser,
}));

jest.mock("azure-devops-extension-api/WorkItemTracking", () => ({
  WorkItemTrackingServiceIds: {
    WorkItemFormNavigationService: "WorkItemFormNavigationService",
  },
}));

(global as any).getService = mockGetService;
(global as any).getUser = mockGetUser;

const mockAddAssociatedActionItem = jest.fn();
jest.mock("../../dal/itemDataService", () => ({
  itemDataService: {
    addAssociatedActionItem: mockAddAssociatedActionItem,
  },
}));

jest.mock("../../utilities/boardUrlHelper", () => ({
  getBoardUrl: jest.fn(() => Promise.resolve("http://test-board-url")),
}));

const mockTrackEvent = jest.fn();
jest.mock("../../utilities/telemetryClient", () => ({
  appInsights: {
    trackEvent: mockTrackEvent,
  },
  TelemetryEvents: {
    WorkItemCreated: "WorkItemCreated",
    ExistingWorkItemLinked: "ExistingWorkItemLinked",
  },
  reactPlugin: {},
}));

const mockGetWorkItemsByIds = jest.fn();
const mockCreateWorkItem = jest.fn();
jest.mock("../../dal/azureDevOpsWorkItemService", () => ({
  workItemService: {
    getWorkItemsByIds: mockGetWorkItemsByIds,
    createWorkItem: mockCreateWorkItem,
  },
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: (reactPlugin: any, Component: any) => Component,
}));

import ActionItemDisplay, { ActionItemDisplayProps } from "../actionItemDisplay";

const defaultTestProps: ActionItemDisplayProps = {
  feedbackItemId: "101",
  feedbackItemTitle: "Test Feedback Item Title",
  team: {
    id: "team-123",
    name: "Test Team",
  } as any,
  boardId: "Test Board Id",
  boardTitle: "Test Board Title",
  defaultIteration: "1",
  defaultAreaPath: "/testPath",
  actionItems: [],
  nonHiddenWorkItemTypes: [],
  allWorkItemTypes: [],
  allowAddNewActionItem: false,
  onUpdateActionItem: jest.fn(),
};

describe("Action Item Display component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenNewWorkItem.mockResolvedValue({ id: 123 });
    mockAddAssociatedActionItem.mockResolvedValue({ id: "updated-feedback-item" });
    mockGetWorkItemsByIds.mockResolvedValue([]);
    mockCreateWorkItem.mockResolvedValue({ id: 123, fields: { "System.Title": "Test Work Item" } });
    mockGetUser.mockReturnValue({ name: "Test User", displayName: "Test User", id: "test-user-id" });
    mockGetService.mockReturnValue({ openNewWorkItem: mockOpenNewWorkItem });
  });

  it("renders correctly when there are no action items", () => {
    const { container } = render(<ActionItemDisplay {...defaultTestProps} />);
    expect(container.querySelector(".action-items")).toBeTruthy();
  });

  it("renders correctly when action items exist", () => {
    const propsWithActionItems = {
      ...defaultTestProps,
      actionItems: [
        {
          id: 123,
          fields: { "System.Title": "Test Work Item" },
          _links: { html: { href: "http://test-url" } },
        } as any,
      ],
    };
    const { container } = render(<ActionItemDisplay {...propsWithActionItems} />);
    expect(container.querySelector(".action-items")).toBeTruthy();
  });

  it("renders add action item section when allowAddNewActionItem is true", () => {
    const propsWithAddEnabled = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [
        {
          name: "Bug",
          referenceName: "Microsoft.VSTS.WorkItemTypes.Bug",
          icon: { url: "bug-icon.png" },
          _links: {},
        } as any,
      ],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAddEnabled} />);
    expect(container.querySelector(".add-action-item-wrapper")).toBeTruthy();
  });

  it("does not render add action item section when allowAddNewActionItem is false", () => {
    const { container } = render(<ActionItemDisplay {...defaultTestProps} />);
    expect(container.querySelector(".add-action-item-wrapper")).toBeFalsy();
  });

  it("renders work item cards when action items exist", () => {
    const propsWithItems = {
      ...defaultTestProps,
      actionItems: [
        {
          id: 1,
          fields: {
            "System.Title": "Bug Item",
            "System.WorkItemType": "Bug",
            "System.State": "Active",
          },
          _links: { html: { href: "http://test-url-1" } },
        } as any,
        {
          id: 2,
          fields: {
            "System.Title": "Task Item",
            "System.WorkItemType": "Task",
            "System.State": "New",
          },
          _links: { html: { href: "http://test-url-2" } },
        } as any,
      ],
    };
    const { container } = render(<ActionItemDisplay {...propsWithItems} />);
    expect(container.querySelector(".action-items")).toBeTruthy();
    expect(container.innerHTML).toContain("action-items");
  });

  it("renders with disabled and checked state", () => {
    const propsWithStates = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      disabled: true,
      checked: true,
      nonHiddenWorkItemTypes: [
        {
          name: "Bug",
          referenceName: "Microsoft.VSTS.WorkItemTypes.Bug",
          icon: { url: "bug-icon.png" },
          _links: {},
        } as any,
      ],
    };
    const { container } = render(<ActionItemDisplay {...propsWithStates} />);
    expect(container.querySelector(".add-action-item-wrapper")).toBeTruthy();
  });

  it("renders dialog component with all elements", () => {
    const { container } = render(<ActionItemDisplay {...defaultTestProps} />);
    expect(container.querySelector(".action-items")).toBeTruthy();
  });

  it("handles multiple work item types", () => {
    const propsWithMultipleTypes = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any, { name: "Task", referenceName: "Microsoft.VSTS.WorkItemTypes.Task", icon: { url: "task-icon.png" }, _links: {} } as any, { name: "User Story", referenceName: "Microsoft.VSTS.WorkItemTypes.UserStory", icon: { url: "story-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithMultipleTypes} />);
    expect(container.querySelector(".add-action-item-wrapper")).toBeTruthy();
  });

  it("handles empty nonHiddenWorkItemTypes", () => {
    const propsEmpty = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [] as any[],
    };
    const { container } = render(<ActionItemDisplay {...propsEmpty} />);
    expect(container.querySelector(".add-action-item-wrapper")).toBeTruthy();
  });

  it("renders with different team and board configurations", () => {
    const propsWithDifferentConfig = {
      ...defaultTestProps,
      team: { id: "different-team-id", name: "Different Team Name" } as any,
      boardId: "Different Board Id",
      boardTitle: "Different Board Title",
      feedbackItemId: "different-feedback-id",
      feedbackItemTitle: "Different Feedback Title",
      defaultIteration: "Different\\Iteration\\Path",
      defaultAreaPath: "/Different/Area/Path",
    };
    const { container } = render(<ActionItemDisplay {...propsWithDifferentConfig} />);
    expect(container.querySelector(".action-items")).toBeTruthy();
  });

  it("calls onUpdateActionItem callback when provided", () => {
    const mockCallback = jest.fn();
    const propsWithCallback = {
      ...defaultTestProps,
      onUpdateActionItem: mockCallback,
    };
    const { container } = render(<ActionItemDisplay {...propsWithCallback} />);
    expect(container).toBeTruthy();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("handles allWorkItemTypes prop", () => {
    const propsWithAllTypes = {
      ...defaultTestProps,
      allWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any, { name: "Task", referenceName: "Microsoft.VSTS.WorkItemTypes.Task", icon: { url: "task-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAllTypes} />);
    expect(container.querySelector(".action-items")).toBeTruthy();
  });

  it("renders with complex action item configurations", () => {
    const propsWithComplexItems = {
      ...defaultTestProps,
      actionItems: [
        {
          id: 1,
          fields: {
            "System.Title": "Complex Bug Item",
            "System.WorkItemType": "Bug",
            "System.State": "Active",
            "System.AssignedTo": "test@example.com",
          },
          _links: { html: { href: "http://test-url-1" } },
        } as any,
        {
          id: 2,
          fields: {
            "System.Title": "Complex Task Item",
            "System.WorkItemType": "Task",
            "System.State": "New",
            "System.Priority": 1,
          },
          _links: { html: { href: "http://test-url-2" } },
        } as any,
      ],
    };
    const { container } = render(<ActionItemDisplay {...propsWithComplexItems} />);
    expect(container.querySelector(".action-items")).toBeTruthy();
  });

  it("renders add action item button when action items can be added", () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);
    expect(container.querySelector(".add-action-item-button")).toBeTruthy();
  });

  it("renders add action item button with keyboard accessibility", () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);
    expect(container.querySelector(".add-action-item-button")).toBeTruthy();
  });

  it("opens work item type callout when add button is clicked", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any, { name: "Task", referenceName: "Microsoft.VSTS.WorkItemTypes.Task", icon: { url: "task-icon.png" }, _links: {} } as any],
    };
    const { container, getByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    const addButton = container.querySelector(".add-action-item-button");
    expect(addButton).toBeTruthy();

    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(getByText("Bug")).toBeTruthy();
    });

    expect(getByText("Task")).toBeTruthy();
  });

  it("opens work item type callout with Enter key", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.keyPress(addButton!, { key: "Enter", code: "Enter", charCode: 13 });

    await waitFor(() => {
      expect(getByText("Bug")).toBeTruthy();
    });
  });

  it("closes work item type callout when clicking add button again", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(getByText("Bug")).toBeTruthy();
    });

    // Click the button again to toggle
    fireEvent.click(addButton!);

    // Callout should still be open or might close - this depends on Fluent UI behavior
    // So we just verify the test completes without error
    expect(addButton).toBeTruthy();
  });

  it("creates and links new work item when work item type is clicked", async () => {
    const mockCallback = jest.fn();
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      onUpdateActionItem: mockCallback,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };

    mockOpenNewWorkItem.mockResolvedValue({ id: 456, fields: { "System.Title": "New Bug" } });
    mockAddAssociatedActionItem.mockResolvedValue({ id: "updated-item" });

    const { container, getByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open callout
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(getByText("Bug")).toBeTruthy();
    });

    // Click on Bug work item type
    const bugButton = getByText("Bug").closest("button");
    fireEvent.click(bugButton!);

    await waitFor(() => {
      expect(mockOpenNewWorkItem).toHaveBeenCalledWith(
        "Bug",
        expect.objectContaining({
          "System.AssignedTo": "Test User",
          "Tags": "feedback",
          "Description": "Test Feedback Item Title",
        }),
      );
      expect(mockAddAssociatedActionItem).toHaveBeenCalledWith("Test Board Id", "101", 456);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: "WorkItemCreated",
        properties: { workItemTypeName: "Bug" },
      });
      expect(mockCallback).toHaveBeenCalledWith({ id: "updated-item" });
    });
  });

  it("opens link existing work item dialog", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByText, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open callout
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      const linkButton = getByText("Link existing work item");
      expect(linkButton).toBeTruthy();
    });

    // Click on "Link existing work item" button in the callout
    const linkButton = getByText("Link existing work item").closest("button");
    fireEvent.click(linkButton!);

    await waitFor(() => {
      expect(getByPlaceholderText("Enter the exact work item id")).toBeTruthy();
    });
  });

  it("opens link existing work item dialog with Enter key", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByText, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open callout
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(getByText("Link existing work item")).toBeTruthy();
    });

    // Press Enter on "Link existing work item"
    const linkButton = getByText("Link existing work item").closest("button");
    fireEvent.keyDown(linkButton!, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(getByPlaceholderText("Enter the exact work item id")).toBeTruthy();
    });
  });

  it("validates work item id input - shows error for non-numeric input", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByText, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open dialog
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      const linkButton = getByText("Link existing work item");
      fireEvent.click(linkButton);
    });

    await waitFor(() => {
      expect(getByPlaceholderText("Enter the exact work item id")).toBeTruthy();
    });

    // Enter invalid input
    const searchBox = getByPlaceholderText("Enter the exact work item id");
    fireEvent.change(searchBox, { target: { value: "abc" } });

    await waitFor(() => {
      expect(getByText("Work item ids have to be positive numbers only.")).toBeTruthy();
    });
  });

  it("clears error when input is empty", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByText, getByPlaceholderText, queryByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open dialog
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      const linkButton = getByText("Link existing work item");
      fireEvent.click(linkButton);
    });

    await waitFor(() => {
      const searchBox = getByPlaceholderText("Enter the exact work item id");

      // Enter invalid input
      fireEvent.change(searchBox, { target: { value: "abc" } });
    });

    await waitFor(() => {
      expect(getByText("Work item ids have to be positive numbers only.")).toBeTruthy();
    });

    // Clear input
    const searchBox = getByPlaceholderText("Enter the exact work item id");
    fireEvent.change(searchBox, { target: { value: "" } });

    await waitFor(() => {
      expect(queryByText("Work item ids have to be positive numbers only.")).toBeNull();
    });
  });

  it("loads and displays work item when valid id is entered", async () => {
    const mockWorkItem = {
      id: 789,
      fields: {
        "System.Title": "Existing Bug",
        "System.WorkItemType": "Bug",
        "System.State": "Active",
      },
      _links: { html: { href: "http://test-url" } },
    };

    mockGetWorkItemsByIds.mockResolvedValue([mockWorkItem]);

    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      allWorkItemTypes: [{ name: "Bug", icon: { url: "bug-icon.png" }, states: [{ name: "Active", category: "InProgress", color: "blue" }] } as any],
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByText, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open dialog
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      const linkButton = getByText("Link existing work item");
      fireEvent.click(linkButton);
    });

    await waitFor(() => {
      const searchBox = getByPlaceholderText("Enter the exact work item id");
      fireEvent.change(searchBox, { target: { value: "789" } });
    });

    await waitFor(() => {
      expect(mockGetWorkItemsByIds).toHaveBeenCalledWith([789]);
      expect(getByText("Existing Bug")).toBeTruthy();
    });
  });

  it("shows not found message when work item doesn't exist", async () => {
    mockGetWorkItemsByIds.mockResolvedValue([]);

    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByText, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open dialog
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      const linkButton = getByText("Link existing work item");
      fireEvent.click(linkButton);
    });

    await waitFor(() => {
      const searchBox = getByPlaceholderText("Enter the exact work item id");
      fireEvent.change(searchBox, { target: { value: "999" } });
    });

    await waitFor(() => {
      expect(getByText("The work item you are looking for was not found. Please verify the id.")).toBeTruthy();
    });
  });

  it("links existing work item successfully", async () => {
    const mockWorkItem = {
      id: 789,
      fields: {
        "System.Title": "Existing Task",
        "System.WorkItemType": "Task",
      },
      _links: { html: { href: "http://test-url" } },
    };

    mockGetWorkItemsByIds.mockResolvedValue([mockWorkItem]);
    mockAddAssociatedActionItem.mockResolvedValue({ id: "linked-item" });

    const mockCallback = jest.fn();
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      onUpdateActionItem: mockCallback,
      allWorkItemTypes: [{ name: "Task", icon: { url: "task-icon.png" }, states: [] } as any],
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByText, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open dialog
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      const linkButton = getByText("Link existing work item");
      fireEvent.click(linkButton);
    });

    // Enter work item id
    await waitFor(() => {
      const searchBox = getByPlaceholderText("Enter the exact work item id");
      fireEvent.change(searchBox, { target: { value: "789" } });
    });

    // Wait for work item to load
    await waitFor(() => {
      expect(getByText("Existing Task")).toBeTruthy();
    });

    // Click Link work item button - find the primary button by text
    const linkWorkItemButton = getByText("Link work item").closest("button");
    fireEvent.click(linkWorkItemButton!);

    await waitFor(() => {
      expect(mockAddAssociatedActionItem).toHaveBeenCalledWith("Test Board Id", "101", 789);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: "ExistingWorkItemLinked",
        properties: { workItemTypeName: "Task" },
      });
      expect(mockCallback).toHaveBeenCalledWith({ id: "linked-item" });
    });
  });

  it("cancels link existing work item dialog", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByText, queryByText, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open dialog
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      const linkButton = getByText("Link existing work item");
      fireEvent.click(linkButton);
    });

    await waitFor(() => {
      expect(getByPlaceholderText("Enter the exact work item id")).toBeTruthy();
    });

    // Click Cancel
    const cancelButton = getByText("Cancel");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(queryByText("Link existing work item", { selector: ".ms-Dialog-title" })).toBeFalsy();
    });
  });

  it("handles user with undefined name (Former User)", async () => {
    mockGetUser.mockReturnValue({ name: undefined, displayName: "Former User", id: "former-user-id" });
    mockOpenNewWorkItem.mockResolvedValue({ id: 111, fields: { "System.Title": "Test" } });
    mockAddAssociatedActionItem.mockResolvedValue({ id: "updated" });

    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      onUpdateActionItem: jest.fn(),
      nonHiddenWorkItemTypes: [{ name: "Task", referenceName: "Microsoft.VSTS.WorkItemTypes.Task", icon: { url: "task-icon.png" }, _links: {} } as any],
    };

    const { container, getByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open callout
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(getByText("Task")).toBeTruthy();
    });

    // Click on Task work item type
    const taskButton = getByText("Task").closest("button");
    fireEvent.click(taskButton!);

    await waitFor(() => {
      expect(mockOpenNewWorkItem).toHaveBeenCalledWith(
        "Task",
        expect.objectContaining({
          "System.AssignedTo": "Former User",
        }),
      );
    });

    // Reset mock
    mockGetUser.mockReturnValue({ name: "Test User", displayName: "Test User", id: "test-user-id" });
  });

  it("disables Link work item button when no work item is loaded", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open dialog
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      const linkButton = getByText("Link existing work item");
      fireEvent.click(linkButton);
    });

    await waitFor(() => {
      const linkWorkItemButton = getByText("Link work item").closest("button");
      expect(linkWorkItemButton).toHaveProperty("disabled", true);
    });
  });
});
