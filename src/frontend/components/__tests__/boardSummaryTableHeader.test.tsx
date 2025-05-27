import React from 'react';
import { shallow } from 'enzyme';
import BoardSummaryTableHeader from '../boardSummaryTableHeader';
import type { Header, HeaderGroup } from '@tanstack/table-core';

const mockHeaderGroup: HeaderGroup<any> = {
  id: 'header-group-1',
  headers: [
    {
      id: 'column-1',
      isPlaceholder: false,
      column: {
        columnDef: { header: 'Board Name' },
        getIsSorted: () => 'asc',
        getSize: () => 150,
        getCanResize: () => true,
        getIsResizing: () => false,
        getToggleSortingHandler: jest.fn(),
      },
      getContext: () => ({}),
      getResizeHandler: jest.fn(),
    } as Header<any, unknown>,
  ],
} as HeaderGroup<any>;

describe('BoardSummaryTableHeader', () => {
  it('renders table headers correctly', () => {
    const wrapper = shallow(<BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />);
    expect(wrapper.find('thead')).toHaveLength(1);
    expect(wrapper.find('tr')).toHaveLength(1);
    expect(wrapper.find('th')).toHaveLength(mockHeaderGroup.headers.length);
  });

  it('applies correct sorting properties to headers', () => {
    const wrapper = shallow(<BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />);
    const headerElement = wrapper.find('th').at(0);

    expect(headerElement.prop('aria-sort')).toBe('ascending'); // Sorting direction
    expect(headerElement.hasClass('asc')).toBeTruthy(); // Sort class applied
  });

  it('calls sorting handler when header is clicked', () => {
    const wrapper = shallow(<BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />);
    wrapper.find('th').simulate('click');
    expect(mockHeaderGroup.headers[0].column.getToggleSortingHandler).toHaveBeenCalled();
  });
});
