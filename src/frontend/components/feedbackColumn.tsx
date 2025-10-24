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
}

export default class FeedbackColumn extends React.Component<FeedbackColumnProps, FeedbackColumnState> {
  private createFeedbackButton: IButton;

  constructor(props: FeedbackColumnProps) {
    super(props);
    this.state = {
      isCarouselHidden: true,
      isCollapsed: false,
      isEditDialogOpen: false,
      isInfoDialogOpen: false,
      columnNotesDraft: "",
    };
  }

  public componentDidUpdate() {
    this.props.shouldFocusOnCreateFeedback && this.createFeedbackButton && this.createFeedbackButton.focus();
  }

  public componentDidMount() {
    this.props.shouldFocusOnCreateFeedback && this.createFeedbackButton && this.createFeedbackButton.focus();
  }

  public createEmptyFeedbackItem = () => {
    if (this.props.workflowPhase !== WorkflowPhase.Collect) return;

    const item = this.props.columnItems.find(x => x.feedbackItem.id === "emptyFeedbackItem");
    if (item) {
      // Don't create another empty feedback item if one already exists.
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
      timerstate: false,
      timerId: null,
      groupIds: [],
      isGroupedCarouselItem: false,
    };

    this.props.addFeedbackItems(this.props.columnId, [feedbackItem], /*shouldBroadcast*/ false, /*newlyCreated*/ true, /*showAddedAnimation*/ false, /*shouldHaveFocus*/ false, /*hideFeedbackItems*/ false);
  };

  public dragFeedbackItemOverColumn = (e: React.DragEvent<HTMLDivElement>) => {
    // Can't check what item is being dragged, so always allow.
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

  public static readonly createFeedbackItemProps = (columnProps: FeedbackColumnProps, columnItem: IColumnItem, isInteractable: boolean): IFeedbackItemProps => {
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
      timerState: columnItem.feedbackItem.timerstate,
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
      isInteractable: isInteractable,
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
        const feedbackItemProps = FeedbackColumn.createFeedbackItemProps(this.props, columnItem, true);

        if (columnItem.feedbackItem.childFeedbackItemIds?.length) {
          const childItemsToGroup = this.props.columnItems.filter(childColumnItem => columnItem.feedbackItem.childFeedbackItemIds.some(childId => childId === childColumnItem.feedbackItem.id)).map(childColumnItem => FeedbackColumn.createFeedbackItemProps(this.props, childColumnItem, true));

          return <FeedbackItemGroup key={feedbackItemProps.id} mainFeedbackItem={feedbackItemProps} groupedWorkItems={childItemsToGroup} workflowState={this.props.workflowPhase} />;
        } else {
          return <FeedbackItem key={feedbackItemProps.id} {...feedbackItemProps} />;
        }
      });
  };

  public render() {
    return (
      <div className="feedback-column" role="application" onDoubleClick={this.createEmptyFeedbackItem} onDrop={this.handleDropFeedbackItemOnColumnSpace} onDragOver={this.dragFeedbackItemOverColumn}>
        <div className="feedback-column-header">
          <div className="feedback-column-title" aria-label={`${this.props.columnName} (${this.props.columnItems.length} feedback items)`}>
            <i className={cn(this.props.iconClass, "feedback-column-icon")} />
            <h2 className="feedback-column-name">{this.props.columnName}</h2>
          </div>
          <div className="feedback-column-actions">
            {this.props.showColumnEditButton && (
              <IconButton
                className="feedback-column-edit-button"
                iconProps={{ iconName: "Edit" }}
                title="Edit column notes"
                aria-label={`Edit column ${this.props.columnName}`}
                onClick={this.openEditDialog}
              />
            )}
            <IconButton
              className="feedback-column-info-button"
              iconProps={{ iconName: "Info" }}
              title="View column notes"
              aria-label={`View notes for ${this.props.columnName}`}
              onClick={this.openInfoDialog}
            />
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
