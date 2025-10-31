import React from "react";
import { cn } from "../utilities/classNameHelper";
import { ActionButton, PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";
import { IContextualMenuItem } from "@fluentui/react/lib/ContextualMenu";
import { Dialog, DialogType, DialogFooter } from "@fluentui/react/lib/Dialog";
import { DocumentCard, DocumentCardActivity } from "@fluentui/react/lib/DocumentCard";
import { SearchBox } from "@fluentui/react/lib/SearchBox";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { WorkItem, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { WebApiTeam } from "azure-devops-extension-api/Core";

import { WorkflowPhase } from "../interfaces/workItem";
import ActionItemDisplay from "./actionItemDisplay";
import EditableDocumentCardTitle from "./editableDocumentCardTitle";
import { IFeedbackItemDocument } from "../interfaces/feedback";
import { itemDataService } from "../dal/itemDataService";
import localStorageHelper from "../utilities/localStorageHelper";
import { reflectBackendService } from "../dal/reflectBackendService";
import { IColumn, IColumnItem } from "./feedbackBoard";
import { FeedbackColumnProps } from "./feedbackColumn";
import { encrypt, getUserIdentity } from "../utilities/userIdentityHelper";
import { appInsights, reactPlugin, TelemetryEvents } from "../utilities/telemetryClient";

export interface IFeedbackItemProps {
  id: string;
  title: string;
  columnProps: FeedbackColumnProps;
  columns: { [id: string]: IColumn };
  columnIds: string[];
  createdBy?: string;
  createdByProfileImage?: string;
  createdDate: string;
  lastEditedDate: string;
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
  shouldHaveFocus: boolean;
  hideFeedbackItems: boolean;
  userIdRef: string;
  timerSecs: number;
  timerState: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timerId: any;
  groupCount: number;
  isGroupedCarouselItem: boolean;
  groupIds: string[];
  isShowingGroupedChildrenTitles: boolean;
  isFocusModalHidden: boolean;
  onVoteCasted: () => void;

  addFeedbackItems: (columnId: string, columnItems: IFeedbackItemDocument[], shouldBroadcast: boolean, newlyCreated: boolean, showAddedAnimation: boolean, shouldHaveFocus: boolean, hideFeedbackItems: boolean) => void;

  removeFeedbackItemFromColumn: (columnIdToDeleteFrom: string, feedbackItemIdToDelete: string, shouldSetFocusOnFirstAvailableItem: boolean) => void;

  refreshFeedbackItems: (feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean) => void;

  moveFeedbackItem: (refreshFeedbackItems: (feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean) => void, boardId: string, feedbackItemId: string, columnId: string) => void;
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
  searchedFeedbackItems: IFeedbackItemDocument[];
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
  private readonly itemElementRef: (element: HTMLElement) => void;

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
      searchTerm: "",
      searchedFeedbackItems: [],
      showVotedAnimation: false,
      userVotes: "0",
      isShowingGroupedChildrenTitles: false,
    };

    this.itemElement = null;
    this.itemElementRef = (element: HTMLElement) => (this.itemElement = element);
  }

  public async componentDidMount() {
    await this.isVoted(this.props.id);
    await this.setDisabledFeedbackItemDeletion(this.props.boardId, this.props.id);

    reflectBackendService.onReceiveDeletedItem(this.receiveDeletedItemHandler);
    this.props.shouldHaveFocus && this.itemElement && this.itemElement.focus();

    if (this.itemElement) {
      this.itemElement.addEventListener("keydown", this.handleItemKeyDown);
    }

    if (this.props.columnProps?.registerItemRef) {
      this.props.columnProps.registerItemRef(this.props.id, this.itemElement);
    }
  }

  public componentWillUnmount() {
    reflectBackendService.removeOnReceiveDeletedItem(this.receiveDeletedItemHandler);

    if (this.itemElement) {
      this.itemElement.removeEventListener("keydown", this.handleItemKeyDown);
    }

    if (this.props.columnProps?.registerItemRef) {
      this.props.columnProps.registerItemRef(this.props.id, null);
    }
  }

  private handleItemKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    if (document.querySelector('[role="dialog"]')) {
      return;
    }

    const key = e.key.toLowerCase();
    const isMainItem = !this.props.groupedItemProps || this.props.groupedItemProps.isMainItem;

    switch (key) {
      case "delete":
      case "backspace":
        if (target.tagName !== "BUTTON") {
          e.preventDefault();
          this.deleteFeedbackItem();
        }
        break;
      case "enter":
        if (target.tagName !== "BUTTON" && target.tagName !== "A") {
          e.preventDefault();
          const titleElement = this.itemElement?.querySelector(".non-editable-text-container, .editable-text-container");
          if (titleElement) {
            (titleElement as HTMLElement).focus();
            (titleElement as HTMLElement).click();
          }
        }
        break;
      case " ":
        if (target.tagName !== "BUTTON" && this.props.groupedItemProps) {
          e.preventDefault();
          this.props.groupedItemProps.toggleGroupExpand();
        }
        break;
      case "v":
        if (this.props.workflowPhase === WorkflowPhase.Vote && isMainItem) {
          e.preventDefault();
          const isUpvote = this.state.userVotes === "0";
          this.onVote(this.props.id, !isUpvote).then(() => this.props.onVoteCasted());
        }
        break;
      case "g":
        if (this.props.workflowPhase === WorkflowPhase.Group && !this.state.isDeletionDisabled) {
          e.preventDefault();
          this.showGroupFeedbackItemDialog();
        }
        break;
      case "m":
        if (this.props.workflowPhase === WorkflowPhase.Group && !this.state.isDeletionDisabled) {
          e.preventDefault();
          this.showMoveFeedbackItemDialog();
        }
        break;
      case "a":
        if (this.props.workflowPhase === WorkflowPhase.Act && isMainItem) {
          e.preventDefault();
          const addActionButton = this.itemElement?.querySelector('[aria-label*="Add action item"]');
          if (addActionButton) {
            (addActionButton as HTMLElement).click();
          }
        }
        break;
      case "t":
        if (this.props.workflowPhase === WorkflowPhase.Act) {
          e.preventDefault();
          this.timerSwitch(this.props.id);
        }
        break;
      case "escape":
        if (!this.state.isDeleteItemConfirmationDialogHidden) {
          e.preventDefault();
          this.hideDeleteItemConfirmationDialog();
        } else if (!this.state.isMoveFeedbackItemDialogHidden) {
          e.preventDefault();
          this.hideMoveFeedbackItemDialog();
        } else if (!this.state.isGroupFeedbackItemDialogHidden) {
          e.preventDefault();
          this.hideGroupFeedbackItemDialog();
        } else if (!this.state.isRemoveFeedbackItemFromGroupConfirmationDialogHidden) {
          e.preventDefault();
          this.hideRemoveFeedbackItemFromGroupConfirmationDialog();
        }
        break;
    }
  };

  private readonly receiveDeletedItemHandler = (columnId: string, feedbackItemId: string) => {
    if (feedbackItemId === this.props.id && !this.state.isMarkedForDeletion) {
      this.markFeedbackItemForDelete();
    }
  };

  public componentDidUpdate() {
    this.props.shouldHaveFocus && this.itemElement && this.itemElement.focus();
  }

  private readonly deleteFeedbackItem = () => {
    this.showDeleteItemConfirmationDialog();
  };

  private readonly dragFeedbackItemOverFeedbackItem = (e: React.DragEvent<HTMLDivElement>) => {
    // Allow if item being dragged is not this item.
    if (!this.state.isBeingDragged) {
      e.preventDefault();
    }
    e.stopPropagation();
    e.dataTransfer.dropEffect = "link";
  };

  private readonly dragFeedbackItemStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (this.props.groupedItemProps) {
      this.props.groupedItemProps.setIsGroupBeingDragged(true);
    }
    e.dataTransfer.effectAllowed = "linkMove";
    // Using localStorage as a temporary solution for Edge issue
    // Bug 19016440: Edge drag and drop dataTransfer protocol is bugged
    e.dataTransfer.setData("foo", "bar"); // Required for firefox drag and drop
    localStorageHelper.setIdValue(this.props.id);
    this.setState({ isBeingDragged: true });
  };

  private readonly dragFeedbackItemEnd = () => {
    if (this.props.groupedItemProps) {
      this.props.groupedItemProps.setIsGroupBeingDragged(false);
    }
    this.setState({ isBeingDragged: false });
  };

  private readonly dropFeedbackItemOnFeedbackItem = async (e: React.DragEvent<HTMLDivElement>) => {
    // Using localStorage as a temporary solution for Edge issue
    // Bug 19016440: Edge drag and drop dataTransfer protocol is bugged
    // const droppedItemId = e.dataTransfer.getData("id");
    const droppedItemId = localStorageHelper.getIdValue();

    if (this.props.id !== droppedItemId) {
      FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(this.props, droppedItemId, this.props.id);
    }

    e.stopPropagation();
  };

  private readonly onDocumentCardTitleSave = async (newTitle: string) => {
    this.onFeedbackItemDocumentCardTitleSave(this.props.id, newTitle, this.props.newlyCreated);

    if (this.itemElement) {
      this.itemElement.focus();
    }
  };

  private readonly showDeleteItemConfirmationDialog = () => {
    this.setState({
      isDeleteItemConfirmationDialogHidden: false,
    });
  };

  private readonly hideDeleteItemConfirmationDialog = () => {
    this.setState({
      isDeleteItemConfirmationDialogHidden: true,
    });
  };

  private readonly showRemoveFeedbackItemFromGroupConfirmationDialog = () => {
    this.setState({
      isRemoveFeedbackItemFromGroupConfirmationDialogHidden: false,
    });
  };

  private readonly hideRemoveFeedbackItemFromGroupConfirmationDialog = () => {
    this.setState({
      isRemoveFeedbackItemFromGroupConfirmationDialogHidden: true,
    });
  };

  private readonly onConfirmRemoveFeedbackItemFromGroup = () => {
    this.props.moveFeedbackItem(this.props.refreshFeedbackItems, this.props.boardId, this.props.id, this.props.columnId);

    this.hideRemoveFeedbackItemFromGroupConfirmationDialog();
  };

  private readonly setDisabledFeedbackItemDeletion = async (boardId: string, id: string) => {
    const feedbackItem = await itemDataService.getFeedbackItem(boardId, id);
    if (feedbackItem) {
      this.setState({ isDeletionDisabled: feedbackItem.upvotes > 0 });
    }
  };

  private readonly onConfirmDeleteFeedbackItem = async () => {
    this.markFeedbackItemForDelete(true);
    await this.initiateDeleteFeedbackItem();
  };

  private readonly markFeedbackItemForDelete = (isLocalDelete: boolean = false) => {
    if (this.props.groupedItemProps?.isMainItem && this.props.groupedItemProps?.isGroupExpanded) {
      this.props.groupedItemProps.toggleGroupExpand();
    }

    this.setState({
      isDeleteItemConfirmationDialogHidden: true,
      isMarkedForDeletion: true,
      isLocalDelete,
    });
  };

  private readonly initiateDeleteFeedbackItem = async () => {
    // if the card is newly created (not stored in extension storage yet), simply remove the card from UI
    if (this.props.newlyCreated) {
      this.removeFeedbackItem(this.props.id);
      return;
    }

    const updatedItems = await itemDataService.deleteFeedbackItem(this.props.boardId, this.props.id);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemDeleted, properties: { boardId: this.props.boardId, feedbackItemId: this.props.id } });
    reflectBackendService.broadcastDeletedItem("dummyColumn", this.props.id);
    if (updatedItems.updatedChildFeedbackItems) {
      // Only refresh the child items here at this point
      this.props.refreshFeedbackItems(
        updatedItems.updatedChildFeedbackItems.filter(item => item),
        true,
      );
    }
  };

  private readonly onAnimationEnd = async () => {
    if (this.state.isMarkedForDeletion) {
      this.state.isLocalDelete && this.removeFeedbackItem(this.props.id, true);
      !this.state.isLocalDelete && this.removeFeedbackItem(this.props.id, false);

      if (this.props.groupedItemProps && !this.props.groupedItemProps.isMainItem) {
        // if the item that is getting deleted is a child item, refresh and broadcast an update of the parent
        const updatedItem = await itemDataService.getFeedbackItem(this.props.boardId, this.props.groupedItemProps.parentItemId);
        this.props.refreshFeedbackItems([updatedItem], true);
      }
    }
  };

  private readonly hideMobileFeedbackItemActionsDialog = () => {
    this.setState({
      isMobileFeedbackItemActionsDialogHidden: true,
    });
  };

  private readonly showMoveFeedbackItemDialog = () => {
    this.setState({
      isMoveFeedbackItemDialogHidden: false,
    });
  };

  private readonly hideMoveFeedbackItemDialog = () => {
    this.setState({
      isMoveFeedbackItemDialogHidden: true,
    });
  };

  private readonly showGroupFeedbackItemDialog = () => {
    this.setState({
      isGroupFeedbackItemDialogHidden: false,
    });
  };

  private readonly hideGroupFeedbackItemDialog = () => {
    this.setState({
      isGroupFeedbackItemDialogHidden: true,
      searchedFeedbackItems: [],
      searchTerm: "",
    });
  };

  private readonly toggleShowGroupedChildrenTitles = () => {
    this.setState(previousState => ({ isShowingGroupedChildrenTitles: !previousState.isShowingGroupedChildrenTitles }));
  };

  private readonly feedbackItemEllipsisMenuItems: FeedbackItemEllipsisMenuItem[] = [
    {
      menuItem: {
        key: "deleteFeedback",
        iconProps: { iconName: "Delete" },
        onClick: this.deleteFeedbackItem,
        text: "Delete feedback",
        title: "Delete feedback (disabled when there are active votes)",
      },
      workflowPhases: [WorkflowPhase.Collect, WorkflowPhase.Group, WorkflowPhase.Vote, WorkflowPhase.Act],
    },
    {
      menuItem: {
        key: "moveFeedback",
        iconProps: { iconName: "Move" },
        onClick: this.showMoveFeedbackItemDialog,
        text: "Move feedback to different column",
        title: "Move feedback to different column",
      },
      workflowPhases: [WorkflowPhase.Group],
      hideMobile: true,
    },
    {
      menuItem: {
        key: "groupFeedback",
        iconProps: { iconName: "RowsGroup" },
        onClick: this.showGroupFeedbackItemDialog,
        text: "Group feedback",
        title: "Group feedback",
      },
      workflowPhases: [WorkflowPhase.Group],
      hideMobile: true,
    },
    {
      menuItem: {
        key: "removeFeedbackFromGroup",
        iconProps: { iconName: "Remove" },
        onClick: this.showRemoveFeedbackItemFromGroupConfirmationDialog,
        text: "Remove feedback from group",
        title: "Remove feedback from group",
      },
      workflowPhases: [WorkflowPhase.Group],
      hideMobile: true,
      hideMainItem: true,
    },
  ];

  private readonly onVote = async (feedbackItemId: string, decrement: boolean = false) => {
    const updatedFeedbackItem = await itemDataService.updateVote(this.props.boardId, this.props.team.id, getUserIdentity().id, feedbackItemId, decrement);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemUpvoted, properties: { boardId: this.props.boardId, feedbackItemId: this.props.id } });

    if (updatedFeedbackItem) {
      await this.isVoted(this.props.id);
      this.props.refreshFeedbackItems([updatedFeedbackItem], true);
      await this.setDisabledFeedbackItemDeletion(this.props.boardId, this.props.id);
    }
  };

  private readonly timerSwitch = async (feedbackItemId: string) => {
    let updatedFeedbackItem;
    const boardId: string = this.props.boardId;

    // function to handle timer count update
    const incTimer = async () => {
      if (this.props.timerState === true) {
        updatedFeedbackItem = await itemDataService.updateTimer(boardId, feedbackItemId);
        if (updatedFeedbackItem) {
          this.props.refreshFeedbackItems([updatedFeedbackItem], true);
        }
      }
    };

    // flip the timer and start/stop count
    if (!this.props.timerState) {
      updatedFeedbackItem = await itemDataService.updateTimer(boardId, feedbackItemId, true);
      if (updatedFeedbackItem) {
        this.props.refreshFeedbackItems([updatedFeedbackItem], true);
      }
      if (this.props.timerId == null) {
        const tid = setInterval(incTimer, 1000);
        updatedFeedbackItem = await itemDataService.flipTimer(boardId, feedbackItemId, tid);
        if (updatedFeedbackItem) {
          this.props.refreshFeedbackItems([updatedFeedbackItem], true);
        }
      } else {
        updatedFeedbackItem = await itemDataService.flipTimer(boardId, feedbackItemId, this.props.timerId);
        if (updatedFeedbackItem) {
          this.props.refreshFeedbackItems([updatedFeedbackItem], true);
        }
      }
    } else {
      clearInterval(this.props.timerId);
      updatedFeedbackItem = await itemDataService.flipTimer(boardId, feedbackItemId, null);
      if (updatedFeedbackItem) {
        this.props.refreshFeedbackItems([updatedFeedbackItem], true);
      }
    }
  };

  private readonly isVoted = async (feedbackItemId: string) => {
    const userId = encrypt(getUserIdentity().id);
    itemDataService.isVoted(this.props.boardId, userId, feedbackItemId).then(result => {
      this.setState({ userVotes: result });
    });
  };

  private readonly removeFeedbackItem = (feedbackItemIdToDelete: string, shouldSetFocusOnFirstAvailableItem: boolean = false) => {
    this.props.removeFeedbackItemFromColumn(this.props.columnId, feedbackItemIdToDelete, shouldSetFocusOnFirstAvailableItem);
  };

  private readonly onFeedbackItemDocumentCardTitleSave = async (feedbackItemId: string, newTitle: string, newlyCreated: boolean) => {
    if (!newTitle.trim()) {
      if (newlyCreated) {
        this.removeFeedbackItem(feedbackItemId);
      }
      return;
    }

    if (newlyCreated) {
      const newFeedbackItem = await itemDataService.createItemForBoard(this.props.boardId, newTitle, this.props.columnId, !this.props.createdBy);
      appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemCreated, properties: { boardId: this.props.boardId, feedbackItemId: newFeedbackItem.id } });

      // Replace empty card UI with populated feedback item
      this.removeFeedbackItem(feedbackItemId);

      this.props.addFeedbackItems(this.props.columnId, [newFeedbackItem], /*shouldBroadcast*/ true, /*newlyCreated*/ false, /*showAddedAnimation*/ false, /*shouldHaveFocus*/ true, /*hideFeedbackItems*/ false);

      return;
    }

    const updatedFeedbackItem = await itemDataService.updateTitle(this.props.boardId, feedbackItemId, newTitle);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemTitleEdited, properties: { boardId: this.props.boardId, feedbackItemId: feedbackItemId } });

    if (updatedFeedbackItem) {
      this.props.refreshFeedbackItems([updatedFeedbackItem], true);
    }
  };

  private readonly onUpdateActionItem = async (updatedFeedbackItem: IFeedbackItemDocument) => {
    if (updatedFeedbackItem) {
      this.props.refreshFeedbackItems([updatedFeedbackItem], true);
    }
  };

  private readonly handleFeedbackItemSearchInputChange = async (event?: React.ChangeEvent<HTMLInputElement>, searchTerm?: string) => {
    if (!searchTerm?.trim()) {
      this.setState({ searchTerm: searchTerm, searchedFeedbackItems: [] });
      return;
    }

    const trimmedSearchTerm = searchTerm.trim();

    const boardItems = await itemDataService.getFeedbackItemsForBoard(this.props.boardId);
    const searchedFeedbackItems = boardItems
      .filter(findItem => {
        return findItem.title.toLocaleLowerCase().includes(trimmedSearchTerm.toLocaleLowerCase());
      })
      .filter(boardItem => {
        return boardItem.id !== this.props.id && !boardItem.parentFeedbackItemId;
      });

    this.setState({
      searchTerm: searchTerm,
      searchedFeedbackItems: searchedFeedbackItems,
    });
  };

  private readonly clickSearchedFeedbackItem = (event: React.MouseEvent<HTMLButtonElement>, feedbackItemProps: IFeedbackItemProps) => {
    event.stopPropagation();
    FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(feedbackItemProps, this.props.id, feedbackItemProps.id);

    this.hideGroupFeedbackItemDialog();
  };

  private readonly pressSearchedFeedbackItem = (event: React.KeyboardEvent<HTMLButtonElement>, feedbackItemProps: IFeedbackItemProps) => {
    event.stopPropagation();

    if (event.key === "Enter") {
      FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(feedbackItemProps, this.props.id, feedbackItemProps.id);
      this.hideGroupFeedbackItemDialog();
    }

    if (event.key === "Escape") {
      this.hideGroupFeedbackItemDialog();
    }
  };

  private readonly feedbackCreationInformationContent = () => {
    if (!this.props.createdBy) {
      return <div className="anonymous-created-date">{new Intl.DateTimeFormat("default", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" }).format(new Date(this.props.createdDate))}</div>;
    }

    return (
      <DocumentCardActivity
        activity={new Intl.DateTimeFormat("default", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" }).format(new Date(this.props.createdDate))}
        people={[
          {
            name: this.props.createdBy,
            profileImageSrc: this.props.createdByProfileImage,
          },
        ]}
      />
    );
  };

  public formatTimer = (timeInSeconds: number) => {
    // Handle the timer display - total seconds into 00:00
    // Doesn't handle formatting hours since that may be excessive
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  private renderGroupButton(groupItemsCount: number, isFocusButton: boolean): React.JSX.Element | null {
    const isExpanded = this.props.groupedItemProps && (isFocusButton ? this.state.isShowingGroupedChildrenTitles : this.props.groupedItemProps.isGroupExpanded);
    return (
      <button
        className={isFocusButton ? "feedback-expand-group-focus" : "feedback-expand-group"}
        aria-live="polite"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? `Collapse group. Group has ${groupItemsCount} items.` : `Expand group. Group has ${groupItemsCount} items.`}
        aria-controls={isFocusButton ? `group-children-${this.props.id}` : undefined}
        style={!isFocusButton ? { color: this.props.accentColor } : undefined}
        onClick={e => {
          e.stopPropagation();
          if (isFocusButton) {
            this.toggleShowGroupedChildrenTitles();
          } else {
            this.props.groupedItemProps.toggleGroupExpand();
          }
        }}
      >
        <i className={cn("fa", isFocusButton && this.state.isShowingGroupedChildrenTitles && "fa-angle-double-down", isFocusButton && !this.state.isShowingGroupedChildrenTitles && "fa-angle-double-right", !isFocusButton && this.props.groupedItemProps.isGroupExpanded && "fa-chevron-down", !isFocusButton && !this.props.groupedItemProps.isGroupExpanded && "fa-chevron-right")} />
        &nbsp;
        {isFocusButton ? `${this.props.groupCount + 1} Items` : `${groupItemsCount} Items`}
        {isFocusButton && <i className="far fa-comments" />}
      </button>
    );
  }

  private renderVoteActionButton(isMainItem: boolean, isBoldItem: boolean, showVoteButton: boolean, totalVotes: number, isUpvote: boolean) {
    const hideFeedbackItems = this.props.hideFeedbackItems && this.props.userIdRef !== getUserIdentity().id;
    const titleForAria = hideFeedbackItems ? "[Hidden Feedback]" : this.props.title;
    const buttonTitle = isUpvote ? "Vote" : "Unvote";
    const buttonAriaLabel = isUpvote ? `Click to vote on feedback with title ${titleForAria}. Current vote count is ${this.props.upvotes}` : `Click to unvote on feedback with title ${titleForAria}. Current vote count is ${this.props.upvotes}`;
    const buttonIconClass = isUpvote ? "fas fa-arrow-circle-up" : "fas fa-arrow-circle-down";

    return (
      <button
        title={buttonTitle}
        aria-live="polite"
        aria-label={buttonAriaLabel}
        tabIndex={0}
        disabled={!isMainItem || !showVoteButton || this.state.showVotedAnimation}
        className={cn("feedback-action-button", "feedback-add-vote", this.state.showVotedAnimation && "voteAnimation")}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          this.setState({ showVotedAnimation: true });
          this.onVote(this.props.id, !isUpvote).then(() => this.props.onVoteCasted());
        }}
        onAnimationEnd={() => {
          this.setState({ showVotedAnimation: false });
        }}
      >
        <i className={buttonIconClass} />
        {isUpvote && <span className={isMainItem && isBoldItem ? "feedback-upvote-count bold" : "feedback-upvote-count"}> {totalVotes.toString()}</span>}
      </button>
    );
  }

  public render(): React.JSX.Element {
    const workflowState = {
      isCollectPhase: this.props.workflowPhase === WorkflowPhase.Collect,
      isGroupPhase: this.props.workflowPhase === WorkflowPhase.Group,
      isVotePhase: this.props.workflowPhase === WorkflowPhase.Vote,
      isActPhase: this.props.workflowPhase === WorkflowPhase.Act,
      isActPhaseFocusMode: this.props.workflowPhase === WorkflowPhase.Act && !this.props.isFocusModalHidden,
    };

    // Grouped State Booleans and Children
    const isNotGroupedItem = !this.props.groupedItemProps;
    const isMainItem = isNotGroupedItem || this.props.groupedItemProps?.isMainItem;
    const isMainCollapsedItem = !isNotGroupedItem && !this.props.groupedItemProps.isGroupExpanded;
    const isGroupedCarouselItem = this.props.isGroupedCarouselItem;
    const childrenIds = this.props.groupIds;

    // Focus Mode Booleans
    const isFocusModalHidden = this.props.isFocusModalHidden; // for rotating through carousel in focus mode
    const mainGroupedItemInFocusMode = isGroupedCarouselItem && isMainItem && workflowState.isActPhaseFocusMode;
    const mainGroupedItemNotInFocusMode = !isNotGroupedItem && isMainItem && this.props.groupCount > 0 && isFocusModalHidden;

    // Vote Count Helpers
    const mainFeedbackItem = this.props.columns[this.props.columnId]?.columnItems.find(c => c.feedbackItem.id === this.props.id)?.feedbackItem;
    const groupedFeedbackItems = this.props.groupIds
      .map(id => {
        const item = this.props.columns[this.props.columnId]?.columnItems.find(c => c.feedbackItem.id === id)?.feedbackItem;
        return item;
      })
      .filter(item => item !== undefined) as IFeedbackItemDocument[];
    const userId = encrypt(getUserIdentity().id);

    // Vote Count Getters
    const votes = mainFeedbackItem ? itemDataService.getVotes(mainFeedbackItem) : 0;
    const votesByUser = this.state.userVotes; // use the direct method since available
    const groupedVotes = mainFeedbackItem ? itemDataService.getVotesForGroupedItems(mainFeedbackItem, groupedFeedbackItems) : votes;
    const groupedVotesByUser = mainFeedbackItem ? itemDataService.getVotesForGroupedItemsByUser(mainFeedbackItem, groupedFeedbackItems, userId) : votesByUser;

    let totalVotes = isMainCollapsedItem ? groupedVotes : votes;
    // In focus mode, does not toggle between grouped and ungrouped vote counts, always displays grouped count
    if (mainGroupedItemInFocusMode) {
      totalVotes = groupedVotes;
    }

    // Group, Vote, Act (and Focus) Options
    const isDraggable = workflowState.isGroupPhase && !this.state.isMarkedForDeletion;
    const showVoteButton = workflowState.isVotePhase;
    const showVotes = showVoteButton || workflowState.isActPhase;

    const groupItemsCount = this.props?.groupedItemProps?.groupedCount + 1;
    const itemPosition = this.props.columns[this.props.columnId]?.columnItems.findIndex(columnItem => columnItem.feedbackItem.id === this.props.id) + 1;
    const totalItemsInColumn = this.props.columns[this.props.columnId]?.columnItems.length || 0;

    const hideFeedbackItems = this.props.hideFeedbackItems && this.props.userIdRef !== getUserIdentity().id;
    const displayTitle = hideFeedbackItems ? "[Hidden Feedback]" : this.props.title;

    let ariaLabel = `Feedback item ${itemPosition} of ${totalItemsInColumn}. `;

    if (!isNotGroupedItem) {
      if (isMainItem) {
        ariaLabel = `Feedback group main item ${itemPosition} of ${totalItemsInColumn}. Group has ${groupItemsCount} items. `;
      } else {
        ariaLabel = `Grouped feedback item. `;
      }
    }

    ariaLabel += `Title: ${displayTitle}. `;

    if (this.props.createdBy && !hideFeedbackItems) {
      ariaLabel += `Created by ${this.props.createdBy}. `;
    }

    if (this.props.createdDate) {
      const creationDate = new Intl.DateTimeFormat("default", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(this.props.createdDate));
      ariaLabel += `Created on ${creationDate}. `;
    }

    if (showVotes) {
      ariaLabel += `${totalVotes} total votes.`;
      if (showVoteButton) {
        ariaLabel += ` You have ${votesByUser} votes on this item.`;
      }
    }

    const curTimerState = this.props.timerState;

    return (
      <div ref={this.itemElementRef} tabIndex={0} aria-live="polite" aria-label={ariaLabel} role="article" aria-roledescription={isNotGroupedItem ? "feedback item" : isMainItem ? "feedback group" : "grouped feedback item"} className={cn(isNotGroupedItem && "feedbackItem", !isNotGroupedItem && "feedbackItemGroupItem", !isNotGroupedItem && !isMainItem && "feedbackItemGroupGroupedItem", this.props.showAddedAnimation && "newFeedbackItem", this.state.isMarkedForDeletion && "removeFeedbackItem", hideFeedbackItems && "hideFeedbackItem")} draggable={isDraggable} onDragStart={this.dragFeedbackItemStart} onDragOver={isNotGroupedItem ? this.dragFeedbackItemOverFeedbackItem : null} onDragEnd={this.dragFeedbackItemEnd} onDrop={isNotGroupedItem ? this.dropFeedbackItemOnFeedbackItem : null} onAnimationEnd={this.onAnimationEnd}>
        <div className="document-card-wrapper">
          <DocumentCard className={cn(isMainItem && "mainItemCard", !isMainItem && "groupedItemCard")}>
            <div
              className="card-integral-part"
              style={{
                borderLeftColor: this.props.accentColor,
              }}
            >
              <div className="card-header">
                {
                  // Controls the top-level feedback item in a group in focus mode
                  mainGroupedItemInFocusMode && this.renderGroupButton(groupItemsCount, true)
                }
                {
                  // Controls the top-level feedback item in a group not in focus mode
                  mainGroupedItemNotInFocusMode && this.renderGroupButton(groupItemsCount, false)
                }
                {
                  showVotes && this.renderVoteActionButton(isMainItem, isMainCollapsedItem, showVoteButton, totalVotes, true) // render voting button
                }
                {
                  showVotes && this.renderVoteActionButton(isMainItem, isMainCollapsedItem, showVoteButton, totalVotes, false) // render unvoting button
                }
                {!this.props.newlyCreated && (
                  <div className="item-actions-menu">
                    <DefaultButton
                      className="contextual-menu-button hide-mobile"
                      aria-label="Feedback Options Menu"
                      iconProps={{ iconName: "MoreVertical" }}
                      title="Feedback actions"
                      menuProps={{
                        className: "feedback-action-menu",
                        items: this.feedbackItemEllipsisMenuItems
                          .filter(menuItem => !(isMainItem && menuItem.hideMainItem))
                          .map(menuItem => {
                            menuItem.menuItem.disabled = this.state.isDeletionDisabled || menuItem.workflowPhases.indexOf(this.props.workflowPhase) === -1;
                            return menuItem.menuItem;
                          }),
                      }}
                    />
                    <Dialog
                      hidden={this.state.isMobileFeedbackItemActionsDialogHidden}
                      onDismiss={this.hideMobileFeedbackItemActionsDialog}
                      modalProps={{
                        isBlocking: false,
                        containerClassName: "ms-dialogMainOverride",
                        className: "retrospectives-dialog-modal",
                      }}
                    >
                      <div className="mobile-contextual-menu-list">
                        {" "}
                        {this.feedbackItemEllipsisMenuItems
                          .filter(menuItem => !menuItem.hideMobile)
                          .filter(menuItem => !(isMainItem && menuItem.hideMainItem))
                          .map(menuItem => {
                            menuItem.menuItem.disabled = this.state.isDeletionDisabled || menuItem.workflowPhases.indexOf(this.props.workflowPhase) === -1;

                            return (
                              <ActionButton
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
                                title={menuItem.menuItem.title}
                              />
                            );
                          })}
                      </div>
                      <DialogFooter>
                        <DefaultButton onClick={this.hideMobileFeedbackItemActionsDialog} text="Close" />
                      </DialogFooter>
                    </Dialog>
                  </div>
                )}
              </div>
              <div className="card-content">
                {workflowState.isActPhase && (
                  <div className="card-action-timer hide-mobile">
                    <button
                      title="Timer"
                      aria-live="polite"
                      aria-label={"Start/stop"}
                      tabIndex={0}
                      className="feedback-action-button"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.timerSwitch(this.props.id);
                      }}
                    >
                      <i className={curTimerState ? "fa fa-stop-circle" : "fa fa-play-circle"} />
                      <span> {this.formatTimer(this.props.timerSecs)} elapsed</span>
                    </button>
                  </div>
                )}
                {<EditableDocumentCardTitle isMultiline={true} title={displayTitle} isChangeEventRequired={false} onSave={this.onDocumentCardTitleSave} />}
                {!workflowState.isCollectPhase && this.props.columnId !== this.props.originalColumnId && (
                  <div className="original-column-info hide-mobile">
                    Original Column: <br />
                    {this.props.columns[this.props.originalColumnId]?.columnProperties?.title ?? "n/a"}
                  </div>
                )}
                {showVoteButton && <div>{isNotGroupedItem || !isMainItem || (isMainItem && this.props.groupedItemProps.isGroupExpanded) ? <span className="feedback-yourvote-count">[Your Votes: {votesByUser}]</span> : <span className="feedback-yourvote-count bold">[Your Votes: {groupedVotesByUser}]</span>}</div>}
              </div>
              {this.feedbackCreationInformationContent()}
              <div className="card-id">#{this.props.columns[this.props.columnId]?.columnItems.findIndex(columnItem => columnItem.feedbackItem.id === this.props.id) + 1}</div>
            </div>
            <div className="card-action-item-part">{workflowState.isActPhase && <ActionItemDisplay feedbackItemId={this.props.id} feedbackItemTitle={displayTitle} team={this.props.team} boardId={this.props.boardId} boardTitle={this.props.boardTitle} defaultAreaPath={this.props.defaultActionItemAreaPath} defaultIteration={this.props.defaultActionItemIteration} actionItems={this.props.actionItems} onUpdateActionItem={this.onUpdateActionItem} nonHiddenWorkItemTypes={this.props.nonHiddenWorkItemTypes} allWorkItemTypes={this.props.allWorkItemTypes} allowAddNewActionItem={isMainItem} />}</div>
            {isGroupedCarouselItem && isMainItem && this.state.isShowingGroupedChildrenTitles && (
              <div className="group-child-feedback-stack" id={`group-children-${this.props.id}`}>
                <div className="related-feedback-header">
                  {" "}
                  <i className="far fa-comments" />
                  &nbsp;Related Feedback
                </div>
                <ul className="fa-ul" aria-label="List of Related Feedback" role="list">
                  {childrenIds.map((id: string) => {
                    const childCard: IColumnItem = this.props.columns[this.props.columnId]?.columnItems.find(c => c.feedbackItem.id === id);
                    const originalColumn = childCard ? this.props.columns[childCard.feedbackItem.originalColumnId] : null;
                    const childItemHidden = childCard && this.props.hideFeedbackItems && childCard.feedbackItem.userIdRef !== getUserIdentity().id;
                    const childDisplayTitle = childItemHidden ? "[Hidden Feedback]" : childCard?.feedbackItem.title;

                    return (
                      childCard && (
                        <li key={id} role="listitem">
                          <span className="fa-li" style={{ borderRightColor: originalColumn?.columnProperties?.accentColor }}>
                            <i className="fa-solid fa-quote-left" aria-hidden="true" />
                          </span>
                          <span className="related-feedback-title" aria-label={`Related feedback: ${childDisplayTitle}`} title={childDisplayTitle}>
                            {childDisplayTitle}
                          </span>
                          {this.props.columnId !== originalColumn?.columnProperties?.id && (
                            <div className="original-column-info hide-mobile">
                              Original Column: <br />
                              {originalColumn.columnProperties.title}
                            </div>
                          )}
                        </li>
                      )
                    );
                  })}
                </ul>
              </div>
            )}
          </DocumentCard>
        </div>
        <Dialog
          hidden={this.state.isDeleteItemConfirmationDialogHidden}
          onDismiss={this.hideDeleteItemConfirmationDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: "Delete Feedback",
            subText: `Are you sure you want to delete the feedback "${displayTitle}"?
              ${!isNotGroupedItem && isMainItem ? "Any feedback grouped underneath this one will be ungrouped." : ""}`,
          }}
          modalProps={{
            isBlocking: true,
            containerClassName: "retrospectives-delete-feedback-item-dialog",
            className: "retrospectives-dialog-modal",
          }}
        >
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
            title: "Move Feedback to Different Column",
            subText: "Choose the column you want to move this feedback to",
          }}
          modalProps={{
            isBlocking: false,
            containerClassName: "retrospectives-move-feedback-item-dialog",
            className: "retrospectives-dialog-modal",
          }}
        >
          {this.props.columnIds
            .filter(columnId => columnId != this.props.columnId)
            .map(columnId => {
              return (
                <DefaultButton
                  key={columnId}
                  className="move-feedback-item-column-button"
                  onClick={() => {
                    this.props.moveFeedbackItem(this.props.refreshFeedbackItems, this.props.boardId, this.props.id, columnId);
                  }}
                >
                  <i className={this.props.columns[columnId].columnProperties.iconClass} />
                  {this.props.columns[columnId].columnProperties.title}
                </DefaultButton>
              );
            })}
        </Dialog>
        <Dialog
          hidden={this.state.isGroupFeedbackItemDialogHidden}
          maxWidth={600}
          minWidth={600}
          onDismiss={this.hideGroupFeedbackItemDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: "Group Feedback",
          }}
          modalProps={{
            isBlocking: false,
            containerClassName: "retrospectives-group-feedback-item-dialog",
            className: "retrospectives-dialog-modal",
          }}
        >
          <label className="ms-Dialog-subText" htmlFor="feedback-item-search-input">
            Search and select the feedback under which to group the current feedback.
          </label>
          <SearchBox id="feedback-item-search-input" autoFocus={true} placeholder="Enter the feedback title" aria-label="Enter the feedback title" onChange={this.handleFeedbackItemSearchInputChange} />
          <div className="output-container">
            {!this.state.searchedFeedbackItems.length && this.state.searchTerm && <p className="no-matching-feedback-message">No feedback with title containing your input.</p>}
            {this.state.searchedFeedbackItems.map((searchItem, index) => {
              const feedbackItemProps: IFeedbackItemProps = {
                id: searchItem.id,
                title: searchItem.title,
                columnProps: this.props.columnProps,
                columns: this.props.columns,
                columnIds: this.props.columnIds,
                lastEditedDate: searchItem.modifiedDate ? searchItem.modifiedDate.toString() : "",
                createdDate: searchItem.createdDate.toString(),
                upvotes: searchItem.upvotes,
                accentColor: this.props.accentColor,
                iconClass: this.props.iconClass,
                workflowPhase: this.props.workflowPhase,
                originalColumnId: searchItem.originalColumnId,
                team: this.props.team,
                columnId: searchItem.columnId,
                boardId: searchItem.boardId,
                boardTitle: this.props.boardTitle,
                defaultActionItemAreaPath: this.props.defaultActionItemAreaPath,
                defaultActionItemIteration: this.props.defaultActionItemIteration,
                actionItems: [],
                showAddedAnimation: this.props.showAddedAnimation,
                newlyCreated: this.props.newlyCreated,
                nonHiddenWorkItemTypes: this.props.nonHiddenWorkItemTypes,
                allWorkItemTypes: this.props.allWorkItemTypes,
                shouldHaveFocus: this.props.shouldHaveFocus,
                hideFeedbackItems: this.props.hideFeedbackItems,
                userIdRef: searchItem.userIdRef,
                timerSecs: searchItem.timerSecs,
                timerState: searchItem.timerState,
                timerId: searchItem.timerId,
                groupCount: searchItem.childFeedbackItemIds?.length,
                groupIds: searchItem.childFeedbackItemIds ?? [],
                isGroupedCarouselItem: searchItem.isGroupedCarouselItem,
                isShowingGroupedChildrenTitles: false,
                isFocusModalHidden: true,
                onVoteCasted: this.props.onVoteCasted,
                addFeedbackItems: this.props.addFeedbackItems,
                removeFeedbackItemFromColumn: this.props.removeFeedbackItemFromColumn,
                refreshFeedbackItems: this.props.refreshFeedbackItems,
                moveFeedbackItem: this.props.moveFeedbackItem,
              };
              return (
                <button key={searchItem.id} className="feedback-item-search-result-item" onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => this.clickSearchedFeedbackItem(e, feedbackItemProps)} onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => this.pressSearchedFeedbackItem(e, feedbackItemProps)} tabIndex={index}>
                  <FeedbackItem {...feedbackItemProps}></FeedbackItem>
                </button>
              );
            })}
          </div>
        </Dialog>
        <Dialog
          hidden={this.state.isRemoveFeedbackItemFromGroupConfirmationDialogHidden}
          onDismiss={this.hideRemoveFeedbackItemFromGroupConfirmationDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: "Remove Feedback from Group",
            subText: `Are you sure you want to remove the feedback "${displayTitle}" from its current group?`,
          }}
          modalProps={{
            isBlocking: true,
            containerClassName: "retrospectives-remove-feedback-item-from-group-dialog",
            className: "retrospectives-dialog-modal",
          }}
        >
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
  public static readonly handleDropFeedbackItemOnFeedbackItem = async (feedbackItemProps: IFeedbackItemProps, droppedItemId: string, targetItemId: string) => {
    const updatedFeedbackItems = await itemDataService.addFeedbackItemAsChild(feedbackItemProps.boardId, targetItemId, droppedItemId);

    feedbackItemProps.refreshFeedbackItems(
      [updatedFeedbackItems.updatedParentFeedbackItem, updatedFeedbackItems.updatedChildFeedbackItem, ...updatedFeedbackItems.updatedGrandchildFeedbackItems, updatedFeedbackItems.updatedOldParentFeedbackItem].filter(item => item),
      true,
    );
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemGrouped, properties: feedbackItemProps });
  };
}

export default withAITracking(reactPlugin, FeedbackItem);
