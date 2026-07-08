import React from "react";
import type { ISimpleColumn } from "./boardSummaryTable";
import { getIconElement } from "./icons";

type SortDirection = "asc" | "desc" | false;
type AriaSort = "none" | "ascending" | "descending" | "other";

interface BoardSummaryTableHeaderProps {
  columns: ISimpleColumn[];
  sortColumn: string;
  sortDirection: SortDirection;
  onSort: (columnId: string) => void;
}

const BoardSummaryTableHeader: React.FC<BoardSummaryTableHeaderProps> = ({ columns, sortColumn, sortDirection, onSort }) => {
  const getAriaSort = (column: ISimpleColumn): AriaSort => {
    if (sortColumn !== column.id) {
      return "none";
    }

    if (sortDirection === "asc") {
      return "ascending";
    }

    if (sortDirection === "desc") {
      return "descending";
    }

    return "none";
  };

  const renderSortIcon = (column: ISimpleColumn) => {
    const isCurrentSort = sortColumn === column.id;

    if (isCurrentSort && sortDirection === "asc") {
      return <span className="board-summary-sort-icon" aria-hidden="true">{getIconElement("chevron-up")}</span>;
    }

    if (isCurrentSort && sortDirection === "desc") {
      return <span className="board-summary-sort-icon" aria-hidden="true">{getIconElement("chevron-down")}</span>;
    }

    return (
      <span className="board-summary-sort-icon unsorted" aria-hidden="true">
        {getIconElement("chevron-up")}
        {getIconElement("chevron-down")}
      </span>
    );
  };

  const renderHeaderContent = (column: ISimpleColumn) => {
    const header = typeof column.header === "function" ? column.header() : column.header;

    if (!column.sortable) {
      return header;
    }

    return (
      <button type="button" className="board-summary-sort-button">
        <span className="board-summary-sort-label">{header}</span>
        {renderSortIcon(column)}
      </button>
    );
  };

  const getSortProps = (column: ISimpleColumn) => {
    if (!column.sortable) {
      return {};
    }

    const isCurrentSort = sortColumn === column.id;
    let sortClassName = "";

    if (isCurrentSort) {
      if (sortDirection === "asc") {
        sortClassName = "asc";
      } else if (sortDirection === "desc") {
        sortClassName = "desc";
      }
    }

    return {
      "className": sortClassName,
      "aria-sort": getAriaSort(column),
      "onClick": () => onSort(column.id),
      "style": { cursor: "pointer" },
    };
  };

  return (
    <thead role="rowgroup">
      <tr role="row">
        {columns.map(column => (
          <th key={column.id} role="columnheader" scope="col" {...getSortProps(column)}>
            {renderHeaderContent(column)}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default BoardSummaryTableHeader;
