import { WebApiTeam } from "azure-devops-extension-api/Core";
import { IWorkItemFormNavigationService, WorkItemTrackingServiceIds } from "azure-devops-extension-api/WorkItemTracking";
import { WorkItem, WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { getService, getUser } from "azure-devops-extension-sdk";
import { ActionButton, BaseButton, Button, DefaultButton, IButtonProps, PrimaryButton } from "@fluentui/react/lib/Button";
import { Image } from "@fluentui/react/lib/Image";
import React from "react";

import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { DirectionalHint, FocusTrapCallout } from "@fluentui/react/lib/Callout";
import Dialog, { DialogFooter, DialogType } from "@fluentui/react/lib/Dialog";
import { List } from "@fluentui/react/lib/List";
import { SearchBox } from "@fluentui/react/lib/SearchBox";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { itemDataService } from "../dal/itemDataService";
import { IFeedbackItemDocument } from "../interfaces/feedback";
import { getBoardUrl } from "../utilities/boardUrlHelper";
import { appInsights, reactPlugin, TelemetryEvents } from "../utilities/telemetryClient";
import ActionItem from "./actionItem";
import { WorkflowPhase } from "../interfaces/workItem";
import { getIconElement, LinkIcon } from "./icons";

export interface ActionItemDisplayProps extends IButtonProps {
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
  isLinkExistingItemDialogHidden: boolean;
  isWorkItemTypeListCalloutVisible: boolean;
  linkedWorkItem: WorkItem;
  workItemSearchTextboxHasErrors: boolean;
  initialRender: boolean;
}

class ActionItemDisplay extends React.Component<ActionItemDisplayProps, ActionItemDisplayState> {
  constructor(props: ActionItemDisplayProps) {
    super(props);

    this.state = {
      isWorkItemTypeListCalloutVisible: false,
      isLinkExistingItemDialogHidden: true,
      isLinkedWorkItemLoaded: false,
      linkedWorkItem: null,
      workItemSearchTextboxHasErrors: false,
      initialRender: true,
    };
  }

  componentDidMount() {
    if (this.state.initialRender) {
      this.setState({ initialRender: false });
    }
  }

  private addActionItemButtonWrapper: HTMLElement | null;
  private addActionItemButton: HTMLElement;

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
      "priority": 1,
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

  private readonly onRenderWorkItemTypeIcon = (iconLocation: string, workItemType: string): React.JSX.Element => {
    return <Image src={iconLocation} className="work-item-icon" aria-label={`icon for work item type ${workItemType}`} />;
  };

  private readonly hideSelectorCallout = () => {
    this.setState({
      isWorkItemTypeListCalloutVisible: false,
    });
  };

  private readonly toggleSelectorCallout = () => {
    this.setState(prevState => {
      return { isWorkItemTypeListCalloutVisible: !prevState.isWorkItemTypeListCalloutVisible };
    });
  };

  private readonly handleKeyPressSelectorButton = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      this.toggleSelectorCallout();
    }
  };

  private readonly handleClickWorkItemType = (event: React.MouseEvent<Button | HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton | HTMLSpanElement>, item: WorkItemType) => {
    event && event.stopPropagation();
    this.hideSelectorCallout();
    this.addActionItem(item.name);
  };

  private readonly handleInputChange = async (event?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
    if (!newValue?.trim()) {
      this.setState({
        isLinkedWorkItemLoaded: false,
        workItemSearchTextboxHasErrors: false,
      });
      return;
    }

    const workItemId = Number(newValue.trim());

    if (!workItemId) {
      this.setState({
        workItemSearchTextboxHasErrors: true,
        isLinkedWorkItemLoaded: false,
      });
      return;
    }

    const workItem = await workItemService.getWorkItemsByIds([workItemId]);
    this.setState({
      isLinkedWorkItemLoaded: true,
      linkedWorkItem: workItem[0] ? workItem[0] : null,
      workItemSearchTextboxHasErrors: false,
    });
  };

  private readonly linkExistingWorkItem = async () => {
    this.linkExistingItemDialogDismiss();

    if (this.state.linkedWorkItem) {
      const updatedFeedbackItem = await itemDataService.addAssociatedActionItem(this.props.boardId, this.props.feedbackItemId, this.state.linkedWorkItem.id);

      appInsights.trackEvent({ name: TelemetryEvents.ExistingWorkItemLinked, properties: { workItemTypeName: this.state.linkedWorkItem.fields["System.WorkItemType"] } });

      this.props.onUpdateActionItem(updatedFeedbackItem);
    }
  };

  private readonly handleLinkExistingWorkItemClick = (mouseEvent: React.MouseEvent<Button | HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton> = undefined) => {
    if (mouseEvent) {
      mouseEvent.stopPropagation();
    }

    this.setState({
      isLinkedWorkItemLoaded: false,
      linkedWorkItem: null,
      isLinkExistingItemDialogHidden: false,
      workItemSearchTextboxHasErrors: false,
    });
  };

  private readonly linkExistingItemDialogDismiss = () => {
    this.setState({
      isLinkExistingItemDialogHidden: true,
    });
  };

  public render(): React.JSX.Element {
    const { disabled, checked } = this.props;
    return (
      <div className="action-items">
        {this.props.allowAddNewActionItem && (
          <div className="add-action-item-wrapper">
            <div className="feedback-spacer" aria-hidden />
            <div
              className="add-action-item-section"
              ref={div => {
                this.addActionItemButtonWrapper = div;
              }}
            >
              <ActionButton
                // @ts-ignore TS2769
                componentRef={(actionButton: HTMLElement) => {
                  this.addActionItemButton = actionButton;
                }}
                className="add-action-item-button"
                ariaLabel="Add work item"
                data-automation-id="actionItemDataAutomation"
                disabled={disabled}
                checked={checked}
                iconProps={{ iconName: "Add" }}
                text="Add work item"
                onKeyPress={this.handleKeyPressSelectorButton}
                onClick={this.toggleSelectorCallout}
              />
            </div>
            {this.state.isWorkItemTypeListCalloutVisible && (
              <FocusTrapCallout className="add-action-item-callout" ariaLabel="List of available work item types" target={this.addActionItemButtonWrapper} directionalHint={DirectionalHint.rightCenter} gapSpace={0} focusTrapProps={{ isClickableOutsideFocusTrap: true }} isBeakVisible={false} onDismiss={this.hideSelectorCallout}>
                <div className="add-action-item-list-container" data-is-scrollable={true}>
                  <DefaultButton
                    className="add-action-item-list-item"
                    onClick={this.handleLinkExistingWorkItemClick}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        this.handleLinkExistingWorkItemClick();
                      }
                    }}
                  >
                    {getIconElement("link")}
                    <div className="add-action-item-list-item-text">Link existing work item</div>
                  </DefaultButton>
                  <div role="separator" className="work-item-list-divider" />
                  <List
                    className="add-action-item-list-items"
                    items={this.props.nonHiddenWorkItemTypes}
                    onRenderCell={(item: WorkItemType) => {
                      return (
                        <DefaultButton className="add-action-item-list-item" onClick={e => this.handleClickWorkItemType(e, item)} tabIndex={0} ariaLabel={`Add work item type ${item.name}`}>
                          {this.onRenderWorkItemTypeIcon(item.icon.url, item.name)}
                          <div className="add-action-item-list-item-text">{item.name}</div>
                        </DefaultButton>
                      );
                    }}
                  />
                </div>
              </FocusTrapCallout>
            )}
          </div>
        )}
        {this.renderAllWorkItemCards()}
        <Dialog
          hidden={this.state.isLinkExistingItemDialogHidden}
          onDismiss={this.linkExistingItemDialogDismiss}
          dialogContentProps={{
            type: DialogType.normal,
            title: "Link existing work item",
          }}
          modalProps={{
            isBlocking: true,
            containerClassName: "retrospectives-link-existing-work-item-dialog",
            className: "retrospectives-dialog-modal",
          }}
        >
          <SearchBox autoFocus={true} placeholder="Enter the exact work item id" aria-label="Enter the exact work item id" onChange={this.handleInputChange} className="work-item-id-input" />
          <div className="error-container">{this.state.workItemSearchTextboxHasErrors && <span className="input-validation-message">Work item ids have to be positive numbers only.</span>}</div>
          <div className="output-container">
            {this.state.isLinkedWorkItemLoaded && this.state.linkedWorkItem && this.renderWorkItemCard(this.state.linkedWorkItem, true)}
            {this.state.isLinkedWorkItemLoaded && !this.state.linkedWorkItem && <div className="work-item-not-found">The work item you are looking for was not found. Please verify the id.</div>}
          </div>
          <DialogFooter>
            <PrimaryButton disabled={!this.state.linkedWorkItem} onClick={this.linkExistingWorkItem} text="Link work item" />
            <DefaultButton onClick={this.linkExistingItemDialogDismiss} text="Cancel" />
          </DialogFooter>
        </Dialog>
      </div>
    );
  }
}

export default withAITracking(reactPlugin, ActionItemDisplay);
