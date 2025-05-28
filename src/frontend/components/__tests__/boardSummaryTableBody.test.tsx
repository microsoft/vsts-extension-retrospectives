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
    const cell1 = createMockCell('totalWorkItemsCount', 2);
    const cell2 = createMockCell('pendingWorkItemsCount', 1);
    const row = createMockRow({
      visibleCells: [cell1, cell2],
      original: {
        totalWorkItemsCount: 2,
        pendingWorkItemsCount: 1,
        feedbackItemsCount: 10,
      } as IBoardSummaryTableItem,
    });

    const wrapper = mount(<BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />);
    expect(wrapper.find('tr')).toHaveLength(1);
    expect(wrapper.find('td')).toHaveLength(2);
  });

  it('applies correct classes and ARIA attributes to <td>', () => {
    const cell = createMockCell('pendingWorkItemsCount', 2);
    const row = createMockRow({
      visibleCells: [cell],
      original: {
        pendingWorkItemsCount: 2,
      } as IBoardSummaryTableItem,
    });

    const wrapper = mount(<BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />);
    const td = wrapper.find('td').at(0);
    expect(td.prop('className')).toContain('pending-action-item-count');
    expect(td.prop('aria-label')).toMatch(/pendingWorkItemsCount 5/);
  });

  it('expands row when first cell is clicked', () => {
    const toggleExpanded = jest.fn();
    const cell = createMockCell('totalWorkItemsCount', 2);
    const row = createMockRow({
      visibleCells: [cell],
      toggleExpanded,
      original: {
        totalWorkItemsCount: 2,
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
  // Mock row with full original data including required properties
  const row = {
    id: 'row1',
    getIsExpanded: () => true,
    toggleExpanded: jest.fn(),
    original: {
      id: 'board1',
      boardName: 'Board A',
      totalWorkItemsCount: 2,
      feedbackItemsCount: 10,
      pendingWorkItemsCount: 1,
      createdDate: new Date(),
      teamId: 'team1',
      ownerId: 'owner1',
    } as IBoardSummaryTableItem,
  } as Partial<Row<IBoardSummaryTableItem>> as Row<IBoardSummaryTableItem>;

  // Create mock cells without the row property yet
  const mockCells = [
    createMockCell('boardName', 'Board A'),
    createMockCell('totalWorkItemsCount', 2),
  ];

  // Assign the row object to each cell's 'row' property to avoid undefined 'original'
  mockCells.forEach(cell => {
    (cell as any).row = row;
  });

  // Add getVisibleCells method to the row to return the mock cells
  (row as any).getVisibleCells = () => mockCells;

  // Mock boardRowSummary component
  const mockSummary = jest.fn(() => <div>Mock summary</div>);

  // Mount BoardSummaryTableBody inside a table (needed for <tr> to render correctly)
  const wrapper = mount(
    <table>
      <BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />
    </table>
  );

  // Assert that the summary content is rendered
  expect(wrapper.text()).toContain('Mock summary');

  // Assert the summary row's cell spans the full number of visible cells
  expect(wrapper.find('td').last().prop('colSpan')).toBe(mockCells.length);
});

  it('renders nothing when rows is empty', () => {
    const wrapper = shallow(<BoardSummaryTableBody rows={[]} boardRowSummary={mockSummary} />);
    expect(wrapper.find('tr')).toHaveLength(0);
  });
});
