import React, { useState, useRef, useEffect, useCallback } from "react";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { WorkItem, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";

import { workService } from "../dal/azureDevOpsWorkService";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { itemDataService } from "../dal/itemDataService";
import FeedbackColumn, { type FeedbackColumnProps, type FeedbackColumnHandle } from "./feedbackColumn";
import { IFeedbackBoardDocument, IFeedbackColumn, IFeedbackItemDocument } from "../interfaces/feedback";
import { ExceptionCode } from "../interfaces/retrospectiveState";
import { WorkflowPhase } from "../interfaces/workItem";
import type { FocusModeModel } from "./feedbackCarousel";

import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { appInsights, reactPlugin } from "../utilities/telemetryClient";
import { isAnyModalDialogOpen } from "../utilities/dialogHelper";
import { getBoardAccess } from "../utilities/boardAccessHelper";
import { IPollingLoop, LIVE_SYNC_POLL_INTERVAL_MS, startPollingLoop } from "../utilities/pollingLoop";
import { getIconElement } from "./icons";

export interface FeedbackBoardProps {
  displayBoard: boolean;
  exceptionCode?: ExceptionCode;
  board: IFeedbackBoardDocument;
  team: WebApiTeam;
  workflowPhase: WorkflowPhase;
  nonHiddenWorkItemTypes: WorkItemType[];
  focusModeNonHiddenWorkItemTypes?: WorkItemType[];
  allWorkItemTypes: WorkItemType[];
  isAnonymous: boolean;
  hideFeedbackItems: boolean;
  onFocusModeModelChange?: (model: FocusModeModel) => void;
  userId: string;
  currentUserIsTeamAdmin?: boolean;
  onVoteCasted?: () => void;
  onColumnNotesChange?: (columnId: string, notes: string) => Promise<void>;
  scrollMode?: "column" | "board";
}

export interface IColumn {
  columnProperties: IFeedbackColumn;
  columnItems: IColumnItem[];
  shouldFocusOnCreateFeedback?: boolean;
}

export interface IColumnItem {
  feedbackItem: IFeedbackItemDocument;
  actionItems: WorkItem[];
  newlyCreated?: boolean;
  showAddedAnimation?: boolean;
  shouldHaveFocus?: boolean;
  hideFeedbackItems?: boolean;
}

export const findActiveTimerFeedbackItemId = (columns: { [id: string]: IColumn }): string | null => {
  for (const columnId of Object.keys(columns)) {
    const activeItem = columns[columnId]?.columnItems.find(columnItem => columnItem.feedbackItem.timerState);
    if (activeItem) {
      return activeItem.feedbackItem.id;
    }
  }

  return null;
};

export const findColumnItemById = (feedbackItemId: string, currentColumns: { [id: string]: IColumn }, currentColumnIds: string[]): IColumnItem | undefined => {
  for (const columnId of currentColumnIds) {
    const columnItem = currentColumns[columnId]?.columnItems.find(item => item.feedbackItem.id === feedbackItemId);
    if (columnItem) {
      return columnItem;
    }
  }

  return undefined;
};

export const getActiveTimerFeedbackItemIdAfterStop = (activeTimerFeedbackItemId: string | null, stoppedFeedbackItemId: string): string | null => {
  return activeTimerFeedbackItemId === stoppedFeedbackItemId ? null : activeTimerFeedbackItemId;
};

export const getTextOrEmpty = (value?: string | null): string => {
  return value ?? "";
};

export const getColumnNotesOrEmpty = (columnNotes: { [columnId: string]: string }, columnId: string): string => {
  return getTextOrEmpty(columnNotes[columnId]);
};

const emptyFeedbackItemId = "emptyFeedbackItem";

// Locally deleted items stay hidden until a poll that started after the delete confirms it (or this expires).
const DELETED_ITEM_TOMBSTONE_MS = 60000;

// Action items are work items, which change without touching the feedback item document, so they're re-fetched periodically.
const ACTION_ITEM_REFRESH_INTERVAL_MS = 30000;

interface ICachedActionItem {
  workItem: WorkItem | null;
  fetchedAt: number;
}

export interface IServerFeedbackItemMergeOptions {
  /** Work items for the associated action item ids; `null` marks a work item that no longer exists. */
  actionItemsById?: ReadonlyMap<number, WorkItem | null>;
  /** Items changed locally while the poll was in flight; their local state wins. */
  pendingItemIds?: ReadonlySet<string>;
  /** Items kept even when the server no longer has them (being edited or playing their delete animation). */
  preservedItemIds?: ReadonlySet<string>;
  /** Items deleted locally that a stale server read must not bring back. */
  deletedItemIds?: ReadonlySet<string>;
  animateNewItems?: boolean;
}

/**
 * Positive when the local copy is newer than the server copy, zero when both are the same revision.
 */
export const compareFeedbackItemVersions = (localItem: IFeedbackItemDocument, serverItem: IFeedbackItemDocument): number => {
  if (typeof localItem.__etag === "number" && typeof serverItem.__etag === "number") {
    return localItem.__etag - serverItem.__etag;
  }

  return JSON.stringify(localItem) === JSON.stringify(serverItem) ? 0 : -1;
};

const haveSameWorkItems = (left: WorkItem[], right: WorkItem[]): boolean => {
  return left.length === right.length && left.every((workItem, index) => workItem === right[index] || (workItem.id === right[index].id && workItem.rev === right[index].rev));
};

const resolveActionItems = (feedbackItem: IFeedbackItemDocument, actionItemsById: ReadonlyMap<number, WorkItem | null>, fallbackActionItems: WorkItem[] = []): WorkItem[] => {
  const actionItems: WorkItem[] = [];

  (feedbackItem.associatedActionItemIds ?? []).forEach(actionItemId => {
    const workItem = actionItemsById.has(actionItemId) ? actionItemsById.get(actionItemId) : fallbackActionItems.find(item => item.id === actionItemId);
    if (workItem) {
      actionItems.push(workItem);
    }
  });

  return actionItems;
};

const mergeColumnItem = (localItem: IColumnItem, feedbackItem: IFeedbackItemDocument, actionItemsById: ReadonlyMap<number, WorkItem | null>): IColumnItem => {
  const resolvedActionItems = resolveActionItems(feedbackItem, actionItemsById, localItem.actionItems);
  const actionItems = haveSameWorkItems(localItem.actionItems, resolvedActionItems) ? localItem.actionItems : resolvedActionItems;

  if (feedbackItem === localItem.feedbackItem && actionItems === localItem.actionItems) {
    return localItem;
  }

  return { ...localItem, feedbackItem, actionItems };
};

/**
 * Merges the feedback items read from the server into the board columns. Unchanged columns and items keep
 * their identity (the previous columns object is returned when nothing changed), local-only state such as
 * focus flags is preserved, and an item only takes the server copy when that copy is newer than the local one.
 */
export const mergeServerFeedbackItems = (previousColumns: { [id: string]: IColumn }, serverFeedbackItems: IFeedbackItemDocument[], options: IServerFeedbackItemMergeOptions = {}): { [id: string]: IColumn } => {
  const actionItemsById = options.actionItemsById ?? new Map<number, WorkItem | null>();
  const pendingItemIds = options.pendingItemIds ?? new Set<string>();
  const preservedItemIds = options.preservedItemIds ?? new Set<string>();
  const deletedItemIds = options.deletedItemIds ?? new Set<string>();
  const animateNewItems = options.animateNewItems ?? false;

  const serverItemsById = new Map<string, IFeedbackItemDocument>();
  serverFeedbackItems.forEach(serverItem => serverItemsById.set(serverItem.id, serverItem));

  const nextColumnItems = new Map<string, IColumnItem[]>();
  Object.keys(previousColumns).forEach(columnId => nextColumnItems.set(columnId, []));

  const changedColumnIds = new Set<string>();
  const placedItemIds = new Set<string>();
  const relocatedItems: { localItem: IColumnItem; feedbackItem: IFeedbackItemDocument }[] = [];

  nextColumnItems.forEach((columnItems, columnId) => {
    previousColumns[columnId].columnItems.forEach(localItem => {
      const itemId = localItem.feedbackItem.id;

      if (placedItemIds.has(itemId)) {
        changedColumnIds.add(columnId);
        return;
      }

      placedItemIds.add(itemId);

      if (pendingItemIds.has(itemId)) {
        columnItems.push(localItem);
        return;
      }

      const serverItem = serverItemsById.get(itemId);

      if (!serverItem) {
        if (localItem.newlyCreated || itemId === emptyFeedbackItemId || preservedItemIds.has(itemId)) {
          columnItems.push(localItem);
        } else {
          changedColumnIds.add(columnId);
        }
        return;
      }

      const isServerNewer = compareFeedbackItemVersions(localItem.feedbackItem, serverItem) < 0;
      const feedbackItem = isServerNewer ? serverItem : localItem.feedbackItem;

      if (feedbackItem.columnId !== columnId && (nextColumnItems.has(feedbackItem.columnId) || isServerNewer)) {
        // Moved to another column, or to a column this board no longer has (in which case it is dropped).
        if (nextColumnItems.has(feedbackItem.columnId)) {
          relocatedItems.push({ localItem, feedbackItem });
        }
        changedColumnIds.add(columnId);
        return;
      }

      const mergedItem = mergeColumnItem(localItem, feedbackItem, actionItemsById);
      if (mergedItem !== localItem) {
        changedColumnIds.add(columnId);
      }
      columnItems.push(mergedItem);
    });
  });

  relocatedItems.forEach(({ localItem, feedbackItem }) => {
    nextColumnItems.get(feedbackItem.columnId).push(mergeColumnItem(localItem, feedbackItem, actionItemsById));
    changedColumnIds.add(feedbackItem.columnId);
  });

  serverItemsById.forEach((serverItem, itemId) => {
    if (placedItemIds.has(itemId) || deletedItemIds.has(itemId) || !nextColumnItems.has(serverItem.columnId)) {
      return;
    }

    placedItemIds.add(itemId);
    nextColumnItems.get(serverItem.columnId).push({
      feedbackItem: serverItem,
      actionItems: resolveActionItems(serverItem, actionItemsById),
      showAddedAnimation: animateNewItems,
    });
    changedColumnIds.add(serverItem.columnId);
  });

  if (!changedColumnIds.size) {
    return previousColumns;
  }

  const nextColumns = { ...previousColumns };
  changedColumnIds.forEach(columnId => {
    nextColumns[columnId] = { ...previousColumns[columnId], columnItems: nextColumnItems.get(columnId) };
  });

  return nextColumns;
};

/**
 * Items that must survive a poll even when the server no longer has them: the one being edited
 * and the ones playing their delete animation (they are removed from the column when it ends).
 */
const getLocallyPreservedFeedbackItemIds = (): Set<string> => {
  const preservedItemIds = new Set<string>();

  const activeEditorElement = document.querySelector(".editable-text-input-container textarea, .editable-text-input-container input, .editable-text-input");
  const activeEditingItemId = activeEditorElement?.closest("[data-feedback-item-id]")?.getAttribute("data-feedback-item-id");
  if (activeEditingItemId) {
    preservedItemIds.add(activeEditingItemId);
  }

  document.querySelectorAll("[data-feedback-item-id].removeFeedbackItem").forEach(itemElement => preservedItemIds.add(itemElement.getAttribute("data-feedback-item-id")));

  return preservedItemIds;
};

const getColumnsWithReleasedFocus = (columns: { [id: string]: IColumn }) => {
  const resetFocusForStateColumns = { ...columns };

  for (const columnIdKey in columns) {
    if (resetFocusForStateColumns[columnIdKey].shouldFocusOnCreateFeedback) {
      resetFocusForStateColumns[columnIdKey].shouldFocusOnCreateFeedback = false;
    }

    const resetColumnItems = columns[columnIdKey].columnItems.map(columnItem => {
      return { ...columnItem, shouldHaveFocus: false };
    });

    resetFocusForStateColumns[columnIdKey].columnItems = resetColumnItems;
  }

  return resetFocusForStateColumns;
};

const FeedbackBoardComponent: React.FC<FeedbackBoardProps> = ({ displayBoard, board, team, workflowPhase, nonHiddenWorkItemTypes, focusModeNonHiddenWorkItemTypes, allWorkItemTypes, isAnonymous, hideFeedbackItems, onFocusModeModelChange, userId, currentUserIsTeamAdmin = false, onVoteCasted, onColumnNotesChange, scrollMode = "column" }) => {
  const trackActivity = useTrackMetric(reactPlugin, "FeedbackBoard");

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [columns, setColumns] = useState<{ [id: string]: IColumn }>({});
  const [columnIds, setColumnIds] = useState<string[]>([]);
  const [defaultActionItemIteration, setDefaultActionItemIteration] = useState("");
  const [defaultActionItemAreaPath, setDefaultActionItemAreaPath] = useState("");
  const [columnNotes, setColumnNotes] = useState<{ [columnId: string]: string }>({});
  const [focusedColumnIndex, setFocusedColumnIndex] = useState(0);
  const [activeTimerFeedbackItemId, setActiveTimerFeedbackItemId] = useState<string | null>(null);

  const columnRefsRef = useRef<React.RefObject<FeedbackColumnHandle>[]>([]);
  const prevBoardIdRef = useRef<string>(board.id);
  const prevBoardModifiedDateRef = useRef<Date | undefined>(board.modifiedDate);
  const prevTeamIdRef = useRef<string>(team.id);

  // Bumped on every local change; a poll ignores items changed after it started, so a stale read can't undo the change.
  const mutationVersionRef = useRef(0);
  const touchedItemVersionsRef = useRef(new Map<string, number>());
  const deletedItemIdsRef = useRef(new Map<string, number>());
  const actionItemCacheRef = useRef(new Map<number, ICachedActionItem>());
  const actionItemRetryAtRef = useRef(0);
  const feedbackItemsPollingLoopRef = useRef<IPollingLoop | null>(null);

  const markFeedbackItemsChanged = useCallback((feedbackItemIds: string[]) => {
    mutationVersionRef.current += 1;
    const version = mutationVersionRef.current;

    feedbackItemIds.forEach(feedbackItemId => touchedItemVersionsRef.current.set(feedbackItemId, version));
  }, []);

  const cacheActionItems = useCallback((requestedIds: number[], workItems: WorkItem[]) => {
    const fetchedAt = Date.now();

    requestedIds.forEach(actionItemId => actionItemCacheRef.current.set(actionItemId, { workItem: null, fetchedAt }));
    workItems.forEach(workItem => actionItemCacheRef.current.set(workItem.id, { workItem, fetchedAt }));
  }, []);

  const refreshFeedbackItems = useCallback(
    async (updatedFeedbackItems: IFeedbackItemDocument[]): Promise<void> => {
      const feedbackItemsToRefresh = updatedFeedbackItems.filter(feedbackItem => !!feedbackItem);
      if (!feedbackItemsToRefresh.length) {
        return;
      }

      markFeedbackItemsChanged(feedbackItemsToRefresh.map(feedbackItem => feedbackItem.id));

      const updatedColumnItems: IColumnItem[] = await Promise.all(
        feedbackItemsToRefresh.map(async feedbackItem => {
          const actionItemIds = feedbackItem.associatedActionItemIds ?? [];
          const actionItems = actionItemIds.length ? await workItemService.getWorkItemsByIds(actionItemIds) : [];
          if (actionItemIds.length) {
            cacheActionItems(actionItemIds, actionItems);
          }

          return {
            feedbackItem,
            actionItems,
          };
        }),
      );

      setColumns(previousColumns => {
        const localFeedbackItemsById = new Map<string, IFeedbackItemDocument>();
        Object.keys(previousColumns).forEach(columnId => {
          previousColumns[columnId].columnItems.forEach(columnItem => localFeedbackItemsById.set(columnItem.feedbackItem.id, columnItem.feedbackItem));
        });

        // A newer copy may already be on the board (e.g. from a later local change or a poll), so never go back in time.
        const applicableColumnItems = updatedColumnItems.filter(updatedItem => {
          const localFeedbackItem = localFeedbackItemsById.get(updatedItem.feedbackItem.id);
          return !localFeedbackItem || compareFeedbackItemVersions(localFeedbackItem, updatedItem.feedbackItem) <= 0;
        });

        if (!applicableColumnItems.length) {
          return previousColumns;
        }

        const newColumns: { [id: string]: IColumn } = {};

        Object.keys(previousColumns).forEach(columnId => {
          newColumns[columnId] = {
            columnProperties: previousColumns[columnId].columnProperties,
            columnItems: previousColumns[columnId].columnItems
              .filter(columnItem => {
                return !applicableColumnItems.some(item => item.feedbackItem.id === columnItem.feedbackItem.id && item.feedbackItem.columnId !== columnItem.feedbackItem.columnId);
              })
              .map(columnItem => {
                const updatedItem = applicableColumnItems.find(item => item.feedbackItem.id === columnItem.feedbackItem.id && item.feedbackItem.columnId === columnItem.feedbackItem.columnId);
                return updatedItem || columnItem;
              })
              .concat(
                applicableColumnItems.filter(columnItem => {
                  return columnItem.feedbackItem.columnId === columnId && !previousColumns[columnId].columnItems.some(existingColumnItem => columnItem.feedbackItem.id === existingColumnItem.feedbackItem.id);
                }),
              ),
          };
        });

        setActiveTimerFeedbackItemId(findActiveTimerFeedbackItemId(newColumns));
        return newColumns;
      });
    },
    [markFeedbackItemsChanged, cacheActionItems],
  );

  const stopTimerById = useCallback(
    async (feedbackItemId: string): Promise<void> => {
      setColumns(currentColumns => {
        const columnItem = findColumnItemById(feedbackItemId, currentColumns, columnIds);

        if (!columnItem || !columnItem.feedbackItem.timerState) {
          setActiveTimerFeedbackItemId(prev => getActiveTimerFeedbackItemIdAfterStop(prev, feedbackItemId));
          return currentColumns;
        }

        if (columnItem.feedbackItem.timerId !== null && columnItem.feedbackItem.timerId !== undefined) {
          window.clearInterval(columnItem.feedbackItem.timerId);
        }

        return currentColumns;
      });

      try {
        const updatedFeedbackItem = await itemDataService.flipTimer(board.id, feedbackItemId, null);
        if (updatedFeedbackItem) {
          await refreshFeedbackItems([updatedFeedbackItem]);
        }
      } catch (error) {
        appInsights.trackException(error, {
          action: "stopTimer",
          boardId: board.id,
          feedbackItemId,
        });
      } finally {
        setActiveTimerFeedbackItemId(prev => getActiveTimerFeedbackItemIdAfterStop(prev, feedbackItemId));
      }
    },
    [board.id, columnIds, refreshFeedbackItems],
  );

  const requestTimerStart = useCallback(
    (feedbackItemId: string): void => {
      setActiveTimerFeedbackItemId(prevId => {
        if (prevId && prevId !== feedbackItemId) {
          stopTimerById(prevId);
        }
        return feedbackItemId;
      });
    },
    [stopTimerById],
  );

  const handleTimerStopped = useCallback((feedbackItemId: string) => {
    setActiveTimerFeedbackItemId(prev => getActiveTimerFeedbackItemIdAfterStop(prev, feedbackItemId));
  }, []);

  const { canManageBoard } = getBoardAccess({
    boardOwnerId: board.createdBy?.id,
    currentUserId: userId,
    isTeamAdmin: currentUserIsTeamAdmin,
  });

  const addFeedbackItems = useCallback(
    (columnId: string, feedbackItems: IFeedbackItemDocument[], newlyCreated: boolean, showAddedAnimation: boolean, shouldHaveFocus: boolean, hideFeedbackItemsParam: boolean) => {
      markFeedbackItemsChanged(feedbackItems.map(feedbackItem => feedbackItem.id));

      setColumns(previousColumns => {
        if (!previousColumns[columnId]) {
          return previousColumns;
        }

        const firstAddedItemId = feedbackItems.length && feedbackItems[0].id;
        const resetFocusForStateColumns = getColumnsWithReleasedFocus(previousColumns);

        const updatedColumnItems = feedbackItems
          .map((feedbackItem): IColumnItem => {
            if (feedbackItem.id === firstAddedItemId) {
              return {
                actionItems: [],
                feedbackItem,
                hideFeedbackItems: hideFeedbackItemsParam,
                newlyCreated,
                shouldHaveFocus,
                showAddedAnimation,
              };
            }

            return {
              actionItems: [],
              feedbackItem,
              hideFeedbackItems: hideFeedbackItemsParam,
              newlyCreated,
              showAddedAnimation,
            };
          })
          .concat(resetFocusForStateColumns[columnId].columnItems);

        const newColumns = { ...resetFocusForStateColumns };
        newColumns[columnId].columnItems = updatedColumnItems;
        setActiveTimerFeedbackItemId(findActiveTimerFeedbackItemId(newColumns));
        setIsDataLoaded(true);

        return newColumns;
      });
    },
    [markFeedbackItemsChanged],
  );

  const removeFeedbackItemFromColumn = useCallback(
    (columnId: string, feedbackItemId: string, shouldSetFocusOnFirstAvailableItem: boolean) => {
      markFeedbackItemsChanged([feedbackItemId]);
      deletedItemIdsRef.current.set(feedbackItemId, Date.now());

      setColumns(previousColumns => {
        if (!previousColumns[columnId]) {
          return previousColumns;
        }

        const removedItemIndex: number = previousColumns[columnId].columnItems.findIndex(columnItem => columnItem.feedbackItem.id === feedbackItemId);
        const updatedColumnItems = previousColumns[columnId].columnItems.filter(columnItem => {
          return columnItem.feedbackItem.id !== feedbackItemId;
        });

        let updatedColumnItemsWithActiveFocus = updatedColumnItems;
        let shouldFocusOnCreateFeedback: boolean = false;

        if (shouldSetFocusOnFirstAvailableItem) {
          if (updatedColumnItems.length > 0 && updatedColumnItems[0]) {
            updatedColumnItemsWithActiveFocus = updatedColumnItems.map((columnItem): IColumnItem => {
              return { ...columnItem, shouldHaveFocus: false };
            });

            const nextAvailableItemIndex = removedItemIndex >= updatedColumnItemsWithActiveFocus.length ? 0 : removedItemIndex;
            updatedColumnItemsWithActiveFocus[nextAvailableItemIndex] = { ...updatedColumnItemsWithActiveFocus[nextAvailableItemIndex], shouldHaveFocus: true };
          } else {
            shouldFocusOnCreateFeedback = true;
          }
        }

        const resetFocusForStateColumns = getColumnsWithReleasedFocus(previousColumns);

        const newColumns = {
          ...resetFocusForStateColumns,
          [columnId]: {
            ...resetFocusForStateColumns[columnId],
            columnItems: updatedColumnItemsWithActiveFocus,
            shouldFocusOnCreateFeedback,
          },
        };

        setActiveTimerFeedbackItemId(findActiveTimerFeedbackItemId(newColumns));
        return newColumns;
      });
    },
    [markFeedbackItemsChanged],
  );

  const getFocusModeModel = useCallback((): FocusModeModel => {
    return {
      columns,
      columnIds,
      workflowPhase,
      team,
      boardId: board.id,
      boardTitle: board.title,
      defaultActionItemAreaPath,
      defaultActionItemIteration,
      nonHiddenWorkItemTypes: focusModeNonHiddenWorkItemTypes ?? nonHiddenWorkItemTypes,
      allWorkItemTypes,
      hideFeedbackItems,
      canManageBoard,
      onVoteCasted: () => {
        onVoteCasted?.();
      },
      activeTimerFeedbackItemId,
      requestTimerStart,
      notifyTimerStopped: handleTimerStopped,
      addFeedbackItems,
      removeFeedbackItemFromColumn,
      refreshFeedbackItems,
    };
  }, [columns, columnIds, workflowPhase, team, board.id, board.title, focusModeNonHiddenWorkItemTypes, nonHiddenWorkItemTypes, allWorkItemTypes, hideFeedbackItems, canManageBoard, onVoteCasted, activeTimerFeedbackItemId, requestTimerStart, handleTimerStopped, addFeedbackItems, removeFeedbackItemFromColumn, refreshFeedbackItems, defaultActionItemAreaPath, defaultActionItemIteration]);

  const initColumns = useCallback(() => {
    const columnProperties = board.columns;

    const newColumnIds: string[] = [];
    const newColumnNotes: { [columnId: string]: string } = {};

    columnRefsRef.current = columnProperties.map(() => React.createRef<FeedbackColumnHandle>());

    columnProperties.forEach(col => {
      if (!col.accentColor) {
        col.accentColor = "#0078d4";
      }

      col.notes = getTextOrEmpty(col.notes);

      newColumnIds.push(col.id);
      newColumnNotes[col.id] = getTextOrEmpty(col.notes);
    });

    // Keep the items already on the board so a board update (e.g. a column edit) doesn't blank it until the next poll.
    setColumns(previousColumns => {
      const stateColumns: { [id: string]: IColumn } = {};

      columnProperties.forEach(col => {
        stateColumns[col.id] = {
          columnProperties: col,
          columnItems: previousColumns[col.id]?.columnItems ?? [],
          shouldFocusOnCreateFeedback: false,
        };
      });

      setActiveTimerFeedbackItemId(findActiveTimerFeedbackItemId(stateColumns));
      return stateColumns;
    });
    setColumnIds(newColumnIds);
    setColumnNotes(newColumnNotes);
  }, [board.columns]);

  const loadActionItems = useCallback(
    async (feedbackItems: IFeedbackItemDocument[], boardId: string): Promise<Map<number, WorkItem | null>> => {
      const now = Date.now();
      const referencedIds: number[] = [];
      const seenIds = new Set<number>();

      feedbackItems.forEach(feedbackItem => {
        (feedbackItem.associatedActionItemIds ?? []).forEach(actionItemId => {
          if (!seenIds.has(actionItemId)) {
            seenIds.add(actionItemId);
            referencedIds.push(actionItemId);
          }
        });
      });

      const idsToFetch = referencedIds.filter(actionItemId => {
        const cachedActionItem = actionItemCacheRef.current.get(actionItemId);
        return !cachedActionItem || now - cachedActionItem.fetchedAt >= ACTION_ITEM_REFRESH_INTERVAL_MS;
      });

      if (idsToFetch.length && now >= actionItemRetryAtRef.current) {
        try {
          cacheActionItems(idsToFetch, await workItemService.getWorkItemsByIds(idsToFetch));
        } catch (error) {
          // Keep syncing feedback with the action items already on the board; retry the work items later.
          actionItemRetryAtRef.current = Date.now() + ACTION_ITEM_REFRESH_INTERVAL_MS;
          appInsights.trackException(error, { action: "pollActionItems", boardId, actionItemCount: idsToFetch.length });
        }
      }

      const actionItemsById = new Map<number, WorkItem | null>();
      referencedIds.forEach(actionItemId => {
        const cachedActionItem = actionItemCacheRef.current.get(actionItemId);
        if (cachedActionItem) {
          actionItemsById.set(actionItemId, cachedActionItem.workItem);
        }
      });

      return actionItemsById;
    },
    [cacheActionItems],
  );

  const pollFeedbackItems = useCallback(
    async (boardId: string, isActive: () => boolean, animateNewItems: boolean): Promise<void> => {
      const pollStartVersion = mutationVersionRef.current;
      const pollStartedAt = Date.now();

      const serverFeedbackItems = ((await itemDataService.getFeedbackItemsForBoardStrict(boardId)) ?? []).filter(feedbackItem => !!feedbackItem?.id);
      if (!isActive()) {
        return;
      }

      const actionItemsById = await loadActionItems(serverFeedbackItems, boardId);
      if (!isActive()) {
        return;
      }

      const pendingItemIds = new Set<string>();
      touchedItemVersionsRef.current.forEach((version, feedbackItemId) => {
        if (version > pollStartVersion) {
          pendingItemIds.add(feedbackItemId);
        }
      });

      const serverItemIds = new Set(serverFeedbackItems.map(feedbackItem => feedbackItem.id));
      const now = Date.now();
      const deletedItemIds = new Set<string>();
      deletedItemIdsRef.current.forEach((deletedAt, feedbackItemId) => {
        const isDeleteConfirmed = deletedAt < pollStartedAt && !serverItemIds.has(feedbackItemId);
        if (isDeleteConfirmed || now - deletedAt > DELETED_ITEM_TOMBSTONE_MS) {
          deletedItemIdsRef.current.delete(feedbackItemId);
        } else {
          deletedItemIds.add(feedbackItemId);
        }
      });

      const preservedItemIds = getLocallyPreservedFeedbackItemIds();

      setColumns(previousColumns => {
        const nextColumns = mergeServerFeedbackItems(previousColumns, serverFeedbackItems, { actionItemsById, pendingItemIds, preservedItemIds, deletedItemIds, animateNewItems });
        if (nextColumns !== previousColumns) {
          setActiveTimerFeedbackItemId(findActiveTimerFeedbackItemId(nextColumns));
        }

        return nextColumns;
      });

      touchedItemVersionsRef.current.forEach((version, feedbackItemId) => {
        if (version <= pollStartVersion) {
          touchedItemVersionsRef.current.delete(feedbackItemId);
        }
      });
    },
    [loadActionItems],
  );

  const hasColumns = columnIds.length > 0;

  useEffect(() => {
    if (!hasColumns) {
      return undefined;
    }

    const boardId = board.id;
    let hasLoadedItems = false;

    const pollingLoop = startPollingLoop({
      intervalMs: LIVE_SYNC_POLL_INTERVAL_MS,
      poll: async isActive => {
        try {
          await pollFeedbackItems(boardId, isActive, hasLoadedItems);
          hasLoadedItems = true;
        } finally {
          // Show the columns after the first attempt even if it failed; the loop keeps retrying.
          if (isActive()) {
            setIsDataLoaded(true);
          }
        }
      },
      onError: (error, consecutiveErrorCount) => {
        appInsights.trackException(error, { action: "pollFeedbackItems", boardId, consecutiveErrorCount });
      },
    });
    feedbackItemsPollingLoopRef.current = pollingLoop;

    return () => {
      pollingLoop.stop();
      feedbackItemsPollingLoopRef.current = null;
    };
  }, [board.id, hasColumns, pollFeedbackItems]);

  const setDefaultIterationAndAreaPath = useCallback(async (teamId: string): Promise<void> => {
    let currentIterations = await workService.getIterations(teamId, "current");
    if (!currentIterations?.length) {
      currentIterations = await workService.getIterations(teamId);
    }

    const defaultIteration = currentIterations?.[0]?.path ?? "";

    const teamFieldValues = await workService.getTeamFieldValues(teamId);
    const defaultArea = teamFieldValues?.values?.[0]?.value ?? "";

    setDefaultActionItemAreaPath(defaultArea);
    setDefaultActionItemIteration(defaultIteration);
  }, []);

  const handleColumnNotesChange = useCallback(
    (columnId: string, notes: string) => {
      const previousNotes = getColumnNotesOrEmpty(columnNotes, columnId);

      setColumns(previousColumns => {
        const updatedColumns = { ...previousColumns };

        if (updatedColumns[columnId]) {
          updatedColumns[columnId] = {
            ...updatedColumns[columnId],
            columnProperties: {
              ...updatedColumns[columnId].columnProperties,
              notes,
            },
          };
        }

        return updatedColumns;
      });

      setColumnNotes(prev => ({
        ...prev,
        [columnId]: notes,
      }));

      const updatePromise = onColumnNotesChange?.(columnId, notes);

      updatePromise?.catch(error => {
        appInsights.trackException(error, {
          action: "updateColumnNotes",
          boardId: board.id,
          columnId,
        });

        setColumns(previousColumns => {
          const revertedColumns = { ...previousColumns };

          if (revertedColumns[columnId]) {
            revertedColumns[columnId] = {
              ...revertedColumns[columnId],
              columnProperties: {
                ...revertedColumns[columnId].columnProperties,
                notes: previousNotes,
              },
            };
          }

          return revertedColumns;
        });

        setColumnNotes(prev => ({
          ...prev,
          [columnId]: previousNotes,
        }));
      });
    },
    [columnNotes, onColumnNotesChange, board.id],
  );

  const navigateToColumnByIndex = useCallback((index: number) => {
    const columnRef = columnRefsRef.current[index];

    setFocusedColumnIndex(index);
    columnRef?.current?.focusColumn();
  }, []);

  const navigateToColumn = useCallback(
    (direction: "next" | "prev") => {
      let newIndex = focusedColumnIndex;

      if (direction === "next") {
        newIndex = (focusedColumnIndex + 1) % columnIds.length;
      } else {
        newIndex = (focusedColumnIndex - 1 + columnIds.length) % columnIds.length;
      }

      navigateToColumnByIndex(newIndex);
    },
    [focusedColumnIndex, columnIds.length, navigateToColumnByIndex],
  );

  const getColumnIndexFromElement = useCallback(
    (element: Element): number | null => {
      const columnElement = element.closest("[data-column-id]");
      const columnId = columnElement?.getAttribute("data-column-id");
      if (!columnId) {
        return null;
      }

      const index = columnIds.indexOf(columnId);
      return index >= 0 ? index : null;
    },
    [columnIds],
  );

  const handleBoardKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable || isAnyModalDialogOpen()) {
        return;
      }

      const targetColumnIndex = getColumnIndexFromElement(target) ?? getColumnIndexFromElement(document.activeElement) ?? focusedColumnIndex;

      switch (e.key) {
        case "ArrowUp":
          if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.defaultPrevented) {
            e.preventDefault();
            columnRefsRef.current[targetColumnIndex]?.current?.navigateByKeyboard("prev");
          }
          break;
        case "ArrowDown":
          if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.defaultPrevented) {
            e.preventDefault();
            columnRefsRef.current[targetColumnIndex]?.current?.navigateByKeyboard("next");
          }
          break;
        case "ArrowLeft":
          if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            navigateToColumn("prev");
          }
          break;
        case "ArrowRight":
          if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            navigateToColumn("next");
          }
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
            const colIndex = parseInt(e.key, 10) - 1;
            if (colIndex < columnIds.length) {
              e.preventDefault();
              navigateToColumnByIndex(colIndex);
            }
          }
          break;
      }
    },
    [getColumnIndexFromElement, focusedColumnIndex, navigateToColumn, navigateToColumnByIndex, columnIds.length],
  );

  useEffect(() => {
    initColumns();
  }, [initColumns]);

  useEffect(() => {
    if (hasColumns) {
      setDefaultIterationAndAreaPath(team.id);
    }
  }, [hasColumns, board.id, team.id, setDefaultIterationAndAreaPath]);

  useEffect(() => {
    if (prevBoardIdRef.current !== board.id) {
      setIsDataLoaded(false);
      setColumns({});
      setColumnIds([]);
      setColumnNotes({});
      setActiveTimerFeedbackItemId(null);
      touchedItemVersionsRef.current.clear();
      deletedItemIdsRef.current.clear();
      initColumns();
      prevBoardIdRef.current = board.id;
    }
  }, [board.id, initColumns]);

  useEffect(() => {
    if (prevBoardModifiedDateRef.current !== board.modifiedDate) {
      initColumns();
      // The board settings changed (e.g. columns were edited), so sync the items now instead of on the next tick.
      feedbackItemsPollingLoopRef.current?.pollNow();
      prevBoardModifiedDateRef.current = board.modifiedDate;
    }
  }, [board.modifiedDate, initColumns]);

  useEffect(() => {
    if (prevTeamIdRef.current !== team.id) {
      setDefaultIterationAndAreaPath(team.id);
      prevTeamIdRef.current = team.id;
    }
  }, [team.id, setDefaultIterationAndAreaPath]);

  useEffect(() => {
    document.addEventListener("keydown", handleBoardKeyDown);

    return () => {
      document.removeEventListener("keydown", handleBoardKeyDown);
    };
  }, [handleBoardKeyDown]);

  useEffect(() => {
    onFocusModeModelChange?.(getFocusModeModel());
  }, [getFocusModeModel, onFocusModeModelChange]);

  const getFeedbackColumnPropsList = useCallback((): FeedbackColumnProps[] => {
    return columnIds.map((columnId, index) => {
      return {
        key: columnId,
        ref: columnRefsRef.current[index],
        columns: columns,
        columnIds: columnIds,
        columnName: columns[columnId].columnProperties.title,
        columnId: columnId,
        columnItems: columns[columnId].columnItems,
        accentColor: columns[columnId].columnProperties.accentColor,
        team: team,
        boardId: board.id,
        boardTitle: board.title,
        isDataLoaded: isDataLoaded,
        icon: getIconElement(columns[columnId].columnProperties.iconClass),
        workflowPhase: workflowPhase,
        addFeedbackItems: addFeedbackItems,
        removeFeedbackItemFromColumn: removeFeedbackItemFromColumn,
        refreshFeedbackItems: refreshFeedbackItems,
        defaultActionItemAreaPath: defaultActionItemAreaPath,
        defaultActionItemIteration: defaultActionItemIteration,
        nonHiddenWorkItemTypes: nonHiddenWorkItemTypes,
        allWorkItemTypes: allWorkItemTypes,
        isBoardAnonymous: isAnonymous,
        canManageBoard: canManageBoard,
        shouldFocusOnCreateFeedback: !!columns[columnId].shouldFocusOnCreateFeedback,
        hideFeedbackItems: hideFeedbackItems,
        isFocusModalHidden: true,
        groupIds: [] as string[],
        showColumnEditButton: canManageBoard,
        columnNotes: getColumnNotesOrEmpty(columnNotes, columnId),
        onColumnNotesChange: (notes: string) => handleColumnNotesChange(columnId, notes),
        onVoteCasted: () => {
          if (onVoteCasted) {
            onVoteCasted();
          }
        },
        activeTimerFeedbackItemId: activeTimerFeedbackItemId,
        requestTimerStart: requestTimerStart,
        notifyTimerStopped: handleTimerStopped,
      };
    });
  }, [columnIds, columns, team, board.id, board.title, isDataLoaded, workflowPhase, addFeedbackItems, removeFeedbackItemFromColumn, refreshFeedbackItems, defaultActionItemAreaPath, defaultActionItemIteration, nonHiddenWorkItemTypes, allWorkItemTypes, isAnonymous, hideFeedbackItems, canManageBoard, columnNotes, handleColumnNotesChange, onVoteCasted, activeTimerFeedbackItemId, requestTimerStart, handleTimerStopped]);

  if (!displayBoard) {
    return <div> An unexpected exception occurred. </div>;
  }

  const feedbackColumnPropsList = getFeedbackColumnPropsList();

  return (
    <div className={`feedback-board scroll-mode-${scrollMode}`} role="main" aria-label="Feedback board with columns" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      {isDataLoaded &&
        feedbackColumnPropsList.map(columnProps => {
          return <FeedbackColumn key={columnProps.columnId} ref={columnRefsRef.current[columnIds.indexOf(columnProps.columnId)]} {...columnProps} />;
        })}
    </div>
  );
};

export const FeedbackBoard = React.memo(FeedbackBoardComponent);
FeedbackBoard.displayName = "FeedbackBoard";

export default FeedbackBoard;
