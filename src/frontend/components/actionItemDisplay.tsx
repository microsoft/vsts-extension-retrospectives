import { WebApiTeam } from "azure-devops-extension-api/Core";
import { IWorkItemFormNavigationService, WorkItemTrackingServiceIds } from "azure-devops-extension-api/WorkItemTracking";
import { WorkItem, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { getService, getUser } from "azure-devops-extension-sdk";
import React from "react";

import { withAITracking } from "@microsoft/applicationinsights-react-js";
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

export interface ActionItemDisplayState {
  isLinkedWorkItemLoaded: boolean;
  isWorkItemTypeListCalloutVisible: boolean;
  linkedWorkItem: WorkItem;
  initialRender: boolean;
}

class ActionItemDisplay extends React.Component<ActionItemDisplayProps, ActionItemDisplayState> {
  constructor(props: ActionItemDisplayProps) {
    super(props);

    this.state = {
      isWorkItemTypeListCalloutVisible: false,
      isLinkedWorkItemLoaded: false,
      linkedWorkItem: null,
      initialRender: true,
    };
  }

  private readonly addWorkItemButtonRef = React.createRef<HTMLButtonElement>();
  private readonly addWorkItemMenuRef = React.createRef<HTMLDivElement>();
  private readonly addWorkItemWrapperRef = React.createRef<HTMLDivElement>();
  private readonly linkExistingWorkItemDialogRef = React.createRef<HTMLDialogElement>();

  componentDidMount() {
    if (this.state.initialRender) {
      this.setState({ initialRender: false });
    }

    document.addEventListener("pointerdown", this.handleDocumentPointerDown);
  }

  componentWillUnmount(): void {
    document.removeEventListener("pointerdown", this.handleDocumentPointerDown);
  }

  private readonly createAndLinkActionItem = async (workItemTypeName: string) => {
    const boardUrl = await getBoardUrl(this.props.team.id, this.props.boardId, WorkflowPhase.Collect);
    const workItemNavSvc = await getService<IWorkItemFormNavigationService>(WorkItemTrackingServiceIds.WorkItemFormNavigationService);

    // Account for any users who are no longer a part of the org
    const assignedUser: string | undefined = getUser().name === undefined ? "Former User" : getUser().name;

    const workItem = await workItemNavSvc.openNewWorkItem(workItemTypeName, {
      "System.AssignedTo": assignedUser,
      "Tags": "feedback",
      "Title": "",
      "Description": `${this.props.feedbackItemTitle}`,
      "priority": 2,
      "System.History": `Created by Retrospectives |` + ` Team [ ${this.props.team.name} ] Retrospective [ ${this.props.boardTitle} ] Item [ ${this.props.feedbackItemTitle} ]` + ` Link [ ${boardUrl} ]`,
      "System.AreaPath": this.props.defaultAreaPath,
      "System.IterationPath": this.props.defaultIteration,
    });

    if (workItem) {
      const updatedFeedbackItem = await itemDataService.addAssociatedActionItem(this.props.boardId, this.props.feedbackItemId, workItem.id);
      appInsights.trackEvent({ name: TelemetryEvents.WorkItemCreated, properties: { workItemTypeName } });
      this.props.onUpdateActionItem(updatedFeedbackItem);
    }
  };

  private readonly renderAllWorkItemCards = () => {
    return this.props.actionItems.map(item => {
      return this.renderWorkItemCard(item, false);
    });
  };

  private readonly renderWorkItemCard = (item: WorkItem, areActionIconsHidden: boolean) => {
    return <ActionItem key={item.id} feedbackItemId={this.props.feedbackItemId} boardId={this.props.boardId} actionItem={item} nonHiddenWorkItemTypes={this.props.nonHiddenWorkItemTypes} allWorkItemTypes={this.props.allWorkItemTypes} onUpdateActionItem={this.props.onUpdateActionItem} areActionIconsHidden={areActionIconsHidden} shouldFocus={!this.state.initialRender} />;
  };

  private readonly addActionItem = (workItemTypeName: string) => {
    this.createAndLinkActionItem(workItemTypeName);
  };

  private readonly hideSelectorCallout = () => {
    this.setState({
      isWorkItemTypeListCalloutVisible: false,
    });
  };

  private readonly toggleSelectorCallout = () => {
    this.setState(prevState => ({ isWorkItemTypeListCalloutVisible: !prevState.isWorkItemTypeListCalloutVisible }));
  };

  private readonly handleDocumentPointerDown = (event: PointerEvent) => {
    if (!this.state.isWorkItemTypeListCalloutVisible) {
      return;
    }

    const wrapper = this.addWorkItemWrapperRef.current;
    const menu = this.addWorkItemMenuRef.current;
    const target = event.target as Node | null;

    if (!wrapper || !target) {
      return;
    }

    if (wrapper.contains(target)) {
      return;
    }

    if (menu && menu.contains(target)) {
      return;
    }

    this.hideSelectorCallout();
  };

  private readonly handleClickWorkItemType = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | HTMLSpanElement>, item: WorkItemType) => {
    event && event.stopPropagation();
    this.hideSelectorCallout();
    this.addActionItem(item.name);
  };

  private readonly handleInputChange = async (event?: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event?.target.value;

    if (!newValue?.trim()) {
      this.setState({
        isLinkedWorkItemLoaded: false,
      });
      return;
    }

    const workItemId = Number(newValue.trim());

    if (!workItemId) {
      this.setState({
        isLinkedWorkItemLoaded: false,
      });
      return;
    }

    const workItem = await workItemService.getWorkItemsByIds([workItemId]);
    this.setState({
      isLinkedWorkItemLoaded: true,
      linkedWorkItem: workItem[0] ? workItem[0] : null,
    });
  };

  private readonly linkExistingWorkItem = async () => {
    if (this.state.linkedWorkItem) {
      const updatedFeedbackItem = await itemDataService.addAssociatedActionItem(this.props.boardId, this.props.feedbackItemId, this.state.linkedWorkItem.id);

      appInsights.trackEvent({ name: TelemetryEvents.ExistingWorkItemLinked, properties: { workItemTypeName: this.state.linkedWorkItem.fields["System.WorkItemType"] } });

      this.props.onUpdateActionItem(updatedFeedbackItem);
    }

    this.linkExistingWorkItemDialogRef.current?.close();
  };

  private readonly handleLinkExistingWorkItemClick = (mouseEvent: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement> = undefined) => {
    if (mouseEvent) {
      mouseEvent.stopPropagation();
    }

    this.hideSelectorCallout();

    this.linkExistingWorkItemDialogRef.current?.showModal();
  };

  public render(): React.JSX.Element {
    return (
      <div className="action-items">
        {this.props.allowAddNewActionItem && (
          <div className="add-action-item-wrapper" ref={this.addWorkItemWrapperRef}>
            <button ref={this.addWorkItemButtonRef} className="add-action-item-button" aria-label="Add work item" data-automation-id="actionItemDataAutomation" onClick={this.toggleSelectorCallout}>
              {getIconElement("add")}
              <span>Add work item</span>
            </button>
            {this.state.isWorkItemTypeListCalloutVisible && (
              <div ref={this.addWorkItemMenuRef} className="popout-container" role="menu" aria-label="Add work item menu">
                <button
                  className="list-item"
                  onClick={this.handleLinkExistingWorkItemClick}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      this.handleLinkExistingWorkItemClick();
                    }
                  }}
                >
                  {getIconElement("link")}
                  <span>Link existing work item</span>
                </button>
                <div role="separator" className="separator" />
                {this.props.nonHiddenWorkItemTypes.map(item => {
                  return (
                    <button key={item.referenceName} className="list-item" onClick={e => this.handleClickWorkItemType(e, item)} aria-label={`Add work item type ${item.name}`}>
                      <img className="work-item-type-icon" alt={`icon for work item type ${item.name}`} src={item.icon.url} />
                      <div className="add-action-item-list-item-text">{item.name}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {this.renderAllWorkItemCards()}
        <dialog ref={this.linkExistingWorkItemDialogRef} className="link-existing-work-item-dialog" aria-label="Link existing work item" onClose={() => this.linkExistingWorkItemDialogRef.current?.close()}>
          <div className="header">
            <h2 className="title">Link existing work item</h2>
            <button onClick={() => this.linkExistingWorkItemDialogRef.current?.close()} aria-label="Close">
              {getIconElement("close")}
            </button>
          </div>
          <div className="subText">
            <div className="form-group">
              <input className="search-box" placeholder="Enter the exact work item id" role="searchbox" onChange={this.handleInputChange}></input>
              <div className="output-container">
                {this.state.isLinkedWorkItemLoaded && this.state.linkedWorkItem && this.renderWorkItemCard(this.state.linkedWorkItem, true)}
                {this.state.isLinkedWorkItemLoaded && !this.state.linkedWorkItem && <div className="work-item-not-found">The work item you are looking for was not found. Please verify the id.</div>}
              </div>
            </div>
          </div>
          <div className="inner">
            <button className="button" disabled={!this.state.linkedWorkItem} onClick={this.linkExistingWorkItem}>
              Link work item
            </button>
            <button className="default button" onClick={() => this.linkExistingWorkItemDialogRef.current?.close()}>
              Cancel
            </button>
          </div>
        </dialog>
      </div>
    );
  }
}

export default withAITracking(reactPlugin, ActionItemDisplay);
