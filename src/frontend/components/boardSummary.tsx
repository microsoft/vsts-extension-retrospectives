import React from 'react';
import { WorkItem, WorkItemType } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';
import { DocumentCard, DocumentCardTitle, DocumentCardType } from 'office-ui-fabric-react/lib/DocumentCard';
import { Image } from 'office-ui-fabric-react/lib/Image';
import { WorkItemTrackingServiceIds, IWorkItemFormNavigationService } from 'azure-devops-extension-api/WorkItemTracking';
import { DetailsList, DetailsListLayoutMode, SelectionMode, IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/telemetryClient';
import { SDKContext } from '../dal/azureDevOpsContextProvider';

export interface IBoardSummaryProps {
  actionItems: WorkItem[];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

class BoardSummary extends React.Component<IBoardSummaryProps, IBoardSummaryState> {
  constructor(props: IBoardSummaryProps) {
    super(props);

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
        onRender: ({ icon, type }: IActionItemsTableProps) => {
          return <Image
            src={icon.url}
            className="work-item-type-icon"
            alt={`${type} icon`}
          />;
        }
      },
      {
        ariaLabel: 'Work item title.',
        fieldName: 'title',
        isResizable: true,
        key: 'title',
        maxWidth: 350,
        minWidth: 100,
        name: 'Title',
        onColumnClick: this.onColumnClick,
        onRender: ({ id, title, onActionItemClick }: IActionItemsTableProps) => {
          return <button
            onClick={() => {
              onActionItemClick(id);
            }}
            className="work-item-title overflow-ellipsis">
            {title}
          </button>;
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
        minWidth: 100,
        maxWidth: 150,
        isResizable: true,
        ariaLabel: 'Work item changed date.',
        onRender: ({ changedDate }: IActionItemsTableProps) => {
          const changedDateAsDate = new Date(changedDate);
          return <div
            className="overflow-ellipsis">
            {new Intl.DateTimeFormat('en-US',
              { year: 'numeric', month: 'short', day: 'numeric' }
            ).format(changedDateAsDate)}
          </div>;
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

  private readonly getIconForWorkItemType = (type: string): IIconProps => {
    const workItemType: WorkItemType = this.props.supportedWorkItemTypes.find(wit => wit.name === type);

    return {
      name: workItemType.name,
      class: workItemType.icon.id,
      url: workItemType.icon.url,
    };
  }

  private readonly buildActionItemsList = () => {
    const actionItemsList = new Array<IActionItemsTableProps>();

    this.props.actionItems.forEach(workItem => {
      const item: IActionItemsTableProps = {
        icon: this.getIconForWorkItemType(workItem.fields['System.WorkItemType']),
        title: workItem.fields['System.Title'],
        state: workItem.fields['System.State'],
        type: workItem.fields['System.WorkItemType'],
        changedDate: workItem.fields['System.ChangedDate'],
        assignedTo: workItem.fields['System.AssignedTo']?.displayName ?? "",
        priority: workItem.fields['Microsoft.VSTS.Common.Priority'],
        id: workItem.id,
        onActionItemClick: async (id: number) => {
          const { SDK } = React.useContext(SDKContext);
          const workItemNavSvc = await SDK.getService<IWorkItemFormNavigationService>(WorkItemTrackingServiceIds.WorkItemFormNavigationService);
          await workItemNavSvc.openWorkItem(id);
        }
      };

      actionItemsList.push(item);
    });

    return actionItemsList;
  }

  private readonly onColumnClick = (_: React.MouseEvent<HTMLElement>, column: IColumn): void => {
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

  private readonly onItemInvoked = async (item: { id: number }) => {
    const { SDK } = React.useContext(SDKContext);
    const workItemNavSvc = await SDK.getService<IWorkItemFormNavigationService>(WorkItemTrackingServiceIds.WorkItemFormNavigationService);
    await workItemNavSvc.openWorkItem(item.id);
  }

  private readonly sortActionItemsByColumn = (actionItems: IActionItemsTableProps[], columnName: string, descending = false): IActionItemsTableProps[] => {
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
            <i className="stats-icon fas fa-comment-dots"></i>
            <div className="count-and-text" aria-label="count and text container">
              <div className="count" aria-label="feedback item count">{this.props.feedbackItemsCount}</div>
              <div className="text">Feedback items created.</div>
            </div>
          </div>
          <div className="items-stats-container" aria-label="feedback items statistics container">
            <i className="stats-icon fa-regular fa-square-plus"></i>
            <div className="count-and-text" aria-label="count and text container">
              <div className="count" aria-label="total work items count">{this.props.actionItems.length}</div>
              <div className="text">Work items created.</div>
            </div>
          </div>
          <div className="items-stats-container" aria-label="feedback items statistics container">
            <i className="stats-icon pending-action-item-color fa-solid fa-hourglass-half"></i>
            <div className="count-and-text" aria-label="count and text container">
              <div className={`count ${this.props.pendingWorkItemsCount > 0 ? 'pending-action-item-color' : ''}`} aria-label="pending work items count">
                {this.props.pendingWorkItemsCount}</div>
              <div className="text">Work items pending.</div>
            </div>
          </div>
          <div className="items-stats-container" aria-label="feedback items statistics container">
            <i className="stats-icon resolved-green fa-solid fa-clipboard-check"></i>
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

export default withAITracking(reactPlugin, BoardSummary);
