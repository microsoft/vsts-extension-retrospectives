import { DefaultButton, IButtonProps, ActionButton, Button, BaseButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Image } from 'office-ui-fabric-react/lib/Image';
import * as React from 'react';
import { WebApiTeam } from 'TFS/Core/Contracts';
import { WorkItem, WorkItemType } from 'TFS/WorkItemTracking/Contracts';
import { WorkItemFormNavigationService } from 'TFS/WorkItemTracking/Services';

import { workItemService } from '../dal/azureDevOpsWorkItemService';
import { itemDataService } from '../dal/itemDataService';
import { IFeedbackItemDocument } from '../interfaces/feedback';
// TODO (enpolat) : import { TelemetryEvents, TelemetryEventProperties, appInsightsClient } from '../utilities/appInsightsClient'
import { FocusTrapCallout, DirectionalHint } from 'office-ui-fabric-react/lib/Callout';
import { List } from 'office-ui-fabric-react/lib/List';
import { getBoardUrl } from '../utilities/boardUrlHelper';
import Dialog, { DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import ActionItem from './actionItem';

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

export default class ActionItemDisplay extends React.Component<ActionItemDisplayProps, ActionItemDisplayState> {
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
    if(this.state.initialRender) {
      this.setState({ initialRender: false });
    }
  }

  private addActionItemButtonWrapper: HTMLElement | null;

  private createAndLinkActionItem = async (workItemTypeName: string) => {
    const workItemNavSvc = await WorkItemFormNavigationService.getService();
    const workItem = await workItemNavSvc.openNewWorkItem(workItemTypeName, {
      'System.AssignedTo': VSS.getWebContext().user.name,
      'Tags': 'feedback;reflect-hub',
      'Title': '',
      'Description': `${this.props.feedbackItemTitle}`,
      'priority': 1,
      'System.History': `Created by Retrospectives |` +
        ` Team [ ${this.props.team.name} ] Retrospective [ ${this.props.boardTitle} ] Item [ ${this.props.feedbackItemTitle} ]` +
        ` Link [ ${getBoardUrl(this.props.team.id, this.props.boardId)} ]`,
      'System.AreaPath': this.props.defaultAreaPath,
      'System.IterationPath': this.props.defaultIteration,
    });

    if (workItem) {
      const updatedFeedbackItem = await itemDataService.addAssociatedActionItem(this.props.boardId, this.props.feedbackItemId, workItem.id);
      // TODO (enpolat) : appInsightsClient.trackEvent(TelemetryEvents.WorkItemCreated, { [TelemetryEventProperties.WorkItemType]: workItemTypeName });
      this.props.onUpdateActionItem(updatedFeedbackItem);
    }
  }

  private renderAllWorkItemCards = () => {
    return this.props.actionItems.map((item) => {
      return this.renderWorkItemCard(item, false);
    });
  }

  private renderWorkItemCard = (item: WorkItem, areActionIconsHidden: boolean) => {
    return (
      <ActionItem
        key={item.id}
        feedbackItemId={this.props.feedbackItemId}
        boardId={this.props.boardId}
        actionItem={item}
        nonHiddenWorkItemTypes={this.props.nonHiddenWorkItemTypes}
        allWorkItemTypes={this.props.allWorkItemTypes}
        onUpdateActionItem={this.props.onUpdateActionItem}
        areActionIconsHidden={areActionIconsHidden}
        shouldFocus={!this.state.initialRender} />
    );
  }

  private addActionItem = (workItemTypeName: string) => {
    this.createAndLinkActionItem(workItemTypeName);
  }

  private onRenderWorkItemTypeIcon = (iconLocation: string, workItemType: string): JSX.Element => {
    return <Image src={iconLocation} className="work-item-icon" aria-label={`icon for work item type ${workItemType}`} />;
  }

  private hideSelectorCallout = () => {
    this.setState({
      isWorkItemTypeListCalloutVisible: false,
    });
  }

  private toggleSelectorCallout = () => {
    this.setState((prevState) => {
      return { isWorkItemTypeListCalloutVisible: !prevState.isWorkItemTypeListCalloutVisible };
    });
  }

  private handleKeyPressSelectorButton = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.keyCode === 13) {
      this.toggleSelectorCallout();
    }
  }

  private handleClickWorkItemType = (event: React.MouseEvent<Button | HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton | HTMLSpanElement>, item: WorkItemType) => {
    event && event.stopPropagation();
    this.hideSelectorCallout();
    this.addActionItem(item.name)
  }

  private handleInputChange = async (event?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
    if (!newValue || !newValue.trim()) {
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
  }

  private linkExistingWorkItem = async () => {
    this.linkExistingItemDialogDismiss();

    if (this.state.linkedWorkItem) {
      const updatedFeedbackItem = await itemDataService.addAssociatedActionItem(this.props.boardId, this.props.feedbackItemId, this.state.linkedWorkItem.id);
      // TODO (enpolat) : appInsightsClient.trackEvent(TelemetryEvents.ExistingWorkItemLinked, { [TelemetryEventProperties.WorkItemType]: this.state.linkedWorkItem.fields['System.WorkItemType'] });
      this.props.onUpdateActionItem(updatedFeedbackItem);
    }
  }

  private handleLinkExistingWorkItemClick = (mouseEvent: React.MouseEvent<Button | HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton> = undefined) => {
    if (mouseEvent) {
      mouseEvent.stopPropagation();
    }

    this.setState({
      isLinkedWorkItemLoaded: false,
      linkedWorkItem: null,
      isLinkExistingItemDialogHidden: false,
      workItemSearchTextboxHasErrors: false,
    });
  }

  private linkExistingItemDialogDismiss = () => {
    this.setState({
      isLinkExistingItemDialogHidden: true,
    });
  }

  public render(): JSX.Element {
    const { disabled, checked } = this.props;
    return (
      <div className="action-items">
        {this.props.allowAddNewActionItem &&
          <div className="add-action-item-wrapper">
            <div className="feedback-spacer" />
            <div
              ref={(div) => this.addActionItemButtonWrapper = div}>
              <ActionButton
                // @ts-ignore TS2769
                componentRef={(actionButton: HTMLElement) => this.addActionItemButton = actionButton}
                className="add-action-item-button"
                ariaLabel="Add work item"
                data-automation-id="actionItemDataAutomation"
                disabled={disabled}
                checked={checked}
                iconProps={{ iconName: 'Add' }}
                text="Add work item"
                onKeyPress={this.handleKeyPressSelectorButton}
                onClick={this.toggleSelectorCallout}
              />
            </div>
            {this.state.isWorkItemTypeListCalloutVisible &&
              <FocusTrapCallout
                className="add-action-item-callout"
                ariaLabel="List of available work item types"
                target={this.addActionItemButtonWrapper}
                directionalHint={DirectionalHint.rightCenter}
                gapSpace={0}
                focusTrapProps={{ isClickableOutsideFocusTrap: true }}
                isBeakVisible={false}
                onDismiss={this.hideSelectorCallout}
              >
                <div
                  className="add-action-item-list-container"
                  data-is-scrollable={true}
                >
                  <DefaultButton
                    className="add-action-item-list-item"
                    onClick={this.handleLinkExistingWorkItemClick}
                    onKeyDown={(e) => {
                      if (e.keyCode === 13) {
                        e.stopPropagation();
                        this.handleLinkExistingWorkItemClick();
                      }
                    }}
                  >
                    <i className="work-item-icon fas fa-link"></i>
                    <div className="add-action-item-list-item-text">
                      Link existing work item
                    </div>
                  </DefaultButton>
                  <div role="separator" className="work-item-list-divider" />
                  <List
                    className="add-action-item-list-items"
                    items={this.props.nonHiddenWorkItemTypes}
                    onRenderCell={(item: WorkItemType) => {
                      return (
                        <DefaultButton
                          className="add-action-item-list-item"
                          onClick={(e) => this.handleClickWorkItemType(e, item)}
                          tabIndex={0}
                          ariaLabel={`Add work item type ${item.name}`}>
                          {this.onRenderWorkItemTypeIcon(item.icon.url, item.name)}
                          <div className="add-action-item-list-item-text">
                            {item.name}
                          </div>
                        </DefaultButton>
                      );
                    }}
                  />
                </div>
              </FocusTrapCallout>
            }
          </div>
        }
        {this.renderAllWorkItemCards()}
        <Dialog
          hidden={this.state.isLinkExistingItemDialogHidden}
          onDismiss={this.linkExistingItemDialogDismiss}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Link existing work item',
          }}
          modalProps={{
            isBlocking: true,
            containerClassName: 'retrospectives-link-existing-work-item-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          <SearchBox
            autoFocus={true}
            placeholder="Enter the exact work item id"
            aria-label="Enter the exact work item id"
            onChange={this.handleInputChange}
            className="work-item-id-input"
          />
          <div className="error-container">
            {
              this.state.workItemSearchTextboxHasErrors && <span className="input-validation-message">Work item ids have to be positive numbers only.</span>
            }
          </div>
          <div className="output-container">
            {
              this.state.isLinkedWorkItemLoaded && this.state.linkedWorkItem && this.renderWorkItemCard(this.state.linkedWorkItem, true)
            }
            {
              this.state.isLinkedWorkItemLoaded && !this.state.linkedWorkItem &&
              <div className="work-item-not-found">The work item you are looking for was not found. Please verify the id.</div>
            }
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
