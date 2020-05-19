import {WorkItemTypeModel,WorkItemTypeClass, WorkItemTypeFieldModel,FieldModel} from 'TFS/WorkItemTracking/ProcessDefinitionsContracts';

export interface CustomWorkItemType {
    workItemTypeModel: WorkItemTypeModel;
    customFields: FieldModel[];
}