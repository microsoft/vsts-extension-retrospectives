import React from "react";
import { PrimaryButton, DefaultButton, ActionButton } from "@fluentui/react/lib/Button";
import { IContextualMenuItem } from "@fluentui/react/lib/ContextualMenu";
import { Dialog, DialogType, DialogFooter } from "@fluentui/react/lib/Dialog";
import { SearchBox } from "@fluentui/react/lib/SearchBox";

import { IFeedbackItemDocument } from "../interfaces/feedback";
import { IColumn } from "./feedbackBoard";
import { IFeedbackItemProps } from "./feedbackItem";
import FeedbackItem from "./feedbackItem";
import { getIconElement } from "./icons";
import { WorkflowPhase } from "../interfaces/workItem";

export interface IFeedbackItemDialogsProps {
  displayTitle: string;
  isMainItem: boolean;
  isNotGroupedItem: boolean;
  workflowPhase: WorkflowPhase;
  isDeletionDisabled: boolean;

  isDeleteItemConfirmationDialogHidden: boolean;
  isMobileFeedbackItemActionsDialogHidden: boolean;
  isMoveFeedbackItemDialogHidden: boolean;
  isGroupFeedbackItemDialogHidden: boolean;
  isRemoveFeedbackItemFromGroupConfirmationDialogHidden: boolean;

  searchTerm: string;
  searchedFeedbackItems: IFeedbackItemDocument[];

  columns: { [id: string]: IColumn };
  columnIds: string[];
  currentColumnId: string;

  feedbackItemPropsBuilder: (searchItem: IFeedbackItemDocument) => IFeedbackItemProps;

  onConfirmDelete: () => void;
  onHideDeleteDialog: () => void;
  onHideMobileActionsDialog: () => void;
  onHideMoveDialog: () => void;
  onHideGroupDialog: () => void;
  onHideRemoveFromGroupDialog: () => void;
  onConfirmRemoveFromGroup: () => void;
  onMoveToColumn: (columnId: string) => void;
  onSearchInputChange: (event?: React.ChangeEvent<HTMLInputElement>, searchTerm?: string) => void;
  onClickSearchedItem: (event: React.MouseEvent<HTMLButtonElement>, feedbackItemProps: IFeedbackItemProps) => void;
  onKeyDownSearchedItem: (event: React.KeyboardEvent<HTMLButtonElement>, feedbackItemProps: IFeedbackItemProps) => void;

  mobileMenuItems: Array<{
    menuItem: IContextualMenuItem;
    workflowPhases: WorkflowPhase[];
    hideMobile?: boolean;
    hideMainItem?: boolean;
  }>;
}

const FeedbackItemDialogs: React.FC<IFeedbackItemDialogsProps> = ({ displayTitle, isMainItem, isNotGroupedItem, workflowPhase, isDeletionDisabled, isDeleteItemConfirmationDialogHidden, isMobileFeedbackItemActionsDialogHidden, isMoveFeedbackItemDialogHidden, isGroupFeedbackItemDialogHidden, isRemoveFeedbackItemFromGroupConfirmationDialogHidden, searchTerm, searchedFeedbackItems, columns, columnIds, currentColumnId, feedbackItemPropsBuilder, onConfirmDelete, onHideDeleteDialog, onHideMobileActionsDialog, onHideMoveDialog, onHideGroupDialog, onHideRemoveFromGroupDialog, onConfirmRemoveFromGroup, onMoveToColumn, onSearchInputChange, onClickSearchedItem, onKeyDownSearchedItem, mobileMenuItems }) => {
  return (
    <>
      <Dialog
        hidden={isDeleteItemConfirmationDialogHidden}
        onDismiss={onHideDeleteDialog}
        dialogContentProps={{
          type: DialogType.close,
          title: "Delete Feedback",
          subText: `Are you sure you want to delete the feedback "${displayTitle}"?\n            ${!isNotGroupedItem && isMainItem ? "Any feedback grouped underneath this one will be ungrouped." : ""}`,
        }}
        modalProps={{
          isBlocking: true,
          containerClassName: "retrospectives-delete-feedback-item-dialog",
          className: "retrospectives-dialog-modal",
        }}
      >
        <DialogFooter>
          <PrimaryButton onClick={onConfirmDelete} text="Delete" />
          <DefaultButton onClick={onHideDeleteDialog} text="Cancel" />
        </DialogFooter>
      </Dialog>

      <Dialog
        hidden={isMobileFeedbackItemActionsDialogHidden}
        onDismiss={onHideMobileActionsDialog}
        modalProps={{
          isBlocking: false,
          containerClassName: "ms-dialogMainOverride",
          className: "retrospectives-dialog-modal",
        }}
      >
        <div className="mobile-contextual-menu-list">
          {mobileMenuItems
            .filter(menuItem => !menuItem.hideMobile)
            .filter(menuItem => !(isMainItem && menuItem.hideMainItem))
            .map(menuItem => {
              const disabled = isDeletionDisabled || menuItem.workflowPhases.indexOf(workflowPhase) === -1;
              return (
                <ActionButton
                  key={menuItem.menuItem.key}
                  className={menuItem.menuItem.className}
                  iconProps={menuItem.menuItem.iconProps}
                  disabled={disabled}
                  aria-label={menuItem.menuItem.text}
                  onClick={() => {
                    onHideMobileActionsDialog();
                    menuItem.menuItem.onClick?.(undefined, menuItem.menuItem);
                  }}
                  text={menuItem.menuItem.text}
                  title={menuItem.menuItem.title}
                />
              );
            })}
        </div>
        <DialogFooter>
          <DefaultButton onClick={onHideMobileActionsDialog} text="Close" />
        </DialogFooter>
      </Dialog>

      <Dialog
        hidden={isMoveFeedbackItemDialogHidden}
        maxWidth={500}
        minWidth={500}
        onDismiss={onHideMoveDialog}
        dialogContentProps={{
          type: DialogType.close,
          title: "Move Feedback to Different Column",
          subText: "Choose the column you want to move this feedback to",
        }}
        modalProps={{
          isBlocking: false,
          containerClassName: "retrospectives-move-feedback-item-dialog",
          className: "retrospectives-dialog-modal",
        }}
      >
        {columnIds
          .filter(columnId => columnId !== currentColumnId)
          .map(columnId => (
            <DefaultButton key={columnId} className="move-feedback-item-column-button" onClick={() => onMoveToColumn(columnId)}>
              {getIconElement(columns[columnId].columnProperties.iconClass)}
              {columns[columnId].columnProperties.title}
            </DefaultButton>
          ))}
      </Dialog>

      <Dialog
        hidden={isGroupFeedbackItemDialogHidden}
        maxWidth={600}
        minWidth={600}
        onDismiss={onHideGroupDialog}
        dialogContentProps={{
          type: DialogType.close,
          title: "Group Feedback",
        }}
        modalProps={{
          isBlocking: false,
          containerClassName: "retrospectives-group-feedback-item-dialog",
          className: "retrospectives-dialog-modal",
        }}
      >
        <label className="ms-Dialog-subText" htmlFor="feedback-item-search-input">
          Search and select the feedback under which to group the current feedback.
        </label>
        <SearchBox id="feedback-item-search-input" autoFocus={true} placeholder="Enter the feedback title" aria-label="Enter the feedback title" onChange={onSearchInputChange} />
        <div className="output-container">
          {!searchedFeedbackItems.length && searchTerm && <p className="no-matching-feedback-message">No feedback with title containing your input.</p>}
          {searchedFeedbackItems.map((searchItem, index) => {
            const feedbackItemProps = feedbackItemPropsBuilder(searchItem);
            return (
              <button key={searchItem.id} className="feedback-item-search-result-item" onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => onClickSearchedItem(e, feedbackItemProps)} onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => onKeyDownSearchedItem(e, feedbackItemProps)} tabIndex={index}>
                <FeedbackItem {...feedbackItemProps} />
              </button>
            );
          })}
        </div>
      </Dialog>

      <Dialog
        hidden={isRemoveFeedbackItemFromGroupConfirmationDialogHidden}
        onDismiss={onHideRemoveFromGroupDialog}
        dialogContentProps={{
          type: DialogType.close,
          title: "Remove Feedback from Group",
          subText: `Are you sure you want to remove the feedback "${displayTitle}" from its current group?`,
        }}
        modalProps={{
          isBlocking: true,
          containerClassName: "retrospectives-remove-feedback-item-from-group-dialog",
          className: "retrospectives-dialog-modal",
        }}
      >
        <DialogFooter>
          <PrimaryButton onClick={onConfirmRemoveFromGroup} text="Remove Feedback from Group" />
          <DefaultButton onClick={onHideRemoveFromGroupDialog} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </>
  );
};

FeedbackItemDialogs.displayName = "FeedbackItemDialogs";

export default FeedbackItemDialogs;
