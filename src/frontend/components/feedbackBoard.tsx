import React from "react";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { WorkItem, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";

import { workService } from "../dal/azureDevOpsWorkService";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { itemDataService } from "../dal/itemDataService";
import { reflectBackendService } from "../dal/reflectBackendService";
import FeedbackColumn from "./feedbackColumn";
import { IFeedbackBoardDocument, IFeedbackColumn, IFeedbackItemDocument } from "../interfaces/feedback";
import { ExceptionCode } from "../interfaces/retrospectiveState";
import { WorkflowPhase } from "../interfaces/workItem";

import FeedbackCarousel from "./feedbackCarousel";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { appInsights, reactPlugin } from "../utilities/telemetryClient";
import KeyboardShortcutsDialog from "./keyboardShortcutsDialog";

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
  isCarouselDialogHidden: boolean;
  hideCarouselDialog: () => void;
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

export interface FeedbackBoardState {
  isDataLoaded: boolean;
  columns: { [id: string]: IColumn };
  columnIds: string[];
  hasItems: boolean;
  defaultActionItemIteration: string;
  defaultActionItemAreaPath: string;
  columnNotes: { [columnId: string]: string };
  focusedColumnIndex: number;
  isKeyboardShortcutsDialogOpen: boolean;
  activeTimerFeedbackItemId: string | null;
}

class FeedbackBoard extends React.Component<FeedbackBoardProps, FeedbackBoardState> {
  private columnRefs: React.RefObject<FeedbackColumn>[] = [];
  private carouselDialogRef: HTMLDialogElement | null = null;

  constructor(props: FeedbackBoardProps) {
    super(props);

    this.state = {
      columnIds: [],
      columns: {},
      defaultActionItemAreaPath: "",
      defaultActionItemIteration: "",
      hasItems: false,
      isDataLoaded: false,
      columnNotes: {},
      focusedColumnIndex: 0,
      isKeyboardShortcutsDialogOpen: false,
      activeTimerFeedbackItemId: null,
    };
  }

  public async componentDidMount() {
    this.initColumns();
    await this.getAllBoardFeedbackItems();
    this.setDefaultIterationAndAreaPath(this.props.team.id);

    // listen for signals for work item updates.
    reflectBackendService.onReceiveNewItem(this.receiveNewItemHandler);
    reflectBackendService.onReceiveUpdatedItem(this.receiveUpdatedItemHandler);

    this.setupKeyboardShortcuts();
  }

  private openDialog(dialog: HTMLDialogElement) {
    // Use showModal if available (browser), otherwise just set open attribute (for tests)
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  private closeDialog(dialog: HTMLDialogElement) {
    // Use close if available (browser), otherwise just remove open attribute (for tests)
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  public async componentDidUpdate(prevProps: FeedbackBoardProps) {
    // Handle dialog state changes
    if (this.carouselDialogRef) {
      if (!this.props.isCarouselDialogHidden && !this.carouselDialogRef.open) {
        this.openDialog(this.carouselDialogRef);
      } else if (this.props.isCarouselDialogHidden && this.carouselDialogRef.open) {
        this.closeDialog(this.carouselDialogRef);
      }
    }

    if (prevProps.board.id !== this.props.board.id) {
      this.setState({
        isDataLoaded: false,
        columns: {},
        columnIds: [],
        hasItems: false,
        columnNotes: {},
        activeTimerFeedbackItemId: null,
      });
      this.initColumns();
      await this.getAllBoardFeedbackItems();
    }

    if (prevProps.board.modifiedDate !== this.props.board.modifiedDate) {
      this.setState({ columnNotes: {}, activeTimerFeedbackItemId: null });
      this.initColumns();
      await this.getAllBoardFeedbackItems();
    }

    if (prevProps.team.id !== this.props.team.id) {
      await this.setDefaultIterationAndAreaPath(this.props.team.id);
    }
  }

  private setupKeyboardShortcuts = () => {
    document.addEventListener("keydown", this.handleBoardKeyDown);
  };

  private getColumnIndexFromElement = (element: Element | null): number | null => {
    if (!element) {
      return null;
    }

    const columnElement = element.closest("[data-column-id]");
    const columnId = columnElement?.getAttribute("data-column-id");
    if (!columnId) {
      return null;
    }

    const index = this.state.columnIds.indexOf(columnId);
    return index >= 0 ? index : null;
  };

  private handleBoardKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable || document.querySelector('[role="dialog"]')) {
      return;
    }

    const targetColumnIndex = this.getColumnIndexFromElement(target) ?? this.getColumnIndexFromElement(document.activeElement) ?? this.state.focusedColumnIndex;

    switch (e.key) {
      case "?":
        e.preventDefault();
        this.setState({ isKeyboardShortcutsDialogOpen: true });
        break;
      case "ArrowUp":
        if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.defaultPrevented) {
          e.preventDefault();
          this.columnRefs[targetColumnIndex]?.current?.navigateByKeyboard("prev");
        }
        break;
      case "ArrowDown":
        if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.defaultPrevented) {
          e.preventDefault();
          this.columnRefs[targetColumnIndex]?.current?.navigateByKeyboard("next");
        }
        break;
      case "ArrowLeft":
        if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          this.navigateToColumn("prev");
        }
        break;
      case "ArrowRight":
        if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          this.navigateToColumn("next");
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
          const columnIndex = parseInt(e.key, 10) - 1;
          if (columnIndex < this.state.columnIds.length) {
            e.preventDefault();
            this.navigateToColumnByIndex(columnIndex);
          }
        }
        break;
    }
  };

  private navigateToColumn = (direction: "next" | "prev") => {
    const { focusedColumnIndex, columnIds } = this.state;
    let newIndex = focusedColumnIndex;

    if (direction === "next") {
      newIndex = (focusedColumnIndex + 1) % columnIds.length;
    } else {
      newIndex = (focusedColumnIndex - 1 + columnIds.length) % columnIds.length;
    }

    this.navigateToColumnByIndex(newIndex);
  };

  private navigateToColumnByIndex = (index: number) => {
    if (index < 0 || index >= this.columnRefs.length) {
      return;
    }

    const columnRef = this.columnRefs[index];

    this.setState({ focusedColumnIndex: index }, () => {
      columnRef?.current?.focusColumn();
    });
  };

  private closeKeyboardShortcutsDialog = () => {
    this.setState({ isKeyboardShortcutsDialogOpen: false });
  };

  public async componentWillUnmount() {
    reflectBackendService.removeOnReceiveNewItem(this.receiveNewItemHandler);
    reflectBackendService.removeOnReceiveUpdatedItem(this.receiveUpdatedItemHandler);
    document.removeEventListener("keydown", this.handleBoardKeyDown);
  }

  private readonly receiveNewItemHandler = async (columnId: string, feedbackItemId: string) => {
    const newItem = await itemDataService.getFeedbackItem(this.props.board.id, feedbackItemId);
    this.addFeedbackItems(columnId, [newItem], /*shouldBroadcast*/ false, /*newlyCreated*/ false, /*showAddedAnimation*/ true, /*shouldHaveFocus*/ false, this.props.hideFeedbackItems);
  };

  private readonly receiveUpdatedItemHandler = async (columnId: string, feedbackItemId: string) => {
    const updatedItem = await itemDataService.getFeedbackItem(this.props.board.id, feedbackItemId);
    this.refreshFeedbackItems([updatedItem], false);
  };

  private readonly initColumns = () => {
    const columnProperties = this.props.board.columns;

    const stateColumns: { [id: string]: IColumn } = {};
    const columnIds: string[] = new Array<string>();
    const columnNotes: { [columnId: string]: string } = {};

    this.columnRefs = columnProperties.map(() => React.createRef<FeedbackColumn>());

    columnProperties.forEach(col => {
      if (!col.iconClass) {
        col.iconClass = "fas fa-chalkboard";
      }

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
      columnIds.push(col.id);
      columnNotes[col.id] = col.notes ?? "";
    });

    this.setState({ columns: stateColumns, columnIds: columnIds, columnNotes, activeTimerFeedbackItemId: null });
  };

  private readonly handleColumnNotesChange = (columnId: string, notes: string) => {
    const previousNotes = this.state.columnNotes[columnId] ?? "";

    this.setState(previousState => {
      const updatedColumns = { ...previousState.columns };

      if (updatedColumns[columnId]) {
        updatedColumns[columnId] = {
          ...updatedColumns[columnId],
          columnProperties: {
            ...updatedColumns[columnId].columnProperties,
            notes,
          },
        };
      }

      return {
        columns: updatedColumns,
        columnNotes: {
          ...previousState.columnNotes,
          [columnId]: notes,
        },
      };
    });

    const updatePromise = this.props.onColumnNotesChange?.(columnId, notes);

    updatePromise?.catch(error => {
      appInsights.trackException(error, {
        action: "updateColumnNotes",
        boardId: this.props.board.id,
        columnId,
      });

      this.setState(previousState => {
        const revertedColumns = { ...previousState.columns };

        if (revertedColumns[columnId]) {
          revertedColumns[columnId] = {
            ...revertedColumns[columnId],
            columnProperties: {
              ...revertedColumns[columnId].columnProperties,
              notes: previousNotes,
            },
          };
        }

        return {
          columns: revertedColumns,
          columnNotes: {
            ...previousState.columnNotes,
            [columnId]: previousNotes,
          },
        };
      });
    });
  };

  private readonly getAllBoardFeedbackItems = async () => {
    const feedbackItems = await itemDataService.getFeedbackItemsForBoard(this.props.board.id);

    if (!feedbackItems) {
      this.setState({ isDataLoaded: true, activeTimerFeedbackItemId: null });
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

    this.setState(prevState => {
      columnItems.forEach(columnItem => {
        // Some columns might have been deleted. Only add items to columns that still exist.
        if (this.state.columnIds.indexOf(columnItem.feedbackItem.columnId) >= 0) {
          prevState.columns[columnItem.feedbackItem.columnId].columnItems.push(columnItem);
        }
      });

      const activeTimerFeedbackItemId = this.findActiveTimerFeedbackItemId(prevState.columns);

      return {
        columns: prevState.columns,
        hasItems: true,
        isDataLoaded: true,
        activeTimerFeedbackItemId,
      };
    });
  };

  private readonly setDefaultIterationAndAreaPath = async (teamId: string): Promise<void> => {
    let currentIterations = await workService.getIterations(teamId, "current");
    if (!currentIterations?.length) {
      // If no iterations cover the present timeframe, we simply choose an arbitrary iteration as default.
      currentIterations = await workService.getIterations(teamId);
    }

    const defaultIteration = currentIterations?.[0]?.path ?? "";

    const teamFieldValues = await workService.getTeamFieldValues(teamId);
    const defaultAreaPath = teamFieldValues?.values?.[0]?.value ?? "";

    this.setState({ defaultActionItemAreaPath: defaultAreaPath, defaultActionItemIteration: defaultIteration });
  };

  private readonly getColumnsWithReleasedFocus = (currentFeedbackBoardState: FeedbackBoardState) => {
    const resetFocusForStateColumns = { ...currentFeedbackBoardState.columns };

    for (const columnIdKey in currentFeedbackBoardState.columns) {
      if (resetFocusForStateColumns[columnIdKey].shouldFocusOnCreateFeedback) {
        resetFocusForStateColumns[columnIdKey].shouldFocusOnCreateFeedback = false;
      }

      const resetColumnItems = currentFeedbackBoardState.columns[columnIdKey].columnItems.map(columnItem => {
        return { ...columnItem, shouldHaveFocus: false };
      });

      resetFocusForStateColumns[columnIdKey].columnItems = resetColumnItems;
    }

    return resetFocusForStateColumns;
  };

  private readonly findActiveTimerFeedbackItemId = (columns: { [id: string]: IColumn }): string | null => {
    for (const columnId of Object.keys(columns)) {
      const column = columns[columnId];
      if (!column) {
        continue;
      }

      const activeItem = column.columnItems.find(columnItem => columnItem.feedbackItem.timerState);
      if (activeItem) {
        return activeItem.feedbackItem.id;
      }
    }

    return null;
  };

  private readonly findColumnItemById = (feedbackItemId: string): IColumnItem | undefined => {
    for (const columnId of this.state.columnIds) {
      const column = this.state.columns[columnId];
      if (!column) {
        continue;
      }

      const columnItem = column.columnItems.find(item => item.feedbackItem.id === feedbackItemId);
      if (columnItem) {
        return columnItem;
      }
    }

    return undefined;
  };

  private readonly stopTimerById = async (feedbackItemId: string): Promise<void> => {
    const columnItem = this.findColumnItemById(feedbackItemId);

    if (!columnItem || !columnItem.feedbackItem.timerState) {
      this.setState(previousState => {
        if (previousState.activeTimerFeedbackItemId === feedbackItemId) {
          return { activeTimerFeedbackItemId: null } as Pick<FeedbackBoardState, "activeTimerFeedbackItemId">;
        }
        return null;
      });
      return;
    }

    if (columnItem.feedbackItem.timerId !== null && columnItem.feedbackItem.timerId !== undefined) {
      window.clearInterval(columnItem.feedbackItem.timerId as number);
    }

    try {
      const updatedFeedbackItem = await itemDataService.flipTimer(this.props.board.id, feedbackItemId, null);
      if (updatedFeedbackItem) {
        await this.refreshFeedbackItems([updatedFeedbackItem], true);
      }
    } catch (error) {
      appInsights.trackException(error, {
        action: "stopTimer",
        boardId: this.props.board.id,
        feedbackItemId,
      });
    } finally {
      this.setState(previousState => {
        if (previousState.activeTimerFeedbackItemId === feedbackItemId) {
          return { activeTimerFeedbackItemId: null } as Pick<FeedbackBoardState, "activeTimerFeedbackItemId">;
        }
        return null;
      });
    }
  };

  private readonly requestTimerStart = async (feedbackItemId: string): Promise<boolean> => {
    try {
      if (this.state.activeTimerFeedbackItemId && this.state.activeTimerFeedbackItemId !== feedbackItemId) {
        await this.stopTimerById(this.state.activeTimerFeedbackItemId);
      }

      this.setState({ activeTimerFeedbackItemId: feedbackItemId });
      return true;
    } catch (error) {
      appInsights.trackException(error, {
        action: "requestTimerStart",
        boardId: this.props.board.id,
        feedbackItemId,
      });
      return false;
    }
  };

  private readonly handleTimerStopped = (feedbackItemId: string) => {
    if (this.state.activeTimerFeedbackItemId === feedbackItemId) {
      this.setState({ activeTimerFeedbackItemId: null });
    }
  };

  private readonly addFeedbackItems = (columnId: string, feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean, newlyCreated: boolean, showAddedAnimation: boolean, shouldHaveFocus: boolean, hideFeedbackItems: boolean) => {
    this.setState(previousState => {
      const firstAddedItemId = feedbackItems.length && feedbackItems[0].id;
      const resetFocusForStateColumns = this.getColumnsWithReleasedFocus(previousState);

      const updatedColumnItems = feedbackItems
        .map((feedbackItem): IColumnItem => {
          if (feedbackItem.id === firstAddedItemId) {
            return {
              actionItems: [],
              feedbackItem,
              hideFeedbackItems,
              newlyCreated,
              shouldHaveFocus,
              showAddedAnimation,
            };
          }

          return {
            actionItems: [],
            feedbackItem,
            hideFeedbackItems,
            newlyCreated,
            showAddedAnimation,
          };
        })
        .concat(resetFocusForStateColumns[columnId].columnItems);

      const newColumns = { ...resetFocusForStateColumns };
      newColumns[columnId].columnItems = updatedColumnItems;
      const activeTimerFeedbackItemId = this.findActiveTimerFeedbackItemId(newColumns);

      return {
        columns: newColumns,
        isDataLoaded: true,
        activeTimerFeedbackItemId,
      };
    });

    if (shouldBroadcast) {
      feedbackItems.forEach(columnItem => {
        reflectBackendService.broadcastNewItem(columnId, columnItem.id);
      });
    }
  };

  private readonly removeFeedbackItemFromColumn = (columnId: string, feedbackItemId: string, shouldSetFocusOnFirstAvailableItem: boolean) => {
    this.setState((previousState: FeedbackBoardState) => {
      const removedItemIndex: number = previousState.columns[columnId].columnItems.findIndex(columnItem => columnItem.feedbackItem.id === feedbackItemId);
      const updatedColumnItems = previousState.columns[columnId].columnItems.filter(columnItem => {
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
          // If no items in colummn, set focus to column"s create feedback button
          shouldFocusOnCreateFeedback = true;
        }
      }

      const resetFocusForStateColumns = this.getColumnsWithReleasedFocus(previousState);

      const newColumns = {
        ...resetFocusForStateColumns,
        [columnId]: {
          ...resetFocusForStateColumns[columnId],
          columnItems: updatedColumnItemsWithActiveFocus,
          shouldFocusOnCreateFeedback,
        },
      };

      return {
        columns: newColumns,
        activeTimerFeedbackItemId: this.findActiveTimerFeedbackItemId(newColumns),
      };
    });
  };

  private readonly refreshFeedbackItems = async (updatedFeedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean): Promise<void> => {
    if (updatedFeedbackItems.length) {
      const updatedColumnItems: IColumnItem[] = await Promise.all(
        updatedFeedbackItems.map(async feedbackItem => {
          // TODO: Optimize performance by only updating work items in action-item-related update scenario.
          const actionItems = feedbackItem.associatedActionItemIds?.length ? await workItemService.getWorkItemsByIds(feedbackItem.associatedActionItemIds) : [];

          return {
            feedbackItem,
            actionItems,
          };
        }),
      );

      this.setState(previousState => {
        const newColumnsAsList = previousState.columnIds.map(columnId => {
          return {
            key: columnId,
            value: {
              columnProperties: previousState.columns[columnId].columnProperties,
              // Update the new column items to contain
              // 1) The existing items that have not been moved. (filter)
              //    - Note that we use the updated version of these items if they are present in updatedFeedbackItems. (map)
              // 2) The new items for this column. (concat)
              columnItems: previousState.columns[columnId].columnItems
                .filter(columnItem => {
                  return !updatedColumnItems.some(item => item.feedbackItem.id === columnItem.feedbackItem.id && item.feedbackItem.columnId !== columnItem.feedbackItem.columnId);
                })
                .map(columnItem => {
                  const updatedItem = updatedColumnItems.find(item => item.feedbackItem.id === columnItem.feedbackItem.id && item.feedbackItem.columnId === columnItem.feedbackItem.columnId);
                  return updatedItem || columnItem;
                })
                .concat(
                  updatedColumnItems.filter(columnItem => {
                    return columnItem.feedbackItem.columnId === columnId && !previousState.columns[columnId].columnItems.some(existingColumnItem => columnItem.feedbackItem.id === existingColumnItem.feedbackItem.id);
                  }),
                ),
            },
          };
        });

        const emptyColumns: { [id: string]: IColumn } = {};

        const newColumns = newColumnsAsList.reduce((columns, columnsAsList) => {
          columns[columnsAsList.key] = columnsAsList.value;
          return columns;
        }, emptyColumns);

        return {
          columns: newColumns,
          activeTimerFeedbackItemId: this.findActiveTimerFeedbackItemId(newColumns),
        };
      });
    }

    if (shouldBroadcast) {
      updatedFeedbackItems.forEach(updatedFeedbackItem => {
        reflectBackendService.broadcastUpdatedItem("dummyColumn", updatedFeedbackItem.id);
      });
    }
  };

  public render() {
    if (!this.props.displayBoard) {
      return <div> An unexpected exception occurred. </div>;
    }

    const canCurrentUserEditBoard = this.props.board.createdBy?.id === this.props.userId;

    const feedbackColumnPropsList = this.state.columnIds.map((columnId, index) => {
      return {
        key: columnId,
        ref: this.columnRefs[index],
        columns: this.state.columns,
        columnIds: this.state.columnIds,
        columnName: this.state.columns[columnId].columnProperties.title,
        columnId: columnId,
        columnItems: this.state.columns[columnId].columnItems,
        accentColor: this.state.columns[columnId].columnProperties.accentColor,
        team: this.props.team,
        boardId: this.props.board.id,
        boardTitle: this.props.board.title,
        isDataLoaded: this.state.isDataLoaded,
        iconClass: this.state.columns[columnId].columnProperties.iconClass,
        workflowPhase: this.props.workflowPhase,
        addFeedbackItems: this.addFeedbackItems,
        removeFeedbackItemFromColumn: this.removeFeedbackItemFromColumn,
        refreshFeedbackItems: this.refreshFeedbackItems,
        defaultActionItemAreaPath: this.state.defaultActionItemAreaPath,
        defaultActionItemIteration: this.state.defaultActionItemIteration,
        nonHiddenWorkItemTypes: this.props.nonHiddenWorkItemTypes,
        allWorkItemTypes: this.props.allWorkItemTypes,
        isBoardAnonymous: this.props.isAnonymous,
        shouldFocusOnCreateFeedback: !!this.state.columns[columnId].shouldFocusOnCreateFeedback,
        hideFeedbackItems: this.props.hideFeedbackItems,
        isFocusModalHidden: true,
        groupIds: [] as string[],
        showColumnEditButton: !!canCurrentUserEditBoard,
        columnNotes: this.state.columnNotes[columnId] ?? "",
        onColumnNotesChange: (notes: string) => this.handleColumnNotesChange(columnId, notes),
        registerItemRef: (itemId: string, element: HTMLElement | null) => this.columnRefs[index]?.current?.registerItemRef(itemId, element),
        onVoteCasted: () => {
          if (this.props.onVoteCasted) {
            this.props.onVoteCasted();
          }
        },
        activeTimerFeedbackItemId: this.state.activeTimerFeedbackItemId,
        requestTimerStart: this.requestTimerStart,
        notifyTimerStopped: this.handleTimerStopped,
      };
    });

    return (
      <>
        <div className="feedback-board feedback-columns-container" role="main" aria-label="Feedback board with columns">
          {this.state.isDataLoaded &&
            feedbackColumnPropsList.map(columnProps => {
              return <FeedbackColumn {...columnProps} />;
            })}
        </div>
        <dialog
          ref={ref => {
            this.carouselDialogRef = ref;
          }}
          className="retrospectives-carousel-dialog"
          onClose={this.props.hideCarouselDialog}
        >
          <div className="retrospectives-carousel-dialog-content">
            <div className="ms-Dialog-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 24px 20px", borderBottom: "1px solid #edebe9" }}>
              <h2 className="ms-Dialog-title" style={{ margin: "0", fontSize: "20px", fontWeight: "600" }}>
                Focus Mode
              </h2>
              <button onClick={this.props.hideCarouselDialog} className="ms-Dialog-button ms-Dialog-button--close" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "8px", fontSize: "16px" }} aria-label="Close">
                <i className="ms-Icon ms-Icon--Cancel" aria-hidden="true"></i>
              </button>
            </div>
            <div className="ms-Dialog-subText" style={{ padding: "0 24px 20px", color: "#605e5c" }}>
              Now is the time to focus! Discuss one feedback item at a time and create actionable work items.
            </div>
            <div className="ms-Dialog-inner" style={{ padding: "0 24px 24px" }}>
              <FeedbackCarousel feedbackColumnPropsList={feedbackColumnPropsList} isFeedbackAnonymous={this.props.isAnonymous} isFocusModalHidden={this.props.isCarouselDialogHidden} />
            </div>
          </div>
        </dialog>
        <KeyboardShortcutsDialog isOpen={this.state.isKeyboardShortcutsDialogOpen} onClose={this.closeKeyboardShortcutsDialog} />
      </>
    );
  }
}

export default withAITracking(reactPlugin, FeedbackBoard);
