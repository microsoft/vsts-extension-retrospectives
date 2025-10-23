import React, { useEffect, useState } from "react";
import { WorkItem, WorkItemType, WorkItemStateColor } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { DefaultButton } from "@fluentui/react/lib/Button";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { useReactTable } from "@tanstack/react-table";

import DeleteBoardDialog from "./deleteBoardDialog";
import BoardSummary from "./boardSummary";
import { IFeedbackBoardDocument } from "../interfaces/feedback";
import BoardDataService from "../dal/boardDataService";
import { itemDataService } from "../dal/itemDataService";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { reflectBackendService } from "../dal/reflectBackendService";
import { appInsights, reactPlugin, TelemetryEvents } from "../utilities/telemetryClient";
import { encrypt, getUserIdentity } from "../utilities/userIdentityHelper";
import BoardSummaryTableHeader from "./boardSummaryTableHeader";
import BoardSummaryTableBody from "./boardSummaryTableBody";

import { createColumnHelper, getCoreRowModel, getExpandedRowModel, getSortedRowModel, type CellContext, type HeaderContext, type OnChangeFn, type Row, type SortingState, type Table, type TableOptions } from "@tanstack/table-core";

export interface IBoardSummaryTableProps {
  teamId: string;
  currentUserId: string;
  currentUserIsTeamAdmin: boolean;
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
  ownerId: string;
}

export interface IBoardActionItemsData {
  isDataLoaded: boolean;
  actionItems: WorkItem[];
}

export interface IActionItemsTableItems {
  [key: string]: IBoardActionItemsData;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export async function handleArchiveToggle(teamId: string, boardId: string, toggleIsArchived: boolean, setTableData: React.Dispatch<React.SetStateAction<IBoardSummaryTableItem[]>>, onArchiveToggle: () => void) {
  try {
    if (toggleIsArchived) {
      await BoardDataService.archiveFeedbackBoard(teamId, boardId);
      appInsights.trackEvent({
        name: TelemetryEvents.FeedbackBoardArchived,
        properties: { boardId },
      });
    } else {
      await BoardDataService.restoreArchivedFeedbackBoard(teamId, boardId);
      appInsights.trackEvent({
        name: TelemetryEvents.FeedbackBoardRestored,
        properties: { boardId },
      });
    }

    setTableData(prevData =>
      prevData.map(item =>
        item.id === boardId
          ? {
              ...item,
              isArchived: toggleIsArchived,
              archivedDate: toggleIsArchived ? new Date() : null,
            }
          : item,
      ),
    );

    onArchiveToggle();
  } catch (error) {
    appInsights.trackException(error, {
      boardId,
      teamId,
      action: toggleIsArchived ? "archive" : "restore",
    });
  }
}

const ARCHIVE_DELETE_DELAY = 2 * 60 * 1000; // 2 minutes

export function isTrashEnabled(board: IBoardSummaryTableItem): boolean {
  if (!board.isArchived || !board.archivedDate) return false;
  const now = new Date().getTime();
  const archivedAt = new Date(board.archivedDate).getTime();
  return now >= archivedAt + ARCHIVE_DELETE_DELAY;
}

export function TrashIcon({ board, currentUserId, currentUserIsTeamAdmin, onClick }: { board: IBoardSummaryTableItem; currentUserId: string; currentUserIsTeamAdmin: boolean; onClick: (event: React.MouseEvent) => void }) {
  if (!board.isArchived || !(currentUserIsTeamAdmin || board.ownerId === currentUserId)) {
    return <div className="centered-cell" />;
  }
  // If archivedDate missing (legacy archived board), hide trash icon completely
  if (board.archivedDate) { //DPH !
    return <div className="centered-cell" />;
  }
  return isTrashEnabled(board) ? (
    <div className="centered-cell trash-icon" title="Delete board" aria-label="Delete board" onClick={onClick}>
      <i className="fas fa-trash-alt"></i>
    </div>
  ) : (
    <div className="centered-cell trash-icon-disabled" title="Try archive before delete" aria-label="Try archive before delete">
      <i className="fas fa-trash-alt"></i>
    </div>
  );
}

function getTable(tableData: IBoardSummaryTableItem[], sortingState: SortingState, onSortingChange: OnChangeFn<SortingState>, onArchiveToggle: () => void, setTableData: React.Dispatch<React.SetStateAction<IBoardSummaryTableItem[]>>, setOpenDialogBoardId: React.Dispatch<React.SetStateAction<string | null>>, currentUserId: string, currentUserIsTeamAdmin: boolean): Table<IBoardSummaryTableItem> {
  const columnHelper = createColumnHelper<IBoardSummaryTableItem>();
  const defaultFooter = (info: HeaderContext<IBoardSummaryTableItem, unknown>) => info.column.id;

  const columns = [
    columnHelper.accessor("id", {
      header: null,
      footer: defaultFooter,
      cell: (cellContext: CellContext<IBoardSummaryTableItem, string>) => {
        return cellContext.row.getCanExpand() ? (
          <DefaultButton className="contextual-menu-button" aria-label="Expand Row" title="Expand Row">
            <span className="ms-Button-icon">
              <i className={`fas ${cellContext.row.getIsExpanded() ? "fa-caret-down" : "fa-caret-right"}`}></i>
            </span>
          </DefaultButton>
        ) : (
          ""
        );
      },
      enableResizing: false,
      enableSorting: false,
    }),
    columnHelper.accessor("boardName", {
      header: "Retrospective Name",
      footer: defaultFooter,
    }),
    columnHelper.accessor("createdDate", {
      header: "Created Date",
      footer: defaultFooter,
      cell: (cellContext: CellContext<IBoardSummaryTableItem, Date>) => {
        return dateFormatter.format(cellContext.row.original.createdDate);
      },
      size: 100,
      sortDescFirst: true,
    }),
    columnHelper.accessor("isArchived", {
      header: "Archived",
      footer: defaultFooter,
      cell: (cellContext: CellContext<IBoardSummaryTableItem, boolean | undefined>) => {
        const boardId = cellContext.row.original.id;
        const teamId = cellContext.row.original.teamId;
        const isArchived = cellContext.row.original.isArchived;

        return (
          <div
            onClick={event => event.stopPropagation()} // Prevent click propagation
            className="centered-cell"
          >
            <input
              type="checkbox"
              checked={!!isArchived} // Ensure boolean value
              onChange={event => {
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
    columnHelper.accessor("archivedDate", {
      header: "Archived Date",
      footer: defaultFooter,
      cell: (cellContext: CellContext<IBoardSummaryTableItem, Date | undefined>) => {
        const archivedDate = cellContext.row.original.archivedDate;
        return archivedDate ? dateFormatter.format(archivedDate) : "";
      },
      size: 100,
      sortDescFirst: true,
    }),
    columnHelper.accessor("feedbackItemsCount", {
      header: "Feedback Items",
      footer: defaultFooter,
      size: 80,
    }),
    columnHelper.accessor("totalWorkItemsCount", {
      header: "Total Work Items",
      footer: defaultFooter,
      size: 80,
    }),
    columnHelper.display({
      id: "trash",
      header: () => (
        <div className="centered-cell trash-icon-header">
          <i className="fas fa-trash-alt" title="Delete enabled for archived boards if user is board owner or team admin." aria-label="Archived boards can be deleted by board owner or team admin."></i>
        </div>
      ),
      cell: cellContext => (
        <TrashIcon
          board={cellContext.row.original}
          currentUserId={currentUserId}
          currentUserIsTeamAdmin={currentUserIsTeamAdmin}
          onClick={event => {
            event.stopPropagation();
            setOpenDialogBoardId(cellContext.row.original.id);
          }}
        />
      ),
      size: 45,
    }),
  ];

  const tableOptions: TableOptions<IBoardSummaryTableItem> = {
    data: tableData,
    columns,
    columnResizeMode: "onChange",
    onSortingChange: onSortingChange,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    state: {
      pagination: {
        pageSize: tableData.length,
        pageIndex: 0,
      },
      sorting: sortingState,
    },
  };

  return useReactTable(tableOptions);
}

export async function handleConfirmDelete(openDialogBoardId: string | null, tableData: IBoardSummaryTableItem[], teamId: string, setOpenDialogBoardId: (id: string | null) => void, setTableData: React.Dispatch<React.SetStateAction<IBoardSummaryTableItem[]>>, setRefreshKey: (value: boolean) => void) {
  if (!openDialogBoardId) return;

  const deletedBoard = tableData.find(board => board.id === openDialogBoardId);
  const deletedBoardName = deletedBoard?.boardName || "Unknown Board";
  const deletedFeedbackCount = deletedBoard?.feedbackItemsCount || 0;

  try {
    setOpenDialogBoardId(null); // close dialog

    await BoardDataService.deleteFeedbackBoard(teamId, openDialogBoardId);
    reflectBackendService.broadcastDeletedBoard(teamId, openDialogBoardId);

    setTableData(prevData => prevData.filter(board => board.id !== openDialogBoardId));

    appInsights.trackEvent({
      name: TelemetryEvents.FeedbackBoardDeleted,
      properties: {
        boardId: openDialogBoardId,
        boardName: deletedBoardName,
        feedbackItemsCount: deletedFeedbackCount,
        deletedByUserId: encrypt(getUserIdentity().id),
      },
    });
  } catch (error) {
    appInsights.trackException(error, {
      boardId: openDialogBoardId,
      boardName: deletedBoardName,
      feedbackItemsCount: deletedFeedbackCount,
      action: "delete",
    });
    setRefreshKey(true);
  }
}

export function buildBoardSummaryState(boardDocuments: IFeedbackBoardDocument[]): IBoardSummaryTableState {
  if (!boardDocuments.length) {
    return {
      boardsTableItems: [],
      isDataLoaded: true,
      feedbackBoards: [],
      actionItemsByBoard: {},
      allDataLoaded: false, // <-- include required property
    };
  }

  const boardsTableItems: IBoardSummaryTableItem[] = [];
  const actionItems: IActionItemsTableItems = {};

  boardDocuments.forEach(board => {
    boardsTableItems.push({
      boardName: board.title,
      createdDate: new Date(board.createdDate),
      isArchived: board.isArchived ?? false,
      archivedDate: board.archivedDate ? new Date(board.archivedDate) : null,
      pendingWorkItemsCount: 0,
      totalWorkItemsCount: 0,
      feedbackItemsCount: 0,
      id: board.id,
      teamId: board.teamId,
      ownerId: board.createdBy.id,
    });

    actionItems[board.id] = { isDataLoaded: false, actionItems: [] };
  });

  boardsTableItems.sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());

  return {
    boardsTableItems,
    isDataLoaded: true,
    feedbackBoards: boardDocuments,
    actionItemsByBoard: actionItems,
    allDataLoaded: false, // <-- include required property
  };
}

function BoardSummaryTable(props: Readonly<IBoardSummaryTableProps>): JSX.Element {
  const [openDialogBoardId, setOpenDialogBoardId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string>();
  const [boardSummaryState, setBoardSummaryState] = useState<IBoardSummaryTableState>({
    boardsTableItems: new Array<IBoardSummaryTableItem>(),
    isDataLoaded: false,
    feedbackBoards: new Array<IFeedbackBoardDocument>(),
    actionItemsByBoard: {},
    allDataLoaded: false,
  });

  const [sorting, setSorting] = useState<SortingState>([{ id: "createdDate", desc: true }]);
  const [tableData, setTableData] = useState<IBoardSummaryTableItem[]>([]);
  useEffect(() => {
    setTableData(boardSummaryState.boardsTableItems);
  }, [boardSummaryState.boardsTableItems]);

  const [refreshKey, setRefreshKey] = useState(false);

  const table: Table<IBoardSummaryTableItem> = getTable(tableData, sorting, setSorting, props.onArchiveToggle, setTableData, setOpenDialogBoardId, props.currentUserId, props.currentUserIsTeamAdmin);

  const handleBoardsDocuments = (boardDocuments: IFeedbackBoardDocument[]) => {
    const newState = buildBoardSummaryState(boardDocuments);
    setBoardSummaryState(prev => ({ ...prev, ...newState }));
    handleActionItems(newState).then();
  };

  const handleActionItems = async (state: IBoardSummaryTableState) => {
    const updatedBoardsTableItems = [...state.boardsTableItems];
    const updatedActionItemsByBoard = { ...state.actionItemsByBoard };

    // Preload all work item state info once, up front
    const workItemTypeToStatesMap: { [key: string]: WorkItemStateColor[] } = {};
    await Promise.all(
      props.supportedWorkItemTypes.map(async workItemType => {
        const workItemTypeStates = await workItemService.getWorkItemStates(workItemType.name);
        workItemTypeToStatesMap[workItemType.name] = workItemTypeStates;
      }),
    );

    await Promise.all(
      state.feedbackBoards.map(async feedbackBoard => {
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

        if (!feedbackItems.length) return;

        // Filter feedback items that have associated action items
        const actionableFeedbackItems = feedbackItems.filter(item => item.associatedActionItemIds && item.associatedActionItemIds.length > 0);

        if (!actionableFeedbackItems.length) {
          return;
        }

        const aggregatedWorkItems: WorkItem[] = [];
        await Promise.all(
          actionableFeedbackItems.map(async item => {
            const workItems = await workItemService.getWorkItemsByIds(item.associatedActionItemIds);
            if (workItems?.length) {
              aggregatedWorkItems.push(...workItems);
            }
          }),
        );

        // Update action items for this board
        updatedActionItemsByBoard[feedbackBoardId] = {
          isDataLoaded: true,
          actionItems: aggregatedWorkItems,
        };

        const pendingWorkItems = aggregatedWorkItems.filter(workItem => {
          const states = workItemTypeToStatesMap[workItem.fields["System.WorkItemType"]].filter(state => state.name === workItem.fields["System.State"]);
          return !states.length || (states[0].category !== "Completed" && states[0].category !== "Removed");
        });

        // Update board table item with work item counts
        if (boardIndex !== -1) {
          updatedBoardsTableItems[boardIndex] = {
            ...updatedBoardsTableItems[boardIndex],
            pendingWorkItemsCount: pendingWorkItems.length,
            totalWorkItemsCount: aggregatedWorkItems.length,
          };
        }
      }),
    );

    // Final state update
    setBoardSummaryState({
      ...state,
      boardsTableItems: updatedBoardsTableItems,
      actionItemsByBoard: updatedActionItemsByBoard,
      allDataLoaded: true,
    });
  };

  const boardRowSummary = (row: Row<IBoardSummaryTableItem>) => {
    const currentBoard = boardSummaryState.boardsTableItems.find(board => board.id === row.original.id);
    const actionItems = boardSummaryState.actionItemsByBoard[currentBoard.id];
    return <BoardSummary actionItems={actionItems?.actionItems} pendingWorkItemsCount={currentBoard?.pendingWorkItemsCount} resolvedActionItemsCount={currentBoard?.totalWorkItemsCount - currentBoard?.pendingWorkItemsCount} boardName={currentBoard?.boardName} feedbackItemsCount={currentBoard?.feedbackItemsCount} supportedWorkItemTypes={props.supportedWorkItemTypes} />;
  };

  useEffect(() => {
    if (teamId !== props.teamId || refreshKey) {
      // Triggers when teamId changes OR refreshKey is true
      BoardDataService.getBoardsForTeam(props.teamId)
        .then((boardDocuments: IFeedbackBoardDocument[]) => {
          setTeamId(props.teamId);
          handleBoardsDocuments(boardDocuments);
        })
        .finally(() => {
          setRefreshKey(false); // Reset refreshKey after fetching
        })
        .catch(e => {
          appInsights.trackException(e);
        });
    }
  }, [props.teamId, refreshKey]); // Runs when teamId or refreshKey updates

  if (boardSummaryState.allDataLoaded !== true) {
    return <Spinner className="board-summary-initialization-spinner" size={SpinnerSize.large} label="Loading..." ariaLive="assertive" />;
  }

  const selectedBoardForDelete = tableData.find(board => board.id === openDialogBoardId);

  return (
    <div className="board-summary-table-container">
      <DeleteBoardDialog board={selectedBoardForDelete} hidden={!openDialogBoardId} onConfirm={() => handleConfirmDelete(openDialogBoardId, tableData, props.teamId, setOpenDialogBoardId, setTableData, setRefreshKey)} onCancel={() => setOpenDialogBoardId(null)} />
      <table>
        <BoardSummaryTableHeader headerGroups={table.getHeaderGroups()} />
        <BoardSummaryTableBody rows={table.getRowModel().rows} boardRowSummary={boardRowSummary} />
      </table>
    </div>
  );
}

export default withAITracking(reactPlugin, BoardSummaryTable);
