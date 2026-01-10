import { WorkItemExpand, WorkItemErrorPolicy } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking/WorkItemTrackingClient";
import { RelationshipType } from "../interfaces/workItem";

import { getClient } from "azure-devops-extension-api/Common";
import { getProjectId } from "../utilities/servicesHelper";

class WorkItemService {
  public static readonly retrospective_type = "Retrospective";
  public static readonly task_type = "Task";

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
  public async getWorkItemsByIds(ids: number[]) {
    const projectId = await getProjectId();
    const workItems = await this._httpClient.getWorkItems(ids, projectId, undefined, undefined, WorkItemExpand.All, WorkItemErrorPolicy.Omit);

    return workItems.filter(wi => wi != null);
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
