import React from "react";
import { shallow, ShallowWrapper } from "enzyme";
import { DetailsList } from "office-ui-fabric-react/lib/DetailsList";
import { Image } from "office-ui-fabric-react/lib/Image";
import { mockWorkItem, mockWorkItemType } from "../__mocks__/mocked_components/mockedWorkItemTracking";
import BoardSummary, { IBoardSummaryProps } from "../boardSummary";

jest.mock("azure-devops-extension-sdk", () => ({
  getService: jest.fn(),
}));

jest.mock("azure-devops-extension-api/WorkItemTracking", () => ({
  WorkItemTrackingServiceIds: {
    WorkItemFormNavigationService: "ms.vss-work-web.work-item-form-navigation-service",
  },
}));

const verifyActionItemsSummaryCard = (component: ShallowWrapper, wereActionItemsInclude: boolean) => {
  if (wereActionItemsInclude) {
    const child = component.findWhere((child: ShallowWrapper) => child.prop("className") === "action-items-summary-card").children();
    expect(child.find(DetailsList)).toHaveLength(1);
  } else {
    expect(component.findWhere((child: ShallowWrapper) => child.prop("className") === "action-items-summary-card").text()).toBe("Looks like no work items were created for this board.");
  }
};

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
  it("renders with no action or work items.", () => {
    const wrapper = shallow(<BoardSummary {...mockedDefaultProps} />);
    const component = wrapper.children().dive();

    verifySummaryBoardCounts(component, mockedDefaultProps);
    verifyActionItemsSummaryCard(component, false);
  });

  it("renders with one action item.", () => {
    mockedDefaultProps.actionItems.push(mockWorkItem);
    mockedDefaultProps.supportedWorkItemTypes.push(mockWorkItemType);
    const wrapper = shallow(<BoardSummary {...mockedDefaultProps} />);
    const component = wrapper.children().dive();

    verifySummaryBoardCounts(component, mockedDefaultProps);
    verifyActionItemsSummaryCard(component, true);
  });

  it("renders when work item counts are greater than zero.", () => {
    const wrapper = shallow(<BoardSummary {...mockedWorkItemCountProps} />);
    const component = wrapper.children().dive();

    verifySummaryBoardCounts(component, mockedWorkItemCountProps);
    verifyActionItemsSummaryCard(component, false);
  });

  it("renders with one action item when work item counts are greater than zero.", () => {
    mockedWorkItemCountProps.actionItems.push(mockWorkItem);
    mockedWorkItemCountProps.supportedWorkItemTypes.push(mockWorkItemType);
    const wrapper = shallow(<BoardSummary {...mockedWorkItemCountProps} />);
    const component = wrapper.children().dive();

    verifySummaryBoardCounts(component, mockedWorkItemCountProps);
    verifyActionItemsSummaryCard(component, true);
  });

  it("renders work item icon column with Image component", () => {
    const wrapper = shallow(<BoardSummary {...mockedPropsWithActionItems} />);
    const component = wrapper.children().dive();
    const detailsList = component.find(DetailsList);

    const columns = detailsList.prop("columns");
    const iconColumn = columns.find(col => col.key === "icon");
    expect(iconColumn).toBeDefined();
    expect(iconColumn.onRender).toBeDefined();

    const iconProps = { icon: mockBugWorkItemType.icon, type: "Bug" };
    const iconElement = iconColumn.onRender(iconProps);
    expect(iconElement.type).toBe(Image);
    expect(iconElement.props.src).toBe(mockBugWorkItemType.icon.url);
    expect(iconElement.props.alt).toBe("Bug icon");
  });

  it("renders work item title column with click handler", () => {
    const wrapper = shallow(<BoardSummary {...mockedPropsWithActionItems} />);
    const component = wrapper.children().dive();
    const detailsList = component.find(DetailsList);

    const columns = detailsList.prop("columns");
    const titleColumn = columns.find(col => col.key === "title");
    expect(titleColumn).toBeDefined();
    expect(titleColumn.onRender).toBeDefined();
    expect(titleColumn.onColumnClick).toBeDefined();

    const mockOnClick = jest.fn();
    const titleProps = { id: 123, title: "Test Item", onActionItemClick: mockOnClick };
    const titleElement = shallow(titleColumn.onRender(titleProps));
    expect(titleElement.find("button")).toHaveLength(1);
    expect(titleElement.find("button").text()).toBe("Test Item");

    titleElement.find("button").simulate("click");
    expect(mockOnClick).toHaveBeenCalledWith(123);
  });

  it("renders work item changed date column with proper formatting", () => {
    const wrapper = shallow(<BoardSummary {...mockedPropsWithActionItems} />);
    const component = wrapper.children().dive();
    const detailsList = component.find(DetailsList);

    const columns = detailsList.prop("columns");
    const dateColumn = columns.find(col => col.key === "changedDate");
    expect(dateColumn).toBeDefined();
    expect(dateColumn.onRender).toBeDefined();

    const testDate = new Date("2023-01-15T10:30:00Z");
    const dateProps = { changedDate: testDate.toISOString() };
    const dateElement = shallow(dateColumn.onRender(dateProps));
    expect(dateElement.find("div")).toHaveLength(1);

    const formattedDate = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(testDate);
    expect(dateElement.text()).toBe(formattedDate);
  });

  it("handles column sorting functionality", () => {
    const wrapper = shallow(<BoardSummary {...mockedPropsWithActionItems} />);
    const component = wrapper.children().dive();
    const detailsList = component.find(DetailsList);

    const columns = detailsList.prop("columns");
    const titleColumn = columns.find(col => col.key === "title");

    expect(titleColumn.onColumnClick).toBeDefined();

    const stateColumn = columns.find(col => col.key === "state");
    expect(stateColumn.onColumnClick).toBeDefined();

    const typeColumn = columns.find(col => col.key === "type");
    expect(typeColumn.onColumnClick).toBeDefined();

    const changedDateColumn = columns.find(col => col.key === "changedDate");
    expect(changedDateColumn.onColumnClick).toBeDefined();
  });

  it("handles item invocation for work item navigation", async () => {
    const mockOpenWorkItem = jest.fn();
    const mockGetService = jest.fn(() =>
      Promise.resolve({
        openWorkItem: mockOpenWorkItem,
      }),
    );

    const azureSDK = jest.requireMock("azure-devops-extension-sdk");
    azureSDK.getService = mockGetService;

    const wrapper = shallow(<BoardSummary {...mockedPropsWithActionItems} />);
    const component = wrapper.children().dive();
    const detailsList = component.find(DetailsList);

    expect(detailsList.prop("onItemInvoked")).toBeDefined();

    const onItemInvoked = detailsList.prop("onItemInvoked");
    await onItemInvoked({ id: 123 });

    expect(mockGetService).toHaveBeenCalled();
    expect(mockOpenWorkItem).toHaveBeenCalledWith(123);
  });

  it("tests sorting functionality through column clicks", () => {
    const wrapper = shallow(<BoardSummary {...mockedPropsWithActionItems} />);
    const component = wrapper.children().dive();

    const detailsList = component.find(DetailsList);
    expect(detailsList).toHaveLength(1);

    const items = detailsList.prop("items");
    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);

    const columns = detailsList.prop("columns");
    expect(columns).toBeDefined();
    expect(columns.length).toBeGreaterThan(4);

    const sortableColumns = columns.filter(col => col.onColumnClick);
    expect(sortableColumns.length).toBeGreaterThan(0);
  });

  it("tests action item creation and properties", () => {
    const wrapper = shallow(<BoardSummary {...mockedPropsWithActionItems} />);
    const component = wrapper.children().dive();

    const summaryCard = component.findWhere(child => child.prop("className") === "action-items-summary-card");
    expect(summaryCard).toHaveLength(1);

    const detailsList = component.find(DetailsList);
    expect(detailsList).toHaveLength(1);

    const items = detailsList.prop("items");
    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);

    const firstItem = items[0];
    expect(firstItem.onActionItemClick).toBeDefined();
    expect(typeof firstItem.onActionItemClick).toBe("function");
    expect(firstItem.id).toBeDefined();
    expect(firstItem.title).toBeDefined();
    expect(firstItem.icon).toBeDefined();
  });

  it("tests onActionItemClick navigation functionality", async () => {
    const mockOpenWorkItem = jest.fn();
    const mockGetService = jest.fn(() =>
      Promise.resolve({
        openWorkItem: mockOpenWorkItem,
      }),
    );

    const azureSDK = jest.requireMock("azure-devops-extension-sdk");
    azureSDK.getService = mockGetService;

    const wrapper = shallow(<BoardSummary {...mockedPropsWithActionItems} />);
    const component = wrapper.children().dive();

    const detailsList = component.find(DetailsList);
    const items = detailsList.prop("items");
    const firstItem = items[0];

    await firstItem.onActionItemClick(123);

    expect(mockGetService).toHaveBeenCalled();
    expect(mockOpenWorkItem).toHaveBeenCalledWith(123);
  });

  it("tests column click sorting logic with state changes", () => {
    const wrapper = shallow(<BoardSummary {...mockedPropsWithActionItems} />);
    const component = wrapper.children().dive();

    const detailsList = component.find(DetailsList);
    const items = detailsList.prop("items");
    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);

    const columns = detailsList.prop("columns");
    const titleColumn = columns.find(col => col.key === "title");

    expect(titleColumn.isSorted).toBe(false);
    expect(titleColumn.onColumnClick).toBeDefined();

    const mockEvent = {} as React.MouseEvent<HTMLElement>;

    expect(() => titleColumn.onColumnClick(mockEvent, titleColumn)).not.toThrow();

    wrapper.update();
    const updatedComponent = wrapper.children().dive();
    const updatedDetailsList = updatedComponent.find(DetailsList);
    const updatedItems = updatedDetailsList.prop("items");

    expect(updatedItems).toBeDefined();
    expect(updatedItems.length).toBe(items.length);

    expect(updatedItems.every((item: { title: string }) => item.title !== undefined)).toBe(true);
  });

  it("tests column sorting with different sort directions", () => {
    const wrapper = shallow(<BoardSummary {...mockedPropsWithActionItems} />);
    const component = wrapper.children().dive();

    const detailsList = component.find(DetailsList);
    const items = detailsList.prop("items");
    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);

    const columns = detailsList.prop("columns");
    const stateColumn = columns.find(col => col.key === "state");

    expect(stateColumn.isSorted).toBe(false);
    expect(stateColumn.onColumnClick).toBeDefined();

    const mockEvent = {} as React.MouseEvent<HTMLElement>;

    expect(() => stateColumn.onColumnClick(mockEvent, stateColumn)).not.toThrow();

    wrapper.update();
    let updatedComponent = wrapper.children().dive();
    let updatedDetailsList = updatedComponent.find(DetailsList);
    let updatedItems = updatedDetailsList.prop("items");

    expect(updatedItems).toBeDefined();
    expect(updatedItems.length).toBe(items.length);

    const updatedColumns = updatedDetailsList.prop("columns");
    const updatedStateColumn = updatedColumns.find(col => col.key === "state");
    expect(() => updatedStateColumn.onColumnClick(mockEvent, updatedStateColumn)).not.toThrow();

    wrapper.update();
    updatedComponent = wrapper.children().dive();
    updatedDetailsList = updatedComponent.find(DetailsList);
    updatedItems = updatedDetailsList.prop("items");

    expect(updatedItems).toBeDefined();
    expect(updatedItems.length).toBe(items.length);
  });

  it("tests sorting by different column types", () => {
    const wrapper = shallow(<BoardSummary {...mockedPropsWithActionItems} />);
    const component = wrapper.children().dive();

    const detailsList = component.find(DetailsList);
    const columns = detailsList.prop("columns");

    const typeColumn = columns.find(col => col.key === "type");
    const mockEvent = {} as React.MouseEvent<HTMLElement>;
    typeColumn.onColumnClick(mockEvent, typeColumn);

    wrapper.update();
    const updatedComponent = wrapper.children().dive();
    const updatedDetailsList = updatedComponent.find(DetailsList);
    const items = updatedDetailsList.prop("items");

    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].type).toBeDefined();
  });
});

const verifySummaryBoardCounts = (component: ShallowWrapper, props: IBoardSummaryProps) => {
  expect(component.findWhere(child => child.prop("aria-label") === "feedback item count").text()).toBe(props.feedbackItemsCount.toString());
  expect(component.findWhere(child => child.prop("aria-label") === "total work items count").text()).toBe(props.actionItems.length.toString());
  expect(component.findWhere(child => child.prop("aria-label") === "pending work items count").text()).toBe(props.pendingWorkItemsCount.toString());
  expect(component.findWhere(child => child.prop("aria-label") === "resolved work items count").text()).toBe(props.resolvedActionItemsCount.toString());
};
