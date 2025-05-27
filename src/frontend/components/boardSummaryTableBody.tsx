import React, { Fragment } from 'react';
import { flexRender } from '@tanstack/react-table';
import type { Cell, Row } from '@tanstack/table-core';
import type { IBoardSummaryTableItem } from './boardSummaryTable';

interface BoardSummaryTableBodyProps {
  rows: Row<IBoardSummaryTableItem>[];
  getTdProps: (cell: Cell<IBoardSummaryTableItem, unknown>) => object;
  boardRowSummary: (row: Row<IBoardSummaryTableItem>) => JSX.Element;
}

const BoardSummaryTableBody: React.FC<BoardSummaryTableBodyProps> = ({ rows, getTdProps, boardRowSummary }) => (
  <tbody>
    {rows.map((row) => (
      <Fragment key={row.id}>
        <tr
          tabIndex={0}
          aria-label="Board summary row. Click expand row icon to view more statistics for this board."
          onKeyPress={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') row.toggleExpanded();
          }}
          onClick={(event) => {
            const firstCell = event.currentTarget.cells[0];
            const clickedCell = (event.target as HTMLElement).closest('td');
            if (clickedCell !== firstCell) return;
            row.toggleExpanded();
          }}
        >
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id} {...getTdProps(cell)}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
        {row.getIsExpanded() && (
          <tr>
            <td colSpan={row.getVisibleCells().length}>
              {boardRowSummary(row)}
            </td>
          </tr>
        )}
      </Fragment>
    ))}
  </tbody>
);

export default BoardSummaryTableBody;
