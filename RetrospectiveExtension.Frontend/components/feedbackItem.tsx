import React from 'react';
import classNames from 'classnames';
import { ActionButton, PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { DocumentCard, DocumentCardActivity } from 'office-ui-fabric-react/lib/DocumentCard';

import { WorkflowPhase } from '../interfaces/workItem';
import ActionItemDisplay from './actionItemDisplay';
import EditableDocumentCardTitle from './editableDocumentCardTitle';
import { IFeedbackItemDocument } from '../interfaces/feedback';
import { itemDataService } from '../dal/itemDataService';
import { WorkItem, WorkItemType } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';
import localStorageHelper from '../utilities/localStorageHelper';
import { reflectBackendService } from '../dal/reflectBackendService';
import { WebApiTeam } from 'azure-devops-extension-api/Core';
import { IColumn, IColumnItem } from './feedbackBoard';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import FeedbackColumn, { FeedbackColumnProps } from './feedbackColumn';
import { getUserIdentity } from '../utilities/userIdentityHelper';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/telemetryClient';

export interface IFeedbackItemProps {
  id: string;
  title: string;
  columnProps: FeedbackColumnProps;
  columns: { [id: string]: IColumn };
  columnIds: string[];
  createdBy?: string;
  createdByProfileImage?: string;
  lastEditedDate: string;
  createdDate: string;
  upvotes: number;
  accentColor: string;
  iconClass: string;
  workflowPhase: WorkflowPhase;
  team: WebApiTeam;
  originalColumnId: string;
  columnId: string;
  boardId: string;
  boardTitle: string;
  defaultActionItemAreaPath: string;
  defaultActionItemIteration: string;
  actionItems: WorkItem[];
  showAddedAnimation: boolean;
  newlyCreated: boolean;
  groupedItemProps?: IGroupedFeedbackItemProps;
  nonHiddenWorkItemTypes: WorkItemType[];
  allWorkItemTypes: WorkItemType[];
  isInteractable: boolean;
  shouldHaveFocus: boolean;
  hideFeedbackItems: boolean;
  userIdRef: string;
  timerSecs: number;
  timerState: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timerId: any;
  groupCount: number;
  isGroupedCarouselItem: boolean;
  groupTitles: String[];
  isShowingGroupedChildrenTitles: boolean;
  isFocusModalHidden: boolean;
  onVoteCasted: () => void;

  addFeedbackItems: (
    columnId: string,
    columnItems: IFeedbackItemDocument[],
    shouldBroadcast: boolean,
    newlyCreated: boolean,
    showAddedAnimation: boolean,
    shouldHaveFocus: boolean,
    hideFeedbackItems: boolean) => void;

  removeFeedbackItemFromColumn: (columnIdToDeleteFrom: string, feedbackItemIdToDelete: string, shouldSetFocusOnFirstAvailableItem: boolean) => void;

  refreshFeedbackItems: (feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean) => void;

  moveFeedbackItem: (
    refreshFeedbackItems: (feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean) => void,
    boardId: string,
    feedbackItemId: string,
    columnId: string) => void;
}

export interface IGroupedFeedbackItemProps {
  groupedCount: number;
  isGroupExpanded: boolean;
  isMainItem: boolean;
  parentItemId: string;

  setIsGroupBeingDragged: (isBeingDragged: boolean) => void;
  toggleGroupExpand: () => void;
}

export interface IFeedbackItemState {
  isDeleteItemConfirmationDialogHidden: boolean;
  isBeingDragged: boolean;
  isGroupFeedbackItemDialogHidden: boolean;
  isMarkedForDeletion: boolean;
  isLocalDelete: boolean;
  isMobileFeedbackItemActionsDialogHidden: boolean;
  isMoveFeedbackItemDialogHidden: boolean;
  isRemoveFeedbackItemFromGroupConfirmationDialogHidden: boolean;
  isDeletionDisabled: boolean;
  showVotedAnimation: boolean;
  itemElementHeight: number;
  searchedFeedbackItems: IColumnItem[];
  searchTerm: string;
  hideFeedbackItems: boolean;
  userVotes: string;
  isShowingGroupedChildrenTitles: boolean;
}

interface FeedbackItemEllipsisMenuItem {
  menuItem: IContextualMenuItem;
  workflowPhases: WorkflowPhase[];
  hideMobile?: boolean;
  hideMainItem?: boolean;
}

class FeedbackItem extends React.Component<IFeedbackItemProps, IFeedbackItemState> {
  private itemElement: HTMLElement;
  private itemElementRef: (element: HTMLElement) => void;

  constructor(props: IFeedbackItemProps) {
    super(props);
    this.state = {
      hideFeedbackItems: false,
      isBeingDragged: false,
      isDeleteItemConfirmationDialogHidden: true,
      isGroupFeedbackItemDialogHidden: true,
      isLocalDelete: false,
      isMarkedForDeletion: false,
      isMobileFeedbackItemActionsDialogHidden: true,
      isMoveFeedbackItemDialogHidden: true,
      isRemoveFeedbackItemFromGroupConfirmationDialogHidden: true,
      isDeletionDisabled: false,
      itemElementHeight: 0,
      searchTerm: '',
      searchedFeedbackItems: [],
      showVotedAnimation: false,
      userVotes: "0",
      isShowingGroupedChildrenTitles: false
    };

    this.itemElement = null;
    this.itemElementRef = (element: HTMLElement) => this.itemElement = element;
  }

  public async componentDidMount() {
    await this.isVoted(this.props.id);
    await this.setDisabledFeedbackItemDeletion(this.props.boardId, this.props.id);

    reflectBackendService.onReceiveDeletedItem(this.receiveDeletedItemHandler);
    this.props.shouldHaveFocus && this.itemElement && this.itemElement.focus();
  }

  public componentWillUnmount() {
    reflectBackendService.removeOnReceiveDeletedItem(this.receiveDeletedItemHandler);
  }

  private receiveDeletedItemHandler = async (columnId: string, feedbackItemId: string) => {
    if (feedbackItemId === this.props.id && !this.state.isMarkedForDeletion) {
      this.markFeedbackItemForDelete();
    }
  }

  public componentDidUpdate() {
    this.props.shouldHaveFocus && this.itemElement && this.itemElement.focus();
  }

  private deleteFeedbackItem = () => {
    this.showDeleteItemConfirmationDialog();
  }

  private dragFeedbackItemOverFeedbackItem = (e: React.DragEvent<HTMLDivElement>) => {
    // Allow if item being dragged is not this item.
    if (!this.state.isBeingDragged) {
      e.preventDefault();
    }
    e.stopPropagation();
    e.dataTransfer.dropEffect = "link";
  }

  private dragFeedbackItemStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (this.props.groupedItemProps) {
      this.props.groupedItemProps.setIsGroupBeingDragged(true);
    }
    e.dataTransfer.effectAllowed = "linkMove";
    // Using localStorage as a temporary solution for Edge issue
    // Bug 19016440: Edge drag and drop dataTransfer protocol is bugged
    e.dataTransfer.setData('foo', 'bar'); // Required for firefox drag and drop
    localStorageHelper.setIdValue(this.props.id);
    this.setState({ isBeingDragged: true });
  }

  private dragFeedbackItemEnd = () => {
    if (this.props.groupedItemProps) {
      this.props.groupedItemProps.setIsGroupBeingDragged(false);
    }
    this.setState({ isBeingDragged: false });
  }

  private dropFeedbackItemOnFeedbackItem = async (e: React.DragEvent<HTMLDivElement>) => {
    // Using localStorage as a temporary solution for Edge issue
    // Bug 19016440: Edge drag and drop dataTransfer protocol is bugged
    // const droppedItemId = e.dataTransfer.getData('id');
    const droppedItemId = localStorageHelper.getIdValue();

    if (this.props.id !== droppedItemId) {
      FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(this.props, droppedItemId, this.props.id);
    }

    e.stopPropagation();
  }

  private onDocumentCardTitleSave = async (newTitle: string) => {
    this.onFeedbackItemDocumentCardTitleSave(this.props.id, newTitle, this.props.newlyCreated);

    if (this.itemElement) {
      this.itemElement.focus();
    }
  }

  private showDeleteItemConfirmationDialog = () => {
    this.setState({
      isDeleteItemConfirmationDialogHidden: false,
    });
  }

  private hideDeleteItemConfirmationDialog = () => {
    this.setState({
      isDeleteItemConfirmationDialogHidden: true,
    });
  }

  private showRemoveFeedbackItemFromGroupConfirmationDialog = () => {
    this.setState({
      isRemoveFeedbackItemFromGroupConfirmationDialogHidden: false,
    });
  }

  private hideRemoveFeedbackItemFromGroupConfirmationDialog = () => {
    this.setState({
      isRemoveFeedbackItemFromGroupConfirmationDialogHidden: true,
    });
  }

  private onConfirmRemoveFeedbackItemFromGroup = async () => {
    await this.props.moveFeedbackItem(
      this.props.refreshFeedbackItems,
      this.props.boardId,
      this.props.id,
      this.props.columnId
    );

    this.hideRemoveFeedbackItemFromGroupConfirmationDialog();
  }

  private setDisabledFeedbackItemDeletion = async (boardId: string, id: string) => {
    const feedbackItem = await itemDataService.getFeedbackItem(boardId, id);
    if (feedbackItem) {
      this.setState({ isDeletionDisabled: feedbackItem.upvotes > 0 });
    }
  }

  private onConfirmDeleteFeedbackItem = async () => {
    this.markFeedbackItemForDelete(true);
    await this.initiateDeleteFeedbackItem();
  }

  private markFeedbackItemForDelete = (isLocalDelete: boolean = false) => {
    if (this.props.groupedItemProps && this.props.groupedItemProps.isMainItem && this.props.groupedItemProps.isGroupExpanded) {
      this.props.groupedItemProps.toggleGroupExpand();
    }

    this.setState({
      isDeleteItemConfirmationDialogHidden: true,
      isMarkedForDeletion: true,
      isLocalDelete,
    });
  }

  private initiateDeleteFeedbackItem = async () => {
    // if the card is newly created (not stored in extension storage yet), simply remove the card from UI
    if (this.props.newlyCreated) {
      this.removeFeedbackItem(this.props.id);
      return;
    }

    const updatedItems = await itemDataService.deleteFeedbackItem(this.props.boardId, this.props.id);
    // TODO (enpolat) : appInsightsClient.trackEvent(TelemetryEvents.FeedbackItemDeleted);
    reflectBackendService.broadcastDeletedItem(
      'dummyColumn',
      this.props.id,
    );
    if (updatedItems.updatedChildFeedbackItems) {
      // Only refresh the child items here at this point
      this.props.refreshFeedbackItems(
        updatedItems.updatedChildFeedbackItems.filter(item => item),
        true
      );
    }
  }

  private onAnimationEnd = async () => {
    if (this.state.isMarkedForDeletion) {
      this.state.isLocalDelete && this.removeFeedbackItem(this.props.id, true);
      !this.state.isLocalDelete && this.removeFeedbackItem(this.props.id, false);

      if (this.props.groupedItemProps && !this.props.groupedItemProps.isMainItem) {
        // if the item that is getting deleted is a child item, refresh and broadcast an update of the parent
        const updatedItem = await itemDataService.getFeedbackItem(this.props.boardId, this.props.groupedItemProps.parentItemId);
        this.props.refreshFeedbackItems([updatedItem], true);
      }
    }
  }

  private showMobileFeedbackItemActionsDialog = () => {
    this.setState({
      isMobileFeedbackItemActionsDialogHidden: false,
    });
  }

  private hideMobileFeedbackItemActionsDialog = () => {
    this.setState({
      isMobileFeedbackItemActionsDialogHidden: true,
    });
  }

  private showMoveFeedbackItemDialog = () => {
    this.setState({
      isMoveFeedbackItemDialogHidden: false,
    });
  }

  private hideMoveFeedbackItemDialog = () => {
    this.setState({
      isMoveFeedbackItemDialogHidden: true,
    });
  }

  private showGroupFeedbackItemDialog = () => {
    this.setState({
      isGroupFeedbackItemDialogHidden: false,
    });
  }

  private hideGroupFeedbackItemDialog = () => {
    this.setState({
      isGroupFeedbackItemDialogHidden: true,
      searchedFeedbackItems: [],
      searchTerm: '',
    });
  }

  private toggleShowGroupedChildrenTitles = () => {
    this.setState((previousState) => ({ isShowingGroupedChildrenTitles: !previousState.isShowingGroupedChildrenTitles }))
  }

  private readonly feedbackItemEllipsisMenuItems: FeedbackItemEllipsisMenuItem[] = [
    {
      menuItem: {
        key: 'deleteFeedback',
        iconProps: { iconName: 'Delete' },
        onClick: this.deleteFeedbackItem,
        text: 'Delete feedback',
        title: 'Delete feedback (disabled when there are active votes)',
      },
      workflowPhases: [WorkflowPhase.Collect, WorkflowPhase.Group, WorkflowPhase.Vote, WorkflowPhase.Act],
    },
    {
      menuItem: {
        key: 'moveFeedback',
        iconProps: { iconName: 'Move' },
        onClick: this.showMoveFeedbackItemDialog,
        text: 'Move feedback to different column',
        title: 'Move feedback to different column',
      },
      workflowPhases: [WorkflowPhase.Group],
      hideMobile: true,
    },
    {
      menuItem: {
        key: 'groupFeedback',
        iconProps: { iconName: 'RowsGroup' },
        onClick: this.showGroupFeedbackItemDialog,
        text: 'Group feedback',
        title: 'Group feedback',
      },
      workflowPhases: [WorkflowPhase.Group],
      hideMobile: true,
    },
    {
      menuItem: {
        key: 'removeFeedbackFromGroup',
        iconProps: { iconName: 'Remove' },
        onClick: this.showRemoveFeedbackItemFromGroupConfirmationDialog,
        text: 'Remove feedback from group',
        title: 'Remove feedback from group',
      },
      workflowPhases: [WorkflowPhase.Group],
      hideMobile: true,
      hideMainItem: true,
    },
  ];

  private onVote = async (feedbackItemId: string, decrement: boolean = false) => {
    const updatedFeedbackItem = await itemDataService.updateVote(this.props.boardId, this.props.team.id, getUserIdentity().id, feedbackItemId, decrement);
    // TODO (enpolat) : appInsightsClient.trackEvent(TelemetryEvents.FeedbackItemUpvoted);

    if (updatedFeedbackItem) {
      await this.isVoted(this.props.id);
      this.props.refreshFeedbackItems([updatedFeedbackItem], true);
      await this.setDisabledFeedbackItemDeletion(this.props.boardId, this.props.id);
    } else {
      // TODO: Show pop-up indicating voting failed. This can be a common scenario due to race condition.
    }
  }

  private timerSwich = async (feedbackItemId: string) => {
    let updatedFeedbackItem;
    const boardId: string = this.props.boardId;

    // function to handle timer count update
    const incTimer = async () => {
      if (this.props.timerState === true) {
        updatedFeedbackItem = await itemDataService.updateTimer(boardId, feedbackItemId);
        if (updatedFeedbackItem) {

          this.props.refreshFeedbackItems([updatedFeedbackItem], true);
        } else {
          // TODO: Show pop-up indicating timer count update failed.
        }
      }
    }

    // flip the timer and start/stop count
    if (!this.props.timerState) {
      updatedFeedbackItem = await itemDataService.updateTimer(boardId, feedbackItemId, true);
      if (updatedFeedbackItem) {
        this.props.refreshFeedbackItems([updatedFeedbackItem], true);
      } else {
        // TODO: Show pop-up indicating timer count update failed.
      }
      if (this.props.timerId == null) {
        const tid = setInterval(incTimer, 1000);
        updatedFeedbackItem = await itemDataService.flipTimer(boardId, feedbackItemId, tid);
        if (updatedFeedbackItem) {
          this.props.refreshFeedbackItems([updatedFeedbackItem], true);
        } else {
          // TODO: Show pop-up indicating timer could not be flipped.
        }
      } else {
        updatedFeedbackItem = await itemDataService.flipTimer(boardId, feedbackItemId, this.props.timerId);
        if (updatedFeedbackItem) {
          this.props.refreshFeedbackItems([updatedFeedbackItem], true);
        } else {
          // TODO: Show pop-up indicating timer could not be flipped.
        }
      }
    } else {
      clearInterval(this.props.timerId);
      updatedFeedbackItem = await itemDataService.flipTimer(boardId, feedbackItemId, null);
      if (updatedFeedbackItem) {
        this.props.refreshFeedbackItems([updatedFeedbackItem], true);
      } else {
        // TODO: Show pop-up indicating timer could not be flipped.
      }
    }
  }

  private isVoted = async (
    feedbackItemId: string) => {
    itemDataService.isVoted(this.props.boardId, getUserIdentity().id, feedbackItemId).then(result => {
      this.setState({ userVotes: result });
    })
  }

  private removeFeedbackItem = (
    feedbackItemIdToDelete: string, shouldSetFocusOnFirstAvailableItem: boolean = false) => {
    this.props.removeFeedbackItemFromColumn(
      this.props.columnId, feedbackItemIdToDelete, shouldSetFocusOnFirstAvailableItem);
  }

  private onFeedbackItemDocumentCardTitleSave = async (
    feedbackItemId: string, newTitle: string, newlyCreated: boolean) => {
    if (!newTitle.trim()) {
      if (newlyCreated) {
        this.removeFeedbackItem(feedbackItemId);
      }
      return;
    }

    if (newlyCreated) {
      const newFeedbackItem = await itemDataService.createItemForBoard(
        this.props.boardId, newTitle, this.props.columnId, !this.props.createdBy);
      // TODO (enpolat) : appInsightsClient.trackEvent(TelemetryEvents.FeedbackItemCreated);

      // Replace empty card UI with populated feedback item
      this.removeFeedbackItem(feedbackItemId);

      this.props.addFeedbackItems(
        this.props.columnId,
        [newFeedbackItem],
        /*shouldBroadcast*/ true,
        /*newlyCreated*/ false,
        /*showAddedAnimation*/ false,
        /*shouldHaveFocus*/ true,
        /*hideFeedbackItems*/ false);

      return;
    }

    const updatedFeedbackItem = await itemDataService.updateTitle(this.props.boardId, feedbackItemId, newTitle);
    // TODO (enpolat) : appInsightsClient.trackEvent(TelemetryEvents.FeedbackItemTitleEdited);

    if (updatedFeedbackItem) {
      this.props.refreshFeedbackItems([updatedFeedbackItem], true);
    } else {
      // TODO: Show pop-up indicating title update failed. This can be a common scenario due to race condition.
    }
  }

  private onUpdateActionItem = async (updatedFeedbackItem: IFeedbackItemDocument) => {
    if (updatedFeedbackItem) {
      this.props.refreshFeedbackItems([updatedFeedbackItem], true);
    } else {
      // TODO: Show pop-up indicating that a change related to work item(s) failed. This can be a common scenario due to race condition.
    }
  }

  private handleFeedbackItemSearchInputChange = async (event?: React.ChangeEvent<HTMLInputElement>, searchTerm?: string) => {
    if (!searchTerm || !searchTerm.trim()) {
      this.setState({ searchTerm: searchTerm, searchedFeedbackItems: [] });
      return;
    }

    const trimmedSearchTerm = searchTerm.trim();

    const searchedFeedbackItems = this.props.columns[this.props.columnId].columnItems
      .filter((columnItem) => columnItem.feedbackItem.title.toLocaleLowerCase().includes(
        trimmedSearchTerm.toLocaleLowerCase()))
      .filter((columnItem) => !columnItem.feedbackItem.parentFeedbackItemId &&
        columnItem.feedbackItem.id !== this.props.id);

    this.setState({
      searchTerm: searchTerm,
      searchedFeedbackItems: searchedFeedbackItems,
    });
  }

  private clickSearchedFeedbackItem = (event: React.MouseEvent<HTMLDivElement>, feedbackItemProps: IFeedbackItemProps) => {
    event.stopPropagation();
    FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(
      feedbackItemProps,
      this.props.id,
      feedbackItemProps.id
    );

    this.hideGroupFeedbackItemDialog();
  }

  private pressSearchedFeedbackItem = (event: React.KeyboardEvent<HTMLDivElement>, feedbackItemProps: IFeedbackItemProps) => {
    event.stopPropagation();

    // Enter
    if (event.keyCode === 13) {
      FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(
        feedbackItemProps,
        this.props.id,
        feedbackItemProps.id
      );
      this.hideGroupFeedbackItemDialog();
    }

    // ESC
    if (event.keyCode === 27) {
      this.hideGroupFeedbackItemDialog();
    }
  }

  private feedbackCreationInformationContent = () => {
    if (!this.props.createdBy) {
      return (
        <div className="anonymous-created-date">
          {new Intl.DateTimeFormat("default", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" }).format(new Date(this.props.createdDate))}
        </div>
      );
    }

    return (<DocumentCardActivity
      activity={new Intl.DateTimeFormat("default", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" }).format(new Date(this.props.createdDate))}
      people={[{
        name: this.props.createdBy,
        profileImageSrc: this.props.createdByProfileImage,
      }]}
    />);
  };

  public formatTimer = (timeInSeconds: number) => {
    // Handle the timer display - total seconds into 00:00
    // Doesn't handle formatting hours since that may be excessive
    const timerMinutes = Math.floor(timeInSeconds / 60);
    const timerSeconds = timeInSeconds % 60;
    const showLeadingZeroInSeconds = timerSeconds < 10;
    return showLeadingZeroInSeconds ? (timerMinutes + ':0' + timerSeconds) : (timerMinutes + ':' + timerSeconds);
  }

  public render(): JSX.Element {
    const showVoteButton = (this.props.workflowPhase === WorkflowPhase.Vote);
    const showAddActionItem = (this.props.workflowPhase === WorkflowPhase.Act);
    const showVotes = showVoteButton || showAddActionItem;
    const isDraggable = this.props.isInteractable && this.props.workflowPhase === WorkflowPhase.Group && !this.state.isMarkedForDeletion;
    const isNotGroupedItem = !this.props.groupedItemProps;
    const isMainItem = isNotGroupedItem || this.props.groupedItemProps.isMainItem;
    const isGroupedCarouselItem = this.props.isGroupedCarouselItem;
    const groupItemsCount = this.props && this.props.groupedItemProps && this.props.groupedItemProps.groupedCount + 1;
    const ariaLabel = isNotGroupedItem ? 'Feedback item.' : (!isMainItem ? 'Feedback group item.' : 'Feedback group main item. Group has ' + groupItemsCount + ' items.');
    const hideFeedbackItems = this.props.hideFeedbackItems && (this.props.userIdRef !== getUserIdentity().id);
    const curTimerState = this.props.timerState;
    const originalColumnId = this.props.originalColumnId;
    const originalColumnTitle = originalColumnId ? this.props.columns[originalColumnId].columnProperties.title : 'n/a';
    // showing `n/a` will be for older boards who don't have this property
    const childrenTitlesShort = this.props.groupTitles;
    const isFocusModalHidden = this.props.isFocusModalHidden;

    return (
      <div
        ref={this.itemElementRef}
        tabIndex={0}
        aria-live="polite"
        aria-label={ariaLabel}
        className={classNames({
          feedbackItem: isNotGroupedItem,
          feedbackItemGroupItem: !isNotGroupedItem,
          feedbackItemGroupGroupedItem: !isNotGroupedItem && !isMainItem,
          newFeedbackItem: this.props.showAddedAnimation,
          removeFeedbackItem: this.state.isMarkedForDeletion,
          hideFeedbackItem: hideFeedbackItems,
        })}
        draggable={isDraggable}
        onDragStart={this.dragFeedbackItemStart}
        onDragOver={isNotGroupedItem ? this.dragFeedbackItemOverFeedbackItem : null}
        onDragEnd={this.dragFeedbackItemEnd}
        onDrop={isNotGroupedItem ? this.dropFeedbackItemOnFeedbackItem : null}
        onAnimationEnd={this.onAnimationEnd}>
        <div className="document-card-wrapper">
          <DocumentCard className={classNames({
            mainItemCard: isMainItem,
            groupedItemCard: !isMainItem,
          })}>
            <div
              className="card-integral-part"
              style={{
                borderLeftColor: this.props.accentColor
              }}>
              <div className="card-header">
                {
                  // This controls the top-level feedback item in the action phase on the carousel
                  isGroupedCarouselItem && isMainItem && showAddActionItem && !isFocusModalHidden &&
                  <button className="feedback-expand-group-focus"
                    aria-live="polite"
                    aria-label={this.props.groupedItemProps
                      && !this.props.groupedItemProps.isGroupExpanded
                      ? 'Expand Feedback Group button. Group has ' + groupItemsCount + ' items.'
                      : 'Collapse Feedback Group button. Group has ' + groupItemsCount + ' items.'}
                    onClick={(e) => {
                      e.stopPropagation();
                      this.toggleShowGroupedChildrenTitles();
                    }}>
                    <i className={classNames('fa', {
                      'fa-angle-double-down': this.state.isShowingGroupedChildrenTitles,
                      'fa-angle-double-right': !this.state.isShowingGroupedChildrenTitles
                    })} />&nbsp;
                    {this.props.groupCount + 1} Items <i className="far fa-comments" />
                  </button>
                }
                {
                  // This controls the top level feedback item in a group in the vote phase
                  // and outside the focus mode
                  !isNotGroupedItem && isMainItem && this.props.groupCount > 0 && isFocusModalHidden &&
                  <button className="feedback-expand-group"
                    aria-live="polite"
                    aria-label={this.props.groupedItemProps
                      && !this.props.groupedItemProps.isGroupExpanded
                      ? 'Expand Feedback Group button. Group has ' + groupItemsCount + ' items.'
                      : 'Collapse Feedback Group button. Group has ' + groupItemsCount + ' items.'}
                    style={{ color: this.props.accentColor }}
                    onClick={(e) => {
                      e.stopPropagation();
                      this.props.groupedItemProps.toggleGroupExpand();
                    }}>
                    <i className={classNames('fa', {
                      'fa-chevron-down': this.props.groupedItemProps.isGroupExpanded,
                      'fa-chevron-right': !this.props.groupedItemProps.isGroupExpanded
                    })} />
                    {groupItemsCount} Items
                  </button>
                }
                {showVotes && this.props.isInteractable &&
                  // Using standard button tag here due to no onAnimationEnd support in fabricUI
                  <button
                    title="Vote"
                    aria-live="polite"
                    aria-label={`Click to vote on feedback with title ${this.props.title}. Current vote count is ${this.props.upvotes}`}
                    tabIndex={0}
                    disabled={!isMainItem || !showVoteButton || this.state.showVotedAnimation}
                    className={classNames(
                      'feedback-action-button',
                      'feedback-add-vote',
                      { voteAnimation: this.state.showVotedAnimation }
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      this.setState({ showVotedAnimation: true });
                      this.onVote(this.props.id).then(() => this.props.onVoteCasted());
                    }}
                    onAnimationEnd={() => {
                      this.setState({ showVotedAnimation: false });
                    }}>
                    <i className="fas fa-arrow-circle-up" />
                    <span className="feedback-upvote-count"> {this.props.upvotes.toString()}</span>
                  </button>
                }
                {showVotes && this.props.isInteractable &&
                  // Using standard button tag here due to no onAnimationEnd support in fabricUI
                  <button
                    title="UnVote"
                    aria-live="polite"
                    aria-label={`Click to unvote on feedback with title ${this.props.title}. Current vote count is ${this.props.upvotes}`}
                    tabIndex={0}
                    disabled={!isMainItem || !showVoteButton || this.state.showVotedAnimation}
                    className={classNames(
                      'feedback-action-button',
                      'feedback-add-vote',
                      { voteAnimation: this.state.showVotedAnimation }
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      this.setState({ showVotedAnimation: true });
                      this.onVote(this.props.id, true).then(() => this.props.onVoteCasted());
                    }}
                    onAnimationEnd={() => {
                      this.setState({ showVotedAnimation: false });
                    }}>
                    <i className="fas fa-arrow-circle-down" />

                  </button>
                }
                {!this.props.newlyCreated && this.props.isInteractable &&
                  <div className="item-actions-menu">
                    <DefaultButton className="contextual-menu-button hide-mobile"
                      aria-label="Feedback Options Menu"
                      iconProps={{ iconName: 'MoreVertical' }}
                      title="Feedback actions"
                      menuProps={{
                        items: this.feedbackItemEllipsisMenuItems
                          .filter((menuItem) => !(isMainItem && menuItem.hideMainItem))
                          .map((menuItem) => {
                            menuItem.menuItem.disabled =
                              this.state.isDeletionDisabled ||
                              menuItem.workflowPhases.indexOf(this.props.workflowPhase) === -1;
                            return menuItem.menuItem;
                          })
                      }}
                    />
                    <Dialog
                      hidden={this.state.isMobileFeedbackItemActionsDialogHidden}
                      onDismiss={this.hideMobileFeedbackItemActionsDialog}
                      modalProps={{
                        isBlocking: false,
                        containerClassName: 'ms-dialogMainOverride',
                        className: 'retrospectives-dialog-modal'
                      }}>
                      <div className="mobile-contextual-menu-list"> {
                        this.feedbackItemEllipsisMenuItems
                          .filter((menuItem) => !menuItem.hideMobile)
                          .filter((menuItem) => !(isMainItem && menuItem.hideMainItem))
                          .map((menuItem) => {
                            menuItem.menuItem.disabled =
                              this.state.isDeletionDisabled ||
                              menuItem.workflowPhases.indexOf(this.props.workflowPhase) === -1;

                            return <ActionButton
                              key={menuItem.menuItem.key}
                              className={menuItem.menuItem.className}
                              iconProps={menuItem.menuItem.iconProps}
                              disabled={menuItem.menuItem.disabled}
                              aria-label={menuItem.menuItem.text}
                              onClick={() => {
                                this.hideMobileFeedbackItemActionsDialog();
                                menuItem.menuItem.onClick();
                              }}
                              text={menuItem.menuItem.text}
                              title={menuItem.menuItem.title} />
                          }
                          )
                      }
                      </div>
                      <DialogFooter>
                        <DefaultButton onClick={this.hideMobileFeedbackItemActionsDialog} text="Close" />
                      </DialogFooter>
                    </Dialog>
                  </div>}
              </div>
              <div className="card-content">
                <div id="actionTimer" className="card-action-timer">
                  {showAddActionItem &&
                    <button
                      title="Timer"
                      aria-live="polite"
                      aria-label={'Start/stop'}
                      tabIndex={0}
                      className={classNames(
                        'feedback-action-button',
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.timerSwich(this.props.id);
                      }}
                    >
                      <i className={curTimerState ? "fa fa-stop-circle" : "fa fa-play-circle"} />
                      <span> {this.formatTimer(this.props.timerSecs)} elapsed</span>
                    </button>
                  }
                </div>
                {this.props.isInteractable && <EditableDocumentCardTitle
                  isMultiline={true}
                  title={this.props.title}
                  isChangeEventRequired={false}
                  onSave={this.onDocumentCardTitleSave}
                />}
                {!this.props.isInteractable &&
                  <div
                    className="non-editable-text-container">
                    <p className="non-editable-text">
                      {this.props.title}
                    </p>
                  </div>
                }
                {(this.props.workflowPhase !== WorkflowPhase.Collect) && (this.props.columnId !== this.props.originalColumnId) &&
                  <div className="original-column-info">Original Column: <br />{originalColumnTitle}</div>
                }
                {showVoteButton && this.props.isInteractable &&
                  <div>
                    <span className="feedback-yourvote-count">[Your Votes: {this.state.userVotes}]</span>
                  </div>
                }
              </div>
              {this.feedbackCreationInformationContent()}
              <div className="card-id">#{this.props.columns[this.props.columnId].columnItems.findIndex((columnItem) => columnItem.feedbackItem.id === this.props.id)}</div>
            </div>
            <div className="card-action-item-part">
              {showAddActionItem &&
                <ActionItemDisplay
                  feedbackItemId={this.props.id}
                  feedbackItemTitle={this.props.title}
                  team={this.props.team}
                  boardId={this.props.boardId}
                  boardTitle={this.props.boardTitle}
                  defaultAreaPath={this.props.defaultActionItemAreaPath}
                  defaultIteration={this.props.defaultActionItemIteration}
                  actionItems={this.props.actionItems}
                  onUpdateActionItem={this.onUpdateActionItem}
                  nonHiddenWorkItemTypes={this.props.nonHiddenWorkItemTypes}
                  allWorkItemTypes={this.props.allWorkItemTypes}
                  allowAddNewActionItem={isMainItem}
                />}
            </div>
            {isGroupedCarouselItem && isMainItem && this.state.isShowingGroupedChildrenTitles &&
              <div className="group-child-feedback-stack"
                style={{
                  width: "300px"
                }}><span className="related-feedback-header">Related Feedback</span>
                <ul className="fa-ul">
                  {childrenTitlesShort.map((title: String, index: React.Key) =>
                    <li key={index}><span className="fa-li"><i className="far fa-comment-dots" /></span>
                      <span className="related-feedback-title"
                        aria-label={'Title of the feedback is ' + title}>
                        {title}
                      </span></li>
                  )
                  }
                </ul>
              </div>
            }
          </DocumentCard>
        </div>
        <Dialog
          hidden={this.state.isDeleteItemConfirmationDialogHidden}
          onDismiss={this.hideDeleteItemConfirmationDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: 'Delete Feedback',
            subText: `Are you sure you want to delete the feedback '${this.props.title}'?
              ${!isNotGroupedItem && isMainItem
                ? 'Any feedback grouped underneath this one will be ungrouped.'
                : ''}`,
          }}
          modalProps={{
            isBlocking: true,
            containerClassName: 'retrospectives-delete-feedback-item-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          <DialogFooter>
            <PrimaryButton onClick={this.onConfirmDeleteFeedbackItem} text="Delete" />
            <DefaultButton onClick={this.hideDeleteItemConfirmationDialog} text="Cancel" />
          </DialogFooter>
        </Dialog>
        <Dialog
          hidden={this.state.isMoveFeedbackItemDialogHidden}
          maxWidth={500}
          minWidth={500}
          onDismiss={this.hideMoveFeedbackItemDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: 'Move Feedback to Different Column',
            subText: 'Choose the column you want to move this feedback to',
          }}
          modalProps={{
            isBlocking: false,
            containerClassName: 'retrospectives-move-feedback-item-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          {this.props.columnIds
            .filter((columnId) => columnId != this.props.columnId)
            .map((columnId) => {
              return <DefaultButton
                key={columnId}
                className="move-feedback-item-column-button"
                onClick={async () => {
                  await this.props.moveFeedbackItem(
                    this.props.refreshFeedbackItems,
                    this.props.boardId,
                    this.props.id,
                    columnId);
                }}>
                <i className={this.props.columns[columnId].columnProperties.iconClass} />
                {this.props.columns[columnId].columnProperties.title}
              </DefaultButton>
            })}
        </Dialog>
        <Dialog
          hidden={this.state.isGroupFeedbackItemDialogHidden}
          maxWidth={600}
          minWidth={600}
          onDismiss={this.hideGroupFeedbackItemDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: 'Group Feedback',
            subText: 'Search and select the feedback under which to group the current feedback.'
          }}
          modalProps={{
            isBlocking: false,
            containerClassName: 'retrospectives-group-feedback-item-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          <SearchBox
            autoFocus={true}
            placeholder="Enter the feedback title"
            aria-label="Enter the feedback title"
            onChange={this.handleFeedbackItemSearchInputChange}
            className="feedback-item-name-input"
          />
          <div className="output-container">
            {!this.state.searchedFeedbackItems.length && this.state.searchTerm &&
              <p className="no-matching-feedback-message">No feedback with title containing your input.</p>
            }
            {this.state.searchedFeedbackItems
              .map((columnItem) => {
                const feedbackItemProps = FeedbackColumn.createFeedbackItemProps(
                  this.props.columnProps,
                  columnItem,
                  false)
                return <div
                  key={feedbackItemProps.id}
                  className="feedback-item-search-result-item"
                  onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => this.clickSearchedFeedbackItem(e, feedbackItemProps)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => this.pressSearchedFeedbackItem(e, feedbackItemProps)}
                  tabIndex={0}
                >
                  <FeedbackItem {...feedbackItemProps}>
                  </FeedbackItem>
                </div>
              })}
          </div>
        </Dialog>
        <Dialog
          hidden={this.state.isRemoveFeedbackItemFromGroupConfirmationDialogHidden}
          maxWidth={700}
          minWidth={700}
          onDismiss={this.hideRemoveFeedbackItemFromGroupConfirmationDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: 'Remove Feedback from Group',
            subText: `Are you sure you want to remove the feedback '${this.props.title}' from its current group?`
          }}
          modalProps={{
            isBlocking: true,
            containerClassName: 'retrospectives-remove-feedback-item-from-group-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          <DialogFooter>
            <PrimaryButton onClick={this.onConfirmRemoveFeedbackItemFromGroup} text="Remove Feedback from Group" />
            <DefaultButton onClick={this.hideRemoveFeedbackItemFromGroupConfirmationDialog} text="Cancel" />
          </DialogFooter>
        </Dialog>
      </div>
    );
  }
}

export class FeedbackItemHelper {
  // Handle linking/grouping workitems and reload any updated items.
  public static handleDropFeedbackItemOnFeedbackItem = async (feedbackItemProps: IFeedbackItemProps, droppedItemId: string, targetItemId: string) => {
    const updatedFeedbackItems = await itemDataService.addFeedbackItemAsChild(feedbackItemProps.boardId, targetItemId, droppedItemId);

    feedbackItemProps.refreshFeedbackItems(
      [
        updatedFeedbackItems.updatedParentFeedbackItem,
        updatedFeedbackItems.updatedChildFeedbackItem,
        ...updatedFeedbackItems.updatedGrandchildFeedbackItems,
        updatedFeedbackItems.updatedOldParentFeedbackItem,
      ].filter((item) => item),
      true
    );
    // TODO (enpolat) : appInsightsClient.trackEvent(TelemetryEvents.FeedbackItemGrouped);

    // TODO: Inform user when not all updates are successful due to race conditions.
  }
}

export default withAITracking(reactPlugin, FeedbackItem);
