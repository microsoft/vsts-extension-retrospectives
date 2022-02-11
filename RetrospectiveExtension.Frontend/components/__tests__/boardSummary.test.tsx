import * as React from 'react';
import { shallow, ShallowWrapper} from 'enzyme';
import { DetailsList } from 'office-ui-fabric-react/lib/DetailsList';
import { mockWorkItem, mockWorkItemType } from './mocked_components/WorkItemTracking';
import BoardSummary, { IBoardSummaryProps } from '../boardSummary';

const mockedDefaultProps: IBoardSummaryProps = {
  actionItems: [],
  isDataLoaded: true,
  pendingWorkItemsCount: 0,
  resolvedActionItemsCount: 0,
  boardName: '',
  feedbackItemsCount: 0,
  supportedWorkItemTypes: []
};

const mockedWorkItemCountProps: IBoardSummaryProps = {
  actionItems: [],
  isDataLoaded: false,
  pendingWorkItemsCount: 2,
  resolvedActionItemsCount: 3,
  boardName: '',
  feedbackItemsCount: 8,
  supportedWorkItemTypes: []
};

describe('Board Summary', () => {
  it('renders with no action or work items.', () => {
    const wrapper = shallow(<BoardSummary {...mockedDefaultProps} />);
    const component = wrapper.children().dive();

    verifySummaryBoardCounts(component, mockedDefaultProps);
    verifyActionItemsSummaryCard(component, false);
  });

  it('renders with one action item.', () => {
    mockedDefaultProps.actionItems.push(mockWorkItem);
    mockedDefaultProps.supportedWorkItemTypes.push(mockWorkItemType);
    const wrapper = shallow(<BoardSummary {...mockedDefaultProps} />);
    const component = wrapper.children().dive();

    verifySummaryBoardCounts(component, mockedDefaultProps);
    verifyActionItemsSummaryCard(component, true);
  });

  it('renders when work item counts are greater than zero.', () => {
    const wrapper = shallow(<BoardSummary {...mockedWorkItemCountProps} />);
    const component = wrapper.children().dive();

    verifySummaryBoardCounts(component, mockedWorkItemCountProps);
    verifyActionItemsSummaryCard(component, false);
  });

  it('renders with one action item when work item counts are greater than zero.', () => {
    mockedWorkItemCountProps.actionItems.push(mockWorkItem);
    mockedWorkItemCountProps.supportedWorkItemTypes.push(mockWorkItemType);
    const wrapper = shallow(<BoardSummary {...mockedWorkItemCountProps} />);
    const component = wrapper.children().dive();

    verifySummaryBoardCounts(component, mockedWorkItemCountProps);
    verifyActionItemsSummaryCard(component, true);
  });
});

const verifySummaryBoardCounts = (component: ShallowWrapper, props: IBoardSummaryProps) => {
  expect(component.findWhere(
    child => child.prop("aria-label") === "feedback item count").text()).toBe(
      props.feedbackItemsCount.toString());
  expect(component.findWhere(
    child => child.prop("aria-label") === "total work items count").text()).toBe(
      (props.actionItems.length).toString());
  expect(component.findWhere(
    child => child.prop("aria-label") === "pending work items count").text()).toBe(
      props.pendingWorkItemsCount.toString());
  expect(component.findWhere(
    child => child.prop("aria-label") === "resolved work items count").text()).toBe(
      props.resolvedActionItemsCount.toString());
};

const verifyActionItemsSummaryCard = (component: ShallowWrapper, wereActionItemsInclude: boolean) => {
  if(wereActionItemsInclude){
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const child = component.findWhere((child: any) => child.prop('className') === 'action-items-summary-card').children();
    expect(child.find(DetailsList)).toHaveLength(1);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(component.findWhere((child: any) => child.prop('className') === 'action-items-summary-card').
      text()).toBe('Looks like no work items were created for this board.');
  }
}