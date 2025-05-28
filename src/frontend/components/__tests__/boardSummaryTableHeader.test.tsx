import React from 'react';
import { shallow, mount } from 'enzyme';
import BoardSummaryTableHeader from '../boardSummaryTableHeader';
import type { Header, HeaderGroup } from '@tanstack/table-core';

const resizeHandler = jest.fn();

const mockHeader: Header<any, unknown> = {
  id: 'column-1',
  isPlaceholder: false,
  depth: 1,
  headerGroup: {} as HeaderGroup<any>,
  colSpan: 1,
  getSize: () => 150,
  getResizeHandler: () => resizeHandler,
  column: {
    columnDef: { header: () => <span>Board Name</span> },
    getIsSorted: () => 'asc',
    getCanResize: () => true,
    getIsResizing: () => true,
    getToggleSortingHandler: jest.fn(),
  },
  getContext: () => ({}),
  getLeafHeaders: (): Header<any, unknown>[] => [],
} as unknown as Header<any, unknown>;

const mockHeaderGroup: HeaderGroup<any> = {
  id: 'header-group-1',
  depth: 0,
  headers: [mockHeader],
};

describe('BoardSummaryTableHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table headers correctly', () => {
    const wrapper = shallow(<BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />);
    expect(wrapper.find('thead')).toHaveLength(1);
    expect(wrapper.find('tr')).toHaveLength(1);
    expect(wrapper.find('th')).toHaveLength(mockHeaderGroup.headers.length);
  });

  it('applies correct sorting properties to headers', () => {
    const wrapper = shallow(<BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />);
    const headerElement = wrapper.find('th').at(0);

    expect(headerElement.prop('aria-sort')).toBe('ascending');
    expect(headerElement.hasClass('asc')).toBeTruthy();
  });

  it('applies correct sorting properties when sorting is descending', () => {
    const mockDescendingHeader: Header<any, unknown> = {
      ...mockHeader,
      column: {
        ...mockHeader.column,
        getIsSorted: () => 'desc',
      },
    };

    const mockDescendingHeaderGroup: HeaderGroup<any> = {
      id: 'header-group-2',
      depth: 0,
      headers: [mockDescendingHeader],
    };

    const wrapper = shallow(<BoardSummaryTableHeader headerGroups={[mockDescendingHeaderGroup]} />);
    const headerElement = wrapper.find('th').at(0);

    expect(headerElement.prop('aria-sort')).toBe('descending');
    expect(headerElement.hasClass('desc')).toBeTruthy();
  });

  it('calls sorting handler when header is clicked', () => {
    const wrapper = shallow(<BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />);
    wrapper.find('th').simulate('click');
    expect(mockHeaderGroup.headers[0].column.getToggleSortingHandler).toHaveBeenCalled();
  });

  it('renders empty <thead> when no headers exist', () => {
    const wrapper = shallow(<BoardSummaryTableHeader headerGroups={[]} />);
    expect(wrapper.find('thead')).toHaveLength(1);
    expect(wrapper.find('th')).toHaveLength(0);
  });

  it('renders header content and resizer with correct classes', () => {
    const wrapper = mount(<BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />);
    const th = wrapper.find('th').at(0);

    // Header content
    expect(th.text()).toContain('Board Name');

    // Resizer div (select by class to avoid ambiguity)
    const resizerDiv = th.find('div.resizer');
    expect(resizerDiv.exists()).toBe(true);
    expect(resizerDiv.hasClass('resizer')).toBe(true);
    expect(resizerDiv.hasClass('isResizing')).toBe(true);
  });

  it('calls resize handler on mouse down and touch start', () => {
    const wrapper = mount(<BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />);
    const resizerDiv = wrapper.find('div.resizer');

    resizerDiv.simulate('mouseDown');
    resizerDiv.simulate('touchStart');

    expect(resizeHandler).toHaveBeenCalledTimes(2);
  });

  it('renders null content when header is placeholder', () => {
    const placeholderHeader = {
      ...mockHeader,
      isPlaceholder: true,
    };
    const placeholderGroup = {
      ...mockHeaderGroup,
      headers: [placeholderHeader],
    };
    const wrapper = mount(<BoardSummaryTableHeader headerGroups={[placeholderGroup]} />);
    const th = wrapper.find('th').at(0);

    // Placeholder header should have no children content (render null)
    expect(th.children()).toHaveLength(0);
  });
});
