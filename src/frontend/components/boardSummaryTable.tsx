import React, { useEffect, useMemo, useRef, useState } from "react";
import { WorkItem, WorkItemType, WorkItemStateColor } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";

import BoardSummary from "./boardSummary";
import { IFeedbackBoardDocument } from "../interfaces/feedback";
import BoardDataService from "../dal/boardDataService";
import { itemDataService } from "../dal/itemDataService";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { reflectBackendService } from "../dal/reflectBackendService";
import { appInsights, reactPlugin, TelemetryEvents } from "../utilities/telemetryClient";
import { obfuscateUserId, getUserIdentity } from "../utilities/userIdentityHelper";
import BoardSummaryTableHeader from "./boardSummaryTableHeader";
import BoardSummaryTableBody from "./boardSummaryTableBody";
import { getIconElement } from "./icons";

export interface IBoardSummaryTableProps {
  teamId: string;
  currentUserId: string;
  currentUserIsTeamAdmin: boolean;
  supportedWorkItemTypes: WorkItemType[];
  onArchiveToggle: () => void;
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
  archivedDate?: Date;
  pendingWorkItemsCount: number;
  totalWorkItemsCount: number;
  feedbackItemsCount: number;
  id: string;
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

function getValidArchivedTimestamp(archivedDate: Date | null | undefined): number | null {
  if (!archivedDate) return null;
  const archivedAt = new Date(archivedDate).getTime();
  return Number.isFinite(archivedAt) ? archivedAt : null;
}

export function isArchivedWithoutValidDate(board: IBoardSummaryTableItem): boolean {
  return !!board.isArchived && !getValidArchivedTimestamp(board.archivedDate);
}

export function isTrashEnabled(board: IBoardSummaryTableItem): boolean {
  if (!board.isArchived) return false;
  const archivedAt = getValidArchivedTimestamp(board.archivedDate);
  if (archivedAt === null) return false;
  const now = new Date().getTime();
  return now >= archivedAt + ARCHIVE_DELETE_DELAY;
}

export function TrashIcon({ board, currentUserId, currentUserIsTeamAdmin, onClick }: { board: IBoardSummaryTableItem; currentUserId: string; currentUserIsTeamAdmin: boolean; onClick: (event: React.MouseEvent) => void }) {
  if (!board.isArchived || !(currentUserIsTeamAdmin || board.ownerId === currentUserId)) {
    return <></>;
  }

  if (isArchivedWithoutValidDate(board)) {
    return (
      <div className="centered-cell trash-icon-disabled" title="Toggle archive off and on to enable delete." aria-label="Toggle archive off and on to enable delete.">
        {getIconElement("delete")}
      </div>
    );
  }

  return isTrashEnabled(board) ? (
    <div className="centered-cell trash-icon" title="Delete board" aria-label="Delete board" onClick={onClick}>
      {getIconElement("delete")}
    </div>
  ) : (
    <div className="centered-cell trash-icon-disabled" title="To delete this board, you must wait for 2 minutes after archiving." aria-label="To delete this board, you must wait for 2 minutes after archiving.">
      {getIconElement("delete")}
    </div>
  );
}

export interface ISimpleColumn {
  id: string;
  header: string | (() => React.JSX.Element) | null;
  accessor?: keyof IBoardSummaryTableItem;
  cell: (item: IBoardSummaryTableItem) => React.JSX.Element | string | number;
  sortable?: boolean;
}

type SortDirection = "asc" | "desc" | false;

export interface ITableData {
  columns: ISimpleColumn[];
  data: IBoardSummaryTableItem[];
  sorting: { columnId: string; direction: SortDirection };
  expandedRows: Set<string>;
}

export function buildBoardSummaryState(boardDocuments: IFeedbackBoardDocument[]): IBoardSummaryTableState {
  if (!boardDocuments.length) {
    return {
      boardsTableItems: [],
      isDataLoaded: true,
      feedbackBoards: [],
      actionItemsByBoard: {},
      allDataLoaded: false,
    };
  }

  const boardsTableItems: IBoardSummaryTableItem[] = [];
  const actionItems: IActionItemsTableItems = {};

  boardDocuments.forEach(board => {
    const archivedDate = board.archivedDate ? new Date(board.archivedDate) : null;
    const normalizedArchivedDate = getValidArchivedTimestamp(archivedDate) === null ? null : archivedDate;

    boardsTableItems.push({
      boardName: board.title,
      createdDate: new Date(board.createdDate),
      isArchived: board.isArchived ?? false,
      archivedDate: normalizedArchivedDate,
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
    allDataLoaded: false,
  };
}

function BoardSummaryTable(props: Readonly<IBoardSummaryTableProps>): React.JSX.Element {
  const trackActivity = useTrackMetric(reactPlugin, "BoardSummaryTable");

  const [openDialogBoardId, setOpenDialogBoardId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string>();
  const [boardSummaryState, setBoardSummaryState] = useState<IBoardSummaryTableState>({
    boardsTableItems: new Array<IBoardSummaryTableItem>(),
    isDataLoaded: false,
    feedbackBoards: new Array<IFeedbackBoardDocument>(),
    actionItemsByBoard: {},
    allDataLoaded: false,
  });

  const [sortColumn, setSortColumn] = useState<string>("createdDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [tableData, setTableData] = useState<IBoardSummaryTableItem[]>([]);

  useEffect(() => {
    setTableData(boardSummaryState.boardsTableItems);
  }, [boardSummaryState.boardsTableItems]);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }), []);
  const deleteBoardDialogRef = useRef<HTMLDialogElement>(null);

  const toggleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(false);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  const toggleExpanded = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const columnList: ISimpleColumn[] = useMemo(
    () => [
    {
      id: "expand",
      header: null,
      cell: (item: IBoardSummaryTableItem) => (
        <button className="contextual-menu-button" aria-label="Expand Row" title="Expand Row" onClick={() => toggleExpanded(item.id)}>
          {getIconElement(expandedRows.has(item.id) ? "chevron-down" : "chevron-right")}
        </button>
      ),
      sortable: false,
    },
    {
      id: "boardName",
      header: "Retrospective Name",
      accessor: "boardName",
      cell: (item: IBoardSummaryTableItem) => item.boardName,
      sortable: true,
    },
    {
      id: "createdDate",
      header: "Created Date",
      accessor: "createdDate",
      cell: (item: IBoardSummaryTableItem) => dateFormatter.format(item.createdDate),
      sortable: true,
    },
    {
      id: "isArchived",
      header: "Archived",
      accessor: "isArchived",
      cell: (item: IBoardSummaryTableItem) => (
        <div onClick={event => event.stopPropagation()} className="centered-cell">
          <input
            type="checkbox"
            checked={!!item.isArchived}
            onChange={event => {
              handleArchiveToggle(item.teamId, item.id, event.target.checked, setTableData, props.onArchiveToggle);
            }}
          />
        </div>
      ),
      sortable: true,
    },
    {
      id: "archivedDate",
      header: "Archived Date",
      accessor: "archivedDate",
      cell: (item: IBoardSummaryTableItem) => (item.archivedDate ? dateFormatter.format(item.archivedDate) : ""),
      sortable: true,
    },
    {
      id: "feedbackItemsCount",
      header: "Feedback Items",
      accessor: "feedbackItemsCount",
      cell: (item: IBoardSummaryTableItem) => item.feedbackItemsCount,
      sortable: true,
    },
    {
      id: "totalWorkItemsCount",
      header: "Total Work Items",
      accessor: "totalWorkItemsCount",
      cell: (item: IBoardSummaryTableItem) => item.totalWorkItemsCount,
      sortable: true,
    },
    {
      id: "trash",
      header: () => (
        <div className="centered-cell trash-icon-header" title="Delete enabled for archived boards if user is board owner or team admin." aria-label="Archived boards can be deleted by board owner or team admin.">
          {getIconElement("delete")}
        </div>
      ),
      cell: (item: IBoardSummaryTableItem) => (
        <TrashIcon
          board={item}
          currentUserId={props.currentUserId}
          currentUserIsTeamAdmin={props.currentUserIsTeamAdmin}
          onClick={event => {
            event.stopPropagation();
            setOpenDialogBoardId(item.id);
            deleteBoardDialogRef.current!.showModal();
          }}
        />
      ),
      sortable: false,
    },
    ],
    [dateFormatter, expandedRows, props.currentUserId, props.currentUserIsTeamAdmin, props.onArchiveToggle],
  );

  const handleActionItems = async (state: IBoardSummaryTableState) => {
    const updatedBoardsTableItems = [...state.boardsTableItems];
    const updatedActionItemsByBoard = { ...state.actionItemsByBoard };

    try {
      const workItemTypeToStatesMap: { [key: string]: WorkItemStateColor[] } = {};
      await Promise.all(
        props.supportedWorkItemTypes.map(async workItemType => {
          const workItemTypeStates = await workItemService.getWorkItemStates(workItemType.name);
          workItemTypeToStatesMap[workItemType.name] = workItemTypeStates;
        }),
      );

      const boardIdToIndex: { [key: string]: number } = {};
      updatedBoardsTableItems.forEach((item, index) => {
        boardIdToIndex[item.id] = index;
      });

      await Promise.all(
        state.feedbackBoards.map(async feedbackBoard => {
          const feedbackBoardId: string = feedbackBoard.id;
          const feedbackItems = await itemDataService.getFeedbackItemsForBoard(feedbackBoardId);

          const boardIndex = boardIdToIndex[feedbackBoardId];
          updatedBoardsTableItems[boardIndex] = {
            ...updatedBoardsTableItems[boardIndex],
            feedbackItemsCount: feedbackItems.length,
          };

          if (!feedbackItems.length) return;

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

          updatedActionItemsByBoard[feedbackBoardId] = {
            isDataLoaded: true,
            actionItems: aggregatedWorkItems,
          };

          const pendingWorkItems = aggregatedWorkItems.filter(workItem => {
            const states = workItemTypeToStatesMap[workItem.fields["System.WorkItemType"]].filter(state => state.name === workItem.fields["System.State"]);
            return !states.length || (states[0].category !== "Completed" && states[0].category !== "Removed");
          });

          updatedBoardsTableItems[boardIndex] = {
            ...updatedBoardsTableItems[boardIndex],
            pendingWorkItemsCount: pendingWorkItems.length,
            totalWorkItemsCount: aggregatedWorkItems.length,
          };
        }),
      );
    } catch (error) {
      appInsights.trackException(error, {
        action: "loadBoardHistoryActionItems",
        teamId: props.teamId,
      });
    } finally {
      setBoardSummaryState({
        ...state,
        boardsTableItems: updatedBoardsTableItems,
        actionItemsByBoard: updatedActionItemsByBoard,
        allDataLoaded: true,
      });
    }
  };

  const boardsById = useMemo(() => {
    return new Map(boardSummaryState.boardsTableItems.map(board => [board.id, board] as const));
  }, [boardSummaryState.boardsTableItems]);

  const boardRowSummary = (item: IBoardSummaryTableItem) => {
    const currentBoard = boardsById.get(item.id);
    if (!currentBoard) return null;
    const actionItems = boardSummaryState.actionItemsByBoard[currentBoard.id];
    return <BoardSummary actionItems={actionItems.actionItems} pendingWorkItemsCount={currentBoard.pendingWorkItemsCount} resolvedActionItemsCount={currentBoard.totalWorkItemsCount - currentBoard.pendingWorkItemsCount} boardName={currentBoard.boardName} feedbackItemsCount={currentBoard.feedbackItemsCount} supportedWorkItemTypes={props.supportedWorkItemTypes} />;
  };

  const handleConfirmDelete = async () => {
    try {
      await BoardDataService.deleteFeedbackBoard(teamId, openDialogBoardId);
      reflectBackendService.broadcastDeletedBoard(teamId, openDialogBoardId);

      setTableData(prevData => prevData.filter(board => board.id !== openDialogBoardId));

      appInsights.trackEvent({
        name: TelemetryEvents.FeedbackBoardDeleted,
        properties: {
          boardId: openDialogBoardId,
          boardName: selectedBoardForDelete!.boardName,
          feedbackItemsCount: selectedBoardForDelete!.feedbackItemsCount,
          deletedByUserId: obfuscateUserId(getUserIdentity().id),
        },
      });
    } catch (error) {
      appInsights.trackException(error, {
        boardId: openDialogBoardId,
        boardName: selectedBoardForDelete!.boardName,
        feedbackItemsCount: selectedBoardForDelete!.feedbackItemsCount,
        action: "delete",
      });
    }

    deleteBoardDialogRef.current!.close();
    setOpenDialogBoardId(null);
  };

  useEffect(() => {
    if (teamId !== props.teamId) {
      BoardDataService.getBoardsForTeam(props.teamId)
        .then((boardDocuments: IFeedbackBoardDocument[]) => {
          setTeamId(props.teamId);
          const state = buildBoardSummaryState(boardDocuments);
          setBoardSummaryState(state);
          handleActionItems(state);
        })
        .catch(e => {
          appInsights.trackException(e);
        });
    }
  }, [props.teamId]);

  const selectedBoardForDelete = useMemo(() => tableData.find(board => board.id === openDialogBoardId), [tableData, openDialogBoardId]);
  const sortedData = useMemo(() => {
    return [...tableData].sort((a, b) => {
      let aVal: Date | string | number | boolean | null | undefined;
      let bVal: Date | string | number | boolean | null | undefined;

      if (sortColumn === "createdDate" || sortColumn === "archivedDate") {
        aVal = a[sortColumn as keyof IBoardSummaryTableItem];
        bVal = b[sortColumn as keyof IBoardSummaryTableItem];
        if (!aVal) return 1;
        if (!bVal) return -1;
        const aTime = new Date(aVal as Date).getTime();
        const bTime = new Date(bVal as Date).getTime();
        return sortDirection === "asc" ? (aTime < bTime ? -1 : 1) : aTime < bTime ? 1 : -1;
      } else {
        aVal = a[sortColumn as keyof IBoardSummaryTableItem];
        bVal = b[sortColumn as keyof IBoardSummaryTableItem];
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [tableData, sortColumn, sortDirection]);

  if (boardSummaryState.allDataLoaded !== true) {
    return (
      <div className="spinner" aria-live="assertive">
        <div></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="board-summary-table-container" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      <table>
        <BoardSummaryTableHeader columns={columnList} sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
        <BoardSummaryTableBody columns={columnList} data={sortedData} expandedRows={expandedRows} boardRowSummary={boardRowSummary} />
      </table>
      <dialog
        className="delete-board-dialog"
        aria-label="Delete Retrospective Board"
        ref={deleteBoardDialogRef}
        onClose={() => {
          deleteBoardDialogRef.current!.close();
          setOpenDialogBoardId(null);
        }}
      >
        <div className="header">
          <h2 className="title">Delete Retrospective Board</h2>
          <button
            onClick={() => {
              deleteBoardDialogRef.current!.close();
              setOpenDialogBoardId(null);
            }}
            aria-label="Close"
          >
            {getIconElement("close")}
          </button>
        </div>
        <div className="subText">
          The retrospective board {selectedBoardForDelete?.boardName} with {selectedBoardForDelete?.feedbackItemsCount} feedback items will be deleted.
        </div>
        <div className="subText">
          <em>⚠️ Warning: This action is permanent and cannot be undone.</em>
        </div>
        <div className="inner">
          <button className="button" onClick={handleConfirmDelete}>
            Delete
          </button>
          <button
            className="default button"
            onClick={() => {
              deleteBoardDialogRef.current!.close();
              setOpenDialogBoardId(null);
            }}
          >
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}

export default BoardSummaryTable;
