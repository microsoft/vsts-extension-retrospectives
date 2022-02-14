import { processService } from '../dal/processService';
import * as RetrospectiveItemContract from '../interfaces/retrospectiveWorkItemType';
import * as ProcessDefinitionsContracts  from 'azure-devops-extension-api/WorkItemTrackingProcessDefinitions';
import { CustomizationType } from 'azure-devops-extension-api/WorkItemTrackingProcess';
import { ExceptionCode, InitialRetrospectiveState } from '../interfaces/retrospectiveState';

const getCurrentProcess = processService.getProcessForCurrentProject();

const getAllWits = (processId: string) => {
  return processService.getWorkItemTypes(processId);
}

const getRetrospectiveItem = (workItemTypes: ProcessDefinitionsContracts.WorkItemTypeModel[]) => {
  return workItemTypes.find(wit => wit.name === RetrospectiveItemContract.retrospectiveWorkItemTypeModel.name);
}

const createIfNotExistsFeedbackPicklist = () => {
  return processService.getList(RetrospectiveItemContract.feedbackPickList.name).then(
    list => {
      return list;
    },
    () => {
      return processService.createList(RetrospectiveItemContract.feedbackPickList);
    }
  );
}

const createOrGetFeedbacktypeField = (feedbackPickList: ProcessDefinitionsContracts.PickListModel, processId: string) => {
  const feedbackTypeField: ProcessDefinitionsContracts.FieldModel = RetrospectiveItemContract.feedbackType;
  feedbackTypeField.pickList = feedbackPickList;

  return processService.getField(feedbackTypeField.name).then(workItemField => {
    const feedbackTypeWitFieldModel: ProcessDefinitionsContracts.WorkItemTypeFieldModel = {
      allowGroups: false,
      defaultValue: "",
      name: null,
      pickList: null,
      readOnly: false,
      referenceName: workItemField.referenceName,
      type: null,
      url: null,
      required: false,
    };
    return feedbackTypeWitFieldModel;
  }, () => {
    return processService.createField(feedbackTypeField, processId).then(fieldModel => {
      const feedbackTypeWitFieldModel: ProcessDefinitionsContracts.WorkItemTypeFieldModel = {
        allowGroups: false,
        defaultValue: "",
        name: null,
        pickList: null,
        readOnly: false,
        referenceName: fieldModel.id,
        type: null,
        url: null,
        required: false,
      };
     return Promise.resolve(feedbackTypeWitFieldModel);
    });
  });
}

const addFeedbackTypeField = (processId: string, workItemTypeId: string) => {
  return createIfNotExistsFeedbackPicklist().then(picklist => {
    return createOrGetFeedbacktypeField(picklist, processId).then(fieldModel => {
      return processService.addFieldToWorkItemType(fieldModel, processId, workItemTypeId).then( witFieldModel => {
        return witFieldModel;
      });
    });
  });
}

const createOrGetUpvoteField = (processId: string) => {
  const upvoteField: ProcessDefinitionsContracts.FieldModel = RetrospectiveItemContract.upvotes;

  return processService.getField(upvoteField.name).then(workItemField =>{
    const upvoteWitFieldModel: ProcessDefinitionsContracts.WorkItemTypeFieldModel = {
      allowGroups: false,
      defaultValue: "",
      name: null,
      pickList: null,
      readOnly: false,
      referenceName: workItemField.referenceName,
      type: null,
      url: null,
      required: false,
    };
    return upvoteWitFieldModel;
  }, () => {
    return processService.createField(upvoteField, processId).then(fieldModel => {
      const upvoteWitFieldModel: ProcessDefinitionsContracts.WorkItemTypeFieldModel = {
        allowGroups: false,
        defaultValue: "",
        name: null,
        pickList: null,
        readOnly: false,
        referenceName: fieldModel.id,
        type: null,
        url: null,
        required: false,
      };
     return Promise.resolve(upvoteWitFieldModel);
    });
  });
}

const addUpvoteField = (processId: string, workItemTypeId: string) => {
  return createOrGetUpvoteField(processId).then(fieldModel =>{
    return processService.addFieldToWorkItemType(fieldModel, processId, workItemTypeId).then(witFieldModel => {
      return witFieldModel;
    });
  });
}

const createRetrospectiveWorkItemType = (processId: string) => {
  return processService.createRetrospectiveWorkItemTypeForProcess(processId);
}

const createFormControl = (id: string, label: string): ProcessDefinitionsContracts.Control => {
  return {
    contribution: null,
    controlType: null,
    height: null,
    id: id,
    inherited: null,
    isContribution: false,
    label: label,
    metadata: null,
    order: null,
    overridden: null,
    readOnly: false,
    visible: true,
    watermark: null,
  };
}

export const initializeRetrospectiveWorkItemType = () => {
  const initialRetrospectiveState: InitialRetrospectiveState = {
    isInheritedProcess: false,
    displayBoard: false
  }

  // Get process Id
  const processId = getCurrentProcess.then(curProcess => {
    if (curProcess) {
      return curProcess.typeId;
    }
    return '';
  });

  const isInherited = getCurrentProcess.then(curProcess => {
    return curProcess && (curProcess.customizationType != CustomizationType.System);
  });

  const initialState = isInherited.then(inherited => {
      if (inherited) {
        // Inherited process
        initialRetrospectiveState.isInheritedProcess = true;
        return processId.then(currentProcessId => {
            if(!currentProcessId) {
              initialRetrospectiveState.displayBoard = false;
              initialRetrospectiveState.exceptionCode = ExceptionCode.Unexpected;
              return initialRetrospectiveState;
            }

            // Get all work item types for the process
            return getAllWits(currentProcessId).then(wits => {
                const retrospectiveItem = getRetrospectiveItem(wits);
                // Check if process already has a Retrospective work item type.
                if (retrospectiveItem) {
                  initialRetrospectiveState.displayBoard = true;
                  initialRetrospectiveState.retrospectiveWorkItemType = retrospectiveItem;
                  return initialRetrospectiveState;
                }
                else {
                  // Create Retrospective work item type and its fields.
                  // Create work item type for the current process.
                  return createRetrospectiveWorkItemType(currentProcessId).then(wit => {
                      // TODO: Make this more generic, to add a collection of any fields.
                      // Create FeedbackType field and add to work item type.
                      return addFeedbackTypeField(currentProcessId, wit.id).then(feedbackFieldModel => {
                          // Create Upvote field and add to work item type.
                          return addUpvoteField(currentProcessId, wit.id).then(upvoteFieldModel => {
                                // Add fields to work item type UI form.
                                return processService.getFormLayoutPage(currentProcessId, wit.id).then(page => {
                                    if (!page) {
                                      initialRetrospectiveState.displayBoard = false;
                                      initialRetrospectiveState.exceptionCode = ExceptionCode.Unexpected;
                                      return initialRetrospectiveState;
                                    }

                                    const upvoteControl: ProcessDefinitionsContracts.Control = createFormControl(upvoteFieldModel.referenceName, upvoteFieldModel.name);
                                    const feedbackControl: ProcessDefinitionsContracts.Control = createFormControl(feedbackFieldModel.referenceName, feedbackFieldModel.name);
                                    const controls: ProcessDefinitionsContracts.Control[] = [upvoteControl, feedbackControl];
                                    return processService.addGroupToPage(controls, currentProcessId, wit.id, page.id, page.sections[0].id).then(() => {
                                        initialRetrospectiveState.displayBoard = true;
                                        initialRetrospectiveState.retrospectiveWorkItemType = wit;
                                        return initialRetrospectiveState;
                                      });
                                  });
                            });
                        });
                    });
                }
              });
          });
      }
      else {
        initialRetrospectiveState.isInheritedProcess = false;
        initialRetrospectiveState.displayBoard = false;
        initialRetrospectiveState.exceptionCode = ExceptionCode.NotInheritedProcess;
        return initialRetrospectiveState;
      }
    });

  return initialState;
}
