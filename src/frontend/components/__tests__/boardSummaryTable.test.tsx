import React from 'react';
import { shallow } from 'enzyme';
import BoardSummaryTable from '../boardSummaryTable';
import { IBoardSummaryTableProps } from '../boardSummaryTable';

const baseProps: IBoardSummaryTableProps = {
  teamId: 'team-1',
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn()
};

describe('BoardSummaryTable', () => {
  it('renders with empty board list', () => {
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);
    const component = wrapper.children().dive();

    expect(component.exists()).toBeTruthy();
  });

  it('simulates archive toggle', () => {
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);
    
    // Dive into the component if necessary
    const componentWithCheckbox = wrapper.dive().dive(); // Add another dive if checkbox is in a deeper child component

    const checkbox = componentWithCheckbox.find('input[type="checkbox"]'); // Adjust if your checkbox has a specific selector

    // Check if the checkbox exists
    expect(checkbox.exists()).toBeTruthy();

    // Simulate checking the checkbox
    checkbox.simulate('change', { target: { checked: true } });
    expect(baseProps.onArchiveToggle).toHaveBeenCalledWith(true); // Ensure the callback was called with the correct value

    // Simulate unchecking the checkbox
    checkbox.simulate('change', { target: { checked: false } });
    expect(baseProps.onArchiveToggle).toHaveBeenCalledWith(false); // Ensure the callback was called with the correct value
  });
});
