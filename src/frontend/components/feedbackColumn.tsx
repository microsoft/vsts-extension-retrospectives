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
import { ActionButton, IconButton, IButton, PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";
import { Dialog, DialogFooter, DialogType } from "@fluentui/react/lib/Dialog";
import { TextField } from "@fluentui/react/lib/TextField";
import { getUserIdentity } from "../utilities/userIdentityHelper";
import { WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { appInsights, TelemetryEvents } from "../utilities/telemetryClient";

export interface FeedbackColumnProps {
  columns: { [id: string]: IColumn };
  columnIds: string[];

  columnName: string;
  columnId: string;
  accentColor: string;
  iconClass: string;
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

  addFeedbackItems: (columnId: string, columnItems: IFeedbackItemDocument[], shouldBroadcast: boolean, newlyCreated: boolean, showAddedAnimation: boolean, shouldHaveFocus: boolean, hideFeedbackItems: boolean) => void;
  removeFeedbackItemFromColumn: (columnIdToDeleteFrom: string, feedbackItemIdToDelete: string, shouldSetFocusOnFirstAvailableItem: boolean) => void;
  refreshFeedbackItems: (feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean) => void;
}

export interface FeedbackColumnState {
  isCollapsed: boolean;
  isCarouselHidden: boolean;
  isEditDialogOpen: boolean;
  isInfoDialogOpen: boolean;
  columnNotesDraft: string;
  focusedItemIndex: number;
}

export default class FeedbackColumn extends React.Component<FeedbackColumnProps, FeedbackColumnState> {
  private createFeedbackButton: IButton;
  private columnRef: React.RefObject<HTMLDivElement> = React.createRef();
  private itemRefs: Map<string, HTMLElement> = new Map();
  private previousItemCount: number = 0;
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
      isEditDialogOpen: false,
      isInfoDialogOpen: false,
      columnNotesDraft: "",
      focusedItemIndex: -1,
    };
  }

  public componentDidMount() {
    this.props.shouldFocusOnCreateFeedback && this.createFeedbackButton && this.createFeedbackButton.focus();

    if (this.columnRef.current) {
      this.columnRef.current.addEventListener("keydown", this.handleColumnKeyDown);
    }

    this.previousItemCount = this.props.columnItems.length;
  }

  public componentDidUpdate(prevProps: FeedbackColumnProps) {
    const itemCountChanged = prevProps.columnItems.length !== this.props.columnItems.length;

    if (itemCountChanged && this.focusPreservation) {
      this.restoreFocus();
      this.focusPreservation = null;
    }

    this.previousItemCount = this.props.columnItems.length;
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
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable || document.querySelector('[role="dialog"]')) {
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
      case "Home":
        e.preventDefault();
        this.navigateItems("first", visibleItems);
        break;
      case "End":
        e.preventDefault();
        this.navigateItems("last", visibleItems);
        break;
      case "n":
      case "N":
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
      case "i":
      case "I":
        e.preventDefault();
        this.openInfoDialog();
        break;
    }
  };

  private getVisibleColumnItems = (): IColumnItem[] => {
    return this.props.columnItems.filter(item => !item.feedbackItem.parentFeedbackItemId);
  };

  private navigateItems = (direction: "next" | "prev" | "first" | "last", visibleItems: IColumnItem[]) => {
    if (visibleItems.length === 0) {
      if (this.props.workflowPhase === WorkflowPhase.Collect && this.createFeedbackButton) {
        this.createFeedbackButton.focus();
      }
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
      case "first":
        newIndex = 0;
        break;
      case "last":
        newIndex = visibleItems.length - 1;
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
      } else if (this.props.workflowPhase === WorkflowPhase.Collect && this.createFeedbackButton) {
        this.createFeedbackButton.focus();
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
    this.setState({
      isEditDialogOpen: true,
      columnNotesDraft: this.props.columnNotes,
    });
  };

  private readonly closeEditDialog = () => {
    this.setState({ isEditDialogOpen: false });
  };

  private readonly openInfoDialog = () => {
    this.setState({ isInfoDialogOpen: true });
  };

  private readonly closeInfoDialog = () => {
    this.setState({ isInfoDialogOpen: false });
  };

  private readonly handleColumnNotesDraftChange = (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    this.setState({ columnNotesDraft: newValue ?? "" });
  };

  private readonly saveColumnNotes = () => {
    this.props.onColumnNotesChange(this.state.columnNotesDraft);
    this.setState({ isEditDialogOpen: false });
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
      iconClass: columnProps.iconClass,
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
    };
  };

  private readonly renderFeedbackItems = () => {
    let columnItems: IColumnItem[] = this.props.columnItems || [];

    // Sort by grouped total votes if Act workflow else sort by created date
    if (this.props.workflowPhase === WorkflowPhase.Act) {
      columnItems = itemDataService.sortItemsByVotesAndDate(columnItems, this.props.columnItems);
    } else {
      columnItems = columnItems.sort((item1, item2) => new Date(item2.feedbackItem.createdDate).getTime() - new Date(item1.feedbackItem.createdDate).getTime());
    }

    return columnItems
      .filter(columnItem => !columnItem.feedbackItem.parentFeedbackItemId) // Exclude child items
      .map(columnItem => {
        const feedbackItemProps = FeedbackColumn.createFeedbackItemProps(this.props, columnItem);

        if (columnItem.feedbackItem.childFeedbackItemIds?.length) {
          const childItemsToGroup = this.props.columnItems.filter(childColumnItem => columnItem.feedbackItem.childFeedbackItemIds.some(childId => childId === childColumnItem.feedbackItem.id)).map(childColumnItem => FeedbackColumn.createFeedbackItemProps(this.props, childColumnItem));

          return <FeedbackItemGroup key={feedbackItemProps.id} mainFeedbackItem={feedbackItemProps} groupedWorkItems={childItemsToGroup} workflowState={this.props.workflowPhase} />;
        } else {
          return <FeedbackItem key={feedbackItemProps.id} {...feedbackItemProps} />;
        }
      });
  };

  public render() {
    return (
      <div ref={this.columnRef} className="feedback-column" role="region" aria-label={`${this.props.columnName} column with ${this.props.columnItems.length} feedback items`} tabIndex={0} onDoubleClick={this.createEmptyFeedbackItem} onDrop={this.handleDropFeedbackItemOnColumnSpace} onDragOver={this.dragFeedbackItemOverColumn}>
        <div className="feedback-column-header">
          <div className="feedback-column-title" aria-label={`${this.props.columnName} (${this.props.columnItems.length} feedback items)`}>
            <i className={cn(this.props.iconClass, "feedback-column-icon")} />
            <h2 className="feedback-column-name">{this.props.columnName}</h2>
          </div>
          <div className="feedback-column-actions">
            {this.props.showColumnEditButton && (
              <button className="feedback-column-edit-button" title="Edit column notes" aria-label={`Edit column ${this.props.columnName}`} onClick={this.openEditDialog}>
                <i className="fas fa-comment-medical"></i>
              </button>
            )}
            <button className="feedback-column-info-button" title="View column notes" aria-label={`View notes for ${this.props.columnName}`} onClick={this.openInfoDialog}>
              <i className="fas fa-circle-info"></i>
            </button>
          </div>
        </div>
        <div className={cn("feedback-column-content", this.state.isCollapsed && "hide-collapse")}>
          {this.props.workflowPhase === WorkflowPhase.Collect && (
            <div className="create-container">
              <ActionButton
                iconProps={{ iconName: "Add" }}
                componentRef={(element: IButton) => {
                  this.createFeedbackButton = element;
                }}
                onClick={this.createEmptyFeedbackItem}
                aria-label="Add new feedback"
                className="create-button"
              >
                Add new feedback
              </ActionButton>
            </div>
          )}
          {this.props.isDataLoaded && <div className={cn("feedback-items-container", this.props.workflowPhase === WorkflowPhase.Act && "feedback-items-actions")}>{this.renderFeedbackItems()}</div>}
        </div>
        <Dialog
          hidden={!this.state.isEditDialogOpen}
          onDismiss={this.closeEditDialog}
          dialogContentProps={{
            type: DialogType.normal,
            title: "Edit column notes",
          }}
          modalProps={{
            isBlocking: false,
            containerClassName: "prime-directive-dialog",
            className: "retrospectives-dialog-modal",
          }}
        >
          <TextField label="Column notes" multiline autoAdjustHeight value={this.state.columnNotesDraft} onChange={this.handleColumnNotesDraftChange} />
          <DialogFooter>
            <PrimaryButton text="Save" onClick={this.saveColumnNotes} />
            <DefaultButton text="Cancel" onClick={this.closeEditDialog} />
          </DialogFooter>
        </Dialog>
        <Dialog
          hidden={!this.state.isInfoDialogOpen}
          onDismiss={this.closeInfoDialog}
          dialogContentProps={{
            type: DialogType.normal,
            title: "Column info",
          }}
          modalProps={{
            isBlocking: false,
            containerClassName: "prime-directive-dialog",
            className: "retrospectives-dialog-modal",
          }}
        >
          <div className="feedback-column-info-dialog-text">{this.props.columnNotes ? this.props.columnNotes : "No notes available for this column."}</div>
          <DialogFooter>
            <DefaultButton text="Close" onClick={this.closeInfoDialog} />
          </DialogFooter>
        </Dialog>
      </div>
    );
  }
}
