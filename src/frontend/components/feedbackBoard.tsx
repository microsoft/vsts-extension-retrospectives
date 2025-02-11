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

import FeedbackItemCarousel from "./feedbackCarousel";
import { Dialog, DialogType } from "office-ui-fabric-react/lib/Dialog";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";
import { encrypt } from "../utilities/userIdentityHelper";

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
  currentVoteCount: string;
}

class FeedbackBoard extends React.Component<FeedbackBoardProps, FeedbackBoardState> {
  constructor(props: FeedbackBoardProps) {
    super(props);

    console.log({props});

    this.state = {
      columnIds: [],
      columns: {},
      defaultActionItemAreaPath: "",
      defaultActionItemIteration: "",
      hasItems: false,
      isDataLoaded: false,
      currentVoteCount: (props.board.boardVoteCollection === undefined || props.board.boardVoteCollection === null) ? "0" : (props.board.boardVoteCollection[this.props.userId] === undefined || props.board.boardVoteCollection[this.props.userId] === null) ? "0" : props.board.boardVoteCollection[this.props.userId]?.toString()
    };
  }

  public async componentDidMount() {
    this.initColumns();
    await this.getAllBoardFeedbackItems();
    this.setDefaultIterationAndAreaPath(this.props.team.id);

    // listen for signals for work item updates.
    reflectBackendService.onReceiveNewItem(this.receiveNewItemHandler);
    reflectBackendService.onReceiveUpdatedItem(this.receiveUpdatedItemHandler);
  }

  public async componentDidUpdate(prevProps: FeedbackBoardProps) {
    if (prevProps.board.id !== this.props.board.id) {
      this.setState({
        isDataLoaded: false,
        columns: {},
        columnIds: [],
        hasItems: false,
      });
      this.initColumns();
      await this.getAllBoardFeedbackItems();
    }

    if (prevProps.board.modifiedDate !== this.props.board.modifiedDate) {
      this.initColumns();
      await this.getAllBoardFeedbackItems();
    }

    if (prevProps.team.id !== this.props.team.id) {
      await this.setDefaultIterationAndAreaPath(this.props.team.id);
    }
  }

  public async componentWillUnmount() {
    // Remove event listeners.
    reflectBackendService.removeOnReceiveNewItem(this.receiveNewItemHandler);
    reflectBackendService.removeOnReceiveUpdatedItem(this.receiveUpdatedItemHandler);
  }

  private readonly receiveNewItemHandler = async (columnId: string, feedbackItemId: string) => {
    const newItem = await itemDataService.getFeedbackItem(this.props.board.id, feedbackItemId);
    this.addFeedbackItems(
      columnId,
      [newItem],
      /*shouldBroadcast*/ false,
      /*newlyCreated*/ false,
      /*showAddedAnimation*/ true,
      /*shouldHaveFocus*/ false,
      this.props.hideFeedbackItems);
  }

  private readonly receiveUpdatedItemHandler = async (columnId: string, feedbackItemId: string) => {
    const updatedItem = await itemDataService.getFeedbackItem(this.props.board.id, feedbackItemId);
    this.refreshFeedbackItems([updatedItem], false);
  }

  private readonly initColumns = () => {
    const columnProperties = this.props.board.columns;

    const stateColumns: { [id: string]: IColumn } = {};
    const columnIds: string[] = new Array<string>();

    columnProperties.forEach((col) => {
      if (!col.iconClass) {
        col.iconClass = "fas fa-chalkboard";
      }

      if (!col.accentColor) {
        col.accentColor = "#0078d4";
      }

      const column: IColumn = {
        columnProperties: col,
        columnItems: [],
        shouldFocusOnCreateFeedback: false,
      };
      stateColumns[col.id] = column;
      columnIds.push(col.id);
    });

    this.setState({ columns: stateColumns, columnIds: columnIds });
  }

  private readonly getAllBoardFeedbackItems = async () => {
    const feedbackItems = await itemDataService.getFeedbackItemsForBoard(this.props.board.id);

    if (!feedbackItems) {
      this.setState({ isDataLoaded: true });
      return;
    }

    const columnItemPromises: Promise<IColumnItem>[] = feedbackItems.map(async (feedbackItem) => {
      const actionItems = feedbackItem.associatedActionItemIds?.length ? await workItemService.getWorkItemsByIds(feedbackItem.associatedActionItemIds) : [];

      return {
        actionItems,
        feedbackItem,
      };
    });

    const columnItems = await Promise.all(columnItemPromises);

    this.setState((prevState) => {
      columnItems.forEach((columnItem) => {
        // Some columns might have been deleted. Only add items to columns that still exist.
        if (this.state.columnIds.indexOf(columnItem.feedbackItem.columnId) >= 0) {
          prevState.columns[columnItem.feedbackItem.columnId].columnItems.push(columnItem);
        }
      });

      return {
        columns: prevState.columns,
        hasItems: true,
        isDataLoaded: true,
      };
    });
  }

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
  }

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
  }

  private readonly addFeedbackItems = (
    columnId: string, feedbackItems: IFeedbackItemDocument[],
    shouldBroadcast: boolean, newlyCreated: boolean, showAddedAnimation: boolean,
    shouldHaveFocus: boolean, hideFeedbackItems: boolean) => {
    this.setState((previousState) => {
      const firstAddedItemId = feedbackItems.length && feedbackItems[0].id;
      const resetFocusForStateColumns = this.getColumnsWithReleasedFocus(previousState);

      const updatedColumnItems = feedbackItems.map(
        (feedbackItem): IColumnItem => {
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
        },
      ).concat(resetFocusForStateColumns[columnId].columnItems);

      const newColumns = { ...resetFocusForStateColumns };
      newColumns[columnId].columnItems = updatedColumnItems;

      return {
        columns: newColumns,
        isDataLoaded: true,
      };
    });

    if (shouldBroadcast) {
      feedbackItems.forEach((columnItem) => {
        reflectBackendService.broadcastNewItem(
          columnId,
          columnItem.id,
        );
      });
    }
  }

  private readonly removeFeedbackItemFromColumn = (columnId: string, feedbackItemId: string, shouldSetFocusOnFirstAvailableItem: boolean) => {
    this.setState((previousState: FeedbackBoardState) => {
      const removedItemIndex: number = previousState.columns[columnId].columnItems.findIndex((columnItem) => columnItem.feedbackItem.id === feedbackItemId);
      const updatedColumnItems = previousState.columns[columnId].columnItems.filter((columnItem) => {
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
        }
        else {
          // If no items in colummn, set focus to column"s create feedback button
          shouldFocusOnCreateFeedback = true;
        }
      }

      const resetFocusForStateColumns = this.getColumnsWithReleasedFocus(previousState);

      return {
        columns: {
          ...resetFocusForStateColumns,
          [columnId]: {
            ...resetFocusForStateColumns[columnId],
            columnItems: updatedColumnItemsWithActiveFocus,
            shouldFocusOnCreateFeedback,
          }
        }
      };
    });
  }

  private readonly refreshFeedbackItems = async (updatedFeedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean): Promise<void> => {
    if (updatedFeedbackItems.length) {
      const updatedColumnItems: IColumnItem[] = await Promise.all(updatedFeedbackItems.map(async (feedbackItem) => {
        // TODO: Optimize performance by only updating work items in action-item-related update scenario.
        const actionItems = feedbackItem.associatedActionItemIds?.length ? await workItemService.getWorkItemsByIds(feedbackItem.associatedActionItemIds) : [];

        return {
          feedbackItem,
          actionItems,
        };
      }));

      this.setState((previousState) => {
        const newColumnsAsList = previousState.columnIds.map((columnId) => {
          return {
            key: columnId,
            value: {
              columnProperties: previousState.columns[columnId].columnProperties,
              // Update the new column items to contain
              // 1) The existing items that have not been moved. (filter)
              //    - Note that we use the updated version of these items if they are present in updatedFeedbackItems. (map)
              // 2) The new items for this column. (concat)
              columnItems: previousState.columns[columnId].columnItems
                .filter((columnItem) => {
                  return !updatedColumnItems.some((item) => (item.feedbackItem.id === columnItem.feedbackItem.id && item.feedbackItem.columnId !== columnItem.feedbackItem.columnId));
                })
                .map((columnItem) => {
                  const updatedItem = updatedColumnItems.find((item) => (item.feedbackItem.id === columnItem.feedbackItem.id && item.feedbackItem.columnId === columnItem.feedbackItem.columnId));
                  return updatedItem || columnItem;
                })
                .concat(updatedColumnItems.filter((columnItem) => {
                  return columnItem.feedbackItem.columnId === columnId &&
                    !previousState.columns[columnId].columnItems.some((existingColumnItem) => columnItem.feedbackItem.id === existingColumnItem.feedbackItem.id);
                })),
            }
          };
        });

        const emptyColumns: { [id: string]: IColumn } = {};

        const newColumns = newColumnsAsList.reduce(
          (columns, columnsAsList) => {
            columns[columnsAsList.key] = columnsAsList.value;
            return columns;
          },
          emptyColumns);

        return {
          columns: newColumns
        };
      });
    }

    if (shouldBroadcast) {
      updatedFeedbackItems.forEach(updatedFeedbackItem => {
        reflectBackendService.broadcastUpdatedItem("dummyColumn", updatedFeedbackItem.id);
      });
    }
  }

  public render() {
    if (!this.props.displayBoard) {
      return (<div> An unexpected exception occurred. </div>);
    }

    const feedbackColumnPropsList = this.state.columnIds.map((columnId) => {
      return {
        key: columnId,
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
        onVoteCasted: () => {
          itemDataService.getBoardItem(this.props.team.id, this.props.board.id).then((boardItem: IFeedbackBoardDocument) => {
            const voteCollection = boardItem.boardVoteCollection;
            const userId = encrypt(this.props.userId);

            this.setState({ currentVoteCount: voteCollection === undefined ? "0" : voteCollection[userId] === undefined ? "0" : voteCollection[userId].toString() });
          });
        },
      };
    });

    return (
      <div className="feedback-board">
        {this.props.workflowPhase === WorkflowPhase.Vote &&
          <div className="feedback-maxvotes-per-user">
            <label>Votes Used: {this.state.currentVoteCount} / {this.props.board?.maxVotesPerUser?.toString()}</label>
          </div>
        }
        <div className="feedback-columns-container">
          {this.state.isDataLoaded && feedbackColumnPropsList.map((columnProps) => { return (<FeedbackColumn {...columnProps} />); })}
        </div>
        <Dialog
          hidden={this.props.isCarouselDialogHidden}
          onDismiss={this.props.hideCarouselDialog}
          minWidth={900}
          dialogContentProps={{
            type: DialogType.close,
            title: "Focus Mode",
            subText: "Now is the time to focus! Discuss one feedback item at a time and create actionable work items",
          }}
          modalProps={{
            containerClassName: "retrospectives-carousel-dialog",
            className: "retrospectives-carousel-dialog-modal hide-mobile",
            isBlocking: true
          }}>
          <FeedbackItemCarousel
            feedbackColumnPropsList={feedbackColumnPropsList} isFeedbackAnonymous={this.props.isAnonymous}
            isFocusModalHidden={this.props.isCarouselDialogHidden}
          />
        </Dialog>
      </div>);
  }
}

export default withAITracking(reactPlugin, FeedbackBoard);
