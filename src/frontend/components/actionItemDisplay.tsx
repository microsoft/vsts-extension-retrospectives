import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

import { WebApiTeam } from "azure-devops-extension-api/Core";
import { IWorkItemFormNavigationService, WorkItemTrackingServiceIds } from "azure-devops-extension-api/WorkItemTracking";
import { WorkItem, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { getService, getUser } from "azure-devops-extension-sdk";

import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { itemDataService } from "../dal/itemDataService";
import { IFeedbackItemDocument } from "../interfaces/feedback";
import { getBoardUrl } from "../utilities/boardUrlHelper";
import { appInsights, reactPlugin, TelemetryEvents } from "../utilities/telemetryClient";
import ActionItem from "./actionItem";
import { WorkflowPhase } from "../interfaces/workItem";
import { getIconElement } from "./icons";
import { t } from "../utilities/localization";

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
  shouldShowAddWorkItemMenuBelow?: boolean;

  onUpdateActionItem: (feedbackItemId: IFeedbackItemDocument) => void;
}

export const ActionItemDisplay: React.FC<ActionItemDisplayProps> = ({ feedbackItemId, feedbackItemTitle, team, boardId, boardTitle, defaultIteration, defaultAreaPath, actionItems, nonHiddenWorkItemTypes, allWorkItemTypes, allowAddNewActionItem, shouldShowAddWorkItemMenuBelow = true, onUpdateActionItem }) => {
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

  const closeLinkExistingWorkItemDialog = useCallback((event?: React.SyntheticEvent) => {
    event?.stopPropagation();

    linkExistingWorkItemDialogRef.current!.close();
  }, []);

  const handleLinkExistingWorkItemDialogClose = useCallback((event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.stopPropagation();
  }, []);

  const linkExistingWorkItem = useCallback(async () => {
    const updatedFeedbackItem = await itemDataService.addAssociatedActionItem(boardId, feedbackItemId, linkedWorkItem!.id);

    appInsights.trackEvent({ name: TelemetryEvents.ExistingWorkItemLinked, properties: { workItemTypeName: linkedWorkItem!.fields["System.WorkItemType"] } });

    closeLinkExistingWorkItemDialog();
    onUpdateActionItem(updatedFeedbackItem);
  }, [linkedWorkItem, boardId, feedbackItemId, closeLinkExistingWorkItemDialog, onUpdateActionItem]);

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
      return <ActionItem key={item.id} feedbackItemId={feedbackItemId} boardId={boardId} actionItem={item} nonHiddenWorkItemTypes={nonHiddenWorkItemTypes} allWorkItemTypes={allWorkItemTypes} onUpdateActionItem={onUpdateActionItem} areActionIconsHidden={areActionIconsHidden} shouldFocus={!initialRender && shouldShowAddWorkItemMenuBelow} />;
    },
    [feedbackItemId, boardId, nonHiddenWorkItemTypes, allWorkItemTypes, onUpdateActionItem, initialRender, shouldShowAddWorkItemMenuBelow],
  );

  const renderAllWorkItemCards = useCallback(() => {
    return actionItems.map(item => {
      return renderWorkItemCard(item, false);
    });
  }, [actionItems, renderWorkItemCard]);

  const renderLinkExistingWorkItemButton = useCallback(() => {
    return (
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
        <span>{t("common_link_existing_work_item")}</span>
      </button>
    );
  }, [handleLinkExistingWorkItemClick]);

  const visibleWorkItemTypes = useMemo(() => {
    return [...(nonHiddenWorkItemTypes ?? [])].sort((left, right) => left.name.localeCompare(right.name));
  }, [nonHiddenWorkItemTypes]);

  return (
    <div className="action-item-display-container" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      {allowAddNewActionItem && (
        <div className="add-action-item-wrapper" ref={addWorkItemWrapperRef}>
          <button ref={addWorkItemButtonRef} className="add-action-item-button" aria-label={t("common_add_work_item")} data-automation-id="actionItemDataAutomation" onClick={toggleSelectorCallout}>
            {getIconElement("add")}
            <span>{t("common_add_work_item")}</span>
          </button>
          {isWorkItemTypeListCalloutVisible && (
            <div ref={addWorkItemMenuRef} className={`popout-container ${shouldShowAddWorkItemMenuBelow ? "popout-container-below" : ""}`.trim()} role="menu" aria-label={t("common_add_work_item_menu")}>
              {renderLinkExistingWorkItemButton()}
              {visibleWorkItemTypes.length > 0 && <div role="separator" className="separator" />}
              {visibleWorkItemTypes.map(item => {
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
      <dialog ref={linkExistingWorkItemDialogRef} className="link-existing-work-item-dialog dialog-width-sm" aria-label="Link existing work item" onCancel={handleLinkExistingWorkItemDialogClose} onClose={handleLinkExistingWorkItemDialogClose}>
        <div className="header">
          <h2 className="title">{t("common_link_existing_work_item")}</h2>
          <button onClick={closeLinkExistingWorkItemDialog} aria-label="Close">
            {getIconElement("close")}
          </button>
        </div>
        <div className="subText">
          <div className="form-group">
            <input className="search-box" placeholder="Enter the exact work item ID" role="searchbox" onChange={handleInputChange}></input>
            <div className="output-container">
              {isLinkedWorkItemLoaded && linkedWorkItem && renderWorkItemCard(linkedWorkItem, true)}
              {isLinkedWorkItemLoaded && !linkedWorkItem && <div className="work-item-not-found">The work item you are looking for was not found. Please verify the ID.</div>}
            </div>
          </div>
        </div>
        <div className="inner">
          <button className="button" disabled={!linkedWorkItem} onClick={linkExistingWorkItem}>
            {t("common_link_work_item")}
          </button>
          <button className="default button" onClick={closeLinkExistingWorkItemDialog}>
            {t("common_cancel")}
          </button>
        </div>
      </dialog>
    </div>
  );
};

export default ActionItemDisplay;
