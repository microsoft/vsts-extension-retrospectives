import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { cn } from "../utilities/classNameHelper";
import { Dialog, DialogType } from "@fluentui/react/lib/Dialog";
import { DocumentCard, DocumentCardActivity } from "@fluentui/react/lib/DocumentCard";
import { SearchBox } from "@fluentui/react/lib/SearchBox";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { WorkItem, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { WebApiTeam } from "azure-devops-extension-api/Core";

import { WorkflowPhase } from "../interfaces/workItem";
import ActionItemDisplay from "./actionItemDisplay";
import EditableDocumentCardTitle from "./editableDocumentCardTitle";
import FeedbackItemTimer from "./feedbackItemTimer";
import GroupedFeedbackList from "./groupedFeedbackList";
import { IFeedbackItemDocument } from "../interfaces/feedback";
import { itemDataService } from "../dal/itemDataService";
import localStorageHelper from "../utilities/localStorageHelper";
import { reflectBackendService } from "../dal/reflectBackendService";
import { IColumn } from "./feedbackBoard";
import { obfuscateUserId, getUserIdentity } from "../utilities/userIdentityHelper";
import { appInsights, reactPlugin, TelemetryEvents } from "../utilities/telemetryClient";
import { isAnyModalDialogOpen } from "../utilities/dialogHelper";
import { getIconElement, MoreVerticalIcon } from "./icons";

export interface IFeedbackItemColumnContext {
  registerItemRef?: (itemId: string, element: HTMLElement | null) => void;
}

export interface IFeedbackItemProps {
  id: string;
  title: string;
  columnProps?: IFeedbackItemColumnContext;
  columns: { [id: string]: IColumn };
  columnIds: string[];
  createdBy?: string;
  createdByProfileImage?: string;
  createdDate: string;
  lastEditedDate: string;
  upvotes: number;
  accentColor: string;
  icon: React.ReactElement;
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
  timerId: ReturnType<typeof setInterval> | null;
  groupCount: number;
  isGroupedCarouselItem: boolean;
  groupIds: string[];
  isShowingGroupedChildrenTitles: boolean;
  isFocusModalHidden: boolean;
  onVoteCasted: () => void;
  activeTimerFeedbackItemId: string | null;
  requestTimerStart: (feedbackItemId: string) => void;
  notifyTimerStopped: (feedbackItemId: string) => void;

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

export interface FeedbackItemHandle {
  get itemElement(): HTMLElement | null;
  set itemElement(value: HTMLElement | null);
  get state(): IFeedbackItemState;
  setState: (stateUpdate: Partial<IFeedbackItemState> | ((prev: IFeedbackItemState) => Partial<IFeedbackItemState>)) => void;

  startEditingTitle: () => void;
  navigateToAdjacentCard: (direction: "prev" | "next") => void;
  focusCardControl: (direction: "prev" | "next") => void;

  onDocumentCardTitleSave: (newTitle: string) => Promise<void>;
  onFeedbackItemDocumentCardTitleSave: (feedbackItemId: string, newTitle: string, newlyCreated: boolean) => Promise<void>;
  onUpdateActionItem: (updatedFeedbackItem: IFeedbackItemDocument | null) => Promise<void>;

  handleFeedbackItemSearchInputChange: (event?: React.ChangeEvent<HTMLInputElement>, searchTerm?: string) => Promise<void>;
  clickSearchedFeedbackItem: (event: React.MouseEvent<HTMLButtonElement>, feedbackItemProps: IFeedbackItemProps) => void;
  pressSearchedFeedbackItem: (event: React.KeyboardEvent<HTMLButtonElement>, feedbackItemProps: IFeedbackItemProps) => void;

  showRemoveFeedbackItemFromGroupConfirmationDialog: () => void;
  onConfirmRemoveFeedbackItemFromGroup: () => void;
  markFeedbackItemForDelete: (isLocalDelete?: boolean) => void;
  setDisabledFeedbackItemDeletion: (boardId: string, id: string) => Promise<void>;

  hideMobileFeedbackItemActionsDialog: () => void;
  hideMoveFeedbackItemDialog: () => void;
  hideGroupFeedbackItemDialog: () => void;
  hideDeleteItemConfirmationDialog: () => void;
  hideRemoveFeedbackItemFromGroupConfirmationDialog: () => void;

  dragFeedbackItemOverFeedbackItem: (e: { preventDefault: () => void; stopPropagation: () => void; dataTransfer?: { dropEffect?: string } }) => void;
  dragFeedbackItemStart: (e: { dataTransfer: { effectAllowed: string; setData: (format: string, data: string) => void } }) => void;
  dragFeedbackItemEnd: () => void;
  initiateDeleteFeedbackItem: () => Promise<void>;
}

interface FeedbackItemEllipsisMenuItem {
  key: string;
  iconName: string;
  onClick: () => void;
  text: string;
  title: string;
  hideMainItem: boolean;
}

const FeedbackItem = forwardRef<FeedbackItemHandle, IFeedbackItemProps>((props, ref) => {
  const trackActivity = useTrackMetric(reactPlugin, "FeedbackItem");

  const [state, setState] = useState<IFeedbackItemState>(() => ({
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
  }));

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const itemElementRef = useRef<HTMLDivElement | null>(null);
  const itemElementOverrideRef = useRef<HTMLElement | null | undefined>(undefined);
  const mobileActionsButtonRef = useRef<HTMLButtonElement>(null);
  const mobileActionsMenuRef = useRef<HTMLDivElement>(null);
  const deleteFeedbackDialogRef = useRef<HTMLDialogElement>(null);
  const moveFeedbackDialogRef = useRef<HTMLDialogElement>(null);
  const removeFeedbackFromGroupDialogRef = useRef<HTMLDialogElement>(null);

  const setStateMerge = useCallback((stateUpdate: Partial<IFeedbackItemState> | ((prev: IFeedbackItemState) => Partial<IFeedbackItemState>)) => {
    setState(prev => {
      const patch = typeof stateUpdate === "function" ? stateUpdate(prev) : stateUpdate;
      return { ...prev, ...patch };
    });
  }, []);

  const removeFeedbackItem = useCallback(
    (feedbackItemIdToDelete: string, shouldSetFocusOnFirstAvailableItem: boolean = false) => {
      props.removeFeedbackItemFromColumn(props.columnId, feedbackItemIdToDelete, shouldSetFocusOnFirstAvailableItem);
    },
    [props.removeFeedbackItemFromColumn, props.columnId],
  );

  const startEditingTitle = useCallback(() => {
    const element = (itemElementOverrideRef.current ?? itemElementRef.current) as HTMLElement | null;

    const activeEditor = element?.querySelector(".editable-text-input-container textarea, .editable-text-input-container input, .editable-text-input") as HTMLElement | null;
    if (activeEditor) {
      activeEditor.focus();
      return;
    }

    const titleText = element?.querySelector(".editable-text") as HTMLElement | null;
    if (titleText) {
      titleText.focus();
      titleText.click();
      return;
    }

    const container = element?.querySelector(".non-editable-text-container, .editable-text-container") as HTMLElement | null;
    if (container) {
      container.focus();
      container.click();
    }
  }, []);

  const navigateToAdjacentCard = useCallback(
    (direction: "prev" | "next") => {
      const columnItems = props.columns[props.columnId]?.columnItems || [];
      const visibleItems = columnItems.filter(item => !item.feedbackItem.parentFeedbackItemId);
      const currentIndex = visibleItems.findIndex(item => item.feedbackItem.id === props.id);

      if (currentIndex === -1) {
        return;
      }

      const nextIndex = direction === "prev" ? (currentIndex > 0 ? currentIndex - 1 : currentIndex) : currentIndex < visibleItems.length - 1 ? currentIndex + 1 : currentIndex;

      if (nextIndex !== currentIndex) {
        const nextItemId = visibleItems[nextIndex]?.feedbackItem.id;
        if (nextItemId) {
          const nextItemElement = document.querySelector(`[data-feedback-item-id="${nextItemId}"]`) as HTMLElement | null;
          nextItemElement?.focus();
        }
      }
    },
    [props.columns, props.columnId, props.id],
  );

  const focusCardControl = useCallback((direction: "prev" | "next") => {
    const element = (itemElementOverrideRef.current ?? itemElementRef.current) as HTMLElement | null;

    const focusableControls = Array.from(element?.querySelectorAll(['[data-card-control="true"]', ".editable-text-container", ".non-editable-text-container"].join(",")) ?? []) as HTMLElement[];
    const visibleControls = focusableControls.filter(control => control.getAttribute("aria-hidden") !== "true" && !control.hasAttribute("disabled"));

    if (!visibleControls.length) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement;
    const currentIndex = visibleControls.indexOf(activeElement);

    let nextIndex: number;
    if (currentIndex === -1) {
      nextIndex = direction === "next" ? 0 : visibleControls.length - 1;
    } else if (direction === "next") {
      nextIndex = (currentIndex + 1) % visibleControls.length;
    } else {
      nextIndex = (currentIndex - 1 + visibleControls.length) % visibleControls.length;
    }

    visibleControls[nextIndex].focus();
  }, []);

  const showDeleteItemConfirmationDialog = useCallback(() => {
    setStateMerge({ isDeleteItemConfirmationDialogHidden: false });
    const dialog = deleteFeedbackDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [setStateMerge]);

  const hideDeleteItemConfirmationDialog = useCallback(() => {
    setStateMerge({ isDeleteItemConfirmationDialogHidden: true });
    deleteFeedbackDialogRef.current?.close();
  }, [setStateMerge]);

  const showRemoveFeedbackItemFromGroupConfirmationDialog = useCallback(() => {
    setStateMerge({ isRemoveFeedbackItemFromGroupConfirmationDialogHidden: false });
    const dialog = removeFeedbackFromGroupDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [setStateMerge]);

  const hideRemoveFeedbackItemFromGroupConfirmationDialog = useCallback(() => {
    setStateMerge({ isRemoveFeedbackItemFromGroupConfirmationDialogHidden: true });
    removeFeedbackFromGroupDialogRef.current?.close();
  }, [setStateMerge]);

  const onConfirmRemoveFeedbackItemFromGroup = useCallback(() => {
    props.moveFeedbackItem(props.refreshFeedbackItems, props.boardId, props.id, props.columnId);
    hideRemoveFeedbackItemFromGroupConfirmationDialog();
  }, [props.moveFeedbackItem, props.refreshFeedbackItems, props.boardId, props.id, props.columnId, hideRemoveFeedbackItemFromGroupConfirmationDialog]);

  const setDisabledFeedbackItemDeletion = useCallback(
    async (boardId: string, id: string) => {
      const feedbackItem = await itemDataService.getFeedbackItem(boardId, id);
      if (feedbackItem) {
        setStateMerge({ isDeletionDisabled: feedbackItem.upvotes > 0 });
      }
    },
    [setStateMerge],
  );

  const markFeedbackItemForDelete = useCallback(
    (isLocalDelete: boolean = false) => {
      if (props.groupedItemProps?.isMainItem && props.groupedItemProps?.isGroupExpanded) {
        props.groupedItemProps.toggleGroupExpand();
      }

      setStateMerge({
        isDeleteItemConfirmationDialogHidden: true,
        isMarkedForDeletion: true,
        isLocalDelete,
      });
    },
    [props.groupedItemProps, setStateMerge],
  );

  const initiateDeleteFeedbackItem = useCallback(async () => {
    if (props.newlyCreated) {
      removeFeedbackItem(props.id);
      return;
    }

    const updatedItems = await itemDataService.deleteFeedbackItem(props.boardId, props.id);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemDeleted, properties: { boardId: props.boardId, feedbackItemId: props.id } });
    reflectBackendService.broadcastDeletedItem("dummyColumn", props.id);

    if (updatedItems.updatedChildFeedbackItems) {
      props.refreshFeedbackItems(
        updatedItems.updatedChildFeedbackItems.filter(item => item),
        true,
      );
    }
  }, [props.newlyCreated, props.id, props.boardId, props.refreshFeedbackItems, removeFeedbackItem]);

  const onConfirmDeleteFeedbackItem = useCallback(async () => {
    markFeedbackItemForDelete(true);
    await initiateDeleteFeedbackItem();
  }, [markFeedbackItemForDelete, initiateDeleteFeedbackItem]);

  const hideMobileFeedbackItemActionsDialog = useCallback(() => {
    setStateMerge({ isMobileFeedbackItemActionsDialogHidden: true });
  }, [setStateMerge]);

  const toggleMobileFeedbackItemActionsMenu = useCallback(() => {
    setStateMerge(previousState => ({ isMobileFeedbackItemActionsDialogHidden: !previousState.isMobileFeedbackItemActionsDialogHidden }));
  }, [setStateMerge]);

  const showMoveFeedbackItemDialog = useCallback(() => {
    setStateMerge({ isMoveFeedbackItemDialogHidden: false });
    const dialog = moveFeedbackDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [setStateMerge]);

  const hideMoveFeedbackItemDialog = useCallback(() => {
    setStateMerge({ isMoveFeedbackItemDialogHidden: true });
    moveFeedbackDialogRef.current?.close();
  }, [setStateMerge]);

  const showGroupFeedbackItemDialog = useCallback(() => {
    setStateMerge({ isGroupFeedbackItemDialogHidden: false });
  }, [setStateMerge]);

  const hideGroupFeedbackItemDialog = useCallback(() => {
    setStateMerge({ isGroupFeedbackItemDialogHidden: true, searchedFeedbackItems: [], searchTerm: "" });
  }, [setStateMerge]);

  const toggleShowGroupedChildrenTitles = useCallback(() => {
    setStateMerge(previousState => ({ isShowingGroupedChildrenTitles: !previousState.isShowingGroupedChildrenTitles }));
  }, [setStateMerge]);

  const teamId = props.team?.id ?? "";

  const isVoted = useCallback(
    async (feedbackItemId: string) => {
      const userId = obfuscateUserId(getUserIdentity().id);
      const result = await itemDataService.isVoted(props.boardId, userId, feedbackItemId);
      setStateMerge({ userVotes: result });
    },
    [props.boardId, setStateMerge],
  );

  const onVote = useCallback(
    async (feedbackItemId: string, decrement: boolean = false) => {
      const updatedFeedbackItem = await itemDataService.updateVote(props.boardId, teamId, getUserIdentity().id, feedbackItemId, decrement);
      appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemUpvoted, properties: { boardId: props.boardId, feedbackItemId: props.id } });

      if (updatedFeedbackItem) {
        await isVoted(props.id);
        props.refreshFeedbackItems([updatedFeedbackItem], true);
        await setDisabledFeedbackItemDeletion(props.boardId, props.id);
      }
    },
    [props.boardId, teamId, props.id, props.refreshFeedbackItems, isVoted, setDisabledFeedbackItemDeletion],
  );

  const timerSwitch = useCallback(
    async (feedbackItemId: string) => {
      let updatedFeedbackItem;
      const boardId = props.boardId;

      if (!props.timerState) {
        props.requestTimerStart(feedbackItemId);
      }

      const incTimer = async () => {
        const currentItem = await itemDataService.getFeedbackItem(boardId, feedbackItemId);
        if (currentItem && currentItem.timerState === true) {
          updatedFeedbackItem = await itemDataService.updateTimer(boardId, feedbackItemId);
          if (updatedFeedbackItem) {
            props.refreshFeedbackItems([updatedFeedbackItem], true);
          }
        }
      };

      if (!props.timerState) {
        updatedFeedbackItem = await itemDataService.updateTimer(boardId, feedbackItemId, true);
        if (updatedFeedbackItem) {
          props.refreshFeedbackItems([updatedFeedbackItem], true);
        }
        const tid = props.timerId ?? setInterval(incTimer, 1000);
        updatedFeedbackItem = await itemDataService.flipTimer(boardId, feedbackItemId, tid);
        if (updatedFeedbackItem) {
          props.refreshFeedbackItems([updatedFeedbackItem], true);
        }
      } else {
        clearInterval(props.timerId);
        updatedFeedbackItem = await itemDataService.flipTimer(boardId, feedbackItemId, null);
        if (updatedFeedbackItem) {
          props.refreshFeedbackItems([updatedFeedbackItem], true);
        }
        props.notifyTimerStopped(feedbackItemId);
      }
    },
    [props.boardId, props.timerState, props.timerId, props.requestTimerStart, props.refreshFeedbackItems, props.notifyTimerStopped],
  );

  const onFeedbackItemDocumentCardTitleSave = useCallback(
    async (feedbackItemId: string, newTitle: string, newlyCreated: boolean) => {
      if (!newTitle.trim()) {
        if (newlyCreated) {
          removeFeedbackItem(feedbackItemId);
        }
        return;
      }

      if (newlyCreated) {
        const newFeedbackItem = await itemDataService.createItemForBoard(props.boardId, newTitle, props.columnId, !props.createdBy);
        appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemCreated, properties: { boardId: props.boardId, feedbackItemId: newFeedbackItem.id } });
        removeFeedbackItem(feedbackItemId);
        props.addFeedbackItems(props.columnId, [newFeedbackItem], true, false, false, true, false);
        return;
      }

      const updatedFeedbackItem = await itemDataService.updateTitle(props.boardId, feedbackItemId, newTitle);
      appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemTitleEdited, properties: { boardId: props.boardId, feedbackItemId: feedbackItemId } });
      if (updatedFeedbackItem) {
        props.refreshFeedbackItems([updatedFeedbackItem], true);
      }
    },
    [props.boardId, props.columnId, props.createdBy, props.addFeedbackItems, props.refreshFeedbackItems, removeFeedbackItem],
  );

  const onDocumentCardTitleSave = useCallback(
    async (newTitle: string) => {
      await onFeedbackItemDocumentCardTitleSave(props.id, newTitle, props.newlyCreated);
      const element = (itemElementOverrideRef.current ?? itemElementRef.current) as HTMLElement | null;
      element?.focus();
    },
    [onFeedbackItemDocumentCardTitleSave, props.id, props.newlyCreated],
  );

  const onUpdateActionItem = useCallback(
    async (updatedFeedbackItem: IFeedbackItemDocument | null) => {
      if (updatedFeedbackItem) {
        props.refreshFeedbackItems([updatedFeedbackItem], true);
      }
    },
    [props.refreshFeedbackItems],
  );

  const handleFeedbackItemSearchInputChange = useCallback(
    async (_event?: React.ChangeEvent<HTMLInputElement>, searchTerm?: string) => {
      if (!searchTerm?.trim()) {
        setStateMerge({ searchTerm: searchTerm, searchedFeedbackItems: [] });
        return;
      }

      const trimmedSearchTerm = searchTerm.trim();
      const boardItems = await itemDataService.getFeedbackItemsForBoard(props.boardId);
      const searchedFeedbackItems = boardItems.filter(findItem => findItem.title.toLocaleLowerCase().includes(trimmedSearchTerm.toLocaleLowerCase())).filter(boardItem => boardItem.id !== props.id && !boardItem.parentFeedbackItemId);

      setStateMerge({ searchTerm: searchTerm, searchedFeedbackItems });
    },
    [props.boardId, props.id, setStateMerge],
  );

  const clickSearchedFeedbackItem = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, feedbackItemProps: IFeedbackItemProps) => {
      event.stopPropagation();
      FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(feedbackItemProps, props.id, feedbackItemProps.id);
      hideGroupFeedbackItemDialog();
    },
    [props.id, hideGroupFeedbackItemDialog],
  );

  const pressSearchedFeedbackItem = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, feedbackItemProps: IFeedbackItemProps) => {
      event.stopPropagation();
      if (event.key === "Enter") {
        FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(feedbackItemProps, props.id, feedbackItemProps.id);
        hideGroupFeedbackItemDialog();
      }
      if (event.key === "Escape") {
        hideGroupFeedbackItemDialog();
      }
    },
    [props.id, hideGroupFeedbackItemDialog],
  );

  const feedbackCreationInformationContent = useCallback(() => {
    const formattedCreatedDate = new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(props.createdDate));

    if (!props.createdBy) {
      return <div className="anonymous-created-date">{formattedCreatedDate}</div>;
    }

    return <DocumentCardActivity activity={formattedCreatedDate} people={[{ name: props.createdBy, profileImageSrc: props.createdByProfileImage }]} />;
  }, [props.createdBy, props.createdByProfileImage, props.createdDate]);

  const deleteFeedbackItem = useCallback(() => {
    showDeleteItemConfirmationDialog();
  }, [showDeleteItemConfirmationDialog]);

  const dragFeedbackItemOverFeedbackItem = useCallback(
    (
      e:
        | React.DragEvent<HTMLDivElement>
        | {
            preventDefault: () => void;
            stopPropagation: () => void;
            dataTransfer?: { dropEffect?: string };
          },
    ) => {
      if (!stateRef.current.isBeingDragged) {
        e.preventDefault();
      }
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "link";
      }
    },
    [],
  );

  const dragFeedbackItemStart = useCallback(
    (
      e:
        | React.DragEvent<HTMLDivElement>
        | {
            dataTransfer: { effectAllowed: string; setData: (format: string, data: string) => void };
          },
    ) => {
      if (props.groupedItemProps) {
        props.groupedItemProps.setIsGroupBeingDragged(true);
      }
      e.dataTransfer.effectAllowed = "linkMove";
      e.dataTransfer.setData("text/plain", props.id);
      e.dataTransfer.setData("text", props.id);
      localStorageHelper.setIdValue(props.id);
      setStateMerge({ isBeingDragged: true });
    },
    [props.groupedItemProps, props.id, setStateMerge],
  );

  const dragFeedbackItemEnd = useCallback(() => {
    if (props.groupedItemProps) {
      props.groupedItemProps.setIsGroupBeingDragged(false);
    }
    setStateMerge({ isBeingDragged: false });
  }, [props.groupedItemProps, setStateMerge]);

  const dropFeedbackItemOnFeedbackItem = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      const droppedItemId = e.dataTransfer?.getData("text/plain") || e.dataTransfer?.getData("text") || localStorageHelper.getIdValue();
      if (props.id !== droppedItemId) {
        FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(props, droppedItemId, props.id);
      }
      e.stopPropagation();
    },
    [props],
  );

  const receiveDeletedItemHandler = useCallback(
    (_columnId: string, feedbackItemId: string) => {
      if (feedbackItemId === props.id && !stateRef.current.isMarkedForDeletion) {
        markFeedbackItemForDelete(false);
      }
    },
    [props.id, markFeedbackItemForDelete],
  );

  useEffect(() => {
    const element = itemElementRef.current;
    if (props.columnProps?.registerItemRef) {
      props.columnProps.registerItemRef(props.id, element);
    }

    return () => {
      if (props.columnProps?.registerItemRef) {
        props.columnProps.registerItemRef(props.id, null);
      }
    };
  }, [props.columnProps, props.id]);

  useEffect(() => {
    const handleDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const menu = mobileActionsMenuRef.current;
      const button = mobileActionsButtonRef.current;

      if (menu?.contains(target) || button?.contains(target)) {
        return;
      }

      hideMobileFeedbackItemActionsDialog();
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [state.isMobileFeedbackItemActionsDialogHidden, hideMobileFeedbackItemActionsDialog]);

  useEffect(() => {
    reflectBackendService.onReceiveDeletedItem(receiveDeletedItemHandler);
    return () => {
      reflectBackendService.removeOnReceiveDeletedItem(receiveDeletedItemHandler);
    };
  }, [receiveDeletedItemHandler]);

  useEffect(() => {
    isVoted(props.id);
    setDisabledFeedbackItemDeletion(props.boardId, props.id);
  }, [props.id, props.boardId, isVoted, setDisabledFeedbackItemDeletion]);

  useEffect(() => {
    if (props.shouldHaveFocus) {
      itemElementRef.current?.focus();
    }
  }, [props.shouldHaveFocus]);

  const handleItemKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement> | KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const key = e.key.toLowerCase();
      const isTextInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      const isDialogOpen = isAnyModalDialogOpen();

      if (isDialogOpen && key !== "tab" && key !== "escape") {
        return;
      }
      if (isTextInput && key !== "tab" && key !== "escape") {
        return;
      }

      if (key === "tab") {
        e.preventDefault();
        navigateToAdjacentCard(e.shiftKey ? "prev" : "next");
        return;
      }

      const isMainItem = !props.groupedItemProps || props.groupedItemProps.isMainItem;

      switch (key) {
        case "arrowup":
        case "arrowdown":
          e.preventDefault();
          navigateToAdjacentCard(key === "arrowup" ? "prev" : "next");
          break;
        case "arrowleft":
          e.preventDefault();
          focusCardControl("prev");
          break;
        case "arrowright":
          e.preventDefault();
          focusCardControl("next");
          break;
        case "delete":
        case "backspace":
          if (target.tagName !== "BUTTON") {
            e.preventDefault();
            deleteFeedbackItem();
          }
          break;
        case "enter":
          if (target.tagName !== "BUTTON" && target.tagName !== "A") {
            if (props.hideFeedbackItems && props.userIdRef !== getUserIdentity().id) {
              e.preventDefault();
              return;
            }
            e.preventDefault();
            startEditingTitle();
          }
          break;
        case " ":
          if (target.tagName !== "BUTTON" && props.groupedItemProps) {
            e.preventDefault();
            props.groupedItemProps.toggleGroupExpand();
          }
          break;
        case "v":
          if (props.workflowPhase === WorkflowPhase.Vote && isMainItem) {
            e.preventDefault();
            const isUpvote = stateRef.current.userVotes === "0";
            onVote(props.id, !isUpvote).then(() => props.onVoteCasted());
          }
          break;
        case "g":
          if (props.workflowPhase === WorkflowPhase.Group) {
            e.preventDefault();
            showGroupFeedbackItemDialog();
          }
          break;
        case "m":
          if (props.workflowPhase === WorkflowPhase.Group) {
            e.preventDefault();
            showMoveFeedbackItemDialog();
          }
          break;
        case "a":
          if (props.workflowPhase === WorkflowPhase.Act && isMainItem) {
            e.preventDefault();
            const element = (itemElementOverrideRef.current ?? itemElementRef.current) as HTMLElement | null;
            const addActionButton = element?.querySelector('[aria-label*="Add action item"]');
            (addActionButton as HTMLElement | null)?.click();
          }
          break;
        case "t":
          if (props.workflowPhase === WorkflowPhase.Act) {
            e.preventDefault();
            timerSwitch(props.id);
          }
          break;
        case "escape":
          if (!stateRef.current.isDeleteItemConfirmationDialogHidden) {
            e.preventDefault();
            hideDeleteItemConfirmationDialog();
          } else if (!stateRef.current.isMobileFeedbackItemActionsDialogHidden) {
            e.preventDefault();
            hideMobileFeedbackItemActionsDialog();
          } else if (!stateRef.current.isMoveFeedbackItemDialogHidden) {
            e.preventDefault();
            hideMoveFeedbackItemDialog();
          } else if (!stateRef.current.isGroupFeedbackItemDialogHidden) {
            e.preventDefault();
            hideGroupFeedbackItemDialog();
          } else if (!stateRef.current.isRemoveFeedbackItemFromGroupConfirmationDialogHidden) {
            e.preventDefault();
            hideRemoveFeedbackItemFromGroupConfirmationDialog();
          }
          break;
      }
    },
    [navigateToAdjacentCard, focusCardControl, deleteFeedbackItem, startEditingTitle, onVote, props, showGroupFeedbackItemDialog, showMoveFeedbackItemDialog, timerSwitch, hideDeleteItemConfirmationDialog, hideMoveFeedbackItemDialog, hideGroupFeedbackItemDialog, hideRemoveFeedbackItemFromGroupConfirmationDialog],
  );

  useEffect(() => {
    const element = itemElementRef.current;

    const listener = (event: KeyboardEvent) => {
      handleItemKeyDown(event);
    };

    element?.addEventListener("keydown", listener);
    return () => {
      element?.removeEventListener("keydown", listener);
    };
  }, [handleItemKeyDown]);

  const feedbackItemEllipsisMenuItems: FeedbackItemEllipsisMenuItem[] = useMemo(
    () => [
      {
        key: "deleteFeedback",
        iconName: "delete",
        onClick: deleteFeedbackItem,
        text: "Delete feedback",
        title: "Delete feedback (disabled when there are active votes)",
        hideMainItem: false,
      },
      {
        key: "moveFeedback",
        iconName: "open-with",
        onClick: showMoveFeedbackItemDialog,
        text: "Move feedback to different column",
        title: "Move feedback to different column",
        hideMainItem: false,
      },
      {
        key: "groupFeedback",
        iconName: "group-work",
        onClick: showGroupFeedbackItemDialog,
        text: "Group feedback",
        title: "Group feedback",
        hideMainItem: false,
      },
      {
        key: "removeFeedbackFromGroup",
        iconName: "logout",
        onClick: showRemoveFeedbackItemFromGroupConfirmationDialog,
        text: "Remove feedback from group",
        title: "Remove feedback from group",
        hideMainItem: true,
      },
    ],
    [deleteFeedbackItem, showMoveFeedbackItemDialog, showGroupFeedbackItemDialog, showRemoveFeedbackItemFromGroupConfirmationDialog],
  );

  const renderGroupButton = useCallback(
    (groupItemsCount: number, isFocusButton: boolean): React.JSX.Element | null => {
      const isExpanded = props.groupedItemProps && (isFocusButton ? state.isShowingGroupedChildrenTitles : props.groupedItemProps.isGroupExpanded);
      return (
        <button
          className={isFocusButton ? "feedback-expand-group-focus" : "feedback-expand-group"}
          aria-live="polite"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse group. Group has ${groupItemsCount} items.` : `Expand group. Group has ${groupItemsCount} items.`}
          aria-controls={isFocusButton ? `group-children-${props.id}` : undefined}
          data-card-control="true"
          tabIndex={-1}
          style={!isFocusButton ? { color: props.accentColor } : undefined}
          onClick={e => {
            e.stopPropagation();
            if (isFocusButton) {
              toggleShowGroupedChildrenTitles();
            } else {
              props.groupedItemProps?.toggleGroupExpand();
            }
          }}
        >
          {isFocusButton && state.isShowingGroupedChildrenTitles && getIconElement("chevron-down")}
          {isFocusButton && !state.isShowingGroupedChildrenTitles && getIconElement("chevron-right")}
          {!isFocusButton && props.groupedItemProps?.isGroupExpanded && getIconElement("chevron-down")}
          {!isFocusButton && !props.groupedItemProps?.isGroupExpanded && getIconElement("chevron-right")}
          {isFocusButton ? `${props.groupCount + 1} Items` : `${groupItemsCount} Items`}
        </button>
      );
    },
    [props, state.isShowingGroupedChildrenTitles, toggleShowGroupedChildrenTitles],
  );

  useImperativeHandle(
    ref,
    () => ({
      get itemElement() {
        return (itemElementOverrideRef.current ?? itemElementRef.current) as HTMLElement | null;
      },
      set itemElement(value: HTMLElement | null) {
        itemElementOverrideRef.current = value;
      },
      get state() {
        return stateRef.current;
      },
      setState: setStateMerge,

      startEditingTitle,
      navigateToAdjacentCard,
      focusCardControl,

      onDocumentCardTitleSave,
      onFeedbackItemDocumentCardTitleSave,
      onUpdateActionItem,

      handleFeedbackItemSearchInputChange,
      clickSearchedFeedbackItem,
      pressSearchedFeedbackItem,

      showRemoveFeedbackItemFromGroupConfirmationDialog,
      onConfirmRemoveFeedbackItemFromGroup,
      markFeedbackItemForDelete,
      setDisabledFeedbackItemDeletion,

      hideMobileFeedbackItemActionsDialog,
      hideMoveFeedbackItemDialog,
      hideGroupFeedbackItemDialog,
      hideDeleteItemConfirmationDialog,
      hideRemoveFeedbackItemFromGroupConfirmationDialog,

      dragFeedbackItemOverFeedbackItem,
      dragFeedbackItemStart,
      dragFeedbackItemEnd,
      initiateDeleteFeedbackItem,
    }),
    [setStateMerge, startEditingTitle, navigateToAdjacentCard, focusCardControl, onDocumentCardTitleSave, onFeedbackItemDocumentCardTitleSave, onUpdateActionItem, handleFeedbackItemSearchInputChange, clickSearchedFeedbackItem, pressSearchedFeedbackItem, showRemoveFeedbackItemFromGroupConfirmationDialog, onConfirmRemoveFeedbackItemFromGroup, markFeedbackItemForDelete, setDisabledFeedbackItemDeletion, hideMobileFeedbackItemActionsDialog, hideMoveFeedbackItemDialog, hideGroupFeedbackItemDialog, hideDeleteItemConfirmationDialog, hideRemoveFeedbackItemFromGroupConfirmationDialog, dragFeedbackItemOverFeedbackItem, dragFeedbackItemStart, dragFeedbackItemEnd, initiateDeleteFeedbackItem],
  );

  const workflowState = {
    isCollectPhase: props.workflowPhase === WorkflowPhase.Collect,
    isGroupPhase: props.workflowPhase === WorkflowPhase.Group,
    isVotePhase: props.workflowPhase === WorkflowPhase.Vote,
    isActPhase: props.workflowPhase === WorkflowPhase.Act,
    isActPhaseFocusMode: props.workflowPhase === WorkflowPhase.Act && !props.isFocusModalHidden,
  };

  const isNotGroupedItem = !props.groupedItemProps;
  const isMainItem = isNotGroupedItem || props.groupedItemProps?.isMainItem;
  const isMainCollapsedItem = !isNotGroupedItem && !props.groupedItemProps?.isGroupExpanded;
  const isGroupedCarouselItem = props.isGroupedCarouselItem;
  const childrenIds = props.groupIds;

  const mainGroupedItemInFocusMode = isGroupedCarouselItem && isMainItem && workflowState.isActPhaseFocusMode;
  const mainGroupedItemNotInFocusMode = !isNotGroupedItem && isMainItem && props.groupCount > 0 && props.isFocusModalHidden;

  const columnItems = props.columns[props.columnId]?.columnItems;
  const mainFeedbackItem = columnItems?.find(c => c.feedbackItem.id === props.id)?.feedbackItem;
  const groupedFeedbackItems = props.groupIds.map(id => columnItems?.find(c => c.feedbackItem.id === id)?.feedbackItem).filter(item => item !== undefined) as IFeedbackItemDocument[];
  const userId = obfuscateUserId(getUserIdentity().id);

  const votes = mainFeedbackItem ? itemDataService.getVotes(mainFeedbackItem) : 0;
  const votesByUser = state.userVotes;
  const groupedVotes = mainFeedbackItem ? itemDataService.getVotesForGroupedItems(mainFeedbackItem, groupedFeedbackItems) : votes;
  const groupedVotesByUser = mainFeedbackItem ? itemDataService.getVotesForGroupedItemsByUser(mainFeedbackItem, groupedFeedbackItems, userId) : votesByUser;

  let totalVotes = isMainCollapsedItem ? groupedVotes : votes;
  if (mainGroupedItemInFocusMode) {
    totalVotes = groupedVotes;
  }

  const isDraggable = workflowState.isGroupPhase && !state.isMarkedForDeletion;
  const showVoteButton = workflowState.isVotePhase;
  const showVotes = showVoteButton || workflowState.isActPhase;

  const groupItemsCount = (props.groupedItemProps?.groupedCount ?? 0) + 1;
  const currentColumnItems = props.columns[props.columnId]?.columnItems;
  const itemPosition = currentColumnItems ? currentColumnItems.findIndex(columnItem => columnItem.feedbackItem.id === props.id) + 1 : 0;
  const totalItemsInColumn = currentColumnItems?.length || 0;

  const hideFeedbackItems = props.workflowPhase === "Collect" && props.hideFeedbackItems && props.userIdRef !== getUserIdentity().id;
  const displayTitle = hideFeedbackItems ? "[Hidden Feedback]" : props.title;

  let ariaLabel = `Feedback item ${itemPosition} of ${totalItemsInColumn}. `;
  if (!isNotGroupedItem) {
    ariaLabel = isMainItem ? `Feedback group main item ${itemPosition} of ${totalItemsInColumn}. Group has ${groupItemsCount} items. ` : `Grouped feedback item. `;
  }
  ariaLabel += `Title: ${displayTitle}. `;
  if (props.createdBy && !hideFeedbackItems) {
    ariaLabel += `Created by ${props.createdBy}. `;
  }
  if (props.createdDate) {
    const creationDate = new Intl.DateTimeFormat("default", { year: "numeric", month: "long", day: "numeric" }).format(new Date(props.createdDate));
    ariaLabel += `Created on ${creationDate}. `;
  }
  if (showVotes) {
    ariaLabel += `${totalVotes} total votes.`;
    if (showVoteButton) {
      ariaLabel += ` You have ${votesByUser} votes on this item.`;
    }
  }

  const curTimerState = props.timerState;

  return (
    <div
      ref={itemElementRef}
      data-feedback-item-id={props.id}
      tabIndex={0}
      aria-live="polite"
      aria-label={ariaLabel}
      aria-hidden={hideFeedbackItems || undefined}
      role="article"
      aria-roledescription={isNotGroupedItem ? "feedback item" : isMainItem ? "feedback group" : "grouped feedback item"}
      className={cn(isNotGroupedItem && "feedbackItem", !isNotGroupedItem && "feedbackItemGroupItem", !isNotGroupedItem && !isMainItem && "feedbackItemGroupGroupedItem", props.showAddedAnimation && "newFeedbackItem", state.isMarkedForDeletion && "removeFeedbackItem", hideFeedbackItems && "hideFeedbackItem")}
      draggable={isDraggable}
      onDragStart={dragFeedbackItemStart}
      onDragOver={isNotGroupedItem ? dragFeedbackItemOverFeedbackItem : undefined}
      onDragEnd={dragFeedbackItemEnd}
      onDrop={isNotGroupedItem ? dropFeedbackItemOnFeedbackItem : undefined}
      onKeyDown={trackActivity}
      onMouseMove={trackActivity}
      onTouchStart={trackActivity}
      onAnimationEnd={async () => {
        if (state.isMarkedForDeletion) {
          if (state.isLocalDelete) {
            removeFeedbackItem(props.id, true);
          } else {
            removeFeedbackItem(props.id, false);
          }

          if (props.groupedItemProps && !props.groupedItemProps.isMainItem) {
            const updatedItem = await itemDataService.getFeedbackItem(props.boardId, props.groupedItemProps.parentItemId);
            props.refreshFeedbackItems([updatedItem], true);
          }
        }
      }}
    >
      <div className="document-card-wrapper">
        <DocumentCard className={cn("feedback-card-surface", isMainItem && "mainItemCard", !isMainItem && "groupedItemCard")} draggable={isDraggable}>
          <div className="card-integral-part" style={{ borderLeftColor: props.accentColor }}>
            <div className="card-header">
              {mainGroupedItemInFocusMode && renderGroupButton(groupItemsCount, true)}
              {mainGroupedItemNotInFocusMode && renderGroupButton(groupItemsCount, false)}
              {showVotes && (
                <>
                  <button
                    title="Vote"
                    aria-live="polite"
                    aria-label={`Vote up. Current vote count is ${props.upvotes}`}
                    tabIndex={-1}
                    data-card-control="true"
                    disabled={!showVoteButton || state.showVotedAnimation}
                    className={cn("feedback-action-button", "feedback-add-vote", state.showVotedAnimation && "voteAnimation")}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setStateMerge({ showVotedAnimation: true });
                      onVote(props.id, false).then(() => props.onVoteCasted());
                    }}
                    onAnimationEnd={() => {
                      setStateMerge({ showVotedAnimation: false });
                    }}
                  >
                    {getIconElement("arrow-circle-up")}
                  </button>
                  <span className="feedback-vote-count">{totalVotes.toString()}</span>
                  <button
                    title="Unvote"
                    aria-live="polite"
                    aria-label={`Vote down. Current vote count is ${props.upvotes}`}
                    tabIndex={-1}
                    data-card-control="true"
                    disabled={!showVoteButton || state.showVotedAnimation}
                    className={cn("feedback-action-button", "feedback-add-vote", state.showVotedAnimation && "voteAnimation")}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setStateMerge({ showVotedAnimation: true });
                      onVote(props.id, true).then(() => props.onVoteCasted());
                    }}
                    onAnimationEnd={() => {
                      setStateMerge({ showVotedAnimation: false });
                    }}
                  >
                    {getIconElement("arrow-circle-down")}
                  </button>
                </>
              )}
              {!props.newlyCreated && (
                <div className="item-actions-menu relative">
                  <button
                    ref={mobileActionsButtonRef}
                    className="contextual-menu-button"
                    aria-label="Feedback options menu"
                    aria-expanded={!state.isMobileFeedbackItemActionsDialogHidden}
                    aria-haspopup="menu"
                    aria-controls={`feedback-item-actions-${props.id}`}
                    data-card-control="true"
                    tabIndex={-1}
                    title="Feedback actions"
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleMobileFeedbackItemActionsMenu();
                    }}
                  >
                    <MoreVerticalIcon />
                  </button>
                  {!state.isMobileFeedbackItemActionsDialogHidden && (
                    <div ref={mobileActionsMenuRef} id={`feedback-item-actions-${props.id}`} className="callout-menu right" role="menu" aria-label="Feedback actions">
                      {feedbackItemEllipsisMenuItems
                        .filter(menuItem => !(isMainItem && menuItem.hideMainItem))
                        .map(menuItem => {
                          const disabled = menuItem.key === "deleteFeedback" && state.isDeletionDisabled;
                          return (
                            <button
                              key={menuItem.key}
                              disabled={disabled}
                              aria-label={menuItem.text}
                              title={menuItem.title}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                hideMobileFeedbackItemActionsDialog();
                                menuItem.onClick?.();
                              }}
                            >
                              {getIconElement(menuItem.iconName)}
                              {menuItem.text}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="card-content">
              {workflowState.isActPhase && isMainItem && <FeedbackItemTimer feedbackItemId={props.id} timerSecs={props.timerSecs} timerState={curTimerState} onTimerToggle={timerSwitch} />}
              <EditableDocumentCardTitle isDisabled={hideFeedbackItems} isMultiline={true} title={displayTitle} isChangeEventRequired={false} onSave={onDocumentCardTitleSave} />
              {props.isFocusModalHidden && !workflowState.isCollectPhase && props.columnId !== props.originalColumnId && <div className="original-column-info">Original Column: {props.columns[props.originalColumnId]?.columnProperties?.title ?? "n/a"}</div>}
            </div>
            {feedbackCreationInformationContent()}
            <div className="card-footer">
              <div className="card-id">#{itemPosition}</div>
              {showVoteButton && <div>{isNotGroupedItem || !isMainItem || (isMainItem && props.groupedItemProps?.isGroupExpanded) ? <span className="feedback-yourvote-count">[My Votes: {votesByUser}]</span> : <span className="feedback-yourvote-count bold">[My Votes: {groupedVotesByUser}]</span>}</div>}
            </div>
          </div>
          {isGroupedCarouselItem && isMainItem && state.isShowingGroupedChildrenTitles && <GroupedFeedbackList childrenIds={childrenIds} columnItems={columnItems} columns={props.columns} currentColumnId={props.columnId} hideFeedbackItems={props.hideFeedbackItems} isFocusModalHidden={props.isFocusModalHidden} />}
          <div className="action-items">{workflowState.isActPhase && <ActionItemDisplay feedbackItemId={props.id} feedbackItemTitle={displayTitle} team={props.team} boardId={props.boardId} boardTitle={props.boardTitle} defaultAreaPath={props.defaultActionItemAreaPath} defaultIteration={props.defaultActionItemIteration} actionItems={props.actionItems} onUpdateActionItem={onUpdateActionItem} nonHiddenWorkItemTypes={props.nonHiddenWorkItemTypes} allWorkItemTypes={props.allWorkItemTypes} allowAddNewActionItem={isMainItem} />}</div>
        </DocumentCard>
      </div>
      <dialog ref={deleteFeedbackDialogRef} className="delete-feedback-item-dialog" aria-label="Delete Feedback" onClose={() => setStateMerge({ isDeleteItemConfirmationDialogHidden: true })}>
        <div className="header">
          <h2 className="title">Delete Feedback</h2>
          <button onClick={hideDeleteItemConfirmationDialog} aria-label="Close">
            {getIconElement("close")}
          </button>
        </div>
        <div className="subText">
          {`Are you sure you want to delete the feedback "${displayTitle}"?`}
          {!isNotGroupedItem && isMainItem ? " Any feedback grouped underneath this one will be ungrouped." : ""}
        </div>
        <div className="inner">
          <button className="button" onClick={onConfirmDeleteFeedbackItem}>
            Delete
          </button>
          <button className="default button" onClick={hideDeleteItemConfirmationDialog}>
            Cancel
          </button>
        </div>
      </dialog>
      <dialog ref={moveFeedbackDialogRef} className="move-feedback-item-dialog" aria-label="Move Feedback to Different Column" onClose={() => setStateMerge({ isMoveFeedbackItemDialogHidden: true })}>
        <div className="header">
          <h2 className="title">Move Feedback to Different Column</h2>
          <button onClick={hideMoveFeedbackItemDialog} aria-label="Close">
            {getIconElement("close")}
          </button>
        </div>
        <div className="subText">Choose the column you want to move this feedback to</div>
        <div className="inner">
          {props.columnIds
            .filter(columnId => columnId != props.columnId)
            .map(columnId => (
              <button
                key={columnId}
                className="move-feedback-item-column-button"
                type="button"
                onClick={() => {
                  props.moveFeedbackItem(props.refreshFeedbackItems, props.boardId, props.id, columnId);
                  hideMoveFeedbackItemDialog();
                }}
              >
                {getIconElement(props.columns[columnId].columnProperties.iconClass)}
                {props.columns[columnId].columnProperties.title}
              </button>
            ))}
          <button className="default button" onClick={hideMoveFeedbackItemDialog}>
            Cancel
          </button>
        </div>
      </dialog>
      <Dialog hidden={state.isGroupFeedbackItemDialogHidden} maxWidth={600} minWidth={600} onDismiss={hideGroupFeedbackItemDialog} dialogContentProps={{ type: DialogType.close, title: "Group Feedback" }} modalProps={{ isBlocking: false, containerClassName: "retrospectives-group-feedback-item-dialog", className: "retrospectives-dialog-modal" }}>
        <label className="ms-Dialog-subText" htmlFor="feedback-item-search-input">
          Search and select the feedback under which to group the current feedback.
        </label>
        <SearchBox id="feedback-item-search-input" autoFocus={true} placeholder="Enter the feedback title" aria-label="Enter the feedback title" onChange={handleFeedbackItemSearchInputChange} />
        <div className="output-container">
          {!state.searchedFeedbackItems.length && state.searchTerm && <p className="no-matching-feedback-message">No feedback with title containing your input.</p>}
          {state.searchedFeedbackItems.map((searchItem, index) => {
            const searchItemColumn = props.columns[searchItem.columnId];
            const feedbackItemProps: IFeedbackItemProps = {
              id: searchItem.id,
              title: searchItem.title,
              columnProps: props.columnProps,
              columns: props.columns,
              columnIds: props.columnIds,
              lastEditedDate: searchItem.modifiedDate ? String(searchItem.modifiedDate) : "",
              createdDate: String(searchItem.createdDate),
              upvotes: searchItem.upvotes,
              accentColor: searchItemColumn?.columnProperties?.accentColor ?? props.accentColor,
              icon: getIconElement(searchItemColumn?.columnProperties?.iconClass) ?? props.icon,
              workflowPhase: props.workflowPhase,
              originalColumnId: searchItem.originalColumnId,
              team: props.team,
              columnId: searchItem.columnId,
              boardId: searchItem.boardId,
              boardTitle: props.boardTitle,
              defaultActionItemAreaPath: props.defaultActionItemAreaPath,
              defaultActionItemIteration: props.defaultActionItemIteration,
              actionItems: [],
              showAddedAnimation: props.showAddedAnimation,
              newlyCreated: props.newlyCreated,
              nonHiddenWorkItemTypes: props.nonHiddenWorkItemTypes,
              allWorkItemTypes: props.allWorkItemTypes,
              shouldHaveFocus: props.shouldHaveFocus,
              hideFeedbackItems: props.hideFeedbackItems,
              userIdRef: searchItem.userIdRef,
              timerSecs: searchItem.timerSecs,
              timerState: searchItem.timerState,
              timerId: searchItem.timerId,
              groupCount: searchItem.childFeedbackItemIds?.length,
              groupIds: searchItem.childFeedbackItemIds ?? [],
              isGroupedCarouselItem: searchItem.isGroupedCarouselItem,
              isShowingGroupedChildrenTitles: false,
              isFocusModalHidden: true,
              onVoteCasted: props.onVoteCasted,
              activeTimerFeedbackItemId: props.activeTimerFeedbackItemId,
              requestTimerStart: props.requestTimerStart,
              notifyTimerStopped: props.notifyTimerStopped,
              addFeedbackItems: props.addFeedbackItems,
              removeFeedbackItemFromColumn: props.removeFeedbackItemFromColumn,
              refreshFeedbackItems: props.refreshFeedbackItems,
              moveFeedbackItem: props.moveFeedbackItem,
            };

            return (
              <button key={searchItem.id} className="feedback-item-search-result-item" onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => clickSearchedFeedbackItem(e, feedbackItemProps)} onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => pressSearchedFeedbackItem(e, feedbackItemProps)} tabIndex={index}>
                <FeedbackItem {...feedbackItemProps} />
              </button>
            );
          })}
        </div>
      </Dialog>
      <dialog ref={removeFeedbackFromGroupDialogRef} className="remove-feedback-item-from-group-dialog" aria-label="Remove Feedback from Group" onClose={() => setStateMerge({ isRemoveFeedbackItemFromGroupConfirmationDialogHidden: true })}>
        <div className="header">
          <h2 className="title">Remove Feedback from Group</h2>
          <button onClick={hideRemoveFeedbackItemFromGroupConfirmationDialog} aria-label="Close">
            {getIconElement("close")}
          </button>
        </div>
        <div className="subText">{`Are you sure you want to remove the feedback "${displayTitle}" from its current group?`}</div>
        <div className="inner">
          <button className="button" onClick={onConfirmRemoveFeedbackItemFromGroup}>
            Remove Feedback from Group
          </button>
          <button className="default button" onClick={hideRemoveFeedbackItemFromGroupConfirmationDialog}>
            Cancel
          </button>
        </div>
      </dialog>
    </div>
  );
});

FeedbackItem.displayName = "FeedbackItem";

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

export default FeedbackItem;
