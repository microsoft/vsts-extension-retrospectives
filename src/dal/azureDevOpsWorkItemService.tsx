import { WorkItem, WorkItemExpand, WorkItemErrorPolicy } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking/WorkItemTrackingClient";
import { RelationshipType } from "../interfaces/workItem";

import { getClient } from "azure-devops-extension-api/Common";
import { getProjectId } from "../utilities/servicesHelper";

class WorkItemService {
  public static readonly retrospective_type = "Retrospective";
  public static readonly task_type = "Task";
  // Azure DevOps rejects work item batch requests with more than 200 ids.
  private static readonly maxWorkItemsPerRequest = 200;

  private _httpClient: WorkItemTrackingRestClient;

  constructor() {
    this._httpClient = getClient(WorkItemTrackingRestClient);
  }

  public getAllFields = () => {
    return this._httpClient.getFields();
  };

  /**
   * Gets the work item states for the given work item type in the current project.
   */
  public getWorkItemStates = async (workItemType: string) => {
    const projectId = await getProjectId();

    return await this._httpClient.getWorkItemTypeStates(projectId, workItemType);
  };

  /**
   * Gets the work item types for the current project.
   */
  public getWorkItemTypesForCurrentProject = async () => {
    const projectId = await getProjectId();

    return await this._httpClient.getWorkItemTypes(projectId);
  };

  /**
   * Gets the list of work item type references for hidden work item types
   */
  public getHiddenWorkItemTypes = async () => {
    const projectId = await getProjectId();
    const hiddenWorkItemTypeCategory = await this._httpClient.getWorkItemTypeCategory(projectId, "Microsoft.HiddenCategory");

    return hiddenWorkItemTypeCategory.workItemTypes;
  };

  /**
   * Gets the work items by given ids.
   * @param ids The ids of the work items to fetch.
   */
  public async getWorkItemsByIds(ids: number[]): Promise<WorkItem[]> {
    if (!ids?.length) {
      return [];
    }

    const projectId = await getProjectId();
    const batches: number[][] = [];
    for (let index = 0; index < ids.length; index += WorkItemService.maxWorkItemsPerRequest) {
      batches.push(ids.slice(index, index + WorkItemService.maxWorkItemsPerRequest));
    }

    const batchResults = await Promise.all(batches.map(batch => this._httpClient.getWorkItems(batch, projectId, undefined, undefined, WorkItemExpand.All, WorkItemErrorPolicy.Omit)));

    return batchResults.reduce<WorkItem[]>((allWorkItems, workItems) => allWorkItems.concat(workItems ?? []), []).filter(wi => wi != null);
  }

  public getReferencedByReverseItemIds(itemId: number) {
    return this.getWorkItemsByIds([itemId]).then(workItems => {
      return workItems[0].relations
        .filter(relation => relation.rel === RelationshipType.ReferencedByReverse)
        .map(relation => Number(relation.url.split("/").pop() || ""))
        .filter(id => id);
    });
  }

  /**
   * Gets the work items that the given work item ids have a 'Related' relationship with
   * @param itemIds
   */
  public getRelatedItemsForItemsIds(itemIds: number[]) {
    return this.getWorkItemsByIds(itemIds).then(workItems => {
      const actionItemIds = new Set<string>();
      workItems.forEach(retrospectiveItem => {
        if (retrospectiveItem.relations) {
          retrospectiveItem.relations
            .filter(relation => relation.rel === RelationshipType.Related)
            .forEach(relation => {
              // TODO improve to just get json directly from url
              const id = relation.url.split("/").pop() || "";
              if (id) {
                actionItemIds.add(id);
              }
            });
        }
      });
      if (actionItemIds.size) {
        return this.getWorkItemsByIds(Array.from(actionItemIds).map(e => Number(e)));
      }
      return Promise.resolve([]);
    });
  }
}

export const workItemService = new WorkItemService();
