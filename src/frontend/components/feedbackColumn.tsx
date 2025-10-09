import React from "react";
import classNames from "classnames";
import { WorkflowPhase } from "../interfaces/workItem";
import { IFeedbackItemDocument } from "../interfaces/feedback";
import { itemDataService } from "../dal/itemDataService";
import FeedbackItem, { IFeedbackItemProps } from "./feedbackItem";
import FeedbackItemGroup from "./feedbackItemGroup";
import { IColumnItem, IColumn } from "./feedbackBoard";
import localStorageHelper from "../utilities/localStorageHelper";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { ActionButton, IButton } from "@fluentui/react/lib/Button";
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

  addFeedbackItems: (columnId: string, columnItems: IFeedbackItemDocument[], shouldBroadcast: boolean, newlyCreated: boolean, showAddedAnimation: boolean, shouldHaveFocus: boolean, hideFeedbackItems: boolean) => void;
  removeFeedbackItemFromColumn: (columnIdToDeleteFrom: string, feedbackItemIdToDelete: string, shouldSetFocusOnFirstAvailableItem: boolean) => void;
  refreshFeedbackItems: (feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean) => void;
}

export interface FeedbackColumnState {
  isCollapsed: boolean;
  isCarouselHidden: boolean;
}

export default class FeedbackColumn extends React.Component<FeedbackColumnProps, FeedbackColumnState> {
  private createFeedbackButton: IButton;

  constructor(props: FeedbackColumnProps) {
    super(props);
    this.state = {
      isCarouselHidden: true,
      isCollapsed: false,
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
            <i className={classNames(this.props.iconClass, "feedback-column-icon")} />
            <h2 className="feedback-column-name">{this.props.columnName}</h2>
          </div>
        </div>
        <div className={classNames("feedback-column-content", { "hide-collapse": this.state.isCollapsed })}>
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
          {this.props.isDataLoaded && <div className={classNames("feedback-items-container", { "feedback-items-actions": this.props.workflowPhase === WorkflowPhase.Act })}>{this.renderFeedbackItems()}</div>}
        </div>
      </div>
    );
  }
}
