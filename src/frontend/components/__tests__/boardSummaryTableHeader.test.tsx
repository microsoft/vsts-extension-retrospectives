import React from 'react';
import { shallow } from 'enzyme';
import BoardSummaryTableHeader from '../boardSummaryTableHeader';
import type { Header, HeaderGroup } from '@tanstack/table-core';

const mockHeader: Header<any, unknown> = {
  id: 'column-1',
  isPlaceholder: false,
  depth: 1,
  headerGroup: {} as HeaderGroup<any>, // Required for proper typing
  colSpan: 1, // Ensures it's structurally sound
  getSize: () => 150, // ✅ Move `getSize` here instead of inside `column`
  column: {
    columnDef: { header: 'Board Name' },
    getIsSorted: () => 'asc',
    getCanResize: () => true,
    getIsResizing: () => false,
    getToggleSortingHandler: jest.fn(),
  },
  getContext: () => ({}),
  getResizeHandler: jest.fn(),
  getLeafHeaders: (): Header<any, unknown>[] => [],
} as unknown as Header<any, unknown>;

const mockHeaderGroup: HeaderGroup<any> = {
  id: 'header-group-1',
  depth: 0,
  headers: [mockHeader],
};

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

  it('renders empty <thead> when no headers exist', () => {
    const wrapper = shallow(<BoardSummaryTableHeader headerGroups={[]} />);
    expect(wrapper.find('thead')).toHaveLength(1); // <thead> should still exist
    expect(wrapper.find('th')).toHaveLength(0); // No headers should be present
  });

  it('applies resizer classes and handlers when column is resizable', () => {
    const wrapper = shallow(<BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />);
    const resizeHandle = wrapper.find('.resizer');

    expect(resizeHandle).toHaveLength(1); // Ensure a resize handle exists
    expect(resizeHandle.prop('onMouseDown')).toBeDefined(); // Should have mouse down handler
    expect(resizeHandle.prop('onTouchStart')).toBeDefined(); // Should have touch start handler
  });

});