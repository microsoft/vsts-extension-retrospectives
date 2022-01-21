import { DefaultButton, IButtonProps, PrimaryButton, BaseButton, Button } from 'office-ui-fabric-react/lib/Button';
import {
  DocumentCard,
  DocumentCardActions,
  DocumentCardTitle,
  DocumentCardType,
  DocumentCardPreview,
  IDocumentCardPreviewProps
} from 'office-ui-fabric-react/lib/DocumentCard';
import * as React from 'react';
import { getService } from 'azure-devops-extension-sdk';
import { WorkItem, WorkItemType, WorkItemStateColor } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';
import { WorkItemTrackingServiceIds, IWorkItemFormNavigationService } from 'azure-devops-extension-api/WorkItemTracking';

import { workItemService } from '../dal/azureDevOpsWorkItemService';
import { itemDataService } from '../dal/itemDataService';
import { IFeedbackItemDocument } from '../interfaces/feedback';
import { IconType } from 'office-ui-fabric-react/lib/Icon';
import Dialog, { DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';

export interface ActionItemProps extends IButtonProps {
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
  isUnlinkWorkItemConfirmationDialogHidden: boolean;
  linkedWorkItem: WorkItem;
  workItemSearchTextboxHasErrors: boolean;
}

export default class ActionItem extends React.Component<ActionItemProps, ActionItemState> {
  constructor(props: ActionItemProps) {
    super(props);

    this.state = {
      isUnlinkWorkItemConfirmationDialogHidden: true,
      linkedWorkItem: null as WorkItem,
      workItemSearchTextboxHasErrors: false,
    };

    this.openWorkItemButton = null;
  }

  componentDidMount() {
    if(this.props.shouldFocus && this.openWorkItemButton) {
      this.openWorkItemButton.focus();
    }
  }

  private openWorkItemButton: HTMLElement;

  private getWorkItemTypeIconProps = (workItemType: WorkItemType): IDocumentCardPreviewProps => {
    return {
      previewImages: [
        {
          previewIconContainerClass: 'work-item-type-icon-container',
          width: 36,
          previewIconProps: {
            ariaLabel: `icon for work item type ${workItemType.name}`,
            iconType: IconType.image,
            imageProps: {
              src: workItemType.icon.url,
              alt: `icon for work item type ${workItemType.name}`,
            }
          }
        }
      ],
    };
  }

  private onActionItemClick = async (workItemId: number) => {
    const workItemNavSvc = await getService<IWorkItemFormNavigationService>(WorkItemTrackingServiceIds.WorkItemFormNavigationService);

    await workItemNavSvc.openWorkItem(workItemId);

    // TODO: TASK 20104107 - When a work item is deleted, remove it as a link from all feedback items that it is linked to.

    const updatedFeedbackItem = await itemDataService.removeAssociatedItemIfNotExistsInVsts(this.props.boardId, this.props.feedbackItemId, workItemId);
    this.props.onUpdateActionItem(updatedFeedbackItem);
    this.updateLinkedItem(workItemId);

    if (this.openWorkItemButton) {
      this.openWorkItemButton.focus();
    }
  }

  private onUnlinkWorkItemClick = async (workItemId: number) => {
    const updatedFeedbackItem = await itemDataService.removeAssociatedActionItem(this.props.boardId, this.props.feedbackItemId, workItemId);
    this.props.onUpdateActionItem(updatedFeedbackItem);
  }

  private showUnlinkWorkItemConfirmationDialog = () => {
    this.setState({
      isUnlinkWorkItemConfirmationDialogHidden: false,
    });
  }

  private hideUnlinkWorkItemConfirmationDialog = () => {
    this.setState({
      isUnlinkWorkItemConfirmationDialogHidden: true,
    });
  }

  private onConfirmUnlinkWorkItem = async (workItemId: number) => {
    this.onUnlinkWorkItemClick(workItemId);
    this.hideUnlinkWorkItemConfirmationDialog();
  }

  private updateLinkedItem = async (workItemId: number) => {
    if (this.state.linkedWorkItem && this.state.linkedWorkItem.id === workItemId) {
      const updatedLinkedWorkItem: WorkItem[] = await workItemService.getWorkItemsByIds([workItemId]);
      if (updatedLinkedWorkItem) {
        this.setState({
          linkedWorkItem: updatedLinkedWorkItem[0],
        });
      }
    }
  }

  private handleKeyPressSelectorButton = (event: React.KeyboardEvent<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton | Button>) => {
    if (event.key === 'Enter') {
      this.showUnlinkWorkItem(event);
      return;
    }
  }

  private showUnlinkWorkItem = (event: React.KeyboardEvent<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton | Button> | React.MouseEvent<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement | BaseButton | Button | HTMLSpanElement, MouseEvent>) => {
    event.preventDefault();
    this.showUnlinkWorkItemConfirmationDialog();
    event.stopPropagation();
  }

  private showWorkItemForm = (event: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event && event.stopPropagation();
    this.onActionItemClick(this.props.actionItem.id);
  }

  public render() {
    const workItemType: any = this.props.allWorkItemTypes.find(wit => wit.name === this.props.actionItem.fields['System.WorkItemType']);
    const iconProps: IDocumentCardPreviewProps = this.getWorkItemTypeIconProps(workItemType);

    // Explicitly cast, since the returned contract contains states, but the interface defined does not
    const workItemStates: WorkItemStateColor[] = workItemType.states ? workItemType.states : null;
    const workItemState: WorkItemStateColor = workItemStates ? workItemStates.find(wisc => wisc.name === this.props.actionItem.fields['System.State']) : null;
    const resolvedBorderRight: string = workItemState && (workItemState.category === 'Completed' || workItemState.category === 'Resolved') ? 'resolved-border-right' : '';

    const systemTitle: string = this.props.actionItem.fields['System.Title'];
    const title = systemTitle.length > 25 ? systemTitle.substring(0, 25) + "..." : systemTitle;

    return (
      <DocumentCard
        key={this.props.actionItem.id + 'card'} 
        className={`related-task-sub-card ${resolvedBorderRight}`}
        type={DocumentCardType.compact}>
        <DocumentCardPreview key={this.props.actionItem.id + 'preview'} {...iconProps} />
        <div
          ref={(element: HTMLElement) => this.openWorkItemButton = element}
          key={this.props.actionItem.id + 'details'} 
          className="ms-DocumentCard-details"
          tabIndex={0}
          role="button"
          aria-label={`${this.props.actionItem.fields['System.WorkItemType']} ${this.props.actionItem.fields['System.Title']}, click to open work item`}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              this.showWorkItemForm(e);
            }
          }}
          onClick={this.showWorkItemForm}>
          <DocumentCardTitle key={this.props.actionItem.id + 'title'} title={title} shouldTruncate={true} />
        </div>
        {!this.props.areActionIconsHidden &&
          <DocumentCardActions
            actions={[
              {
                iconProps: { iconName: 'RemoveLink' },
                onClick: this.showUnlinkWorkItem,
                onKeyPress: this.handleKeyPressSelectorButton,
                title: 'Remove link to work item',
                ariaLabel: 'Remove link to work item button'
              }]
            } />
        }
        {!this.state.isUnlinkWorkItemConfirmationDialogHidden &&
          <Dialog
            hidden={false}
            onDismiss={this.hideUnlinkWorkItemConfirmationDialog}
            dialogContentProps={{
              type: DialogType.close,
              title: 'Remove Work Item Link',
              subText: `Are you sure you want to remove the link to work item '${this.props.actionItem.fields['System.Title']}'?`,
            }}
            modalProps={{
              isBlocking: true,
              containerClassName: 'retrospectives-unlink-work-item-confirmation-dialog',
              className: 'retrospectives-dialog-modal',
            }}>
            <DialogFooter>
              <PrimaryButton onClick={(e) => {
                e && e.stopPropagation();
                this.onConfirmUnlinkWorkItem(this.props.actionItem.id)
                }} text="Remove" />
              <DefaultButton onClick={this.hideUnlinkWorkItemConfirmationDialog} text="Cancel" />
            </DialogFooter>
          </Dialog>
        }
      </DocumentCard>
    );
  }
}
