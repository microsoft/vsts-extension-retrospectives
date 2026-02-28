import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { cn } from "../utilities/classNameHelper";
import { WorkflowPhase } from "../interfaces/workItem";
import { IFeedbackItemDocument } from "../interfaces/feedback";
import { itemDataService } from "../dal/itemDataService";
import FeedbackItem, { IFeedbackItemProps } from "./feedbackItem";
import FeedbackItemGroup from "./feedbackItemGroup";
import { IColumnItem, IColumn } from "./feedbackBoard";
import localStorageHelper from "../utilities/localStorageHelper";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { getUserIdentity } from "../utilities/userIdentityHelper";
import { WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { appInsights, TelemetryEvents } from "../utilities/telemetryClient";
import { isAnyModalDialogOpen } from "../utilities/dialogHelper";
import { getIconElement } from "./icons";

export interface FeedbackColumnProps {
  columns: { [id: string]: IColumn };
  columnIds: string[];

  columnName: string;
  columnId: string;
  accentColor: string;
  icon: React.ReactElement;
  workflowPhase: WorkflowPhase;
  isDataLoaded: boolean;
  columnItems: IColumnItem[];
  team: WebApiTeam;
  boardId: string;
  boardTitle: string;
  defaultActionItemIteration: string;
  defaultActionItemAreaPath: string;
  nonHiddenWorkItemTypes: WorkItemType[];
  allWorkItemTypes: WorkItemType[];
  isBoardAnonymous: boolean;
  shouldFocusOnCreateFeedback: boolean;
  hideFeedbackItems: boolean;
  groupIds: string[];
  onVoteCasted: () => void;
  showColumnEditButton: boolean;
  columnNotes: string;
  onColumnNotesChange: (notes: string) => void;
  registerItemRef?: (itemId: string, element: HTMLElement | null) => void;
  activeTimerFeedbackItemId: string | null;
  requestTimerStart: (feedbackItemId: string) => void;
  notifyTimerStopped: (feedbackItemId: string) => void;

  addFeedbackItems: (columnId: string, columnItems: IFeedbackItemDocument[], shouldBroadcast: boolean, newlyCreated: boolean, showAddedAnimation: boolean, shouldHaveFocus: boolean, hideFeedbackItems: boolean) => void;
  removeFeedbackItemFromColumn: (columnIdToDeleteFrom: string, feedbackItemIdToDelete: string, shouldSetFocusOnFirstAvailableItem: boolean) => void;
  refreshFeedbackItems: (feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean) => void;
}

export interface FeedbackColumnHandle {
  navigateByKeyboard: (direction: "next" | "prev") => void;
  focusColumn: () => void;
  createEmptyFeedbackItem: () => void;
}

interface FocusPreservation {
  elementId: string | null;
  selectionStart: number | null;
  selectionEnd: number | null;
  isContentEditable: boolean;
  cursorPosition: number | null;
}

export const moveFeedbackItem = async (refreshFeedbackItems: (feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean) => void, boardId: string, feedbackItemId: string, columnId: string) => {
  const updatedFeedbackItems = await itemDataService.addFeedbackItemAsMainItemToColumn(boardId, feedbackItemId, columnId);

  if (updatedFeedbackItems) {
    refreshFeedbackItems(
      [updatedFeedbackItems.updatedOldParentFeedbackItem, updatedFeedbackItems.updatedFeedbackItem, ...updatedFeedbackItems.updatedChildFeedbackItems].filter(item => item),
      true,
    );
  }

  appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemUngrouped, properties: { boardId, feedbackItemId, columnId } });
};

export const createFeedbackItemProps = (columnProps: FeedbackColumnProps, columnItem: IColumnItem): IFeedbackItemProps => {
  let accentColor: string = columnProps.accentColor;
  if (columnItem.feedbackItem.originalColumnId !== columnProps.columnId) {
    accentColor = columnProps.columns[columnItem.feedbackItem.originalColumnId]?.columnProperties?.accentColor ?? columnProps.accentColor;
  }

  return {
    id: columnItem.feedbackItem.id,
    title: columnItem.feedbackItem.title,
    createdBy: columnItem.feedbackItem.createdBy ? columnItem.feedbackItem.createdBy.displayName : null,
    createdByProfileImage: columnItem.feedbackItem.createdBy ? columnItem.feedbackItem.createdBy._links.avatar.href : null,
    lastEditedDate: columnItem.feedbackItem.modifiedDate ? columnItem.feedbackItem.modifiedDate.toString() : "",
    upvotes: columnItem.feedbackItem.upvotes,
    timerSecs: columnItem.feedbackItem.timerSecs,
    timerState: columnItem.feedbackItem.timerState,
    timerId: columnItem.feedbackItem.timerId,
    workflowPhase: columnProps.workflowPhase,
    accentColor: accentColor,
    icon: columnProps.icon,
    createdDate: columnItem.feedbackItem.createdDate.toString(),
    team: columnProps.team,
    columnProps: columnProps,
    columns: columnProps.columns,
    columnIds: columnProps.columnIds,
    columnId: columnProps.columnId,
    originalColumnId: columnItem.feedbackItem.originalColumnId,
    boardId: columnProps.boardId,
    boardTitle: columnProps.boardTitle,
    defaultActionItemAreaPath: columnProps.defaultActionItemAreaPath,
    defaultActionItemIteration: columnProps.defaultActionItemIteration,
    actionItems: columnItem.actionItems,
    newlyCreated: columnItem.newlyCreated,
    showAddedAnimation: columnItem.showAddedAnimation,
    addFeedbackItems: columnProps.addFeedbackItems,
    removeFeedbackItemFromColumn: columnProps.removeFeedbackItemFromColumn,
    refreshFeedbackItems: columnProps.refreshFeedbackItems,
    moveFeedbackItem: moveFeedbackItem,
    nonHiddenWorkItemTypes: columnProps.nonHiddenWorkItemTypes,
    allWorkItemTypes: columnProps.allWorkItemTypes,
    shouldHaveFocus: columnItem.shouldHaveFocus,
    hideFeedbackItems: columnProps.hideFeedbackItems,
    userIdRef: columnItem.feedbackItem.userIdRef,
    onVoteCasted: columnProps.onVoteCasted,
    groupCount: columnItem.feedbackItem.childFeedbackItemIds ? columnItem.feedbackItem.childFeedbackItemIds.length : 0,
    groupIds: columnItem.feedbackItem.childFeedbackItemIds ?? [],
    isGroupedCarouselItem: columnItem.feedbackItem.isGroupedCarouselItem,
    isShowingGroupedChildrenTitles: false,
    isFocusModalHidden: true,
    activeTimerFeedbackItemId: columnProps.activeTimerFeedbackItemId,
    requestTimerStart: columnProps.requestTimerStart,
    notifyTimerStopped: columnProps.notifyTimerStopped,
  };
};

const FeedbackColumn = forwardRef<FeedbackColumnHandle, FeedbackColumnProps>((props, ref) => {
  const { columnName, columnId, icon, workflowPhase, isDataLoaded, columnItems, boardId, isBoardAnonymous, showColumnEditButton, columnNotes, onColumnNotesChange, addFeedbackItems, refreshFeedbackItems } = props;
  const currentColumnItems = columnItems ?? [];

  const [isCollapsed] = useState(false);
  const [columnNotesDraft, setColumnNotesDraft] = useState("");
  const [, setFocusedItemIndex] = useState(-1);

  const columnRef = useRef<HTMLDivElement>(null);
  const editColumnNotesDialogRef = useRef<HTMLDialogElement>(null);
  const focusPreservation = useRef<FocusPreservation | null>(null);
  const prevColumnItemsLength = useRef<number>(currentColumnItems.length);

  const getNavigableColumnItems = useCallback((): IColumnItem[] => {
    const sourceColumnItems: IColumnItem[] = currentColumnItems;

    let sortedItems: IColumnItem[] = sourceColumnItems;

    if (workflowPhase === WorkflowPhase.Act) {
      sortedItems = itemDataService.sortItemsByVotesAndDate(sortedItems, sourceColumnItems);
    } else {
      sortedItems = sortedItems.sort((item1, item2) => new Date(item2.feedbackItem.createdDate).getTime() - new Date(item1.feedbackItem.createdDate).getTime());
    }

    return (sortedItems || []).filter(item => !item.feedbackItem.parentFeedbackItemId);
  }, [currentColumnItems, workflowPhase]);

  const focusFeedbackItemById = useCallback((feedbackItemId: string) => {
    const elementToFocus = columnRef.current?.querySelector(`[data-feedback-item-id="${feedbackItemId}"]`) as HTMLElement | null;
    elementToFocus?.focus();
    elementToFocus?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, []);

  const focusFeedbackItemAtIndex = useCallback(
    (index: number) => {
      const navigableItems = getNavigableColumnItems();
      const feedbackItemId = navigableItems[index].feedbackItem.id;
      focusFeedbackItemById(feedbackItemId);
    },
    [focusFeedbackItemById, getNavigableColumnItems],
  );

  const moveFocus = useCallback(
    (direction: "next" | "prev") => {
      const navigableItems = getNavigableColumnItems();
      if (navigableItems.length === 0) {
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      const activeCard = activeElement?.closest("[data-feedback-item-id]") as HTMLElement | null;
      const activeId = activeCard?.getAttribute("data-feedback-item-id") ?? null;

      const currentIndex = activeId ? navigableItems.findIndex(item => item.feedbackItem.id === activeId) : -1;

      if (direction === "prev" && currentIndex < 0) {
        return;
      }

      const newIndex = direction === "next" ? (currentIndex < 0 ? 0 : Math.min(currentIndex + 1, navigableItems.length - 1)) : Math.max(currentIndex - 1, 0);

      setFocusedItemIndex(newIndex);
      focusFeedbackItemAtIndex(newIndex);
    },
    [focusFeedbackItemAtIndex, getNavigableColumnItems],
  );

  const preserveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;

    if (columnRef.current && columnRef.current.contains(activeElement)) {
      const feedbackCard = activeElement.closest("[data-feedback-item-id]") as HTMLElement;
      const elementId = feedbackCard?.getAttribute("data-feedback-item-id") || activeElement.id;

      focusPreservation.current = {
        elementId: elementId || null,
        selectionStart: null,
        selectionEnd: null,
        isContentEditable: activeElement.isContentEditable,
        cursorPosition: null,
      };

      if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
        const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;
        focusPreservation.current.selectionStart = inputElement.selectionStart;
        focusPreservation.current.selectionEnd = inputElement.selectionEnd;
      } else if (activeElement.isContentEditable) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          focusPreservation.current.cursorPosition = range.startOffset;
        }
      }
    }
  }, []);

  const restoreFocus = useCallback(() => {
    const preserved = focusPreservation.current;

    setTimeout(() => {
      let elementToFocus: HTMLElement | null = null;

      if (preserved.elementId && columnRef.current) {
        const feedbackCard = columnRef.current.querySelector(`[data-feedback-item-id="${preserved.elementId}"]`) as HTMLElement;
        if (feedbackCard) {
          elementToFocus = feedbackCard.querySelector('input, textarea, [contenteditable="true"]') as HTMLElement;
          if (!elementToFocus) {
            elementToFocus = feedbackCard;
          }
        }
      }

      if (elementToFocus) {
        elementToFocus.focus();

        if ((elementToFocus.tagName === "INPUT" || elementToFocus.tagName === "TEXTAREA") && preserved.selectionStart !== null) {
          const inputElement = elementToFocus as HTMLInputElement | HTMLTextAreaElement;
          inputElement.setSelectionRange(preserved.selectionStart, preserved.selectionEnd ?? preserved.selectionStart);
        } else if (elementToFocus.isContentEditable && preserved.cursorPosition !== null) {
          try {
            const range = document.createRange();
            const selection = window.getSelection();
            if (elementToFocus.firstChild && selection) {
              const firstChildText = elementToFocus.firstChild.textContent;
              const maxOffset = firstChildText === null ? 0 : firstChildText.length;
              range.setStart(elementToFocus.firstChild, Math.min(preserved.cursorPosition, maxOffset));
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          } catch (error) {
            console.warn("Failed to restore cursor position:", error);
          }
        }
      }
    }, 0);
  }, []);

  const createEmptyFeedbackItem = useCallback(() => {
    if (workflowPhase !== WorkflowPhase.Collect) return;

    const item = currentColumnItems.find(x => x.feedbackItem.id === "emptyFeedbackItem");
    if (item) {
      return;
    }

    const userIdentity = getUserIdentity();
    const feedbackItem: IFeedbackItemDocument = {
      boardId: boardId,
      columnId: columnId,
      originalColumnId: columnId,
      createdBy: isBoardAnonymous ? null : userIdentity,
      createdDate: new Date(Date.now()),
      id: "emptyFeedbackItem",
      title: "",
      voteCollection: {},
      upvotes: 0,
      userIdRef: userIdentity.id,
      timerSecs: 0,
      timerState: false,
      timerId: null,
      groupIds: [],
      isGroupedCarouselItem: false,
    };

    addFeedbackItems(columnId, [feedbackItem], /*shouldBroadcast*/ false, /*newlyCreated*/ true, /*showAddedAnimation*/ false, /*shouldHaveFocus*/ false, /*hideFeedbackItems*/ false);
  }, [workflowPhase, currentColumnItems, boardId, columnId, isBoardAnonymous, addFeedbackItems]);

  const openEditDialog = useCallback(() => {
    setColumnNotesDraft(columnNotes);
    editColumnNotesDialogRef.current!.showModal();
  }, [columnNotes]);

  const handleColumnKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable || isAnyModalDialogOpen()) {
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          moveFocus("prev");
          break;
        case "ArrowDown":
          e.preventDefault();
          moveFocus("next");
          break;
        case "Insert":
          if (workflowPhase === WorkflowPhase.Collect) {
            e.preventDefault();
            createEmptyFeedbackItem();
          }
          break;
        case "e":
        case "E":
          if (showColumnEditButton) {
            e.preventDefault();
            openEditDialog();
          }
          break;
      }
    },
    [moveFocus, workflowPhase, createEmptyFeedbackItem, showColumnEditButton, openEditDialog],
  );

  const navigateByKeyboard = useCallback(
    (direction: "next" | "prev") => {
      moveFocus(direction);
    },
    [moveFocus],
  );

  const focusColumn = useCallback(() => {
    if (columnRef.current) {
      columnRef.current.focus();

      const visibleItems = getNavigableColumnItems();
      if (visibleItems.length > 0) {
        setFocusedItemIndex(0);
        focusFeedbackItemAtIndex(0);
      }
    }
  }, [focusFeedbackItemAtIndex, getNavigableColumnItems]);

  useImperativeHandle(
    ref,
    () => ({
      navigateByKeyboard,
      focusColumn,
      createEmptyFeedbackItem,
    }),
    [navigateByKeyboard, focusColumn, createEmptyFeedbackItem],
  );

  useEffect(() => {
    const column = columnRef.current;
    if (column) {
      column.addEventListener("keydown", handleColumnKeyDown);
    }

    return () => {
      if (column) {
        column.removeEventListener("keydown", handleColumnKeyDown);
      }
    };
  }, [handleColumnKeyDown]);

  useEffect(() => {
    const itemCountChanged = prevColumnItemsLength.current !== currentColumnItems.length;

    if (itemCountChanged) {
      preserveFocus();
    }

    prevColumnItemsLength.current = currentColumnItems.length;

    if (itemCountChanged && focusPreservation.current) {
      restoreFocus();
      focusPreservation.current = null;
    }
  }, [currentColumnItems.length, preserveFocus, restoreFocus]);

  const dragFeedbackItemOverColumn = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDropFeedbackItemOnColumnSpace = useCallback(async () => {
    const droppedItemId = localStorageHelper.getIdValue();
    await moveFeedbackItem(refreshFeedbackItems, boardId, droppedItemId, columnId);
  }, [refreshFeedbackItems, boardId, columnId]);

  const handleColumnNotesDraftChange = useCallback((event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    const value = target ? target.value : "";
    setColumnNotesDraft(value);
  }, []);

  const saveColumnNotes = useCallback(() => {
    onColumnNotesChange(columnNotesDraft);
    editColumnNotesDialogRef.current!.close();
  }, [onColumnNotesChange, columnNotesDraft]);

  const renderFeedbackItems = useCallback(() => {
    const sourceColumnItems: IColumnItem[] = currentColumnItems;
    const navigableItems = getNavigableColumnItems();

    return navigableItems.map(columnItem => {
      const feedbackItemProps = createFeedbackItemProps(props, columnItem);
      let itemContent: React.JSX.Element;

      if (columnItem.feedbackItem.childFeedbackItemIds?.length) {
        const childItemsToGroup = sourceColumnItems.filter(childColumnItem => columnItem.feedbackItem.childFeedbackItemIds.some(childId => childId === childColumnItem.feedbackItem.id)).map(childColumnItem => createFeedbackItemProps(props, childColumnItem));
        itemContent = <FeedbackItemGroup mainFeedbackItem={feedbackItemProps} groupedWorkItems={childItemsToGroup} workflowState={workflowPhase} />;
      } else {
        itemContent = <FeedbackItem {...feedbackItemProps} />;
      }

      return (
        <li key={feedbackItemProps.id} className="feedback-item-list-entry">
          {itemContent}
        </li>
      );
    });
  }, [currentColumnItems, getNavigableColumnItems, props, workflowPhase]);

  return (
    <div ref={columnRef} className="feedback-column" role="region" aria-label={`${columnName} column with ${currentColumnItems.length} feedback items`} tabIndex={0} onDoubleClick={createEmptyFeedbackItem} onDrop={handleDropFeedbackItemOnColumnSpace} onDragOver={dragFeedbackItemOverColumn}>
      <div className="feedback-column-header">
        <div className="feedback-column-title" aria-label={`${columnName} (${currentColumnItems.length} feedback items)`}>
          <div className="feedback-column-icon">{icon}</div>
          <h2 className="feedback-column-name">{columnName}</h2>
        </div>
        <div className="feedback-column-actions">
          {showColumnEditButton && (
            <button className="feedback-column-edit-button" title="Edit column notes" aria-label={`Edit column ${columnName}`} onClick={openEditDialog}>
              {getIconElement("reviews")}
            </button>
          )}
          {columnNotes && (
            <button className="feedback-column-info-button" title={columnNotes} aria-label={`Column notes: ${columnNotes}`}>
              {getIconElement("info")}
            </button>
          )}
        </div>
      </div>
      <div className={cn("feedback-column-content", isCollapsed && "hide-collapse")}>
        {workflowPhase === WorkflowPhase.Collect && (
          <button className="create-button" title="Add new feedback" aria-label="Add new feedback" onClick={createEmptyFeedbackItem}>
            {getIconElement("add")}
            Add new feedback
          </button>
        )}
        {isDataLoaded && (
          <ul className="feedback-items-container" aria-label={`${columnName} feedback list`}>
            {renderFeedbackItems()}
          </ul>
        )}
      </div>
      <dialog ref={editColumnNotesDialogRef} className="edit-column-notes-dialog" role="dialog" aria-label="Edit column notes">
        <div className="header">
          <h2 className="title">Edit column notes</h2>
          <button type="button" onClick={() => editColumnNotesDialogRef.current!.close()} aria-label="Close">
            {getIconElement("close")}
          </button>
        </div>
        <div className="subText">
          <div className="form-group">
            <label id="column-notes-label" htmlFor="column-notes-textarea">
              Column notes
            </label>
            <textarea id="column-notes-textarea" aria-labelledby="column-notes-label" aria-invalid="false" value={columnNotesDraft} onChange={handleColumnNotesDraftChange} />
          </div>
        </div>
        <div className="inner">
          <button type="button" className="button" onClick={saveColumnNotes}>
            Save
          </button>
          <button type="button" className="button default" onClick={() => editColumnNotesDialogRef.current!.close()}>
            Cancel
          </button>
        </div>
      </dialog>
    </div>
  );
});

FeedbackColumn.displayName = "FeedbackColumn";

export default FeedbackColumn;
