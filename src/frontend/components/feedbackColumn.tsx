import React from "react";
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
  requestTimerStart: (feedbackItemId: string) => Promise<boolean>;
  notifyTimerStopped: (feedbackItemId: string) => void;

  addFeedbackItems: (columnId: string, columnItems: IFeedbackItemDocument[], shouldBroadcast: boolean, newlyCreated: boolean, showAddedAnimation: boolean, shouldHaveFocus: boolean, hideFeedbackItems: boolean) => void;
  removeFeedbackItemFromColumn: (columnIdToDeleteFrom: string, feedbackItemIdToDelete: string, shouldSetFocusOnFirstAvailableItem: boolean) => void;
  refreshFeedbackItems: (feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean) => void;
}

export interface FeedbackColumnState {
  isCollapsed: boolean;
  isCarouselHidden: boolean;
  columnNotesDraft: string;
  focusedItemIndex: number;
}

export default class FeedbackColumn extends React.Component<FeedbackColumnProps, FeedbackColumnState> {
  private columnRef: React.RefObject<HTMLDivElement> = React.createRef();
  private readonly editColumnNotesDialogRef = React.createRef<HTMLDialogElement>();
  private itemRefs: Map<string, HTMLElement> = new Map();
  private focusPreservation: {
    elementId: string | null;
    selectionStart: number | null;
    selectionEnd: number | null;
    isContentEditable: boolean;
    cursorPosition: number | null;
  } | null = null;

  constructor(props: FeedbackColumnProps) {
    super(props);
    this.state = {
      isCarouselHidden: true,
      isCollapsed: false,
      columnNotesDraft: "",
      focusedItemIndex: -1,
    };
  }

  public componentDidMount() {
    if (this.columnRef.current) {
      this.columnRef.current.addEventListener("keydown", this.handleColumnKeyDown);
    }
  }

  public componentDidUpdate(prevProps: FeedbackColumnProps) {
    const itemCountChanged = prevProps.columnItems.length !== this.props.columnItems.length;

    if (itemCountChanged && this.focusPreservation) {
      this.restoreFocus();
      this.focusPreservation = null;
    }
  }

  public getSnapshotBeforeUpdate(prevProps: FeedbackColumnProps): null {
    if (prevProps.columnItems.length !== this.props.columnItems.length) {
      this.preserveFocus();
    }
    return null;
  }

  public componentWillUnmount() {
    if (this.columnRef.current) {
      this.columnRef.current.removeEventListener("keydown", this.handleColumnKeyDown);
    }
  }

  private preserveFocus = () => {
    const activeElement = document.activeElement as HTMLElement;

    if (this.columnRef.current && this.columnRef.current.contains(activeElement)) {
      const feedbackCard = activeElement.closest("[data-feedback-item-id]") as HTMLElement;
      const elementId = feedbackCard?.getAttribute("data-feedback-item-id") || activeElement.id;

      this.focusPreservation = {
        elementId: elementId || null,
        selectionStart: null,
        selectionEnd: null,
        isContentEditable: activeElement.isContentEditable,
        cursorPosition: null,
      };

      if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
        const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;
        this.focusPreservation.selectionStart = inputElement.selectionStart;
        this.focusPreservation.selectionEnd = inputElement.selectionEnd;
      } else if (activeElement.isContentEditable) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          this.focusPreservation.cursorPosition = range.startOffset;
        }
      }
    }
  };

  private restoreFocus = () => {
    if (!this.focusPreservation) {
      return;
    }

    setTimeout(() => {
      if (!this.focusPreservation) {
        return;
      }

      let elementToFocus: HTMLElement | null = null;

      if (this.focusPreservation.elementId) {
        const feedbackCard = this.columnRef.current?.querySelector(`[data-feedback-item-id="${this.focusPreservation.elementId}"]`) as HTMLElement;
        if (feedbackCard) {
          elementToFocus = feedbackCard.querySelector('input, textarea, [contenteditable="true"]') as HTMLElement;
          if (!elementToFocus) {
            elementToFocus = feedbackCard;
          }
        }
      }

      if (elementToFocus) {
        elementToFocus.focus();

        if ((elementToFocus.tagName === "INPUT" || elementToFocus.tagName === "TEXTAREA") && this.focusPreservation.selectionStart !== null) {
          const inputElement = elementToFocus as HTMLInputElement | HTMLTextAreaElement;
          inputElement.setSelectionRange(this.focusPreservation.selectionStart, this.focusPreservation.selectionEnd || this.focusPreservation.selectionStart);
        } else if (elementToFocus.isContentEditable && this.focusPreservation.cursorPosition !== null) {
          try {
            const range = document.createRange();
            const selection = window.getSelection();
            if (elementToFocus.firstChild && selection) {
              range.setStart(elementToFocus.firstChild, Math.min(this.focusPreservation.cursorPosition, elementToFocus.firstChild.textContent?.length || 0));
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
  };

  private handleColumnKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable || isAnyModalDialogOpen()) {
      return;
    }

    const visibleItems = this.getVisibleColumnItems();

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        this.navigateItems("prev", visibleItems);
        break;
      case "ArrowDown":
        e.preventDefault();
        this.navigateItems("next", visibleItems);
        break;
      case "Insert":
        if (this.props.workflowPhase === WorkflowPhase.Collect) {
          e.preventDefault();
          this.createEmptyFeedbackItem();
        }
        break;
      case "e":
      case "E":
        if (this.props.showColumnEditButton) {
          e.preventDefault();
          this.openEditDialog();
        }
        break;
    }
  };

  private getVisibleColumnItems = (): IColumnItem[] => {
    return this.props.columnItems.filter(item => !item.feedbackItem.parentFeedbackItemId);
  };

  private navigateItems = (direction: "next" | "prev", visibleItems: IColumnItem[]) => {
    if (visibleItems.length === 0) {
      return;
    }

    let newIndex = this.state.focusedItemIndex;

    switch (direction) {
      case "next":
        newIndex = this.state.focusedItemIndex < 0 ? 0 : Math.min(this.state.focusedItemIndex + 1, visibleItems.length - 1);
        break;
      case "prev":
        newIndex = this.state.focusedItemIndex < 0 ? -1 : this.state.focusedItemIndex <= 0 ? 0 : this.state.focusedItemIndex - 1;
        break;
    }

    if (newIndex < 0) {
      return;
    }

    this.setState({ focusedItemIndex: newIndex });
    const itemId = visibleItems[newIndex]?.feedbackItem.id;
    if (itemId) {
      const itemElement = this.itemRefs.get(itemId);
      if (itemElement) {
        itemElement.focus();
      }
    }
  };

  public navigateByKeyboard = (direction: "next" | "prev") => {
    const visibleItems = this.getVisibleColumnItems();
    this.navigateItems(direction, visibleItems);
  };

  public focusColumn = () => {
    if (this.columnRef.current) {
      this.columnRef.current.focus();

      const visibleItems = this.getVisibleColumnItems();
      if (visibleItems.length > 0) {
        this.setState({ focusedItemIndex: 0 });
        const firstItemId = visibleItems[0].feedbackItem.id;
        const itemElement = this.itemRefs.get(firstItemId);
        if (itemElement) {
          itemElement.focus();
        }
      }
    }
  };

  public registerItemRef = (itemId: string, element: HTMLElement | null) => {
    if (element) {
      this.itemRefs.set(itemId, element);
    } else {
      this.itemRefs.delete(itemId);
    }
  };

  public createEmptyFeedbackItem = () => {
    if (this.props.workflowPhase !== WorkflowPhase.Collect) return;

    const item = this.props.columnItems.find(x => x.feedbackItem.id === "emptyFeedbackItem");
    if (item) {
      return;
    }

    const userIdentity = getUserIdentity();
    const feedbackItem: IFeedbackItemDocument = {
      boardId: this.props.boardId,
      columnId: this.props.columnId,
      originalColumnId: this.props.columnId,
      createdBy: this.props.isBoardAnonymous ? null : userIdentity,
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

    this.props.addFeedbackItems(this.props.columnId, [feedbackItem], /*shouldBroadcast*/ false, /*newlyCreated*/ true, /*showAddedAnimation*/ false, /*shouldHaveFocus*/ false, /*hideFeedbackItems*/ false);
  };

  public dragFeedbackItemOverColumn = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  // Handle unlinking/ungrouping workitems and reload any updated items.
  private readonly handleDropFeedbackItemOnColumnSpace = async () => {
    // Using localStorage as a temporary solution for Edge issue
    // Bug 19016440: Edge drag and drop dataTransfer protocol is bugged
    // const draggedItemId = e.dataTransfer.getData('id');
    const droppedItemId = localStorageHelper.getIdValue();

    await FeedbackColumn.moveFeedbackItem(this.props.refreshFeedbackItems, this.props.boardId, droppedItemId, this.props.columnId);
  };

  private readonly openEditDialog = () => {
    this.setState(
      (state, props) => ({
        columnNotesDraft: props.columnNotes,
      }),
      () => {
        this.editColumnNotesDialogRef.current?.showModal();
      },
    );
  };

  private readonly handleColumnNotesDraftChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    const value = newValue ?? target?.value ?? "";
    this.setState({ columnNotesDraft: value });
  };

  private readonly saveColumnNotes = () => {
    this.props.onColumnNotesChange(this.state.columnNotesDraft);
    this.editColumnNotesDialogRef.current?.close();
  };

  public static readonly moveFeedbackItem = async (refreshFeedbackItems: (feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean) => void, boardId: string, feedbackItemId: string, columnId: string) => {
    const updatedFeedbackItems = await itemDataService.addFeedbackItemAsMainItemToColumn(boardId, feedbackItemId, columnId);

    refreshFeedbackItems(
      [updatedFeedbackItems.updatedOldParentFeedbackItem, updatedFeedbackItems.updatedFeedbackItem, ...updatedFeedbackItems.updatedChildFeedbackItems].filter(item => item),
      true,
    );

    appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemUngrouped, properties: { boardId, feedbackItemId, columnId } });
  };

  public static readonly createFeedbackItemProps = (columnProps: FeedbackColumnProps, columnItem: IColumnItem): IFeedbackItemProps => {
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
      moveFeedbackItem: FeedbackColumn.moveFeedbackItem,
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

  private readonly renderFeedbackItems = () => {
    const sourceColumnItems: IColumnItem[] = this.props.columnItems || [];
    let columnItems: IColumnItem[] = sourceColumnItems;

    // Sort by grouped total votes if Act workflow else sort by created date
    if (this.props.workflowPhase === WorkflowPhase.Act) {
      columnItems = itemDataService.sortItemsByVotesAndDate(columnItems, this.props.columnItems);
    } else {
      columnItems = columnItems.sort((item1, item2) => new Date(item2.feedbackItem.createdDate).getTime() - new Date(item1.feedbackItem.createdDate).getTime());
    }

    columnItems = columnItems || [];

    return columnItems
      .filter(columnItem => !columnItem.feedbackItem.parentFeedbackItemId) // Exclude child items
      .map(columnItem => {
        const feedbackItemProps = FeedbackColumn.createFeedbackItemProps(this.props, columnItem);

        if (columnItem.feedbackItem.childFeedbackItemIds?.length) {
          const childItemsToGroup = sourceColumnItems.filter(childColumnItem => columnItem.feedbackItem.childFeedbackItemIds.some(childId => childId === childColumnItem.feedbackItem.id)).map(childColumnItem => FeedbackColumn.createFeedbackItemProps(this.props, childColumnItem));

          return <FeedbackItemGroup key={feedbackItemProps.id} mainFeedbackItem={feedbackItemProps} groupedWorkItems={childItemsToGroup} workflowState={this.props.workflowPhase} />;
        } else {
          return <FeedbackItem key={feedbackItemProps.id} {...feedbackItemProps} />;
        }
      });
  };

  public render() {
    const columnItems = this.props.columnItems || [];

    return (
      <div ref={this.columnRef} className="feedback-column" role="region" aria-label={`${this.props.columnName} column with ${columnItems.length} feedback items`} tabIndex={0} onDoubleClick={this.createEmptyFeedbackItem} onDrop={this.handleDropFeedbackItemOnColumnSpace} onDragOver={this.dragFeedbackItemOverColumn}>
        <div className="feedback-column-header">
          <div className="feedback-column-title" aria-label={`${this.props.columnName} (${columnItems.length} feedback items)`}>
            <div className="feedback-column-icon">{this.props.icon}</div>
            <h2 className="feedback-column-name">{this.props.columnName}</h2>
          </div>
          <div className="feedback-column-actions">
            {this.props.showColumnEditButton && (
              <button className="feedback-column-edit-button" title="Edit column notes" aria-label={`Edit column ${this.props.columnName}`} onClick={this.openEditDialog}>
                {getIconElement("reviews")}
              </button>
            )}
            {this.props.columnNotes && (
              <button className="feedback-column-info-button" title={this.props.columnNotes} aria-label={`Column notes: ${this.props.columnNotes}`}>
                {getIconElement("info")}
              </button>
            )}
          </div>
        </div>
        <div className={cn("feedback-column-content", this.state.isCollapsed && "hide-collapse")}>
          {this.props.workflowPhase === WorkflowPhase.Collect && (
            <button className="create-button" title="Add new feedback" aria-label="Add new feedback" onClick={this.createEmptyFeedbackItem}>
              {getIconElement("add")}
              Add new feedback
            </button>
          )}
          {this.props.isDataLoaded && <div className={cn("feedback-items-container", this.props.workflowPhase === WorkflowPhase.Act && "feedback-items-actions")}>{this.renderFeedbackItems()}</div>}
        </div>
        <dialog ref={this.editColumnNotesDialogRef} className="edit-column-notes-dialog" role="dialog" aria-label="Edit column notes">
          <div className="header">
            <h2 className="title">Edit column notes</h2>
            <button type="button" onClick={() => this.editColumnNotesDialogRef.current?.close()} aria-label="Close">
              {getIconElement("close")}
            </button>
          </div>
          <div className="subText">
            <div className="form-group">
              <label id="column-notes-label" htmlFor="column-notes-textarea">
                Column notes
              </label>
              <textarea id="column-notes-textarea" aria-labelledby="column-notes-label" aria-invalid="false" value={this.state.columnNotesDraft} onChange={this.handleColumnNotesDraftChange} />
            </div>
          </div>
          <div className="inner">
            <button type="button" className="button" onClick={this.saveColumnNotes}>
              Save
            </button>
            <button type="button" className="button default" onClick={() => this.editColumnNotesDialogRef.current?.close()}>
              Cancel
            </button>
          </div>
        </dialog>
      </div>
    );
  }
}
