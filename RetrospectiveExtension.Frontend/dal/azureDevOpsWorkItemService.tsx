import { Wiql, WorkItemExpand, WorkItemRelation, WorkItemErrorPolicy } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';
import { WorkItemTrackingRestClient } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTrackingClient';
import { JsonPatchDocument, Operation } from 'azure-devops-extension-api/WebApi';
import { IRetrospectiveItemCreate, IRetrospectiveItemsQuery, RelationshipType } from '../interfaces/workItem';

import { getClient } from 'azure-devops-extension-api/Common';
import { getProjectId } from '../utilities/servicesHelper';

class WorkItemService {
  public static readonly retrospective_type = 'Retrospective';
  public static readonly task_type = 'Task';

  private _httpClient: WorkItemTrackingRestClient;

  constructor() {
    if (!this._httpClient) {
      this._httpClient = getClient(WorkItemTrackingRestClient);
    }
  }

  public getAllFields = () => {
    return this._httpClient.getFields();
  }

  /**
   * Gets the work item states for the given work item type in the current project.
   */
  public getWorkItemStates = async (workItemType: string) => {
    const projectId = await getProjectId();

    return await this._httpClient.getWorkItemTypeStates(projectId, workItemType);
  }

  /**
   * Gets the work item types for the current project.
   */
  public getWorkItemTypesForCurrentProject = async () => {
    const projectId = await getProjectId();

    return await this._httpClient.getWorkItemTypes(projectId);
  }

  /**
   * Gets the list of work item type references for hidden work item types
   */
  public getHiddenWorkItemTypes = async () => {
    const projectId = await getProjectId();
    const hiddenWorkItemTypeCategory = await this._httpClient.getWorkItemTypeCategory(
      projectId,
      'Microsoft.HiddenCategory');

    return hiddenWorkItemTypeCategory.workItemTypes;
  }

  /**
   * Creates a new item of type 'Retrospective'.
   * @param title The title of the work item.
   */
  public createRetrospectiveItemOfType = async (createFields: IRetrospectiveItemCreate) => {
    const operation = [
      {
        op: Operation.Add,
        path: '/fields/System.Title',
        value: createFields.title,
      },
      {
        op: 'add',
        path: '/fields/System.IterationPath',
        value: createFields.iteration,
      },
      {
        op: 'add',
        path: '/fields/System.AreaPath',
        value: createFields.areaPath,
      },
      {
        op: 'add',
        path: '/fields/AgilewithRetrospective.FeedbackType',
        value: createFields.feedbackType.toString(),
      },
      {
        op: 'add',
        path: '/fields/AgilewithRetrospective.IsAnonymous',
        value: createFields.isAnonymous,
      },
      {
        op: Operation.Add,
        path: '/fields/AgilewithRetrospective.Votes',
        value: 0, // zero votes
      },
    ];

    const projectId = await getProjectId();

    return this._httpClient.createWorkItem(operation, projectId, WorkItemService.retrospective_type);
  }

  /**
   * Adds a vote to the existing retrospective item
   * @param id The id of the workitem
   * @param currentVotes The number of votes a workitem has got so far
   */
  public addUpvoteToRetrospectiveItem = (id: number, currentVotes: number) => {
    const updatedVotes = currentVotes + 1;
    return this.UpdateRetrospectiveItem([
      {
        op: Operation.Add,
        path: '/fields/AgilewithRetrospective.Votes',
        value: updatedVotes,
      },
    ],
      id);
  }

  /**
   * Updates the title of a retrospective item
   * @param id The id of the workitem
   * @param newTitle The new title of the retrospective item
   */
  public updateRetrospectiveItemTitle = (id: number, newTitle: string) => {
    this.UpdateRetrospectiveItem([
      {
        op: Operation.Add,
        path: '/fields/System.Title',
        value: newTitle,
      },
    ],
      id);
  }

  /**
   * Creates a 'Reference' relationship between two Retrospective items. Updating their own
   * groupings as necessary.
   * @param sourceReferencingId The id of the referencer(dragged item)
   * @param targetReferencedById The id of the referencee(target item)
   */
  public AddReferenceRelationshipBetweenRetrospectiveItems(sourceReferencingId: number, targetReferencedById: number) {
    return this.getWorkItemsByIds([sourceReferencingId])
      // Check to see if the retrospectiveItemReferencing has any relations that also need to link
      // to the retrospectiveItemReferencedBy.
      .then((workItems) => {
        const referenceRelationshipItemIds = workItems[0].relations
          ? workItems[0].relations.filter((relation) => relation.rel === RelationshipType.ReferencedByReverse).map((relation) => Number(relation.url.split('/').pop() || '-1')).filter((id) => id >= 0)
          : [];
        return referenceRelationshipItemIds.length
          ? this.getWorkItemsByIds(referenceRelationshipItemIds)
          : Promise.resolve([]);
      })
      // If they exist, remove these existing links and create new ones.
      // Operation.Update doesn't seem to support this scenario.
      .then((referenceRelationshipItems) => {
        if (referenceRelationshipItems.length) {
          referenceRelationshipItems.map((referenceRelationshipItem) => {
            const relationIndexToRemove = referenceRelationshipItem.relations.findIndex(
              (relation: WorkItemRelation) => relation.rel === RelationshipType.ReferencedByForward
                && relation.url === `https://reflect-retrospective-hackathon.visualstudio.com/_apis/wit/workItems/${sourceReferencingId}`);
            return this.UpdateRetrospectiveItem([
              {
                op: Operation.Remove,
                path: `/relations/${relationIndexToRemove}`,
              },
            ],
              referenceRelationshipItem.id)
              .then(() => {
                return this.UpdateRetrospectiveItem([
                  {
                    op: Operation.Add,
                    path: '/relations/-',
                    value: {
                      attributes: {
                        comment: 'linked via reflect retrospective',
                      },
                      rel: RelationshipType.ReferencedByForward,
                      url: `https://reflect-retrospective-hackathon.visualstudio.com/_apis/wit/workItems/${targetReferencedById}`,
                    },
                  },
                ],
                  referenceRelationshipItem.id);
              });
          });
          // Bug in Typescript https://github.com/Microsoft/TypeScript/issues/17862 prevents us
          // from using Promise.all() here. Instead, we fetch all the items again.
          // return Promise.all(referenceRelationshipItemUpdates).then(workItems => workItems);
          return this.getWorkItemsByIds(referenceRelationshipItems.map((item) => item.id)).then((workItems) => workItems);
        }
        return Promise.resolve([]);
      })
      // Link the main two items, only one operation is needed.
      .then((previouslyUpdatedItems) => {
        return this.UpdateRetrospectiveItem([
          {
            op: Operation.Add,
            path: '/relations/-',
            value: {
              attributes: {
                comment: 'linked via reflect retrospective',
              },
              rel: RelationshipType.ReferencedByForward,
              url: `https://reflect-retrospective-hackathon.visualstudio.com/_apis/wit/workItems/${targetReferencedById}`,
            },
          },
        ],
          sourceReferencingId)
          .then((updatedRetrospectiveItemReferencingId) => previouslyUpdatedItems.concat(updatedRetrospectiveItemReferencingId));
      })
      // Return all the items that were updated by the service calls.
      .then((previouslyUpdatedItems) => {
        return this.getWorkItemsByIds([targetReferencedById])
          .then((workItems) => previouslyUpdatedItems.concat(workItems));
      });
  }

  /**
   * Removes a 'Reference' relationship between the two items.
   * @param retrospectiveItemReferencingId The id of the referencer
   * @param retrospectiveItemReferencedById The ide of the referencee
   */
  public RemovesReferenceRelationshipBetweenRetrospectiveItems(retrospectiveItemReferencingId: number, retrospectiveItemReferencedById: number) {
    return this.getWorkItemsByIds([retrospectiveItemReferencingId])
      // Find and remove the relation between the two items.
      .then((workItems) => {
        const relationIndexToRemove = workItems[0].relations.findIndex(
          (relation) => relation.rel === RelationshipType.ReferencedByForward
            && relation.url === `https://reflect-retrospective-hackathon.visualstudio.com/_apis/wit/workItems/${retrospectiveItemReferencedById}`);
        return this.UpdateRetrospectiveItem([
          {
            op: Operation.Remove,
            path: `/relations/${relationIndexToRemove}`,
          },
        ],
          retrospectiveItemReferencingId);
      })
      // Return all the items that were updated by the service calls.
      .then((previouslyUpdatedItem) => {
        return this.getWorkItemsByIds([retrospectiveItemReferencedById])
          .then((workItems) => [previouslyUpdatedItem].concat(workItems));
      });
  }

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
    return this.getWorkItemsByIds([itemId]).then((workItems) => {
      return workItems[0].relations.filter((relation) => relation.rel === RelationshipType.ReferencedByReverse)
        .map((relation) => Number(relation.url.split('/').pop() || ''))
        .filter((id) => id);
    });
  }

  /**
   * Gets the work items that the given work item ids have a 'Related' relationship with
   * @param itemIds
   */
  public getRelatedItemsForItemsIds(itemIds: number[]) {
    return this.getWorkItemsByIds(itemIds)
      .then((workItems) => {
        const actionItemIds = new Set<string>();
        workItems.forEach((retrospectiveItem) => {
          if (retrospectiveItem.relations) {
            retrospectiveItem.relations.filter((relation) => relation.rel === RelationshipType.Related)
              .forEach((relation) => {
                // TODO improve to just get json directly from url
                const id = relation.url.split('/').pop() || '';
                if (id) {
                  actionItemIds.add(id);
                }
              });
          }
        });
        if (actionItemIds.size) {
          return this.getWorkItemsByIds(Array.from(actionItemIds).map((e) => Number(e)));
        }
        return Promise.resolve([]);
      });
  }

  /**
   *
   * @param item1_id
   * @param item2_id
   */
  public linkItemsAsRelated(item1_id: number, item2_id: number) {
    const item2Update = this.UpdateRetrospectiveItem([
      {
        op: Operation.Add,
        path: '/relations/-',
        value: {
          attributes: {
            comment: 'linked via reflect retrospective',
          },
          rel: RelationshipType.Related,
          url: `https://reflect-retrospective-hackathon.visualstudio.com/_apis/wit/workItems/${item1_id}`,
        },
      },
    ],
      item2_id);

    const item1Update = this.UpdateRetrospectiveItem([
      {
        op: Operation.Add,
        path: '/relations/-',
        value: {
          attributes: {
            comment: 'linked via reflect retrospective',
          },
          rel: RelationshipType.Related,
          url: `https://reflect-retrospective-hackathon.visualstudio.com/_apis/wit/workItems/${item2_id}`,
        },
      },
    ],
      item1_id);

    return Promise.all([item1Update, item2Update]);
  }

  /**
   * Gets the ids of items of type Retrospective.
   */
  public getRetrospectiveItems = async (queryFields: IRetrospectiveItemsQuery) => {
    // TODO: Handle case for dynamic type name i.e. replace the static [AgilewithRetrospective.FeedbackType] with dynamic content.
    const wiqlQuery: Wiql = {
      query: "SELECT [System.Id], [System.Title], [System.CreatedBy], [System.IterationPath] "
        + "FROM WorkItems "
        + "WHERE [System.WorkItemType] = '" + WorkItemService.retrospective_type + "' "
        + "AND [AgilewithRetrospective.FeedbackType] = '" + queryFields.feedbackType.toString() + "' "
        + "AND [System.IterationPath] = '" + queryFields.iteration + "' "
        + "AND [System.AreaPath] = '" + queryFields.areaPath + "' "
    };

    const projectId = await getProjectId();
    const queryResult = await this._httpClient.queryByWiql(wiqlQuery, projectId);
    const workItems = queryResult.workItems;

    const workItemIds = new Array<number>();
    workItems.forEach((item) => {
      workItemIds.push(item.id);
    });

    if (workItemIds.length > 0) {
      return this._httpClient.getWorkItems(workItemIds, projectId, undefined, undefined, WorkItemExpand.All, undefined);
    } else {
      return [];
    }
  }

  private createTaskItem = async (title: string) => {
    const operation = [
      {
        op: Operation.Add,
        path: '/fields/System.Title',
        value: title,
      },
    ];

    const projectId = await getProjectId();

    return this._httpClient.createWorkItem(operation, projectId, WorkItemService.task_type);
  }

  private async UpdateRetrospectiveItem(patchDocument: JsonPatchDocument, id: number) {
    const projectId = await getProjectId();

    return this._httpClient.updateWorkItem(patchDocument, id, projectId);
  }
}

export const workItemService = new WorkItemService();
