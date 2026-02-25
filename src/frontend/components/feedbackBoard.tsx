import React, { useState, useRef, useEffect, useCallback } from "react";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { WorkItem, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";

import { workService } from "../dal/azureDevOpsWorkService";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { itemDataService } from "../dal/itemDataService";
import { reflectBackendService } from "../dal/reflectBackendService";
import FeedbackColumn, { type FeedbackColumnProps, type FeedbackColumnHandle } from "./feedbackColumn";
import { IFeedbackBoardDocument, IFeedbackColumn, IFeedbackItemDocument } from "../interfaces/feedback";
import { ExceptionCode } from "../interfaces/retrospectiveState";
import { WorkflowPhase } from "../interfaces/workItem";
import type { FocusModeModel } from "./feedbackCarousel";

import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { appInsights, reactPlugin } from "../utilities/telemetryClient";
import { isAnyModalDialogOpen } from "../utilities/dialogHelper";
import { getIconElement } from "./icons";

export interface FeedbackBoardProps {
  displayBoard: boolean;
  exceptionCode?: ExceptionCode;
  board: IFeedbackBoardDocument;
  team: WebApiTeam;
  workflowPhase: WorkflowPhase;
  nonHiddenWorkItemTypes: WorkItemType[];
  allWorkItemTypes: WorkItemType[];
  isAnonymous: boolean;
  hideFeedbackItems: boolean;
  onFocusModeModelChange?: (model: FocusModeModel) => void;
  userId: string;
  onVoteCasted?: () => void;
  onColumnNotesChange?: (columnId: string, notes: string) => Promise<void>;
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

const findActiveTimerFeedbackItemId = (columns: { [id: string]: IColumn }): string | null => {
  for (const columnId of Object.keys(columns)) {
    const activeItem = columns[columnId]?.columnItems.find(columnItem => columnItem.feedbackItem.timerState);
    if (activeItem) {
      return activeItem.feedbackItem.id;
    }
  }

  return null;
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

export const FeedbackBoard: React.FC<FeedbackBoardProps> = ({ displayBoard, board, team, workflowPhase, nonHiddenWorkItemTypes, allWorkItemTypes, isAnonymous, hideFeedbackItems, onFocusModeModelChange, userId, onVoteCasted, onColumnNotesChange }) => {
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

  const findColumnItemById = useCallback((feedbackItemId: string, currentColumns: { [id: string]: IColumn }, currentColumnIds: string[]): IColumnItem | undefined => {
    for (const columnId of currentColumnIds) {
      const columnItem = currentColumns[columnId]?.columnItems.find(item => item.feedbackItem.id === feedbackItemId);
      if (columnItem) {
        return columnItem;
      }
    }

    return undefined;
  }, []);

  const refreshFeedbackItems = useCallback(
    async (updatedFeedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean): Promise<void> => {
      if (updatedFeedbackItems.length) {
        const updatedColumnItems: IColumnItem[] = await Promise.all(
          updatedFeedbackItems.map(async feedbackItem => {
            const actionItems = feedbackItem.associatedActionItemIds?.length ? await workItemService.getWorkItemsByIds(feedbackItem.associatedActionItemIds) : [];

            return {
              feedbackItem,
              actionItems,
            };
          }),
        );

        setColumns(previousColumns => {
          const newColumnsAsList = columnIds.map(columnId => {
            return {
              key: columnId,
              value: {
                columnProperties: previousColumns[columnId].columnProperties,
                columnItems: previousColumns[columnId].columnItems
                  .filter(columnItem => {
                    return !updatedColumnItems.some(item => item.feedbackItem.id === columnItem.feedbackItem.id && item.feedbackItem.columnId !== columnItem.feedbackItem.columnId);
                  })
                  .map(columnItem => {
                    const updatedItem = updatedColumnItems.find(item => item.feedbackItem.id === columnItem.feedbackItem.id && item.feedbackItem.columnId === columnItem.feedbackItem.columnId);
                    return updatedItem || columnItem;
                  })
                  .concat(
                    updatedColumnItems.filter(columnItem => {
                      return columnItem.feedbackItem.columnId === columnId && !previousColumns[columnId].columnItems.some(existingColumnItem => columnItem.feedbackItem.id === existingColumnItem.feedbackItem.id);
                    }),
                  ),
              },
            };
          });

          const emptyColumns: { [id: string]: IColumn } = {};

          const newColumns = newColumnsAsList.reduce((cols, columnsAsList) => {
            cols[columnsAsList.key] = columnsAsList.value;
            return cols;
          }, emptyColumns);

          setActiveTimerFeedbackItemId(findActiveTimerFeedbackItemId(newColumns));
          return newColumns;
        });
      }

      if (shouldBroadcast) {
        updatedFeedbackItems.forEach(updatedFeedbackItem => {
          reflectBackendService.broadcastUpdatedItem("dummyColumn", updatedFeedbackItem.id);
        });
      }
    },
    [columnIds],
  );

  const stopTimerById = useCallback(
    async (feedbackItemId: string): Promise<void> => {
      setColumns(currentColumns => {
        const columnItem = findColumnItemById(feedbackItemId, currentColumns, columnIds);

        if (!columnItem || !columnItem.feedbackItem.timerState) {
          setActiveTimerFeedbackItemId(prev => (prev === feedbackItemId ? null : prev));
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
          await refreshFeedbackItems([updatedFeedbackItem], true);
        }
      } catch (error) {
        appInsights.trackException(error, {
          action: "stopTimer",
          boardId: board.id,
          feedbackItemId,
        });
      } finally {
        setActiveTimerFeedbackItemId(prev => (prev === feedbackItemId ? null : prev));
      }
    },
    [board.id, columnIds, findColumnItemById, refreshFeedbackItems],
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
    setActiveTimerFeedbackItemId(prev => (prev === feedbackItemId ? null : prev));
  }, []);

  const addFeedbackItems = useCallback((columnId: string, feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean, newlyCreated: boolean, showAddedAnimation: boolean, shouldHaveFocus: boolean, hideFeedbackItemsParam: boolean) => {
    setColumns(previousColumns => {
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

    if (shouldBroadcast) {
      feedbackItems.forEach(columnItem => {
        reflectBackendService.broadcastNewItem(columnId, columnItem.id);
      });
    }
  }, []);

  const removeFeedbackItemFromColumn = useCallback((columnId: string, feedbackItemId: string, shouldSetFocusOnFirstAvailableItem: boolean) => {
    setColumns(previousColumns => {
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
  }, []);

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
      nonHiddenWorkItemTypes,
      allWorkItemTypes,
      hideFeedbackItems,
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
  }, [columns, columnIds, workflowPhase, team, board.id, board.title, defaultActionItemAreaPath, defaultActionItemIteration, nonHiddenWorkItemTypes, allWorkItemTypes, hideFeedbackItems, onVoteCasted, activeTimerFeedbackItemId, requestTimerStart, handleTimerStopped, addFeedbackItems, removeFeedbackItemFromColumn, refreshFeedbackItems]);

  const initColumns = useCallback(() => {
    const columnProperties = board.columns;

    const stateColumns: { [id: string]: IColumn } = {};
    const newColumnIds: string[] = [];
    const newColumnNotes: { [columnId: string]: string } = {};

    columnRefsRef.current = columnProperties.map(() => React.createRef<FeedbackColumnHandle>());

    columnProperties.forEach(col => {
      if (!col.accentColor) {
        col.accentColor = "#0078d4";
      }

      col.notes = col.notes ?? "";

      const column: IColumn = {
        columnProperties: col,
        columnItems: [],
        shouldFocusOnCreateFeedback: false,
      };
      stateColumns[col.id] = column;
      newColumnIds.push(col.id);
      newColumnNotes[col.id] = col.notes ?? "";
    });

    setColumns(stateColumns);
    setColumnIds(newColumnIds);
    setColumnNotes(newColumnNotes);
    setActiveTimerFeedbackItemId(null);
  }, [board.columns]);

  const getAllBoardFeedbackItems = useCallback(async () => {
    const feedbackItems = await itemDataService.getFeedbackItemsForBoard(board.id);

    if (!feedbackItems) {
      setIsDataLoaded(true);
      setActiveTimerFeedbackItemId(null);
      return;
    }

    const columnItemPromises: Promise<IColumnItem>[] = feedbackItems.map(async feedbackItem => {
      const actionItems = feedbackItem.associatedActionItemIds?.length ? await workItemService.getWorkItemsByIds(feedbackItem.associatedActionItemIds) : [];

      return {
        actionItems,
        feedbackItem,
      };
    });

    const columnItems = await Promise.all(columnItemPromises);

    const activeEditorElement = document.querySelector(".editable-text-input-container textarea, .editable-text-input-container input, .editable-text-input") as HTMLElement | null;
    const activeEditingItemId = activeEditorElement?.closest("[data-feedback-item-id]")?.getAttribute("data-feedback-item-id");

    setColumns(prevColumns => {
      const newColumns = { ...prevColumns };

      const serverItemsByColumn = new Map<string, IColumnItem[]>();
      columnItems.forEach(columnItem => {
        const columnId = columnItem.feedbackItem.columnId;
        if (columnIds.indexOf(columnId) < 0) {
          return;
        }

        const existingItems = serverItemsByColumn.get(columnId) ?? [];
        existingItems.push(columnItem);
        serverItemsByColumn.set(columnId, existingItems);
      });

      columnIds.forEach(columnId => {
        if (!newColumns[columnId]) {
          return;
        }

        const serverItems = serverItemsByColumn.get(columnId) ?? [];
        const serverIds = new Set(serverItems.map(item => item.feedbackItem.id));

        const localItemsToPreserve = newColumns[columnId].columnItems.filter(columnItem => {
          const itemId = columnItem.feedbackItem.id;
          if (serverIds.has(itemId)) {
            return false;
          }

          return columnItem.newlyCreated || itemId === "emptyFeedbackItem" || (activeEditingItemId !== null && itemId === activeEditingItemId);
        });

        newColumns[columnId] = {
          ...newColumns[columnId],
          columnItems: [...localItemsToPreserve, ...serverItems],
        };
      });

      setActiveTimerFeedbackItemId(findActiveTimerFeedbackItemId(newColumns));
      return newColumns;
    });

    setIsDataLoaded(true);
  }, [board.id, columnIds]);

  useEffect(() => {
    let fallbackPollingIntervalId: number | undefined;

    if (workflowPhase === WorkflowPhase.Collect) {
      fallbackPollingIntervalId = window.setInterval(() => {
        void getAllBoardFeedbackItems();
      }, 5000);
    }

    return () => {
      if (fallbackPollingIntervalId !== undefined) {
        window.clearInterval(fallbackPollingIntervalId);
      }
    };
  }, [getAllBoardFeedbackItems, workflowPhase]);

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
      const previousNotes = columnNotes[columnId] ?? "";

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
    if (columnIds.length > 0) {
      getAllBoardFeedbackItems();
      setDefaultIterationAndAreaPath(team.id);
    }
  }, [columnIds.length > 0 ? null : columnIds, getAllBoardFeedbackItems, setDefaultIterationAndAreaPath, team.id]);

  useEffect(() => {
    if (prevBoardIdRef.current !== board.id) {
      setIsDataLoaded(false);
      setColumns({});
      setColumnIds([]);
      setColumnNotes({});
      setActiveTimerFeedbackItemId(null);
      initColumns();
      prevBoardIdRef.current = board.id;
    }
  }, [board.id, initColumns]);

  useEffect(() => {
    if (prevBoardModifiedDateRef.current !== board.modifiedDate) {
      setColumnNotes({});
      setActiveTimerFeedbackItemId(null);
      initColumns();
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
    const receiveNewItemHandler = async (columnId: string, feedbackItemId: string) => {
      const newItem = await itemDataService.getFeedbackItem(board.id, feedbackItemId);
      addFeedbackItems(columnId, [newItem], /*shouldBroadcast*/ false, /*newlyCreated*/ false, /*showAddedAnimation*/ true, /*shouldHaveFocus*/ false, hideFeedbackItems);
    };

    const receiveUpdatedItemHandler = async (_: string, feedbackItemId: string) => {
      const updatedItem = await itemDataService.getFeedbackItem(board.id, feedbackItemId);
      refreshFeedbackItems([updatedItem], false);
    };

    reflectBackendService.onReceiveNewItem(receiveNewItemHandler);
    reflectBackendService.onReceiveUpdatedItem(receiveUpdatedItemHandler);

    return () => {
      reflectBackendService.removeOnReceiveNewItem(receiveNewItemHandler);
      reflectBackendService.removeOnReceiveUpdatedItem(receiveUpdatedItemHandler);
    };
  }, [board.id, hideFeedbackItems, addFeedbackItems, refreshFeedbackItems]);

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
    const canCurrentUserEditBoard = board.createdBy?.id === userId;

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
        shouldFocusOnCreateFeedback: !!columns[columnId].shouldFocusOnCreateFeedback,
        hideFeedbackItems: hideFeedbackItems,
        isFocusModalHidden: true,
        groupIds: [] as string[],
        showColumnEditButton: !!canCurrentUserEditBoard,
        columnNotes: columnNotes[columnId] ?? "",
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
  }, [board.createdBy?.id, board.id, board.title, userId, columnIds, columns, team, isDataLoaded, workflowPhase, addFeedbackItems, removeFeedbackItemFromColumn, refreshFeedbackItems, defaultActionItemAreaPath, defaultActionItemIteration, nonHiddenWorkItemTypes, allWorkItemTypes, isAnonymous, hideFeedbackItems, columnNotes, handleColumnNotesChange, onVoteCasted, activeTimerFeedbackItemId, requestTimerStart, handleTimerStopped]);

  if (!displayBoard) {
    return <div> An unexpected exception occurred. </div>;
  }

  const feedbackColumnPropsList = getFeedbackColumnPropsList();

  return (
    <div className="feedback-board" role="main" aria-label="Feedback board with columns" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      {isDataLoaded &&
        feedbackColumnPropsList.map(columnProps => {
          return <FeedbackColumn key={columnProps.columnId} ref={columnRefsRef.current[columnIds.indexOf(columnProps.columnId)]} {...columnProps} />;
        })}
    </div>
  );
};

export default FeedbackBoard;
