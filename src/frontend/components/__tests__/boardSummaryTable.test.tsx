import React from 'react';
import { shallow } from 'enzyme';
import BoardSummaryTable, { IBoardSummaryTableProps } from '../boardSummaryTable';

const baseProps: IBoardSummaryTableProps = {
  teamId: 'team-1',
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn(),
};

/*describe('BoardSummaryTable', () => {
  it('renders when no boards exist', () => {
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);
    const component = wrapper.children().dive();
    expect(component.exists()).toBeTruthy();
  });
});*/
