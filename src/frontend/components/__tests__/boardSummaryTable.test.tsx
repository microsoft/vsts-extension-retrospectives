import React from 'react';
import { shallow, mount } from 'enzyme';
import BoardSummaryTable from '../boardSummaryTable'; // Adjust the import path if needed
import { IBoardSummaryTableProps } from '../boardSummaryTable';

const baseProps: IBoardSummaryTableProps = {
  teamId: 'team-1',
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn(),
};

describe('BoardSummaryTable', () => {
  it('renders with empty board list (shallow test)', () => {
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);
    const component = wrapper.children().dive();

    expect(component.exists()).toBeTruthy();
  });

  it('simulates archive toggle (mount test)', () => {
    // Create the wrapper using mount to fully render the component
    const wrapper = mount(<BoardSummaryTable {...baseProps} />);

    // Find the checkbox in the rendered component (adjust the selector as needed)
    const checkbox = wrapper.find('input[type="checkbox"]');

    // Check if the checkbox exists in the component
    expect(checkbox.exists()).toBeTruthy();  // Ensure the checkbox is found

    // Simulate checking the checkbox (change event)
    checkbox.simulate('change', { target: { checked: true } });

    // Check that the onArchiveToggle function was called with the correct value
    expect(baseProps.onArchiveToggle).toHaveBeenCalledWith(true);

    // Simulate unchecking the checkbox
    checkbox.simulate('change', { target: { checked: false } });

    // Check that the onArchiveToggle function was called again with false
    expect(baseProps.onArchiveToggle).toHaveBeenCalledWith(false);
  });
});
