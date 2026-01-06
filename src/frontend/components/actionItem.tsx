import React from "react";
import { getService } from "azure-devops-extension-sdk";
import { WorkItem, WorkItemType, WorkItemStateColor } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { WorkItemTrackingServiceIds, IWorkItemFormNavigationService } from "azure-devops-extension-api/WorkItemTracking";

import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { itemDataService } from "../dal/itemDataService";
import { IFeedbackItemDocument } from "../interfaces/feedback";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
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

export interface ActionItemState {
  linkedWorkItem: WorkItem;
  workItemSearchTextboxHasErrors: boolean;
}

export class ActionItem extends React.Component<ActionItemProps, ActionItemState> {
  constructor(props: ActionItemProps) {
    super(props);

    this.state = {
      linkedWorkItem: null as WorkItem,
      workItemSearchTextboxHasErrors: false,
    };

    this.openWorkItemButton = null;
  }

  componentDidMount() {
    if (this.props.shouldFocus && this.openWorkItemButton) {
      this.openWorkItemButton.focus();
    }
  }

  public openWorkItemButton: HTMLElement;
  private readonly unlinkWorkItemDialogRef = React.createRef<HTMLDialogElement>();

  private readonly onActionItemClick = async (workItemId: number) => {
    const workItemNavSvc = await getService<IWorkItemFormNavigationService>(WorkItemTrackingServiceIds.WorkItemFormNavigationService);

    await workItemNavSvc.openWorkItem(workItemId);

    // TODO: TASK 20104107 - When a work item is deleted, remove it as a link from all feedback items that it is linked to.

    const updatedFeedbackItem = await itemDataService.removeAssociatedItemIfNotExistsInVsts(this.props.boardId, this.props.feedbackItemId, workItemId);
    this.props.onUpdateActionItem(updatedFeedbackItem);
    this.updateLinkedItem(workItemId);

    if (this.openWorkItemButton) {
      this.openWorkItemButton.focus();
    }
  };

  private readonly onUnlinkWorkItemClick = async (workItemId: number) => {
    const updatedFeedbackItem = await itemDataService.removeAssociatedActionItem(this.props.boardId, this.props.feedbackItemId, workItemId);
    this.props.onUpdateActionItem(updatedFeedbackItem);
  };

  private readonly onConfirmUnlinkWorkItem = async (workItemId: number) => {
    this.onUnlinkWorkItemClick(workItemId);
    this.unlinkWorkItemDialogRef.current?.close();
  };

  private readonly updateLinkedItem = async (workItemId: number) => {
    if (this.state.linkedWorkItem && this.state.linkedWorkItem.id === workItemId) {
      const updatedLinkedWorkItem: WorkItem[] = await workItemService.getWorkItemsByIds([workItemId]);
      if (updatedLinkedWorkItem) {
        this.setState({
          linkedWorkItem: updatedLinkedWorkItem[0],
        });
      }
    }
  };

  private readonly showWorkItemForm = (event: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event && event.stopPropagation();
    this.onActionItemClick(this.props.actionItem.id);
  };

  public render() {
    const workItemType: WorkItemType = this.props.allWorkItemTypes.find(wit => wit.name === this.props.actionItem.fields["System.WorkItemType"]);

    const workItemStates: WorkItemStateColor[] = workItemType?.states ? workItemType.states : null;
    const workItemState: WorkItemStateColor = workItemStates ? workItemStates.find(wisc => wisc.name === this.props.actionItem.fields["System.State"]) : null;

    const systemTitle: string = this.props.actionItem.fields["System.Title"];

    return (
      <div key={`${this.props.actionItem.id}card`} role="group" className={`related-task-sub-card ${workItemState?.category?.toLowerCase() ?? ""}`.trim()}>
        <img className="work-item-type-icon" alt={`icon for work item type ${workItemType?.name}`} src={workItemType?.icon?.url} />
        <div
          ref={(element: HTMLElement) => {
            this.openWorkItemButton = element;
          }}
          key={`${this.props.actionItem.id}details`}
          className="details"
          tabIndex={0}
          role="button"
          title={this.props.actionItem.fields["System.Title"]}
          aria-label={`${this.props.actionItem.fields["System.WorkItemType"]} ${this.props.actionItem.fields["System.Title"]}, click to open work item`}
          data-right-border-color={workItemState?.color ?? ""}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter") {
              this.showWorkItemForm(e);
            }
          }}
          onClick={this.showWorkItemForm}
        >
          {systemTitle}
        </div>
        {!this.props.areActionIconsHidden && (
          <button
            type="button"
            title="Remove link to work item"
            className="action"
            aria-label="Remove link to work item button"
            onClick={event => {
              event.stopPropagation();
              this.unlinkWorkItemDialogRef.current?.showModal();
            }}
            aria-haspopup="dialog"
          >
            {getIconElement("link-off")}
          </button>
        )}
        <dialog className="unlink-work-item-confirmation-dialog" aria-label="Remove Work Item Link" ref={this.unlinkWorkItemDialogRef} onClose={() => this.unlinkWorkItemDialogRef.current?.close()}>
          <div className="header">
            <h2 className="title">Remove Work Item Link</h2>
            <button onClick={() => this.unlinkWorkItemDialogRef.current?.close()} aria-label="Close">
              {getIconElement("close")}
            </button>
          </div>
          <div className="subText">Are you sure you want to remove the link to work item &apos;{this.props.actionItem.fields["System.Title"]}&apos;?</div>
          <div className="inner">
            <button
              className="button"
              onClick={event => {
                event.stopPropagation();
                this.onConfirmUnlinkWorkItem(this.props.actionItem.id);
              }}
            >
              Remove
            </button>
            <button className="default button" onClick={() => this.unlinkWorkItemDialogRef.current?.close()}>
              Cancel
            </button>
          </div>
        </dialog>
      </div>
    );
  }
}

export default withAITracking(reactPlugin, ActionItem);
