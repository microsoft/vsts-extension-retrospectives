import React from "react";
import type { ISimpleColumn } from "./boardSummaryTable";

type SortDirection = "asc" | "desc" | false;

interface BoardSummaryTableHeaderProps {
  columns: ISimpleColumn[];
  sortColumn: string;
  sortDirection: SortDirection;
  onSort: (columnId: string, sortDescFirst?: boolean) => void;
}

const BoardSummaryTableHeader: React.FC<BoardSummaryTableHeaderProps> = ({ columns, sortColumn, sortDirection, onSort }) => {
  const getSortProps = (column: ISimpleColumn) => {
    if (!column.sortable) {
      return {};
    }

    const isCurrentSort = sortColumn === column.id;
    let sortClassName = "";
    let ariaSort: "none" | "ascending" | "descending" | "other" = "none";

    if (isCurrentSort) {
      if (sortDirection === "asc") {
        sortClassName = "asc";
        ariaSort = "ascending";
      } else if (sortDirection === "desc") {
        sortClassName = "desc";
        ariaSort = "descending";
      }
    }

    return {
      "className": sortClassName,
      "aria-sort": ariaSort,
      "onClick": () => onSort(column.id, column.sortDescFirst),
      "style": { cursor: "pointer" },
    };
  };

  return (
    <thead role="rowgroup">
      <tr role="row">
        {columns.map(column => (
          <th key={column.id} role="columnheader" scope="col" {...getSortProps(column)}>
            {typeof column.header === "function" ? column.header() : column.header}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default BoardSummaryTableHeader;
