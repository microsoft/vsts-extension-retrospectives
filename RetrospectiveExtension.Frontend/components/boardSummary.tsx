import * as React from 'react';
import { WorkItem, WorkItemType } from 'TFS/WorkItemTracking/Contracts';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import {
  DocumentCard,
  DocumentCardTitle,
  DocumentCardType,
} from 'office-ui-fabric-react/lib/DocumentCard';
import { Image } from 'office-ui-fabric-react/lib/Image';
import { WorkItemFormNavigationService } from 'TFS/WorkItemTracking/Services';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
} from 'office-ui-fabric-react/lib/DetailsList';

export interface IBoardSummaryProps {
  actionItems: WorkItem[];
  isDataLoaded: boolean;
  pendingWorkItemsCount: number;
  resolvedActionItemsCount: number;
  boardName: string;
  feedbackItemsCount: number;
  supportedWorkItemTypes: WorkItemType[];
}

interface IBoardSummaryState {
  actionItemTableItems: IActionItemsTableProps[];
  actionItemTableColumns: IColumn[];
}

interface IIconProps {
  name: string;
  class: string;
  url: string;
}

interface IActionItemsTableProps {
  [key: string]: any;
  icon: IIconProps;
  title: string;
  state: string;
  type: string;
  changedDate: string;
  assignedTo: string;
  priority: string;
  id: number;
  onActionItemClick: (id: number) => void;
}

export default class BoardSummary extends React.Component<IBoardSummaryProps, IBoardSummaryState> {
  constructor(props: IBoardSummaryProps) {
    super (props);

    const actionItemsTableColumns: IColumn[] = [
      {
        ariaLabel: 'Work item type icon',
        fieldName: 'icon',
        isIconOnly: true,
        isResizable: false,
        key: 'icon',
        maxWidth: 16,
        minWidth: 16,
        name: 'Work Item Icon',
        onRender: (props) => {
          return <Image src={props.icon.url} className="work-item-type-icon" alt={`${props.type} icon`} />;
        }
      },
      {
        ariaLabel: 'Work item title.',
        fieldName: 'title',
        isResizable: true,
        key: 'title',
        maxWidth: 700,
        minWidth: 100,
        name: 'Title',
        onColumnClick: this.onColumnClick,
        onRender: (props: IActionItemsTableProps) => {
          return <div onClick={async () => { await props.onActionItemClick(props.id); }} className="work-item-title overflow-ellipsis">{props.title}</div>;
        }
      },
      {
        key: 'state',
        name: 'State',
        fieldName: 'state',
        minWidth: 50,
        maxWidth: 100,
        isResizable: true,
        ariaLabel: 'Work item state.',
        onColumnClick: this.onColumnClick,
      },
      {
        key: 'type',
        name: 'Type',
        fieldName: 'type',
        minWidth: 50,
        maxWidth: 100,
        isResizable: true,
        ariaLabel: 'Work item type.',
        onColumnClick: this.onColumnClick,
      },
      {
        key: 'changedDate',
        name: 'Last Updated',
        fieldName: 'changedDate',
        minWidth: 50,
        maxWidth: 150,
        isResizable: true,
        ariaLabel: 'Work item changed date.',
        onRender: (props: IActionItemsTableProps) => {
          const changedDate = new Date(props.changedDate);
          return <div className="overflow-ellipsis">{new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(changedDate)}</div>;
        },
        onColumnClick: this.onColumnClick,
      },
      {
        key: 'assignedTo',
        name: 'Assigned To',
        fieldName: 'assignedTo',
        minWidth: 100,
        maxWidth: 400,
        isResizable: true,
        ariaLabel: 'Work item assigned to.',
        onColumnClick: this.onColumnClick,
      },
      {
        key: 'priority',
        name: 'Priority',
        fieldName: 'priority',
        minWidth: 50,
        maxWidth: 50,
        isResizable: true,
        ariaLabel: 'Work item priority.',
        onColumnClick: this.onColumnClick,
      },
    ];

    this.state = {
      actionItemTableItems: new Array<IActionItemsTableProps>(),
      actionItemTableColumns: actionItemsTableColumns
    };
  }

  public componentDidMount() {
    const actionItemTableItems = this.buildActionItemsList();

    this.setState({ actionItemTableItems });
  }

  private getIconForWorkItemType = (type: string): IIconProps => {
    const workItemType: WorkItemType = this.props.supportedWorkItemTypes.find(wit => wit.name === type);

    return {
      name: workItemType.name,
      class: workItemType.icon.id,
      url: workItemType.icon.url,
    };
  }

  private buildActionItemsList = () => {
    const actionItemsList = new Array<IActionItemsTableProps>();

    this.props.actionItems.forEach(workItem => {
      const item: IActionItemsTableProps = {
        icon: this.getIconForWorkItemType(workItem.fields['System.WorkItemType']),
        title: workItem.fields['System.Title'],
        state: workItem.fields['System.State'],
        type: workItem.fields['System.WorkItemType'],
        changedDate: workItem.fields['System.ChangedDate'],
        assignedTo: workItem.fields['System.AssignedTo'],
        priority: workItem.fields['Microsoft.VSTS.Common.Priority'],
        id: workItem.id,
        onActionItemClick: async (id: number) => {
          // TODO: Update specific table summary after work item is updated.
          const workItemNavSvc = await WorkItemFormNavigationService.getService();
          await workItemNavSvc.openWorkItem(id);
        }
      };

      actionItemsList.push(item);
    });

    return actionItemsList;
  }

  private onColumnClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn): void => {
    const actionItems = this.state.actionItemTableItems;
    let newActionItems = actionItems.slice();

    const newTableColumns: IColumn[] = this.state.actionItemTableColumns.slice();
    const currColumn: IColumn = newTableColumns.filter((currCol: IColumn) => {
      return column.key === currCol.key;
    })[0];
    newTableColumns.forEach((newCol: IColumn) => {
      if (newCol === currColumn) {
        currColumn.isSortedDescending = !currColumn.isSortedDescending;
        currColumn.isSorted = true;
      } else {
        newCol.isSorted = false;
        newCol.isSortedDescending = true;
      }
    });

    newActionItems = this.sortActionItemsByColumn(newActionItems, currColumn.fieldName || '', currColumn.isSortedDescending);
    this.setState({
      actionItemTableColumns: newTableColumns,
      actionItemTableItems: newActionItems
    });
  }

  private onItemInvoked = async (item: { id: number }) => {
    const workItemNavSvc = await WorkItemFormNavigationService.getService();
    await workItemNavSvc.openWorkItem(item.id);
  }

  private sortActionItemsByColumn = (actionItems: IActionItemsTableProps[], columnName: string, descending = false): IActionItemsTableProps[] => {
    if (descending) {
      return actionItems.sort((itemA: IActionItemsTableProps, itemB: IActionItemsTableProps) => {
        if (itemA[columnName] < itemB[columnName]) {
          return 1;
        }
        if (itemA[columnName] > itemB[columnName]) {
          return -1;
        }
        return 0;
      });
    } else {
      return actionItems.sort((itemA: IActionItemsTableProps, itemB: IActionItemsTableProps) => {
        if (itemA[columnName] < itemB[columnName]) {
          return -1;
        }
        if (itemA[columnName] > itemB[columnName]) {
          return 1;
        }
        return 0;
      });
    }
  }

  public render() {
    return (
      <div className="board-summary-container" aria-label="Retrospective history container">
        <DocumentCard className="board-summary-card" type={DocumentCardType.normal} aria-label="Retrospective history card">
          <div className="ms-DocumentCard-details board-summary-card-title">
            <DocumentCardTitle title={this.props.boardName} shouldTruncate={false} aria-label="Retrospective name" />
          </div>
          <div className="items-stats-container" aria-label="feedback items statistics container">
            <Icon iconName="Feedback" className="stats-icon" />
            <div className="count-and-text" aria-label="count and text container">
              <div className="count" aria-label="feedback item count">{this.props.feedbackItemsCount}</div>
              <div className="text">Feedback items created.</div>
            </div>
          </div>
          <div className="items-stats-container" aria-label="feedback items statistics container">
            <Icon iconName="ClipboardSolid" className="stats-icon" />
            <div className="count-and-text" aria-label="count and text container">
              <div className="count" aria-label="total work items count">{this.props.actionItems.length}</div>
              <div className="text">Work items created.</div>
            </div>
          </div>
          <div className="items-stats-container" aria-label="feedback items statistics container">
            <Icon iconName="WorkItemBug" className="stats-icon pending-action-item-color" />
            <div className="count-and-text" aria-label="count and text container">
              <div className={`count ${this.props.pendingWorkItemsCount > 0 ? 'pending-action-item-color' : ''}`} aria-label="pending work items count">
                {this.props.pendingWorkItemsCount}</div>
              <div className="text">Work items pending.</div>
            </div>
          </div>
          <div className="items-stats-container" aria-label="feedback items statistics container">
            <Icon iconName="WorkItem" className="stats-icon resolved-green" />
            <div className="count-and-text" aria-label="count and text container">
              <div className={`count ${this.props.resolvedActionItemsCount > 0 ? 'resolved-green' : ''}`} aria-label="resolved work items count">
                {this.props.resolvedActionItemsCount}</div>
              <div className="text">Work items resolved.</div>
            </div>
          </div>
        </DocumentCard>
        <div className="action-items-summary-card">
          {
            this.props.actionItems.length > 0 &&
            <DetailsList
              items={this.state.actionItemTableItems}
              compact={false}
              columns={this.state.actionItemTableColumns}
              selectionMode={SelectionMode.none}
              setKey="set"
              layoutMode={DetailsListLayoutMode.justified}
              isHeaderVisible={true}
              selectionPreservedOnEmptyClick={true}
              onItemInvoked={this.onItemInvoked} />
          }
          {
            this.props.actionItems.length === 0 &&
            <div className="no-action-items">Looks like no work items were created for this board.</div>
          }
        </div>
      </div>
    );
  }
}
