import React, { Fragment } from "react";
import type { IBoardSummaryTableItem, ISimpleColumn } from "./boardSummaryTable";

interface BoardSummaryTableBodyProps {
  columns: ISimpleColumn[];
  data: IBoardSummaryTableItem[];
  expandedRows: Set<string>;
  boardRowSummary: (item: IBoardSummaryTableItem) => React.JSX.Element | null;
}

const getTdProps = (item: IBoardSummaryTableItem, columnId: string) => {
  const hasPendingItems = item.pendingWorkItemsCount > 0;

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

  const columnKey = columnId as keyof IBoardSummaryTableItem;
  const cellValue = item[columnKey];
  const hasValue = cellValue !== undefined && cellValue !== null;
  const ariaLabel = hasValue ? `${columnId} ${cellValue}` : undefined;

  return {
    "className": `${workItemsClass}`,
    "aria-label": ariaLabel,
    "aria-readonly": true,
  };
};

const BoardSummaryTableBody: React.FC<BoardSummaryTableBodyProps> = ({ columns, data, expandedRows, boardRowSummary }) => (
  <tbody>
    {data.map(item => {
      const isExpanded = expandedRows.has(item.id);
      return (
        <Fragment key={item.id}>
          <tr
            tabIndex={0}
            aria-label="Board summary row. Click expand row icon to view more statistics for this board."
            onKeyPress={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") {
                const expandColumn = columns[0];
                if (expandColumn) {
                  expandColumn.cell(item);
                }
              }
            }}
          >
            {columns.map(column => (
              <td key={column.id} {...getTdProps(item, column.id)}>
                {column.cell(item)}
              </td>
            ))}
          </tr>
          {isExpanded && (
            <tr>
              <td colSpan={columns.length}>{boardRowSummary(item)}</td>
            </tr>
          )}
        </Fragment>
      );
    })}
  </tbody>
);

export default BoardSummaryTableBody;
