import { WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";

export const getActionItemWorkItemTypes = (availableWorkItemTypes: WorkItemType[], requirementWorkItemTypeNames: string[], allowedWorkItemTypeNames: string[]): WorkItemType[] => {
  const allowedNames = allowedWorkItemTypeNames.length ? allowedWorkItemTypeNames : requirementWorkItemTypeNames;

  if (!allowedNames.length) {
    return availableWorkItemTypes;
  }

  return availableWorkItemTypes.filter(workItemType => allowedNames.includes(workItemType.name));
};
