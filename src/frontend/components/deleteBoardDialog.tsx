import React from 'react';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton
} from 'office-ui-fabric-react';
import { IBoardSummaryTableItem } from './boardSummaryTable';

interface DeleteBoardDialogProps {
  board: IBoardSummaryTableItem | undefined;
  hidden: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteBoardDialog: React.FC<DeleteBoardDialogProps> = ({
  board,
  hidden,
  onConfirm,
  onCancel
}) => {
  if (!board) return null;

  return (
    <Dialog
      hidden={hidden}
      onDismiss={onCancel}
      dialogContentProps={{
        type: DialogType.close,
        title: 'Delete Retrospective'
      }}
      modalProps={{
        isBlocking: true,
        containerClassName: 'retrospectives-delete-board-confirmation-dialog',
        className: 'retrospectives-dialog-modal'
      }}
    >
      <div>
        <p>
          The retrospective board <strong>{board.boardName}</strong> with <strong>{board.feedbackItemsCount}</strong> feedback items will be deleted.
        </p>
        <br />
        <p className="warning-text">
          <i className="fas fa-exclamation-triangle"></i>
          <strong>Warning:</strong> <em>This action is permanent and cannot be undone.</em>
        </p>
      </div>
      <DialogFooter>
        <PrimaryButton onClick={onConfirm} text="Delete" />
        <DefaultButton autoFocus onClick={onCancel} text="Cancel" />
      </DialogFooter>
    </Dialog>
  );
};

export default DeleteBoardDialog;
