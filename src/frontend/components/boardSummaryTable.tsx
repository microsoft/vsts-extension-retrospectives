import React, { Fragment, KeyboardEvent, useEffect, useState } from 'react';
import { IFeedbackBoardDocument } from '../interfaces/feedback';
import BoardDataService from '../dal/boardDataService';
import { WorkItem, WorkItemType, WorkItemStateColor } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';
import { itemDataService } from '../dal/itemDataService';
import { workItemService } from '../dal/azureDevOpsWorkItemService';
import BoardSummary from './boardSummary';
import { Cell, CellContext, Header, OnChangeFn, Row, SortDirection, SortingState, Table, TableOptions, createColumnHelper, flexRender, getCoreRowModel, getExpandedRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { appInsights, reactPlugin } from '../utilities/telemetryClient';
import { DefaultButton, Spinner, SpinnerSize } from 'office-ui-fabric-react';

export interface IBoardSummaryTableProps {
  teamId: string;
  supportedWorkItemTypes: WorkItemType[];
}

export interface IBoardSummaryTableState {
  boardsTableItems: IBoardSummaryTableItem[];
  feedbackBoards: IFeedbackBoardDocument[];
  isDataLoaded: boolean;
  actionItemsByBoard: IActionItemsTableItems;
  allDataLoaded: boolean;
}

export interface IBoardSummaryTableItem {
  boardName: string;
  createdDate: Date;
  isArchived?: boolean;
  archivedDate?: Date; //archivedDate not set for legacy archived boards
  pendingWorkItemsCount: number;
  totalWorkItemsCount: number;
  feedbackItemsCount: number;
  id: string; // Board ID
  teamId: string; // Added teamId to the definition
}

export interface IBoardActionItemsData {
  isDataLoaded: boolean;
  actionItems: WorkItem[];
}

export interface IActionItemsTableItems {
  [key: string]: IBoardActionItemsData;
}

function getTable(data: IBoardSummaryTableItem[], sortingState: SortingState, onSortingChange: OnChangeFn<SortingState>): Table<IBoardSummaryTableItem> {
  const updateRowState = (updatedRow: Partial<IBoardSummaryTableItem>, rowId: string) => {
    setTableData((prevData) =>
      prevData.map((row) =>
        row.id === rowId ? { ...row, ...updatedRow } : row
      )
    );
  }

  const columnHelper = createColumnHelper<IBoardSummaryTableItem>()
  const columns = [
    columnHelper.accessor('id', {
      header: null,
      footer: info => info.column.id,
      cell: (cellContext: CellContext<IBoardSummaryTableItem, string>) => {
        return cellContext.row.getCanExpand() ? (
          <DefaultButton
            className="contextual-menu-button"
            aria-label="Expand Row"
            title="Expand Row"
          >
            <span className="ms-Button-icon"><i className={`fas ${cellContext.row.getIsExpanded() ? 'fa-caret-down' : 'fa-caret-right'}`}></i></span>
          </DefaultButton>
        ) : (
          ''
        )
      },
      enableResizing: false,
      enableSorting: false
    }),
    columnHelper.accessor('boardName', {
      header: 'Retrospective Name',
      footer: info => info.column.id
    }),
    columnHelper.accessor('createdDate', {
      header: 'Created Date',
      footer: info => info.column.id,
      cell: (cellContext: CellContext<IBoardSummaryTableItem, Date>) => {
        return (
          new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(cellContext.row.original.createdDate)
        )
      },
      size: 120,
      sortDescFirst: true
    }),
    columnHelper.accessor('isArchived', {
      header: 'Archived',
      footer: info => info.column.id,
      cell: (cellContext: CellContext<IBoardSummaryTableItem, boolean | undefined>) => {
        const boardId = cellContext.row.original.id; // Board ID
        const teamId = cellContext.row.original.teamId; // Team ID
        const isArchived = cellContext.row.original.isArchived;

        return (
          <div
            onClick={(event) => event.stopPropagation()} // Prevent click propagation
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
          >
            <input
              type="checkbox"
              checked={!!isArchived} // Ensure boolean value
              onChange={async (event) => {
                console.log('Checkbox clicked, is checked:', event.target.checked);
                try {
                  if (event.target.checked) {
                    await BoardDataService.archiveFeedbackBoard(teamId, boardId);
                    updateRowState({ isArchived: true, archivedDate: new Date() });
                  } else {
                    await BoardDataService.restoreArchivedFeedbackBoard(teamId, boardId);
                    updateRowState({ isArchived: false, archivedDate: null });                  }
                } catch (error) {
                  console.error("Error while toggling archive state:", error);
                }
              }}
            />
          </div>
        );
      },
      size: 35,
      sortDescFirst: true,
    }),
    columnHelper.accessor('archivedDate', {
      header: 'Archived Date',
      footer: info => info.column.id,
      cell: (cellContext: CellContext<IBoardSummaryTableItem, Date | undefined>) => {
        const archivedDate = cellContext.row.original.archivedDate;
        return archivedDate
          ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(archivedDate)
          : ''; // Return an empty string if archivedDate is null or undefined
      },
      size: 120,
      sortDescFirst: true
    }),
    columnHelper.accessor('pendingWorkItemsCount', {
      header: 'Open Work Items',
      footer: info => info.column.id,
      size: 110,
    }),
    columnHelper.accessor('totalWorkItemsCount', {
      header: 'Total Work Items',
      footer: info => info.column.id,
      size: 110,
    })
  ]

  const tableOptions: TableOptions<IBoardSummaryTableItem> = {
    data,
    columns,
    columnResizeMode: 'onChange',
    onSortingChange: onSortingChange,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    state: {
      pagination: {
        pageSize: data.length,
        pageIndex: 0
      },
      sorting: sortingState
    },
  }

  return useReactTable(tableOptions);
}

function BoardSummaryTable(props: Readonly<IBoardSummaryTableProps>): JSX.Element {
  const [teamId, setTeamId] = useState<string>();
  const [boardSummaryState, setBoardSummaryState] = useState<IBoardSummaryTableState>({
    boardsTableItems: new Array<IBoardSummaryTableItem>(),
    isDataLoaded: false,
    feedbackBoards: new Array<IFeedbackBoardDocument>(),
    actionItemsByBoard: {},
    allDataLoaded: false
  })
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'createdDate', desc: true }])

  const table: Table<IBoardSummaryTableItem> = getTable(boardSummaryState.boardsTableItems, sorting, setSorting);

  const updatedState: IBoardSummaryTableState = boardSummaryState;

  const handleBoardsDocuments = (boardDocuments: IFeedbackBoardDocument[]) => {
    if((boardDocuments ?? []).length === 0) {
      updatedState.boardsTableItems = [];
      updatedState.isDataLoaded = true;
    } else {
      const boardsTableItems = new Array<IBoardSummaryTableItem>();
      const actionItems: IActionItemsTableItems = {};

      boardDocuments.forEach(board => {
        const boardSummaryItem: IBoardSummaryTableItem = {
          boardName: board.title,
          createdDate: new Date(board.createdDate),
          isArchived: board.isArchived ?? false,
          archivedDate: board.archivedDate ? new Date(board.archivedDate) : null,
          pendingWorkItemsCount: 0,
          totalWorkItemsCount: 0,
          feedbackItemsCount: 0,
          id: board.id,
          teamId: board.teamId,
        };

        boardsTableItems.push(boardSummaryItem);

        const actionItemsForBoard = new Array<WorkItem>();
        actionItems[board.id] = {
          isDataLoaded: false,
          actionItems: actionItemsForBoard,
        };
      });

      boardsTableItems.sort((b1, b2) => {
        return (new Date(b2.createdDate).getTime() - new Date(b1.createdDate).getTime());
      });

      updatedState.boardsTableItems = boardsTableItems;
      updatedState.isDataLoaded = true;
      updatedState.feedbackBoards = boardDocuments;
      updatedState.actionItemsByBoard = actionItems;
    }

    handleActionItems().then();
  }

  const handleActionItems = async () => {
    await Promise.all(updatedState.feedbackBoards.map(async (feedbackBoard) => {
      const feedbackBoardId: string = feedbackBoard.id;
      const feedbackItems = await itemDataService.getFeedbackItemsForBoard(feedbackBoardId);

      if (!feedbackItems.length) {
        return;
      }

      const feedbackItemsCount = feedbackItems.length;

      const workItemTypeToStatesMap: { [key: string]: WorkItemStateColor[] } = {};

      await Promise.all(props.supportedWorkItemTypes.map(async (workItemType) => {
        const workItemTypeStates = await workItemService.getWorkItemStates(workItemType.name);
        workItemTypeToStatesMap[workItemType.name] = workItemTypeStates;
      }));

      await Promise.all(feedbackItems.map(async (feedbackItem) => {
        if (!feedbackItem.associatedActionItemIds?.length) {
          return;
        }

        const workItems = await workItemService.getWorkItemsByIds(feedbackItem.associatedActionItemIds);
        if (!workItems.length) {
          return
        }

        const updatedActionItemsForBoard = updatedState.actionItemsByBoard[feedbackBoardId];
        const updatedItems = updatedActionItemsForBoard.actionItems.concat(workItems);
        updatedActionItemsForBoard.actionItems = updatedItems;
        updatedActionItemsForBoard.isDataLoaded = true;

        const pendingWorkItems = updatedItems.map((updatedItem) => {
          const states = workItemTypeToStatesMap[updatedItem.fields['System.WorkItemType']].filter((workItemState) => workItemState.name === updatedItem.fields['System.State']);
          if (states.length) {
            return states[0];
          }

          return null;
        }).filter((workItemState) => {
          return !workItemState || (workItemState.category !== 'Completed' && workItemState.category !== 'Removed');
        });

        const pendingWorkItemsCount = pendingWorkItems.length;
        const totalWorkItemsCount = updatedItems.length;

        updatedState.boardsTableItems = updatedState.boardsTableItems.map(item => item.id === feedbackBoardId ? { ...item, feedbackItemsCount, pendingWorkItemsCount, totalWorkItemsCount } : item);
      }));

      updatedState.boardsTableItems = updatedState.boardsTableItems.map(item => item.id === feedbackBoardId ? { ...item, feedbackItemsCount } : item);

      setBoardSummaryState({
        ...updatedState,
        allDataLoaded: true
      });
    }));
  }

  const boardRowSummary = (row: Row<IBoardSummaryTableItem>) => {
    const currentBoard = boardSummaryState.boardsTableItems.find(board => board.id === row.original.id);
    const actionItems = boardSummaryState.actionItemsByBoard[currentBoard.id];
    return <BoardSummary
      actionItems={actionItems?.actionItems}
      pendingWorkItemsCount={currentBoard?.pendingWorkItemsCount}
      resolvedActionItemsCount={currentBoard?.totalWorkItemsCount - currentBoard?.pendingWorkItemsCount}
      boardName={currentBoard?.boardName}
      feedbackItemsCount={currentBoard?.feedbackItemsCount}
      supportedWorkItemTypes={props.supportedWorkItemTypes}
    />
  }

  const getThProps = (header: Header<IBoardSummaryTableItem, unknown>) => {
    const sortDirection: false | SortDirection = header.column.getIsSorted()
    let sortClassName: string = "";
    let ariaSort: "none" | "ascending" | "descending" | "other" = "none";
    if(sortDirection) {
      sortClassName = sortDirection;
      ariaSort = `${sortDirection}ending`;
    }

    return {
      key: header.id,
      role: "columnheader",
      'aria-sort': ariaSort,
      style: {
        minWidth: header.getSize(),
        width: header.getSize()
      },
      className: sortClassName,
      onClick: header.column.getToggleSortingHandler()
    }
  }

  const getTdProps = (cell: Cell<IBoardSummaryTableItem, unknown>) => {
    const hasPendingItems: boolean = cell?.row?.original?.pendingWorkItemsCount > 0;
    const columnId: keyof IBoardSummaryTableItem | undefined = cell?.column?.id as keyof IBoardSummaryTableItem | undefined;
    const cellValue = (cell?.row?.original && columnId && cell.row.original[columnId]) ? cell.row.original[columnId] : null;

    const ariaLabel = (columnId && cellValue) ? columnId + ' ' + cellValue : '';

    let workItemsClass;
    switch (columnId) {
      case 'totalWorkItemsCount':
        workItemsClass = 'workItemsCount total-work-item-count';
        break;
      case 'pendingWorkItemsCount':
        workItemsClass = 'workItemsCount';
        if (hasPendingItems) {
          workItemsClass += " pending-action-item-count";
        }
        break;
      default:
        workItemsClass = '';
        break;
    }

    return {
      className: `${workItemsClass}`,
      'aria-label': ariaLabel,
      'aria-readonly': true
    };
  }

  useEffect(() => {
    if(teamId !== props.teamId) {
      BoardDataService.getBoardsForTeam(props.teamId).then((boardDocuments: IFeedbackBoardDocument[]) => {
        setTeamId(props.teamId);
        handleBoardsDocuments(boardDocuments);
      }).catch(e => {
        appInsights.trackException(e);
      })
    }
  }, [props.teamId])

  if(boardSummaryState.allDataLoaded !== true) {
    return <Spinner className="board-summary-initialization-spinner"
      size={SpinnerSize.large}
      label="Loading..."
      ariaLive="assertive"
    />
  }

  return (
    <div className="board-summary-table-container">
      <table>
          <thead role="rowgroup">
            {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} role="row">
                  {headerGroup.headers.map(header => (
                    <th {...getThProps(header)} onClick={header.column.getToggleSortingHandler()}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      <div
                      {...{
                        onMouseDown: header.getResizeHandler(),
                        onTouchStart: header.getResizeHandler(),
                        className: `
                          ${header.column.getCanResize() ? 'resizer' : ''}
                          ${header.column.getIsResizing() ? 'isResizing' : ''}
                        `
                      }}
                    />
                    </th>
                  ))}
                </tr>
              ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <Fragment key={row.id}>
              <tr
                tabIndex={0}
                aria-label="Board summary row. Click row to expand and view more statistics for this board."
                onKeyPress={(e: KeyboardEvent) => { if (e.key === 'Enter') row.toggleExpanded(); }}
                onClick={() => row.toggleExpanded()}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} {...getTdProps(cell)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
              {row.getIsExpanded() &&
              <tr>
                <td colSpan={row.getVisibleCells().length}>
                  { boardRowSummary(row) }
                </td>
              </tr>}
              </Fragment>
            ))}
          </tbody>
      </table>
    </div>
  );
}

export default withAITracking(reactPlugin, BoardSummaryTable);
