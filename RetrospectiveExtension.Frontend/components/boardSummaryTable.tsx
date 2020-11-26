﻿import * as React from 'react';
import { IFeedbackBoardDocument } from '../interfaces/feedback';
import ReactTable, { Column } from 'react-table';
import BoardDataService from '../dal/boardDataService';
import { WorkItem, WorkItemType, WorkItemStateColor } from 'TFS/WorkItemTracking/Contracts';
import { itemDataService } from '../dal/itemDataService';
import { workItemService } from '../dal/azureDevOpsWorkItemService';
import BoardSummary from './boardSummary';
import * as moment from 'moment';
import { appInsightsClient } from '../utilities/appInsightsClient';
import classNames from 'classnames';

import 'react-table/react-table.css'

const boardSummaryColumns: Column[] = [
  {
    Header: 'Retrospective Name',
    accessor: 'boardName',
  },
  {
    Header: 'Created Date',
    accessor: 'createdDate',
    Cell: (row: any) => {
      return (
        moment(row.original.createdDate).format('MMM Do, YYYY')
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
];

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

export class BoardSummaryTable extends React.Component<IBoardSummaryTableProps, IBoardSummaryTableState> {
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
      appInsightsClient.trackException(e);
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
          console.log(workItemState);
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

  private getTrProps = (state: any, rowInfo: any, col: any, instance: any) => {
    return {
      onClick: () => {
        this.expandSummaryRow(state, rowInfo, instance);
      },
      tabIndex: 0,
      'aria-label': 'Board summary row. Click row to expand and view more statistics for this board.',
      onKeyPress: (e: any) => {
        if (e.key === 'Enter') {
          this.expandSummaryRow(state, rowInfo, instance);
        }
      },
    };
  };

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
          columns={boardSummaryColumns}
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