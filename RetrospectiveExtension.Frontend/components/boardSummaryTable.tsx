import * as React from 'react';
import { IFeedbackBoardDocument } from '../interfaces/feedback';
import BoardDataService from '../dal/boardDataService';
import { WorkItem, WorkItemType, WorkItemStateColor } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';
import { itemDataService } from '../dal/itemDataService';
import { workItemService } from '../dal/azureDevOpsWorkItemService';
import BoardSummary from './boardSummary';
// TODO (enpolat) : import { appInsightsClient } from '../utilities/appInsightsClient';
import classNames from 'classnames';

import ReactTable from 'react-table-6';

import 'react-table-6/react-table.css'
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/external/telemetryClient';

export interface IBoardSummaryTableProps {
  teamId: string;
  supportedWorkItemTypes: WorkItemType[];
}

export interface IBoardSummaryTableState {
  boardsTableItems: IBoardSummaryTableItem[];
  feedbackBoards: IFeedbackBoardDocument[];
  isDataLoaded: boolean;
  actionItemsByBoard: IActionItemsTableItems;
  allDataLoaded: boolean;
}

export interface IBoardSummaryTableItem {
  boardName: string;
  createdDate: Date;
  pendingWorkItemsCount: number;
  totalWorkItemsCount: number;
  feedbackItemsCount: number;
  id: string;
}

export interface IBoardActionItemsData {
  isDataLoaded: boolean;
  actionItems: WorkItem[];
}

export interface IActionItemsTableItems {
  [key: string]: IBoardActionItemsData;
}

class BoardSummaryTable extends React.Component<IBoardSummaryTableProps, IBoardSummaryTableState> {
  constructor(props: IBoardSummaryTableProps) {
    super(props);

    this.state = {
      boardsTableItems: new Array<IBoardSummaryTableItem>(),
      isDataLoaded: false,
      feedbackBoards: new Array<IFeedbackBoardDocument>(),
      actionItemsByBoard: {},
      allDataLoaded: false,
    };
  }

  public async componentDidMount() {
    try {
      await this.setBoardsTable();
      await this.setActionItems();
    }
    catch (e) {
      // TODO: Better error handling.
      // TODO (enpolat) : appInsightsClient.trackException(e);
    }
  }

  public async componentDidUpdate(prevProps: IBoardSummaryTableProps) {
    if (prevProps.teamId !== this.props.teamId) {
      await this.setBoardsTable();
      await this.setActionItems();
    }
  }

  // TODO: Add live update support.
  private setBoardsTable = async () => {
    const boardsForTeam = await BoardDataService.getBoardsForTeam(this.props.teamId);
    if (!boardsForTeam || boardsForTeam.length === 0) {
      this.setState({ isDataLoaded: true, boardsTableItems: [] });
      return;
    }

    this.setState(() => {
      const boardsTableItems = new Array<IBoardSummaryTableItem>();
      const actionItems: IActionItemsTableItems = {};

      boardsForTeam.forEach(board => {
        const boardSummaryItem: IBoardSummaryTableItem = {
          boardName: board.title,
          createdDate: new Date(board.createdDate),
          pendingWorkItemsCount: 0,
          totalWorkItemsCount: 0,
          id: board.id,
          feedbackItemsCount: 0,
        };

        boardsTableItems.push(boardSummaryItem);

        const actionItemsForBoard = new Array<WorkItem>();
        actionItems[board.id] = {
          isDataLoaded: false,
          actionItems: actionItemsForBoard,
        };
      });

      boardsTableItems.sort((b1, b2) => {
        return (new Date(b2.createdDate).getTime() - new Date(b1.createdDate).getTime());
      });

      return {
        boardsTableItems: boardsTableItems,
        isDataLoaded: true,
        feedbackBoards: boardsForTeam,
        actionItemsByBoard: actionItems,
      };
    });
  }

  private setActionItems = async () => {
    const feedbackBoards = this.state.feedbackBoards;

    await Promise.all(feedbackBoards.map(async (feedbackBoard) => {
      await this.setBoardStats(feedbackBoard.id);
    }));

    this.setState({
      allDataLoaded: true,
    });
  };

  private setBoardStats = async (feedbackBoardId: string) => {
    const feedbackItems = await itemDataService.getFeedbackItemsForBoard(feedbackBoardId);

    if (!feedbackItems || !feedbackItems.length) {
      return;
    }

    const workItemTypeToStatesMap: { [key: string]: WorkItemStateColor[] } = {};

    await Promise.all(this.props.supportedWorkItemTypes.map(async (workItemType) => {
      const workItemTypeStates = await workItemService.getWorkItemStates(workItemType.name);
      workItemTypeToStatesMap[workItemType.name] = workItemTypeStates;
    }));

    await Promise.all(feedbackItems.map(async (feedbackItem) => {
      if (!feedbackItem.associatedActionItemIds || !feedbackItem.associatedActionItemIds.length) {
        return;
      }

      const workItems = await workItemService.getWorkItemsByIds(feedbackItem.associatedActionItemIds);
      if (!workItems || !workItems.length) {
        return
      }

      this.setState(prevState => {
        const updatedActionItemsForBoard = prevState.actionItemsByBoard[feedbackBoardId];
        const updatedItems = updatedActionItemsForBoard.actionItems.concat(workItems);
        updatedActionItemsForBoard.actionItems = updatedItems;
        updatedActionItemsForBoard.isDataLoaded = true;

        const pendingWorkItems = updatedItems.map((updatedItem) => {
          const states = workItemTypeToStatesMap[updatedItem.fields['System.WorkItemType']].filter((workItemState) => workItemState.name === updatedItem.fields['System.State']);
          if (states.length) {
            return states[0];
          }

          return null;
        }).filter((workItemState) => {
          return !workItemState || (workItemState.category !== 'Completed' && workItemState.category !== 'Removed');
        });

        const pendingWorkItemsCount = pendingWorkItems.length;
        const totalWorkItemsCount = updatedItems.length;

        const currentTableItemsToUpdate =
          prevState.boardsTableItems.map(
            item => item.id === feedbackBoardId ?
              {
                ...item,
                feedbackItemsCount: feedbackItems.length,
                pendingWorkItemsCount: pendingWorkItemsCount,
                totalWorkItemsCount: totalWorkItemsCount
              } :
              item);

        return {
          actionItemsByBoard: prevState.actionItemsByBoard,
          boardsTableItems: currentTableItemsToUpdate,
        };
      })
    }));

    this.setState(prevState => {
      return {
        boardsTableItems: prevState.boardsTableItems.map(item => item.id === feedbackBoardId ?
          {
            ...item,
            feedbackItemsCount: feedbackItems.length
          } : item),
      };
    });
  };

  renderActionItemsSummary = (
    isCurrentDataLoaded: boolean,
    isAllDataLoaded: boolean,
    actionItems: WorkItem[],
    pendingWorkItemsCount: number,
    resolvedActionItemsCount: number,
    boardName: string,
    feedbackItemsCount: number) => {
    return (<BoardSummary
      actionItems={actionItems}
      isDataLoaded={isCurrentDataLoaded || isAllDataLoaded}
      pendingWorkItemsCount={pendingWorkItemsCount}
      resolvedActionItemsCount={resolvedActionItemsCount}
      boardName={boardName}
      feedbackItemsCount={feedbackItemsCount}
      supportedWorkItemTypes={this.props.supportedWorkItemTypes}
    />);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private expandSummaryRow = (state: any, rowInfo: any, instance: any) => {
    const { expanded } = state;
    const path = rowInfo.nestingPath[0];
    const diff = { [path]: expanded[path] ? false : true };

    instance.setState({
      expanded: {
        ...expanded,
        ...diff
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getTrProps = (state: any, rowInfo: any, col: any, instance: any) => {
    return {
      onClick: () => {
        this.expandSummaryRow(state, rowInfo, instance);
      },
      tabIndex: 0,
      'aria-label': 'Board summary row. Click row to expand and view more statistics for this board.',
      onKeyPress: (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          this.expandSummaryRow(state, rowInfo, instance);
        }
      },
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getTdProps = (state: any, rowInfo: any, col: any) => {
    const hasPendingItems: boolean =
      (rowInfo && rowInfo.original && rowInfo.original.pendingWorkItemsCount && rowInfo.original.pendingWorkItemsCount > 0) ?
        true : false;

    const isPendingCountColumn = col && col.id === 'pendingWorkItemsCount';
    const ariaLabel = col && col.Header && col.id && rowInfo && rowInfo.original && rowInfo.original[col.id] ? col.Header + ' ' + rowInfo.original[col.id] : '';

    return {
      className: (hasPendingItems && isPendingCountColumn) ? 'pending-action-item-count' : '',
      'aria-label': ariaLabel,
      'aria-readonly': true
    };
  };

  private getTableProps = () => {
    return {
      tabIndex: 0
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getCustomTbodyComponent = (props: any) => (
    <div {...props} className={classNames("rt-tbody", props.className || [])}>
      {props.children}
    </div>
  );

  public render() {
    return (
        <div className="board-summary-table-container">
        {/*
         // @ts-ignore TS2786 */}
        <ReactTable
          data={this.state.boardsTableItems}
          TbodyComponent={this.getCustomTbodyComponent}
          columns={[
            {
              Header: 'Retrospective Name',
              accessor: 'boardName',
            },
            {
              Header: 'Created Date',
              accessor: 'createdDate',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Cell: (row: any) => {
                return (
                  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(row.original.createdDate)
                )
              },
              width: 175,
            },
            {
              Header: 'Pending Work Items',
              accessor: 'pendingWorkItemsCount',
              width: 170,
            },
            {
              Header: 'Total Work Items',
              accessor: 'totalWorkItemsCount',
              width: 170,
            },
          ]}
          defaultSorted={[
            {
              id: "createdDate",
              desc: true
            }
          ]}
          pageSize={this.state.boardsTableItems.length}
          showPagination={false}
          loading={!this.state.allDataLoaded}
          className="-striped -highlight"
          getTrProps={this.getTrProps}
          getTdProps={this.getTdProps}
          getTableProps={this.getTableProps}
          // @ts-ignore TS7006
          SubComponent={row => {
            const currentBoard = this.state.boardsTableItems.find(board => board.id === row.original.id);
            const actionItems = this.state.actionItemsByBoard[currentBoard.id];
            return (
              this.renderActionItemsSummary(
                actionItems.isDataLoaded,
                this.state.allDataLoaded,
                actionItems.actionItems,
                currentBoard.pendingWorkItemsCount,
                currentBoard.totalWorkItemsCount - currentBoard.pendingWorkItemsCount,
                currentBoard.boardName,
                currentBoard.feedbackItemsCount)
            );
          }}
        />
      </div>
    );
  }
}

export default withAITracking(reactPlugin, BoardSummaryTable);
