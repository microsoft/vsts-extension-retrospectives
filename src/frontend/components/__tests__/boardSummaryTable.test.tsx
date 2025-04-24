
import React from 'react';
import { shallow, mount } from 'enzyme';
import BoardSummaryTable, { IBoardSummaryTableProps } from '../boardSummaryTable';

const baseProps: IBoardSummaryTableProps = {
  teamId: 'team-1',
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn(),
};

describe('BoardSummaryTable', () => {
  it('renders when no boards exist', () => {
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);
    const component = wrapper.children().dive();

    expect(component.exists()).toBeTruthy();
  });

  it('shows a spinner when data is not loaded', () => {
    const wrapper = mount(<BoardSummaryTable {...baseProps} />);
    expect(wrapper.find('Spinner').exists()).toBe(true);
  });
});
