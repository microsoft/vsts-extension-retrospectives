import React from 'react';
import { shallow, mount } from 'enzyme';
import BoardSummaryTable from '../boardSummaryTable';
import { IBoardSummaryTableProps } from '../boardSummaryTable'; // Adjust import if needed

const baseProps: IBoardSummaryTableProps = {
  teamId: 'team-1',
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn()
};

describe('BoardSummaryTable', () => {
  it('renders with empty board list', () => {
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);
    const component = wrapper.children().dive();

    // Could check for loading state or empty message depending on what renders
    expect(component.exists()).toBeTruthy();
  });

  // Expand this once you're ready to test with board data
});

it('calls onArchiveToggle when archive toggle is triggered', () => {
  const onArchiveToggle = jest.fn();
  const tableData = [{
    id: 'board-id-1',
    boardName: 'Board 1',
    createdDate: new Date(),
    isArchived: false,
    archivedDate: null,
    feedbackItemsCount: 0,
    totalWorkItemsCount: 0,
    teamId: 'team-id-1'
  }];
  const sortingState = [{ id: 'createdDate', desc: true }];
  const setTableData = jest.fn();

  const wrapper = mount(
    <BoardSummaryTable
      tableData={tableData}
      sortingState={sortingState}
      onArchiveToggle={onArchiveToggle}
      setTableData={setTableData}
    />
  );

  // Find the checkbox input by type and simulate change event
  const checkbox = wrapper.find('input[type="checkbox"]');
  checkbox.simulate('change', { target: { checked: true } });

  // Assert that onArchiveToggle was called with correct arguments
  expect(onArchiveToggle).toHaveBeenCalledWith('board-id-1', true);
});
