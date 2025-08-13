import React, { Fragment } from "react";
import { flexRender } from "@tanstack/react-table";
import type { Cell, Row } from "@tanstack/table-core";
import type { IBoardSummaryTableItem } from "./boardSummaryTable";

interface BoardSummaryTableBodyProps {
  rows: Row<IBoardSummaryTableItem>[];
  boardRowSummary: (row: Row<IBoardSummaryTableItem>) => JSX.Element;
}

const getTdProps = (cell: Cell<IBoardSummaryTableItem, unknown>) => {
  const hasPendingItems = cell.row.original.pendingWorkItemsCount > 0;
  const columnId = cell.column.id as keyof IBoardSummaryTableItem | undefined;
  const cellValue = cell.row.original[columnId];

  const ariaLabel = columnId && cellValue ? `${columnId} ${cellValue}` : "";

  let workItemsClass = "";
  switch (columnId) {
    case "totalWorkItemsCount":
    case "feedbackItemsCount":
      workItemsClass = "workItemsCount total-work-item-count";
      break;
    case "pendingWorkItemsCount":
      workItemsClass = "workItemsCount";
      if (hasPendingItems) {
        workItemsClass += " pending-action-item-count";
      }
      break;
    default:
      workItemsClass = "";
      break;
  }

  return {
    "className": `${workItemsClass}`,
    "aria-label": ariaLabel,
    "aria-readonly": true,
  };
};

const BoardSummaryTableBody: React.FC<BoardSummaryTableBodyProps> = ({ rows, boardRowSummary }) => (
  <tbody>
    {rows.map(row => (
      <Fragment key={row.id}>
        <tr
          tabIndex={0}
          aria-label="Board summary row. Click expand row icon to view more statistics for this board."
          onKeyPress={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") row.toggleExpanded();
          }}
          onClick={event => {
            const firstCell = event.currentTarget.cells[0];
            const clickedCell = (event.target as HTMLElement).closest("td");
            if (clickedCell !== firstCell) return;
            row.toggleExpanded();
          }}
        >
          {row.getVisibleCells().map(cell => (
            <td key={cell.id} {...getTdProps(cell)}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
        {row.getIsExpanded() && (
          <tr>
            <td colSpan={row.getVisibleCells().length}>{boardRowSummary(row)}</td>
          </tr>
        )}
      </Fragment>
    ))}
  </tbody>
);

export default BoardSummaryTableBody;
