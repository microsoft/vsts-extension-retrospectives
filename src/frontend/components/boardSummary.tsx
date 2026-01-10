import React, { useState, useMemo, useCallback } from "react";
import { getService } from "azure-devops-extension-sdk";
import { WorkItem, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { WorkItemTrackingServiceIds, IWorkItemFormNavigationService } from "azure-devops-extension-api/WorkItemTracking";
import { DetailsList, DetailsListLayoutMode, SelectionMode, IColumn } from "@fluentui/react/lib/DetailsList";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";
import { getIconElement } from "./icons";

export interface IBoardSummaryProps {
  actionItems: WorkItem[];
  pendingWorkItemsCount: number;
  resolvedActionItemsCount: number;
  boardName: string;
  feedbackItemsCount: number;
  supportedWorkItemTypes: WorkItemType[];
}

interface IIconProps {
  name: string;
  class: string;
  url: string;
}

interface IActionItemsTableProps {
  [key: string]: string | number | IIconProps | ((id: number) => void);
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

const getIconForWorkItemType = (type: string, supportedWorkItemTypes: WorkItemType[]): IIconProps => {
  const workItemType: WorkItemType = supportedWorkItemTypes.find(wit => wit.name === type);

  return {
    name: workItemType.name,
    class: workItemType.icon.id,
    url: workItemType.icon.url,
  };
};

export const sortActionItemsByColumn = (actionItems: IActionItemsTableProps[], columnName: string, descending = false): IActionItemsTableProps[] => {
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
};

export const BoardSummary: React.FC<IBoardSummaryProps> = ({ actionItems, pendingWorkItemsCount, resolvedActionItemsCount, boardName, feedbackItemsCount, supportedWorkItemTypes }) => {
  const trackActivity = useTrackMetric(reactPlugin, "BoardSummary");

  const buildActionItemsList = useCallback(() => {
    const actionItemsList = new Array<IActionItemsTableProps>();

    actionItems.forEach(workItem => {
      const item: IActionItemsTableProps = {
        icon: getIconForWorkItemType(workItem.fields["System.WorkItemType"], supportedWorkItemTypes),
        title: workItem.fields["System.Title"],
        state: workItem.fields["System.State"],
        type: workItem.fields["System.WorkItemType"],
        changedDate: workItem.fields["System.ChangedDate"],
        assignedTo: workItem.fields["System.AssignedTo"]?.displayName ?? "",
        priority: workItem.fields["Microsoft.VSTS.Common.Priority"],
        id: workItem.id,
        onActionItemClick: async (id: number) => {
          const workItemNavSvc = await getService<IWorkItemFormNavigationService>(WorkItemTrackingServiceIds.WorkItemFormNavigationService);
          await workItemNavSvc.openWorkItem(id);
        },
      };

      actionItemsList.push(item);
    });

    return actionItemsList;
  }, [actionItems, supportedWorkItemTypes]);

  const [actionItemTableItems, setActionItemTableItems] = useState<IActionItemsTableProps[]>(() => buildActionItemsList());

  const onColumnClick = useCallback((_: React.MouseEvent<HTMLElement>, column: IColumn): void => {
    setActionItemTableItems(prevItems => {
      let newActionItems = prevItems.slice();

      setActionItemTableColumns(prevColumns => {
        const newTableColumns: IColumn[] = prevColumns.slice();
        const currColumn: IColumn = newTableColumns.filter((currCol: IColumn) => {
          return column.key === currCol.key;
        })[0];

        newTableColumns.forEach((newCol: IColumn) => {
          if (newCol === currColumn) {
            if (currColumn.isSorted) {
              currColumn.isSortedDescending = !currColumn.isSortedDescending;
            } else {
              currColumn.isSortedDescending = false;
            }
            currColumn.isSorted = true;
          } else {
            newCol.isSorted = false;
            newCol.isSortedDescending = false;
          }
        });

        newActionItems = sortActionItemsByColumn(newActionItems, currColumn.fieldName || "", currColumn.isSortedDescending);
        return newTableColumns;
      });

      return newActionItems;
    });
  }, []);

  const initialColumns = useMemo(
    (): IColumn[] => [
      {
        ariaLabel: "Work item type icon",
        key: "icon",
        name: "Work Item Icon",
        fieldName: "icon",
        isIconOnly: true,
        isResizable: false,
        minWidth: 16,
        maxWidth: 16,
        onRender: ({ icon, type }: IActionItemsTableProps) => {
          return <img src={icon.url} className="work-item-type-icon" alt={`${type} icon`} />;
        },
      },
      {
        ariaLabel: "Work item title",
        key: "title",
        name: "Title",
        fieldName: "title",
        isResizable: true,
        isSorted: false,
        isSortedDescending: false,
        maxWidth: 350,
        minWidth: 100,
        onColumnClick: onColumnClick,
        onRender: ({ id, title, onActionItemClick }: IActionItemsTableProps) => {
          return (
            <button
              onClick={() => {
                onActionItemClick(id);
              }}
              className="work-item-title overflow-ellipsis"
            >
              {title}
            </button>
          );
        },
      },
      {
        ariaLabel: "Work item state",
        key: "state",
        name: "State",
        fieldName: "state",
        isResizable: true,
        isSorted: false,
        isSortedDescending: false,
        minWidth: 50,
        maxWidth: 100,
        onColumnClick: onColumnClick,
      },
      {
        ariaLabel: "Work item type",
        key: "type",
        name: "Type",
        fieldName: "type",
        isResizable: true,
        isSorted: false,
        isSortedDescending: false,
        minWidth: 50,
        maxWidth: 100,
        onColumnClick: onColumnClick,
      },
      {
        ariaLabel: "Work item changed date",
        key: "changedDate",
        name: "Last Updated",
        fieldName: "changedDate",
        isResizable: true,
        isSorted: false,
        isSortedDescending: false,
        minWidth: 100,
        maxWidth: 150,
        onRender: ({ changedDate }: IActionItemsTableProps) => {
          const changedDateAsDate = new Date(changedDate);
          return <div className="overflow-ellipsis">{new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(changedDateAsDate)}</div>;
        },
        onColumnClick: onColumnClick,
      },
      {
        ariaLabel: "Work item assigned to",
        key: "assignedTo",
        name: "Assigned To",
        fieldName: "assignedTo",
        isResizable: true,
        isSorted: false,
        isSortedDescending: false,
        minWidth: 100,
        maxWidth: 400,
        onColumnClick: onColumnClick,
      },
      {
        ariaLabel: "Work item priority",
        key: "priority",
        name: "Priority",
        fieldName: "priority",
        isResizable: true,
        isSorted: false,
        isSortedDescending: false,
        minWidth: 50,
        maxWidth: 50,
        onColumnClick: onColumnClick,
      },
    ],
    [onColumnClick],
  );

  const [actionItemTableColumns, setActionItemTableColumns] = useState<IColumn[]>(initialColumns);

  const onItemInvoked = useCallback(async (item: { id: number }) => {
    const workItemNavSvc = await getService<IWorkItemFormNavigationService>(WorkItemTrackingServiceIds.WorkItemFormNavigationService);
    await workItemNavSvc.openWorkItem(item.id);
  }, []);

  return (
    <div className="board-summary-container" aria-label="Retrospective history container" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      <div className="board-summary-card" aria-label="Retrospective history card">
        <h2 title={boardName} aria-label="Retrospective name">
          {boardName}
        </h2>
        <div className="items-stats-container" aria-label="feedback items statistics container">
          {getIconElement("sms")}
          <div className="count-and-text" aria-label="count and text container">
            <div className="count" aria-label="feedback item count">
              {feedbackItemsCount}
            </div>
            <div className="text">Feedback items created.</div>
          </div>
        </div>
        <div className="items-stats-container status-primary-text" aria-label="feedback items statistics container">
          {getIconElement("note-add")}
          <div className="count-and-text" aria-label="count and text container">
            <div className="count" aria-label="total work items count">
              {actionItems.length}
            </div>
            <div className="text">Work items created.</div>
          </div>
        </div>
        <div className="items-stats-container status-warning-text" aria-label="feedback items statistics container">
          {getIconElement("hourglass-top")}
          <div className="count-and-text" aria-label="count and text container">
            <div className={`count ${pendingWorkItemsCount > 0 ? "pending-action-item-color" : ""}`} aria-label="pending work items count">
              {pendingWorkItemsCount}
            </div>
            <div className="text">Work items pending.</div>
          </div>
        </div>
        <div className="items-stats-container status-success-text" aria-label="feedback items statistics container">
          {getIconElement("assignment-turned-in")}
          <div className="count-and-text" aria-label="count and text container">
            <div className={`count ${resolvedActionItemsCount > 0 ? "resolved-green" : ""}`} aria-label="resolved work items count">
              {resolvedActionItemsCount}
            </div>
            <div className="text">Work items resolved.</div>
          </div>
        </div>
      </div>
      <div className="action-items-summary-card">
        {actionItems.length > 0 && <DetailsList items={actionItemTableItems} compact={false} columns={actionItemTableColumns} selectionMode={SelectionMode.none} setKey="set" layoutMode={DetailsListLayoutMode.justified} isHeaderVisible={true} selectionPreservedOnEmptyClick={true} onItemInvoked={onItemInvoked} />}
        {actionItems.length === 0 && <div className="no-action-items">Looks like no work items were created for this board.</div>}
      </div>
    </div>
  );
};

export default BoardSummary;
