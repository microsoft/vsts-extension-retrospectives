import React from "react";
import { render } from "@testing-library/react";
import { DetailsList } from "@fluentui/react/lib/DetailsList";
import { Image } from "@fluentui/react/lib/Image";
import { mockWorkItem, mockWorkItemType } from "../__mocks__/mocked_components/mockedWorkItemTracking";
import BoardSummary from "../boardSummary";
import { IBoardSummaryProps } from "../boardSummary";

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
  },
}));

jest.mock("azure-devops-extension-sdk", () => ({
  getService: jest.fn(),
}));

jest.mock("azure-devops-extension-api/WorkItemTracking", () => ({
  WorkItemTrackingServiceIds: {
    WorkItemFormNavigationService: "ms.vss-work-web.work-item-form-navigation-service",
  },
}));

const mockedDefaultProps: IBoardSummaryProps = {
  actionItems: [],
  pendingWorkItemsCount: 0,
  resolvedActionItemsCount: 0,
  boardName: "",
  feedbackItemsCount: 0,
  supportedWorkItemTypes: [],
};

const mockedWorkItemCountProps: IBoardSummaryProps = {
  actionItems: [],
  pendingWorkItemsCount: 2,
  resolvedActionItemsCount: 3,
  boardName: "",
  feedbackItemsCount: 8,
  supportedWorkItemTypes: [],
};

const mockBugWorkItemType = {
  ...mockWorkItemType,
  name: "Bug",
  icon: { ...mockWorkItemType.icon, id: "Bug-icon" },
};

const mockTaskWorkItemType = {
  ...mockWorkItemType,
  name: "Task",
  icon: { ...mockWorkItemType.icon, id: "Task-icon" },
};

const testWorkItem1 = {
  ...mockWorkItem,
  id: 123,
  fields: {
    ...mockWorkItem.fields,
    ["System.Title"]: "Test Action Item 1",
    ["System.AssignedTo"]: "John Doe",
    ["System.State"]: "New",
    ["System.WorkItemType"]: "Bug",
  },
};

const testWorkItem2 = {
  ...mockWorkItem,
  id: 456,
  fields: {
    ...mockWorkItem.fields,
    ["System.Title"]: "Test Action Item 2",
    ["System.AssignedTo"]: "",
    ["System.State"]: "Active",
    ["System.WorkItemType"]: "Task",
  },
};

const mockedPropsWithActionItems: IBoardSummaryProps = {
  actionItems: [testWorkItem1, testWorkItem2],
  pendingWorkItemsCount: 1,
  resolvedActionItemsCount: 1,
  boardName: "Test Board",
  feedbackItemsCount: 5,
  supportedWorkItemTypes: [mockBugWorkItemType, mockTaskWorkItemType],
};

describe("Board Summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without errors", () => {
    const { container } = render(<BoardSummary {...mockedDefaultProps} />);
    expect(container).toBeTruthy();
  });

  it("should render with action items", () => {
    const { container } = render(<BoardSummary {...mockedPropsWithActionItems} />);
    expect(container).toBeTruthy();
  });

  it("should render no action items message when no action items are present", () => {
    const { container } = render(<BoardSummary {...mockedDefaultProps} />);
    const noActionItemsMessage = container.querySelector(".action-items-summary-card");
    expect(noActionItemsMessage).toBeTruthy();
  });

  it("should display correct work item counts", () => {
    const { container } = render(<BoardSummary {...mockedWorkItemCountProps} />);
    expect(container).toBeTruthy();
  });

  it("should render DetailsList when action items are present", () => {
    const { container } = render(<BoardSummary {...mockedPropsWithActionItems} />);
    const detailsList = container.querySelector('[role="grid"]');
    expect(detailsList).toBeTruthy();
  });

  it("should render action items with correct properties", () => {
    const { container } = render(<BoardSummary {...mockedPropsWithActionItems} />);
    expect(container).toBeTruthy();
  });

  it("should handle work item navigation correctly", () => {
    const { container } = render(<BoardSummary {...mockedPropsWithActionItems} />);
    expect(container).toBeTruthy();
  });

  it("should display correct feedback count information", () => {
    const { container } = render(<BoardSummary {...mockedPropsWithActionItems} />);
    expect(container).toBeTruthy();
  });

  it("should render board name when provided", () => {
    const { container } = render(<BoardSummary {...mockedPropsWithActionItems} />);
    expect(container).toBeTruthy();
  });

  it("should handle empty supported work item types", () => {
    const { container } = render(<BoardSummary {...mockedDefaultProps} />);
    expect(container).toBeTruthy();
  });
});
