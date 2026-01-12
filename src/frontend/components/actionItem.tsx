import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { getService } from "azure-devops-extension-sdk";
import { WorkItem, WorkItemType, WorkItemStateColor } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { WorkItemTrackingServiceIds, IWorkItemFormNavigationService } from "azure-devops-extension-api/WorkItemTracking";

import { itemDataService } from "../dal/itemDataService";
import { IFeedbackItemDocument } from "../interfaces/feedback";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";
import { getIconElement } from "./icons";

export interface ActionItemProps {
  feedbackItemId: string;
  boardId: string;
  actionItem: WorkItem;
  nonHiddenWorkItemTypes: WorkItemType[];
  allWorkItemTypes: WorkItemType[];
  areActionIconsHidden: boolean;
  shouldFocus: boolean;

  onUpdateActionItem: (feedbackItemId: IFeedbackItemDocument) => void;
}

export const ActionItem: React.FC<ActionItemProps> = ({ feedbackItemId, boardId, actionItem, allWorkItemTypes, areActionIconsHidden, shouldFocus, onUpdateActionItem }) => {
  const trackActivity = useTrackMetric(reactPlugin, "ActionItem");

  const openWorkItemButtonRef = useRef<HTMLDivElement>(null);
  const unlinkWorkItemDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (shouldFocus && openWorkItemButtonRef.current) {
      openWorkItemButtonRef.current.focus();
    }
  }, [shouldFocus]);

  const onActionItemClick = useCallback(
    async (workItemId: number) => {
      const workItemNavSvc = await getService<IWorkItemFormNavigationService>(WorkItemTrackingServiceIds.WorkItemFormNavigationService);

      await workItemNavSvc.openWorkItem(workItemId);

      // TODO: TASK 20104107 - When a work item is deleted, remove it as a link from all feedback items that it is linked to.

      const updatedFeedbackItem = await itemDataService.removeAssociatedItemIfNotExistsInVsts(boardId, feedbackItemId, workItemId);
      onUpdateActionItem(updatedFeedbackItem);

      openWorkItemButtonRef.current!.focus();
    },
    [boardId, feedbackItemId, onUpdateActionItem],
  );

  const onUnlinkWorkItemClick = useCallback(
    async (workItemId: number) => {
      const updatedFeedbackItem = await itemDataService.removeAssociatedActionItem(boardId, feedbackItemId, workItemId);
      onUpdateActionItem(updatedFeedbackItem);
    },
    [boardId, feedbackItemId, onUpdateActionItem],
  );

  const onConfirmUnlinkWorkItem = useCallback(
    async (workItemId: number) => {
      onUnlinkWorkItemClick(workItemId);
      unlinkWorkItemDialogRef.current!.close();
    },
    [onUnlinkWorkItemClick],
  );

  const showWorkItemForm = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event && event.stopPropagation();
      onActionItemClick(actionItem.id);
    },
    [actionItem.id, onActionItemClick],
  );

  const workItemType: WorkItemType | undefined = useMemo(() => {
    return allWorkItemTypes.find(wit => wit.name === actionItem.fields["System.WorkItemType"]);
  }, [allWorkItemTypes, actionItem.fields]);

  const workItemState: WorkItemStateColor | null = useMemo(() => {
    const workItemStates: WorkItemStateColor[] | null = workItemType?.states ?? null;
    return workItemStates ? (workItemStates.find(wisc => wisc.name === actionItem.fields["System.State"]) ?? null) : null;
  }, [workItemType, actionItem.fields]);

  const systemTitle: string = actionItem.fields["System.Title"];

  return (
    <div key={`${actionItem.id}card`} role="group" className="related-task-sub-card" style={{ borderRightColor: `#${workItemState?.color ?? ""}` }} onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      <img className="work-item-type-icon" alt={`icon for work item type ${workItemType?.name}`} src={workItemType?.icon?.url} />
      <div
        ref={openWorkItemButtonRef}
        key={`${actionItem.id}details`}
        className="details"
        tabIndex={0}
        role="button"
        title={actionItem.fields["System.Title"]}
        aria-label={`${actionItem.fields["System.WorkItemType"]} ${actionItem.fields["System.Title"]}, click to open work item`}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter") {
            showWorkItemForm(e);
          }
        }}
        onClick={showWorkItemForm}
      >
        {systemTitle}
      </div>
      {!areActionIconsHidden && (
        <button
          type="button"
          title="Remove link to work item"
          className="action"
          aria-label="Remove link to work item button"
          onClick={event => {
            event.stopPropagation();
            unlinkWorkItemDialogRef.current!.showModal();
          }}
          aria-haspopup="dialog"
        >
          {getIconElement("link-off")}
        </button>
      )}
      <dialog className="unlink-work-item-confirmation-dialog" aria-label="Remove Work Item Link" ref={unlinkWorkItemDialogRef} onClose={() => unlinkWorkItemDialogRef.current!.close()}>
        <div className="header">
          <h2 className="title">Remove Work Item Link</h2>
          <button onClick={() => unlinkWorkItemDialogRef.current!.close()} aria-label="Close">
            {getIconElement("close")}
          </button>
        </div>
        <div className="subText">Are you sure you want to remove the link to work item &apos;{actionItem.fields["System.Title"]}&apos;?</div>
        <div className="inner">
          <button
            className="button"
            onClick={event => {
              event.stopPropagation();
              onConfirmUnlinkWorkItem(actionItem.id);
            }}
          >
            Remove
          </button>
          <button className="default button" onClick={() => unlinkWorkItemDialogRef.current!.close()}>
            Cancel
          </button>
        </div>
      </dialog>
    </div>
  );
};

export default ActionItem;
