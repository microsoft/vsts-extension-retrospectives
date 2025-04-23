import React from 'react';
import { shallow } from 'enzyme';
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
