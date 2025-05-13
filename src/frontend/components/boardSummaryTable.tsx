import React, { Fragment, useEffect, useState } from 'react';
import { WorkItem, WorkItemType, WorkItemStateColor } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';
import { DefaultButton, Dialog, DialogContent, DialogFooter, DialogType, PrimaryButton, Spinner, SpinnerSize } from 'office-ui-fabric-react';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { flexRender, useReactTable } from '@tanstack/react-table';

import BoardSummary from './boardSummary';
import { IFeedbackBoardDocument } from '../interfaces/feedback';
import BoardDataService from '../dal/boardDataService';
import { itemDataService } from '../dal/itemDataService';
import { workItemService } from '../dal/azureDevOpsWorkItemService';
import { reflectBackendService } from "../dal/reflectBackendService";
import { appInsights, reactPlugin, TelemetryEvents } from '../utilities/telemetryClient';
import { encrypt, getUserIdentity } from '../utilities/userIdentityHelper';

import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  type Cell,
  type CellContext,
  type Header,
  type HeaderContext,
  type HeaderGroup,
  type OnChangeFn,
  type Row,
  type SortDirection,
  type SortingState,
  type Table,
  type TableOptions
} from '@tanstack/table-core';

export interface IBoardSummaryTableProps {
  teamId: string;
  supportedWorkItemTypes: WorkItemType[];
  onArchiveToggle: () => void; // Notify the parent about archive toggles
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
  archivedDate?: Date; // archivedDate not set for legacy archived boards
  pendingWorkItemsCount: number;
  totalWorkItemsCount: number;
  feedbackItemsCount: number;
  id: string; // Board ID
  teamId: string;
  ownerId: string; // DPH
}

export interface IBoardActionItemsData {
  isDataLoaded: boolean;
  actionItems: WorkItem[];
}

export interface IActionItemsTableItems {
  [key: string]: IBoardActionItemsData;
}

interface BoardSummaryTableHeaderProps {
  headerGroups: HeaderGroup<IBoardSummaryTableItem>[];
  getThProps: (header: Header<IBoardSummaryTableItem, unknown>) => object;
}

interface BoardSummaryTableBodyProps {
  rows: Row<IBoardSummaryTableItem>[];
  getTdProps: (cell: Cell<IBoardSummaryTableItem, unknown>) => object;
  boardRowSummary: (row: Row<IBoardSummaryTableItem>) => JSX.Element;
}

const BoardSummaryTableHeader: React.FC<BoardSummaryTableHeaderProps> = ({ headerGroups, getThProps }) => (
  <thead role="rowgroup">
    {headerGroups.map((headerGroup) => (
      <tr key={headerGroup.id} role="row">
        {headerGroup.headers.map((header) => (
          <th {...getThProps(header)}>
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
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

const BoardSummaryTableBody: React.FC<BoardSummaryTableBodyProps> = ({
  rows,
  getTdProps,
  boardRowSummary,
}) => (
  <tbody>
    {rows.map((row) => (
      <Fragment key={row.id}>
        <tr
          tabIndex={0}
          aria-label="Board summary row. Click row to expand and view more statistics for this board."
          onKeyPress={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') row.toggleExpanded();
          }}
          onClick={() => row.toggleExpanded()}
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

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

async function handleArchiveToggle(
  teamId: string,
  boardId: string,
  toggleIsArchived: boolean,
  setTableData: React.Dispatch<React.SetStateAction<IBoardSummaryTableItem[]>>,
  onArchiveToggle: () => void
) {
  try {
    if (toggleIsArchived) {
      await BoardDataService.archiveFeedbackBoard(teamId, boardId);
      appInsights.trackEvent({
        name: TelemetryEvents.FeedbackBoardArchived,
        properties: { boardId }
      });
    } else {
      await BoardDataService.restoreArchivedFeedbackBoard(teamId, boardId);
      appInsights.trackEvent({
        name: TelemetryEvents.FeedbackBoardRestored,
        properties: { boardId }
      });
    }

    setTableData(prevData =>
      prevData.map(item =>
        item.id === boardId
          ? {
              ...item,
              isArchived: toggleIsArchived,
              archivedDate: toggleIsArchived ? new Date() : null
            }
          : item
      )
    );

    onArchiveToggle();
  } catch (error) {
    console.error('Error while toggling archive state: ', error);
  }
}

// DPH
// State for delete dialog
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

// DPH
const handleTrashClick = async (  
  event: React.MouseEvent, 
  teamId: string, 
  boardId: string, 
  setTableData: React.Dispatch<React.SetStateAction<IBoardSummaryTableItem[]>>
) => {
  event.stopPropagation(); // Prevent row expansion

  try {
    const boardExists = await BoardDataService.getBoardForTeamById(teamId, boardId);
    if (!boardExists) {
      alert("This board was already deleted by another user. Refreshing your view now.");
      setTableData(prevData => prevData.filter(board => board.id !== boardId)); // Remove from UI
      return;
    }

    setIsDeleteDialogOpen(true); // Open confirmation dialog
  } catch (error) {
    console.error("Error checking board existence:", error);
  }
};

// DPH
// Handles canceling the delete dialog
const handleCancelDelete = () => {
  setIsDeleteDialogOpen(false);
};

// DPH
// Handles confirming the board deletion
const handleConfirmDelete = async (
  selectedBoard: IBoardSummaryTableItem,
  setTableData: React.Dispatch<React.SetStateAction<IBoardSummaryTableItem[]>>
) => {
  try {
    await BoardDataService.deleteFeedbackBoard(selectedBoard.teamId, selectedBoard.id);
    reflectBackendService.broadcastDeletedBoard(selectedBoard.teamId, selectedBoard.id);

    // Update local state to remove the deleted board from the table
    setTableData((prevData) => prevData.filter(board => board.id !== selectedBoard.id));

    // Track the event
    appInsights.trackEvent({
      name: TelemetryEvents.FeedbackBoardDeleted,
      properties: {
        boardId: selectedBoard.id,
        boardName: selectedBoard.boardName,
        deletedByUserId: encrypt(getUserIdentity().id),
      }
    });

  } catch (error) {
    console.error("Error deleting board:", error);
  }
};

function getTable(
  tableData: IBoardSummaryTableItem[],
  sortingState: SortingState,
  onSortingChange: OnChangeFn<SortingState>,
  onArchiveToggle: () => void,
  // isDataLoaded: boolean, // DPH if remove then expect only 5 arguments
  setTableData: React.Dispatch<React.SetStateAction<IBoardSummaryTableItem[]>>
): Table<IBoardSummaryTableItem> {
  const columnHelper = createColumnHelper<IBoardSummaryTableItem>();
  const defaultFooter = (info: HeaderContext<IBoardSummaryTableItem, unknown>) => info.column.id;

  const columns = [
    columnHelper.accessor('id', {
      header: null,
      footer: defaultFooter,
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
      footer: defaultFooter
    }),
    columnHelper.accessor('createdDate', {
      header: 'Created Date',
      footer: defaultFooter,
      cell: (cellContext: CellContext<IBoardSummaryTableItem, Date>) => {
        return dateFormatter.format(cellContext.row.original.createdDate);
      },
      size: 100,
      sortDescFirst: true
    }),
    columnHelper.accessor('isArchived', {
      header: 'Archived',
      footer: defaultFooter,
      cell: (cellContext: CellContext<IBoardSummaryTableItem, boolean | undefined>) => {
        const boardId = cellContext.row.original.id;
        const teamId = cellContext.row.original.teamId;
        const isArchived = cellContext.row.original.isArchived;

        return (
          <div
            onClick={(event) => event.stopPropagation()} // Prevent click propagation
            className="centered-cell"
          >
          <input
            type="checkbox"
            checked={!!isArchived} // Ensure boolean value
            onChange={(event) => {
              const toggleIsArchived = event.target.checked;
              handleArchiveToggle(teamId, boardId, toggleIsArchived, setTableData, onArchiveToggle);
            }}
          />
          </div>
        );
      },
      size: 30,
      sortDescFirst: true,
    }),
    columnHelper.accessor('archivedDate', {
      header: 'Archived Date',
      footer: defaultFooter,
      cell: (cellContext: CellContext<IBoardSummaryTableItem, Date | undefined>) => {
        const archivedDate = cellContext.row.original.archivedDate;
        return archivedDate ? dateFormatter.format(archivedDate) : '';
      },
      size: 100,
      sortDescFirst: true
    }),
    columnHelper.accessor('feedbackItemsCount', {
      header: 'Feedback Items',
      footer: defaultFooter,
      size: 80,
    }),
    columnHelper.accessor('totalWorkItemsCount', {
      header: 'Total Work Items',
      footer: defaultFooter,
      size: 80,
    }),
    // DPH delete

    columnHelper.display({
      id: 'trash',
      header: () => (
        <div className="centered-cell">
          <i className="fas fa-trash-alt" style={{ color: 'white' }} title="Delete board"></i>
        </div>
      ),
      cell: (cellContext) => {
        const selectedBoard = cellContext.row.original;
        /*
        const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

        const handleTrashClick = (event: React.MouseEvent) => {
          event.stopPropagation(); // Prevent row expansion on click
          setIsDeleteDialogOpen(true);
        };

      const handleCancelDelete = () => {
        setIsDeleteDialogOpen(false);
      };

      const handleConfirmDelete = async (selectedBoard: IBoardSummaryTableItem) => {
        try {
          await BoardDataService.deleteFeedbackBoard(selectedBoard.teamId, selectedBoard.id);
          reflectBackendService.broadcastDeletedBoard(selectedBoard.teamId, selectedBoard.id);

          // Update local state to remove the deleted board from the table
          setTableData((prevData) => prevData.filter(board => board.id !== selectedBoard.id));

          // Track the event
          appInsights.trackEvent({
            name: TelemetryEvents.FeedbackBoardDeleted,
            properties: {
              boardId: selectedBoard.id,
              boardName: selectedBoard.boardName,
              deletedByUserId: encrypt(getUserIdentity().id),
            }
          });

        } catch (error) {
          console.error("Error deleting board:", error);
        }
      };
*/
// DPH
      return (
        <>
          <div
            className="centered-cell trash-icon"
            title="Delete board"
            onClick={(event) => handleTrashClick(event, selectedBoard.teamId, selectedBoard.id, setTableData)}
          >
            {selectedBoard.isArchived && <i className="fas fa-trash-alt"></i>}
          </div>
          <Dialog
            hidden={!isDeleteDialogOpen}
            onDismiss={handleCancelDelete}
            dialogContentProps={{
              type: DialogType.close,
              title: 'Delete Retrospective',
            }}
            modalProps={{
              isBlocking: true,
              containerClassName: 'retrospectives-delete-board-confirmation-dialog',
              className: 'retrospectives-dialog-modal',
            }}>
            <DialogContent>
              <p>
                The retrospective board &quot;{selectedBoard.boardName}&quot; with {selectedBoard.feedbackItemsCount} feedback items will be deleted.
              </p>
              <br />
              <p style={{ fontStyle: "italic" }}>
                This action is permanent and cannot be undone.
              </p>
            </DialogContent>
            <DialogFooter>
              <PrimaryButton onClick={() => handleConfirmDelete(selectedBoard, setTableData)} text="Delete" />
              <DefaultButton autoFocus onClick={handleCancelDelete} text="Cancel" />
            </DialogFooter>
          </Dialog>
        </>
      );
    },
      size: 45,
      enableSorting: false,
    })
  ]

  const tableOptions: TableOptions<IBoardSummaryTableItem> = {
    data: tableData,
    columns,
    columnResizeMode: 'onChange',
    onSortingChange: onSortingChange,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    state: {
      pagination: {
        pageSize: tableData.length,
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
    allDataLoaded: false,
  });

  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdDate', desc: true }])
  const [tableData, setTableData] = useState<IBoardSummaryTableItem[]>([]);
  useEffect(() => {
    setTableData(boardSummaryState.boardsTableItems);
  }, [boardSummaryState.boardsTableItems]);

  const table: Table<IBoardSummaryTableItem> =
    getTable(tableData, sorting, setSorting, props.onArchiveToggle, setTableData); // DPH boardSummaryState.isDataLoaded,

  const updatedState: IBoardSummaryTableState = { ...boardSummaryState };

  const handleBoardsDocuments = (boardDocuments: IFeedbackBoardDocument[]) => {
    if ((boardDocuments ?? []).length === 0) {
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
          ownerId: board.createdBy.id, // DPH
        };

        boardsTableItems.push(boardSummaryItem);

        const actionItemsForBoard = new Array<WorkItem>();
        actionItems[board.id] = {
          isDataLoaded: false,
          actionItems: actionItemsForBoard,
        };
      });

      boardsTableItems.sort((b1, b2) => {
        return new Date(b2.createdDate).getTime() - new Date(b1.createdDate).getTime();
      });

      updatedState.boardsTableItems = boardsTableItems;
      updatedState.isDataLoaded = true;
      updatedState.feedbackBoards = boardDocuments;
      updatedState.actionItemsByBoard = actionItems;
    }
    handleActionItems().then()
  };

  const handleActionItems = async () => {
    const updatedBoardsTableItems = [...updatedState.boardsTableItems];
    const updatedActionItemsByBoard = { ...updatedState.actionItemsByBoard };

    // Preload all work item state info once, up front
    const workItemTypeToStatesMap: { [key: string]: WorkItemStateColor[] } = {};
    await Promise.all(props.supportedWorkItemTypes.map(async (workItemType) => {
      const workItemTypeStates = await workItemService.getWorkItemStates(workItemType.name);
      workItemTypeToStatesMap[workItemType.name] = workItemTypeStates;
    }));

    await Promise.all(updatedState.feedbackBoards.map(async (feedbackBoard) => {
      const feedbackBoardId: string = feedbackBoard.id;

      const feedbackItems = await itemDataService.getFeedbackItemsForBoard(feedbackBoardId);

      // Always set feedback item count, even if 0
      const boardIndex = updatedBoardsTableItems.findIndex(item => item.id === feedbackBoardId);
      if (boardIndex !== -1) {
        updatedBoardsTableItems[boardIndex] = {
          ...updatedBoardsTableItems[boardIndex],
          feedbackItemsCount: feedbackItems.length,
        };
      }

      if (!feedbackItems.length) {
        return;
      }

      const actionableFeedbackItems = feedbackItems.filter(
        item => item.associatedActionItemIds?.length
      );

      if (!actionableFeedbackItems.length) {
        return;
      }

      const aggregatedWorkItems: WorkItem[] = [];
      await Promise.all(actionableFeedbackItems.map(async (item) => {
        const workItems = await workItemService.getWorkItemsByIds(item.associatedActionItemIds);
        if (workItems?.length) {
          aggregatedWorkItems.push(...workItems);
        }
      }));

      // Update action items for this board
      updatedActionItemsByBoard[feedbackBoardId] = {
        isDataLoaded: true,
        actionItems: aggregatedWorkItems,
      };

      const pendingWorkItems = aggregatedWorkItems.filter((workItem) => {
        const states = workItemTypeToStatesMap[workItem.fields['System.WorkItemType']]
          .filter(state => state.name === workItem.fields['System.State']);
        return !states.length || (states[0].category !== 'Completed' && states[0].category !== 'Removed');
      });

      // Update board table item with work item counts
      if (boardIndex !== -1) {
        updatedBoardsTableItems[boardIndex] = {
          ...updatedBoardsTableItems[boardIndex],
          pendingWorkItemsCount: pendingWorkItems.length,
          totalWorkItemsCount: aggregatedWorkItems.length,
        };
      }
    }));

    // Final state update
    setBoardSummaryState({
      ...updatedState,
      boardsTableItems: updatedBoardsTableItems,
      actionItemsByBoard: updatedActionItemsByBoard,
      allDataLoaded: true,
    });
  };

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
    const sortDirection: false | SortDirection = header.column.getIsSorted();
    let sortClassName: string = "";
    let ariaSort: "none" | "ascending" | "descending" | "other" = "none";
    if (sortDirection === "asc") {
      sortClassName = sortDirection;
      ariaSort = "ascending";
    } else if (sortDirection === "desc") {
      sortClassName = sortDirection;
      ariaSort = "descending";
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
      case 'feedbackItemsCount':
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
        <BoardSummaryTableHeader
          headerGroups={table.getHeaderGroups()}
          getThProps={getThProps}
        />
        <BoardSummaryTableBody
          rows={table.getRowModel().rows}
          getTdProps={getTdProps}
          boardRowSummary={boardRowSummary}
        />
      </table>
    </div>
  );
}

export default withAITracking(reactPlugin, BoardSummaryTable);
