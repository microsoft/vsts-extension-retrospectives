import React from 'react';
import { shallow } from 'enzyme';
import BoardSummaryTable from '../boardSummaryTable';
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

  it('shows a spinner when data is not yet loaded', () => {
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);
    const spinner = wrapper.find('Spinner');
    expect(spinner.exists()).toBe(true);
  });
});
