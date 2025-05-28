import React from 'react';
import { mount, shallow } from 'enzyme';
import BoardSummaryTableBody from '../boardSummaryTableBody';
import type { Row, Cell, Column } from '@tanstack/table-core';
import type { IBoardSummaryTableItem } from '../boardSummaryTable';

const mockSummary = jest.fn().mockReturnValue(<div>Mock summary</div>);

const createMockCell = (id: string, value: any): Cell<IBoardSummaryTableItem, unknown> => {
  const column: Partial<Column<IBoardSummaryTableItem, unknown>> = {
    id,
    columnDef: {
      id,
      accessorFn: () => value,
      cell: () => <span>{value}</span>,
    },
  };

  const cell: Partial<Cell<IBoardSummaryTableItem, unknown>> = {
    id: `cell-${id}`,
    column: column as Column<IBoardSummaryTableItem, unknown>,
    getContext: jest.fn(),
    getValue: () => value,
  };

  return cell as Cell<IBoardSummaryTableItem, unknown>;
};

const createMockRow = ({
  id = 'row-1',
  visibleCells = [],
  isExpanded = false,
  toggleExpanded = jest.fn(),
  original = {} as IBoardSummaryTableItem,
}: Partial<Partial<Row<IBoardSummaryTableItem>>> & {
  visibleCells?: Cell<IBoardSummaryTableItem, unknown>[];
  isExpanded?: boolean;
  toggleExpanded?: () => void;
  original?: IBoardSummaryTableItem;
} = {}): Row<IBoardSummaryTableItem> => {
  const row: Partial<Row<IBoardSummaryTableItem>> = {
    id,
    getVisibleCells: () => visibleCells,
    getIsExpanded: () => isExpanded,
    toggleExpanded,
    original,
  };

  visibleCells.forEach((cell) => {
    cell.row = row as Row<IBoardSummaryTableItem>;
  });

  return row as Row<IBoardSummaryTableItem>;
};

describe('BoardSummaryTableBody', () => {
  it('renders rows and their cells', () => {
    const cell1 = createMockCell('totalWorkItemsCount', 10);
    const cell2 = createMockCell('pendingWorkItemsCount', 5);
    const row = createMockRow({
      visibleCells: [cell1, cell2],
      original: {
        totalWorkItemsCount: 10,
        pendingWorkItemsCount: 5,
        feedbackItemsCount: 2,
      } as IBoardSummaryTableItem,
    });

    const wrapper = mount(<BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />);
    expect(wrapper.find('tr')).toHaveLength(1);
    expect(wrapper.find('td')).toHaveLength(2);
  });

  it('applies correct classes and ARIA attributes to <td>', () => {
    const cell = createMockCell('pendingWorkItemsCount', 5);
    const row = createMockRow({
      visibleCells: [cell],
      original: {
        pendingWorkItemsCount: 5,
      } as IBoardSummaryTableItem,
    });

    const wrapper = mount(<BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />);
    const td = wrapper.find('td').at(0);
    expect(td.prop('className')).toContain('pending-action-item-count');
    expect(td.prop('aria-label')).toMatch(/pendingWorkItemsCount 5/);
  });

  it('expands row when first cell is clicked', () => {
    const toggleExpanded = jest.fn();
    const cell = createMockCell('totalWorkItemsCount', 10);
    const row = createMockRow({
      visibleCells: [cell],
      toggleExpanded,
      original: {
        totalWorkItemsCount: 10,
        pendingWorkItemsCount: 0,
      } as IBoardSummaryTableItem,
    });

    const wrapper = mount(<BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />);
    wrapper.find('tr').at(0).simulate('click', {
      currentTarget: {
        cells: [wrapper.find('td').at(0).getDOMNode()],
      },
      target: {
        closest: () => wrapper.find('td').at(0).getDOMNode(),
      },
    });

    expect(toggleExpanded).toHaveBeenCalled();
  });

  it('does not expand row when a cell other than the first is clicked', () => {
    const toggleExpanded = jest.fn();
    const cells = [createMockCell('totalWorkItemsCount', 10), createMockCell('pendingWorkItemsCount', 5)];
    const row = createMockRow({ visibleCells: cells, toggleExpanded });

    const wrapper = mount(<BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />);
    wrapper.find('tr').at(0).simulate('click', {
      currentTarget: {
        cells: [wrapper.find('td').at(0).getDOMNode()],
      },
      target: {
        closest: () => wrapper.find('td').at(1).getDOMNode(),
      },
    });

    expect(toggleExpanded).not.toHaveBeenCalled();
  });

  it('expands row when Enter key is pressed', () => {
    const toggleExpanded = jest.fn();
    const row = createMockRow({ toggleExpanded });

    const wrapper = mount(<BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />);
    wrapper.find('tr').at(0).simulate('keyPress', { key: 'Enter' });

    expect(toggleExpanded).toHaveBeenCalled();
  });

  it('renders boardRowSummary when row is expanded', () => {
    const row = {
      id: 'row1',
      getIsExpanded: () => true,
      toggleExpanded: jest.fn(),
      original: {
        boardName: 'Board A',
        totalWorkItemsCount: 10,
        feedbackItemsCount: 2,
        pendingWorkItemsCount: 1,
      },
    } as Partial<Row<IBoardSummaryTableItem>> as Row<IBoardSummaryTableItem>;

    const mockCells = [
      createMockCell('boardName', 'Board A', row),
      createMockCell('totalWorkItemsCount', 10, row),
    ];

    (row as any).getVisibleCells = () => mockCells;

    const mockSummary = jest.fn(() => <div>Mock summary</div>);

    const wrapper = mount(
      <table>
        <BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />
      </table>
    );

    expect(wrapper.text()).toContain('Mock summary');
    expect(wrapper.find('td').last().prop('colSpan')).toBe(mockCells.length);
  });

  it('renders nothing when rows is empty', () => {
    const wrapper = shallow(<BoardSummaryTableBody rows={[]} boardRowSummary={mockSummary} />);
    expect(wrapper.find('tr')).toHaveLength(0);
  });
});
