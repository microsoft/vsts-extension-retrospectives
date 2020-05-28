import {WorkItemTypeModel, FieldModel} from 'TFS/WorkItemTracking/ProcessDefinitionsContracts';

export interface CustomWorkItemType {
    workItemTypeModel: WorkItemTypeModel;
    customFields: FieldModel[];
}