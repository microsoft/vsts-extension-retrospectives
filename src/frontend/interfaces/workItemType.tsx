import {WorkItemTypeModel, FieldModel} from 'azure-devops-extension-api/WorkItemTrackingProcessDefinitions';

export interface CustomWorkItemType {
    workItemTypeModel: WorkItemTypeModel;
    customFields: FieldModel[];
}