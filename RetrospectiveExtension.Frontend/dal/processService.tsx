import ProcessRestClient = require("TFS/WorkItemTracking/ProcessRestClient");
import { ProcessModel, GetProcessExpandLevel, FieldModel } from "TFS/WorkItemTracking/ProcessContracts";
import ProcessDefinitionsRestClient = require("TFS/WorkItemTracking/ProcessDefinitionsRestClient");
import * as ProcessDefinitionsContracts  from 'TFS/WorkItemTracking/ProcessDefinitionsContracts';
import { retrospectiveWorkItemTypeModel } from '../interfaces/retrospectiveWorkItemType';
import { workItemService } from './azureDevOpsWorkItemService';

export class ProcessService {
    private workItemTrackingProcessHttpClient: ProcessRestClient.WorkItemTrackingProcessHttpClient4_1;
    private workItemTrackingProcessDefinitionsHttpClient: ProcessDefinitionsRestClient.WorkItemTrackingProcessDefinitionsHttpClient4_1;

    static readonly retrospective_type = "Retrospective";

    constructor() {
        if (!this.workItemTrackingProcessHttpClient) {
            this.workItemTrackingProcessHttpClient = ProcessRestClient.getClient();
        }

        if (!this.workItemTrackingProcessDefinitionsHttpClient) {
            this.workItemTrackingProcessDefinitionsHttpClient = ProcessDefinitionsRestClient.getClient();
        }
    }

    public createList = (listModel: ProcessDefinitionsContracts.PickListModel) => {
        return this.workItemTrackingProcessDefinitionsHttpClient.createList(listModel);
    }

    public createField = (field: ProcessDefinitionsContracts.FieldModel, processId: string) => {
        return this.workItemTrackingProcessDefinitionsHttpClient.createField(field,processId);
    }

    public addFieldToWorkItemType = (field: ProcessDefinitionsContracts.WorkItemTypeFieldModel, processId: string, witRefNameForFields: string) => {
        return this.workItemTrackingProcessDefinitionsHttpClient.addFieldToWorkItemType(field,processId,witRefNameForFields);
    }

    public createRetrospectiveWorkItemTypeForProcess = (processId: string) => {
        return this.workItemTrackingProcessDefinitionsHttpClient.createWorkItemType(retrospectiveWorkItemTypeModel, processId);
    }
    
    private getProcesses = () => {
        return this.workItemTrackingProcessHttpClient.getProcesses(GetProcessExpandLevel.Projects);
    }

    public getFieldsForProcess = (processId:string) => {
        return this.workItemTrackingProcessHttpClient.getFields(processId);
    }

    public getWorkItemTypes = (processId: string) => {
        return this.workItemTrackingProcessDefinitionsHttpClient.getWorkItemTypes(processId);
    }

    public getWorkItemType = (processId: string, witRefName: string) => {
        return this.workItemTrackingProcessDefinitionsHttpClient.getWorkItemType(processId, witRefName);
    }
    
    public getFormLayoutPage = (processId: string, witRefName: string): PromiseLike<ProcessDefinitionsContracts.Page|undefined> => {
        return this.workItemTrackingProcessDefinitionsHttpClient.getFormLayout(processId, witRefName).then(layout => {
            return layout.pages.find(page => page.pageType === ProcessDefinitionsContracts.PageType.Custom);
        });
    }

    public addGroupToPage = (controls: ProcessDefinitionsContracts.Control[], processId: string, witRefName: string, pageId: string, sectionId: string) => {
        const customRetrospectiveGroup: ProcessDefinitionsContracts.Group = {
            contribution: null,
            controls: controls,
            height: null,
            id: null,
            inherited: null,
            isContribution: false,
            label: 'Custom Retrospective Fields',
            order: null,
            overridden: null,
            visible: true,
        };

        return this.workItemTrackingProcessDefinitionsHttpClient.addGroup(customRetrospectiveGroup, processId, witRefName, pageId, sectionId);
    }

    public getProcessForCurrentProject = () => {
        const currentProjectId = VSS.getWebContext().project.id;

        return this.getProcesses().then(processModels => {
            return processModels.find((process) => {
                const projects = process.projects ? process.projects : [];
                return projects.some((project) => project.id === currentProjectId);
            });       
        });
    }

    public getList = (listName: string) => {
        return this.workItemTrackingProcessDefinitionsHttpClient.getListsMetadata().then(lists => {
            const pickListMetadata = lists.find( list => list.name === listName);
            if (pickListMetadata) {
                return this.workItemTrackingProcessDefinitionsHttpClient.getList(pickListMetadata.id);
            }

            return Promise.reject('List with the specified name not found.');
        });
    }

    public getField = (name: string) => {
        return workItemService.getAllFields()
        .then(fields => {
            const field = fields.find(field => field.name === name);
            if (field) {
                return Promise.resolve(field);
            }

            return Promise.reject('Field with the specified name not found.')
        });
    }
}

export const processService = new ProcessService();
