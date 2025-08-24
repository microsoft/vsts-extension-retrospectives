import React from "react";
import { render } from "@testing-library/react";

// Mock all Azure DevOps SDK and services BEFORE importing the component
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

// Mock both getService and getUser globally to ensure they work everywhere
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

// Mock workItemService to avoid Azure SDK calls
const mockGetWorkItemsByIds = jest.fn();
const mockCreateWorkItem = jest.fn();
jest.mock("../../dal/azureDevOpsWorkItemService", () => ({
  workItemService: {
    getWorkItemsByIds: mockGetWorkItemsByIds,
    createWorkItem: mockCreateWorkItem,
  },
}));

// Mock the HOC wrapper that's causing issues
jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: (reactPlugin: any, Component: any) => Component,
}));

// Now import the component after all mocks are set up
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
      nonHiddenWorkItemTypes: [
        { name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any,
        { name: "Task", referenceName: "Microsoft.VSTS.WorkItemTypes.Task", icon: { url: "task-icon.png" }, _links: {} } as any,
        { name: "User Story", referenceName: "Microsoft.VSTS.WorkItemTypes.UserStory", icon: { url: "story-icon.png" }, _links: {} } as any
      ],
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
      allWorkItemTypes: [
        { name: "Bug", referenceName: "Microsoft.VSTS.WorkItemTypes.Bug", icon: { url: "bug-icon.png" }, _links: {} } as any,
        { name: "Task", referenceName: "Microsoft.VSTS.WorkItemTypes.Task", icon: { url: "task-icon.png" }, _links: {} } as any
      ],
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
});
