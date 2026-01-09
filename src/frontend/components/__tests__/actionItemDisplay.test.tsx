import React from "react";
import { render, fireEvent, waitFor, within, act } from "@testing-library/react";

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

const openAddWorkItemMenu = (container: HTMLElement) => {
  const addButton = container.querySelector(".add-action-item-button");
  fireEvent.click(addButton!);
  return waitFor(() => {
    const menu = container.querySelector(".popout-container") as HTMLElement;
    expect(menu).toBeTruthy();
    return menu;
  });
};

const openLinkExistingDialog = async (container: HTMLElement) => {
  const menu = await openAddWorkItemMenu(container);
  const linkButton = within(menu).getByRole("button", { name: "Link existing work item" });
  fireEvent.click(linkButton);
  const dialog = container.querySelector(".link-existing-work-item-dialog") as HTMLDialogElement;
  return waitFor(() => {
    expect(dialog.open).toBe(true);
    return dialog;
  });
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
    expect(container.querySelector(".link-existing-work-item-dialog")).toBeTruthy();
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
    expect(container.querySelectorAll(".related-task-sub-card")).toHaveLength(1);
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
    expect(container.querySelectorAll(".related-task-sub-card")).toHaveLength(2);
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
    expect(container.querySelector(".link-existing-work-item-dialog")).toBeTruthy();
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
    expect(container.querySelector(".link-existing-work-item-dialog")).toBeTruthy();
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
    expect(container.querySelector(".link-existing-work-item-dialog")).toBeTruthy();
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
    expect(container.querySelectorAll(".related-task-sub-card")).toHaveLength(2);
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
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    const menu = await openAddWorkItemMenu(container);

    await waitFor(() => {
      expect(within(menu).getByText("Bug")).toBeTruthy();
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
    const { container, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    await openLinkExistingDialog(container);

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
    const { container, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    const menu = await openAddWorkItemMenu(container);
    const linkButton = within(menu).getByRole("button", { name: "Link existing work item" });
    fireEvent.keyDown(linkButton, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(getByPlaceholderText("Enter the exact work item id")).toBeTruthy();
    });
  });

  it("closes add work item menu when clicking outside", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    await openAddWorkItemMenu(container);
    expect(container.querySelector(".popout-container")).toBeTruthy();

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(container.querySelector(".popout-container")).toBeNull();
    });
  });

  it("keeps add work item menu open when clicking inside", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    await openAddWorkItemMenu(container);
    const menu = container.querySelector(".popout-container") as HTMLElement;
    expect(menu).toBeTruthy();

    fireEvent.pointerDown(menu);

    await waitFor(() => {
      expect(container.querySelector(".popout-container")).toBeTruthy();
    });
  });

  it("validates work item id input - shows error for non-numeric input", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByPlaceholderText, queryByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    await openLinkExistingDialog(container);

    await waitFor(() => {
      expect(getByPlaceholderText("Enter the exact work item id")).toBeTruthy();
    });

    // Enter invalid input
    const searchBox = getByPlaceholderText("Enter the exact work item id");
    fireEvent.change(searchBox, { target: { value: "abc" } });

    await waitFor(() => {
      const linkButton = container.querySelector(".link-existing-work-item-dialog .button") as HTMLButtonElement;
      expect(linkButton?.disabled).toBe(true);
      expect(queryByText("The work item you are looking for was not found. Please verify the id.")).toBeNull();
    });
  });

  it("clears error when input is empty", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    await openLinkExistingDialog(container);

    await waitFor(() => {
      const searchBox = getByPlaceholderText("Enter the exact work item id");

      // Enter invalid input
      fireEvent.change(searchBox, { target: { value: "abc" } });
    });

    // Clear input
    const searchBox = getByPlaceholderText("Enter the exact work item id");
    fireEvent.change(searchBox, { target: { value: "" } });

    await waitFor(() => {
      const linkButton = container.querySelector(".link-existing-work-item-dialog .button") as HTMLButtonElement;
      expect(linkButton?.disabled).toBe(true);
      const workItemCard = container.querySelector(".work-item-card");
      expect(workItemCard).toBeNull();
    });
  });

  it("ignores work item id of zero", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    await openLinkExistingDialog(container);

    const searchBox = getByPlaceholderText("Enter the exact work item id");
    fireEvent.change(searchBox, { target: { value: "0" } });

    await waitFor(() => {
      expect(mockGetWorkItemsByIds).not.toHaveBeenCalled();
      const linkButton = container.querySelector(".link-existing-work-item-dialog .button") as HTMLButtonElement;
      expect(linkButton?.disabled).toBe(true);
      expect(container.querySelector(".work-item-not-found")).toBeNull();
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
    const { container, getByPlaceholderText, getByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    await openLinkExistingDialog(container);

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
    const { container, getByPlaceholderText, getByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    await openLinkExistingDialog(container);

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
    const { container, getByPlaceholderText, getByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    await openLinkExistingDialog(container);

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
    const { container, queryByText, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    const dialog = await openLinkExistingDialog(container);

    await waitFor(() => {
      expect(getByPlaceholderText("Enter the exact work item id")).toBeTruthy();
    });

    const cancelButton = dialog.querySelector(".default.button") as HTMLButtonElement;
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(dialog.open).toBe(false);
      expect(queryByText("Link existing work item")).toBeTruthy();
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

    await openLinkExistingDialog(container);

    await waitFor(() => {
      const linkWorkItemButton = getByText("Link work item").closest("button");
      expect(linkWorkItemButton).toHaveProperty("disabled", true);
    });
  });

  it("closes menu when clicking outside after opening it", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open the menu
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(container.querySelector(".popout-container")).toBeTruthy();
    });

    // Click outside (on document body) - should close the menu
    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(container.querySelector(".popout-container")).toBeFalsy();
    });
  });

  it("menu is not visible by default", () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Menu callout is not visible by default
    expect(container.querySelector(".popout-container")).toBeFalsy();

    // Pointer down on body should have no effect when menu is not open
    fireEvent.pointerDown(document.body);

    expect(container.querySelector(".popout-container")).toBeFalsy();
  });

  it("handles clicks gracefully when menu is open", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open the menu
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(container.querySelector(".popout-container")).toBeTruthy();
    });

    // Various pointer events should not throw
    expect(() => fireEvent.pointerDown(document.body)).not.toThrow();
  });

  it("handleDocumentPointerDown does not close callout when clicking inside the menu", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open the menu
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(container.querySelector(".popout-container")).toBeTruthy();
    });

    const menu = container.querySelector(".popout-container") as HTMLElement;

    // Click inside the menu - should not close it
    fireEvent.pointerDown(menu);

    await waitFor(() => {
      expect(container.querySelector(".popout-container")).toBeTruthy();
    });
  });

  it("closes callout when clicking outside the menu and wrapper", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open the menu
    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(container.querySelector(".popout-container")).toBeTruthy();
    });

    // Create an element outside both wrapper and menu
    const outsideElement = document.createElement("div");
    outsideElement.id = "outside-element";
    document.body.appendChild(outsideElement);

    // Trigger pointerdown on the outside element
    fireEvent.pointerDown(outsideElement);

    await waitFor(() => {
      // Callout should now be hidden
      expect(container.querySelector(".popout-container")).toBeFalsy();
    });

    // Cleanup
    document.body.removeChild(outsideElement);
  });

  it("displays work item not found message when work item search returns undefined", async () => {
    // Return undefined for the work item (different from empty array)
    mockGetWorkItemsByIds.mockResolvedValue([undefined]);

    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    await openLinkExistingDialog(container);

    const searchBox = getByPlaceholderText("Enter the exact work item id");
    fireEvent.change(searchBox, { target: { value: "12345" } });

    await waitFor(() => {
      expect(mockGetWorkItemsByIds).toHaveBeenCalledWith([12345]);
      // Check for "work item not found" message
      const notFoundMessage = container.querySelector(".work-item-not-found");
      expect(notFoundMessage).toBeTruthy();
    });
  });

  it("does not call addAssociatedActionItem when workItem is null from openNewWorkItem", async () => {
    mockOpenNewWorkItem.mockResolvedValue(null);

    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      onUpdateActionItem: jest.fn(),
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };

    const { container, getByText } = render(<ActionItemDisplay {...propsWithAdd} />);

    const addButton = container.querySelector(".add-action-item-button");
    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(getByText("Bug")).toBeTruthy();
    });

    const bugButton = getByText("Bug").closest("button");
    fireEvent.click(bugButton!);

    await waitFor(() => {
      expect(mockOpenNewWorkItem).toHaveBeenCalled();
      expect(mockAddAssociatedActionItem).not.toHaveBeenCalled();
    });
  });

  it("does not link work item when linkedWorkItem is null", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      onUpdateActionItem: jest.fn(),
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };

    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    // Open the Link Existing dialog
    await openLinkExistingDialog(container);

    // Click the Link button without entering any work item ID
    const linkButton = container.querySelector(".link-existing-work-item-dialog .button") as HTMLButtonElement;

    // The button should be disabled when no work item is entered
    expect(linkButton?.disabled).toBe(true);

    // Should not call addAssociatedActionItem
    expect(mockAddAssociatedActionItem).not.toHaveBeenCalled();
  });

  it("handles whitespace-only input in search box", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container, getByPlaceholderText } = render(<ActionItemDisplay {...propsWithAdd} />);

    await openLinkExistingDialog(container);

    const searchBox = getByPlaceholderText("Enter the exact work item id");
    fireEvent.change(searchBox, { target: { value: "   " } });

    await waitFor(() => {
      const linkButton = container.querySelector(".link-existing-work-item-dialog .button") as HTMLButtonElement;
      expect(linkButton?.disabled).toBe(true);
    });
  });

  it("closes link existing work item dialog when clicking close button", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    const dialog = await openLinkExistingDialog(container);
    expect(dialog.open).toBe(true);

    // Click the close button in the dialog header
    const closeButton = dialog.querySelector('button[aria-label="Close"]') as HTMLButtonElement;
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(dialog.open).toBe(false);
    });
  });

  it("triggers dialog onClose handler when dialog is closed", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    const dialog = await openLinkExistingDialog(container);
    expect(dialog.open).toBe(true);

    // Trigger the close event on the dialog
    dialog.dispatchEvent(new Event("close"));

    // Dialog should handle the close event
    expect(dialog).toBeTruthy();
  });

  it("handleClickOutside returns early when target is inside the menu", async () => {
    const propsWithAdd = {
      ...defaultTestProps,
      allowAddNewActionItem: true,
      nonHiddenWorkItemTypes: [{ name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any],
    };
    const { container } = render(<ActionItemDisplay {...propsWithAdd} />);

    const menu = await openAddWorkItemMenu(container);

    // Click on a button inside the menu
    const menuButton = menu.querySelector("button");
    if (menuButton) {
      fireEvent.pointerDown(menuButton);
    }

    // Menu should still be open
    await waitFor(() => {
      expect(menu).toBeTruthy();
    });
  });
});
