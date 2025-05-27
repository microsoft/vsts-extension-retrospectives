import React from 'react';
import { flexRender } from '@tanstack/react-table';
import type { Header, HeaderGroup } from '@tanstack/table-core';
import type { IBoardSummaryTableItem } from './boardSummaryTable';

interface BoardSummaryTableHeaderProps {
  headerGroups: HeaderGroup<IBoardSummaryTableItem>[];
  getThProps: (header: Header<IBoardSummaryTableItem, unknown>) => object;
}

const BoardSummaryTableHeader: React.FC<BoardSummaryTableHeaderProps> = ({ headerGroups, getThProps }) => (
  <thead role="rowgroup">
    {headerGroups.map((headerGroup) => (
      <tr key={headerGroup.id} role="row">
        {headerGroup.headers.map((header) => (
          <th {...getThProps(header)}>
            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            <div
              {...{
                onMouseDown: header.getResizeHandler(),
                onTouchStart: header.getResizeHandler(),
                className: `
                  ${header.column.getCanResize() ? 'resizer' : ''}
                  ${header.column.getIsResizing() ? 'isResizing' : ''}
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
