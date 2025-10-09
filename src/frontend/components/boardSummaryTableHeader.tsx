import React from "react";
import { flexRender } from "@tanstack/react-table";
import type { Header, HeaderGroup, SortDirection } from "@tanstack/table-core";
import type { IBoardSummaryTableItem } from "./boardSummaryTable";

interface BoardSummaryTableHeaderProps {
  headerGroups: HeaderGroup<IBoardSummaryTableItem>[];
}

const getThProps = (header: Header<IBoardSummaryTableItem, unknown>) => {
  const sortDirection: false | SortDirection = header.column.getIsSorted();
  let sortClassName = "";
  let ariaSort: "none" | "ascending" | "descending" | "other" = "none";

  if (sortDirection === "asc") {
    sortClassName = sortDirection;
    ariaSort = "ascending";
  } else if (sortDirection === "desc") {
    sortClassName = sortDirection;
    ariaSort = "descending";
  }

  return {
    "key": header.id,
    "role": "columnheader",
    "aria-sort": ariaSort,
    "style": {
      minWidth: header.getSize(),
      width: header.getSize(),
    },
    "className": sortClassName,
    "onClick": header.column.getToggleSortingHandler(),
  };
};

const BoardSummaryTableHeader: React.FC<BoardSummaryTableHeaderProps> = ({ headerGroups }) => (
  <thead role="rowgroup">
    {headerGroups.map(headerGroup => (
      <tr key={headerGroup.id} role="row">
        {headerGroup.headers.map(header => (
          <th key={header.id} {...getThProps(header)}>
            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            <div
              {...{
                onMouseDown: header.getResizeHandler(),
                onTouchStart: header.getResizeHandler(),
                className: `
                  ${header.column.getCanResize() ? "resizer" : ""}
                  ${header.column.getIsResizing() ? "isResizing" : ""}
                `,
              }}
            />
          </th>
        ))}
      </tr>
    ))}
  </thead>
);

export default BoardSummaryTableHeader;
