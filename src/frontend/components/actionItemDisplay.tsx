import { WebApiTeam } from "azure-devops-extension-api/Core";
import { IWorkItemFormNavigationService, WorkItemTrackingServiceIds } from "azure-devops-extension-api/WorkItemTracking";
import { WorkItem, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { getService, getUser } from "azure-devops-extension-sdk";
import React, { useState, useRef, useEffect, useCallback } from "react";

import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { itemDataService } from "../dal/itemDataService";
import { IFeedbackItemDocument } from "../interfaces/feedback";
import { getBoardUrl } from "../utilities/boardUrlHelper";
import { appInsights, reactPlugin, TelemetryEvents } from "../utilities/telemetryClient";
import ActionItem from "./actionItem";
import { WorkflowPhase } from "../interfaces/workItem";
import { getIconElement } from "./icons";

export interface ActionItemDisplayProps {
  feedbackItemId: string;
  feedbackItemTitle: string;
  team: WebApiTeam;
  boardId: string;
  boardTitle: string;
  defaultIteration: string;
  defaultAreaPath: string;
  actionItems: WorkItem[];
  nonHiddenWorkItemTypes: WorkItemType[];
  allWorkItemTypes: WorkItemType[];
  allowAddNewActionItem: boolean;

  onUpdateActionItem: (feedbackItemId: IFeedbackItemDocument) => void;
}

export const ActionItemDisplay: React.FC<ActionItemDisplayProps> = ({ feedbackItemId, feedbackItemTitle, team, boardId, boardTitle, defaultIteration, defaultAreaPath, actionItems, nonHiddenWorkItemTypes, allWorkItemTypes, allowAddNewActionItem, onUpdateActionItem }) => {
  const trackActivity = useTrackMetric(reactPlugin, "ActionItemDisplay");

  const [isLinkedWorkItemLoaded, setIsLinkedWorkItemLoaded] = useState(false);
  const [isWorkItemTypeListCalloutVisible, setIsWorkItemTypeListCalloutVisible] = useState(false);
  const [linkedWorkItem, setLinkedWorkItem] = useState<WorkItem | null>(null);
  const [initialRender, setInitialRender] = useState(true);

  const addWorkItemButtonRef = useRef<HTMLButtonElement>(null);
  const addWorkItemMenuRef = useRef<HTMLDivElement>(null);
  const addWorkItemWrapperRef = useRef<HTMLDivElement>(null);
  const linkExistingWorkItemDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (initialRender) {
      setInitialRender(false);
    }
  }, [initialRender]);

  const hideSelectorCallout = useCallback(() => {
    setIsWorkItemTypeListCalloutVisible(false);
  }, []);

  useEffect(() => {
    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (!isWorkItemTypeListCalloutVisible) {
        return;
      }

      const wrapper = addWorkItemWrapperRef.current!;
      const menu = addWorkItemMenuRef.current!;
      const target = event.target as Node;

      if (wrapper.contains(target) || menu.contains(target)) {
        return;
      }

      hideSelectorCallout();
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [isWorkItemTypeListCalloutVisible, hideSelectorCallout]);

  const createAndLinkActionItem = useCallback(
    async (workItemTypeName: string) => {
      const boardUrl = await getBoardUrl(team.id, boardId, WorkflowPhase.Collect);
      const workItemNavSvc = await getService<IWorkItemFormNavigationService>(WorkItemTrackingServiceIds.WorkItemFormNavigationService);

      const assignedUser: string | undefined = getUser().name === undefined ? "Former User" : getUser().name;

      const workItem = await workItemNavSvc.openNewWorkItem(workItemTypeName, {
        "System.AssignedTo": assignedUser,
        "Tags": "feedback",
        "Title": "",
        "Description": `${feedbackItemTitle}`,
        "priority": 2,
        "System.History": `Created by Retrospectives |` + ` Team [ ${team.name} ] Retrospective [ ${boardTitle} ] Item [ ${feedbackItemTitle} ]` + ` Link [ ${boardUrl} ]`,
        "System.AreaPath": defaultAreaPath,
        "System.IterationPath": defaultIteration,
      });

      if (workItem) {
        const updatedFeedbackItem = await itemDataService.addAssociatedActionItem(boardId, feedbackItemId, workItem.id);
        appInsights.trackEvent({ name: TelemetryEvents.WorkItemCreated, properties: { workItemTypeName } });
        onUpdateActionItem(updatedFeedbackItem);
      }
    },
    [team, boardId, feedbackItemTitle, boardTitle, defaultAreaPath, defaultIteration, feedbackItemId, onUpdateActionItem],
  );

  const addActionItem = useCallback(
    (workItemTypeName: string) => {
      createAndLinkActionItem(workItemTypeName);
    },
    [createAndLinkActionItem],
  );

  const toggleSelectorCallout = useCallback(() => {
    setIsWorkItemTypeListCalloutVisible(prev => !prev);
  }, []);

  const handleClickWorkItemType = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | HTMLSpanElement>, item: WorkItemType) => {
      event && event.stopPropagation();
      hideSelectorCallout();
      addActionItem(item.name);
    },
    [hideSelectorCallout, addActionItem],
  );

  const handleInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    if (!newValue.trim()) {
      setIsLinkedWorkItemLoaded(false);
      return;
    }

    const workItemId = Number(newValue.trim());

    if (!workItemId) {
      setIsLinkedWorkItemLoaded(false);
      return;
    }

    const workItem = await workItemService.getWorkItemsByIds([workItemId]);
    setIsLinkedWorkItemLoaded(true);
    setLinkedWorkItem(workItem[0] ? workItem[0] : null);
  }, []);

  const linkExistingWorkItem = useCallback(async () => {
    const updatedFeedbackItem = await itemDataService.addAssociatedActionItem(boardId, feedbackItemId, linkedWorkItem!.id);

    appInsights.trackEvent({ name: TelemetryEvents.ExistingWorkItemLinked, properties: { workItemTypeName: linkedWorkItem!.fields["System.WorkItemType"] } });

    onUpdateActionItem(updatedFeedbackItem);
    linkExistingWorkItemDialogRef.current!.close();
  }, [linkedWorkItem, boardId, feedbackItemId, onUpdateActionItem]);

  const handleLinkExistingWorkItemClick = useCallback(
    (mouseEvent: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement> | undefined = undefined) => {
      if (mouseEvent) {
        mouseEvent.stopPropagation();
      }

      hideSelectorCallout();

      linkExistingWorkItemDialogRef.current!.showModal();
    },
    [hideSelectorCallout],
  );

  const renderWorkItemCard = useCallback(
    (item: WorkItem, areActionIconsHidden: boolean) => {
      return <ActionItem key={item.id} feedbackItemId={feedbackItemId} boardId={boardId} actionItem={item} nonHiddenWorkItemTypes={nonHiddenWorkItemTypes} allWorkItemTypes={allWorkItemTypes} onUpdateActionItem={onUpdateActionItem} areActionIconsHidden={areActionIconsHidden} shouldFocus={!initialRender} />;
    },
    [feedbackItemId, boardId, nonHiddenWorkItemTypes, allWorkItemTypes, onUpdateActionItem, initialRender],
  );

  const renderAllWorkItemCards = useCallback(() => {
    return actionItems.map(item => {
      return renderWorkItemCard(item, false);
    });
  }, [actionItems, renderWorkItemCard]);

  return (
    <div className="action-item-display-container" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      {allowAddNewActionItem && (
        <div className="add-action-item-wrapper" ref={addWorkItemWrapperRef}>
          <button ref={addWorkItemButtonRef} className="add-action-item-button" aria-label="Add work item" data-automation-id="actionItemDataAutomation" onClick={toggleSelectorCallout}>
            {getIconElement("add")}
            <span>Add work item</span>
          </button>
          {isWorkItemTypeListCalloutVisible && (
            <div ref={addWorkItemMenuRef} className="popout-container" role="menu" aria-label="Add work item menu">
              <button
                className="list-item"
                onClick={handleLinkExistingWorkItemClick}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    handleLinkExistingWorkItemClick();
                  }
                }}
              >
                {getIconElement("link")}
                <span>Link existing work item</span>
              </button>
              <div role="separator" className="separator" />
              {nonHiddenWorkItemTypes.map(item => {
                return (
                  <button key={item.referenceName} className="list-item" onClick={e => handleClickWorkItemType(e, item)} aria-label={`Add work item type ${item.name}`}>
                    <img className="work-item-type-icon" alt={`icon for work item type ${item.name}`} src={item.icon.url} />
                    <div className="add-action-item-list-item-text">{item.name}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {renderAllWorkItemCards()}
      <dialog ref={linkExistingWorkItemDialogRef} className="link-existing-work-item-dialog" aria-label="Link existing work item" onClose={() => linkExistingWorkItemDialogRef.current!.close()}>
        <div className="header">
          <h2 className="title">Link existing work item</h2>
          <button onClick={() => linkExistingWorkItemDialogRef.current!.close()} aria-label="Close">
            {getIconElement("close")}
          </button>
        </div>
        <div className="subText">
          <div className="form-group">
            <input className="search-box" placeholder="Enter the exact work item id" role="searchbox" onChange={handleInputChange}></input>
            <div className="output-container">
              {isLinkedWorkItemLoaded && linkedWorkItem && renderWorkItemCard(linkedWorkItem, true)}
              {isLinkedWorkItemLoaded && !linkedWorkItem && <div className="work-item-not-found">The work item you are looking for was not found. Please verify the id.</div>}
            </div>
          </div>
        </div>
        <div className="inner">
          <button className="button" disabled={!linkedWorkItem} onClick={linkExistingWorkItem}>
            Link work item
          </button>
          <button className="default button" onClick={() => linkExistingWorkItemDialogRef.current!.close()}>
            Cancel
          </button>
        </div>
      </dialog>
    </div>
  );
};

export default ActionItemDisplay;
