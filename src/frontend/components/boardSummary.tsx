import React, { useState, useMemo, useCallback } from "react";
import { getService } from "azure-devops-extension-sdk";
import { WorkItem, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { WorkItemTrackingServiceIds, IWorkItemFormNavigationService } from "azure-devops-extension-api/WorkItemTracking";
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

interface IActionItemsColumn {
  ariaLabel: string;
  key: string;
  name: string;
  fieldName?: string;
  isIconOnly?: boolean;
  isResizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
  isSortable?: boolean;
  onRender?: (item: IActionItemsTableProps) => React.ReactNode;
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

  const onColumnClick = useCallback((column: IActionItemsColumn): void => {
    if (!column.fieldName || !column.isSortable) {
      return;
    }

    setActionItemTableItems(prevItems => {
      let newActionItems = prevItems.slice();

      setActionItemTableColumns(prevColumns => {
        const newTableColumns: IActionItemsColumn[] = prevColumns.slice();
        const currColumn = newTableColumns.filter(currCol => {
          return column.key === currCol.key;
        })[0];

        if (!currColumn?.fieldName || !currColumn.isSortable) {
          return newTableColumns;
        }

        newTableColumns.forEach(newCol => {
          if (newCol === currColumn) {
            const currentDescending = (currColumn as IActionItemsColumn & { isSortedDescending?: boolean; isSorted?: boolean }).isSortedDescending ?? false;
            const isSorted = (currColumn as IActionItemsColumn & { isSorted?: boolean }).isSorted ?? false;
            (currColumn as IActionItemsColumn & { isSortedDescending: boolean; isSorted: boolean }).isSortedDescending = isSorted ? !currentDescending : false;
            (currColumn as IActionItemsColumn & { isSorted: boolean }).isSorted = true;
          } else {
            (newCol as IActionItemsColumn & { isSorted: boolean; isSortedDescending: boolean }).isSorted = false;
            (newCol as IActionItemsColumn & { isSortedDescending: boolean }).isSortedDescending = false;
          }
        });

        const isSortedDescending = (currColumn as IActionItemsColumn & { isSortedDescending?: boolean }).isSortedDescending ?? false;
        newActionItems = sortActionItemsByColumn(newActionItems, currColumn.fieldName, isSortedDescending);
        return newTableColumns;
      });

      return newActionItems;
    });
  }, []);

  const initialColumns = useMemo(
    (): (IActionItemsColumn & { isSorted?: boolean; isSortedDescending?: boolean })[] => [
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
        isSortable: true,
        maxWidth: 350,
        minWidth: 100,
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
        isSortable: true,
        minWidth: 50,
        maxWidth: 100,
      },
      {
        ariaLabel: "Work item type",
        key: "type",
        name: "Type",
        fieldName: "type",
        isResizable: true,
        isSorted: false,
        isSortedDescending: false,
        isSortable: true,
        minWidth: 50,
        maxWidth: 100,
      },
      {
        ariaLabel: "Work item changed date",
        key: "changedDate",
        name: "Last Updated",
        fieldName: "changedDate",
        isResizable: true,
        isSorted: false,
        isSortedDescending: false,
        isSortable: true,
        minWidth: 100,
        maxWidth: 150,
        onRender: ({ changedDate }: IActionItemsTableProps) => {
          const changedDateAsDate = new Date(changedDate);
          return <div className="overflow-ellipsis">{new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(changedDateAsDate)}</div>;
        },
      },
      {
        ariaLabel: "Work item assigned to",
        key: "assignedTo",
        name: "Assigned To",
        fieldName: "assignedTo",
        isResizable: true,
        isSorted: false,
        isSortedDescending: false,
        isSortable: true,
        minWidth: 100,
        maxWidth: 400,
      },
      {
        ariaLabel: "Work item priority",
        key: "priority",
        name: "Priority",
        fieldName: "priority",
        isResizable: true,
        isSorted: false,
        isSortedDescending: false,
        isSortable: true,
        minWidth: 50,
        maxWidth: 50,
      },
    ],
    [],
  );

  const [actionItemTableColumns, setActionItemTableColumns] = useState<(IActionItemsColumn & { isSorted?: boolean; isSortedDescending?: boolean })[]>(initialColumns);

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
        {actionItems.length > 0 && (
          <table className="board-summary-action-items-table" role="grid" aria-label="Work items summary table">
            <thead>
              <tr role="row">
                {actionItemTableColumns.map((column, index) => {
                  const isSorted = (column as IActionItemsColumn & { isSorted?: boolean }).isSorted ?? false;
                  const isSortedDescending = (column as IActionItemsColumn & { isSortedDescending?: boolean }).isSortedDescending ?? false;
                  const ariaSort = isSorted ? (isSortedDescending ? "descending" : "ascending") : "none";

                  return (
                    <th key={column.key} role="columnheader" aria-colindex={index + 1} aria-sort={ariaSort} data-automationid="ColumnsHeaderColumn" className={column.isSortable ? "sortable" : ""}>
                      {column.isSortable ? (
                        <button
                          type="button"
                          onClick={() => {
                            onColumnClick(column);
                          }}
                          aria-label={column.ariaLabel}
                        >
                          {column.name}
                        </button>
                      ) : (
                        <span aria-label={column.ariaLabel}>{column.isIconOnly ? "" : column.name}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {actionItemTableItems.map(item => (
                <tr
                  key={item.id}
                  role="row"
                  onClick={() => {
                    onItemInvoked({ id: item.id });
                  }}
                >
                  {actionItemTableColumns.map(column => (
                    <td key={`${item.id}-${column.key}`}>{column.onRender ? column.onRender(item) : String(item[column.fieldName ?? ""] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {actionItems.length === 0 && <div className="no-action-items">Looks like no work items were created for this board.</div>}
      </div>
    </div>
  );
};

export default BoardSummary;
