import * as React from 'react';
import { PrimaryButton, DefaultButton, Button, IconButton, ActionButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import Dialog, { DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog';
import { Checkbox, ICheckboxProps } from 'office-ui-fabric-react/lib/Checkbox';
const NoWorkSvg = require('../images/zerodata-no-work-scheduled.svg');

import { boardDataService } from '../dal/boardDataService';
import { IFeedbackBoardDocument, IFeedbackColumn } from '../interfaces/feedback';
import { List } from 'office-ui-fabric-react/lib/List';
import { DocumentCardType, DocumentCard } from 'office-ui-fabric-react/lib/DocumentCard';
import classNames = require('classnames');
import EditableDocumentCardTitle from './editableDocumentCardTitle';
import uuid = require('uuid');

interface IFeedbackBoardMetadataFormProps {
  isNewBoardCreation: boolean;
  currentBoard: IFeedbackBoardDocument;
  teamId: string;
  placeholderText: string;
  initialValue: string;
  onFormSubmit: (
      title: string, columns: IFeedbackColumn[],
      isBoardAnonymous: boolean, shouldShowFeedbackAfterCollect: boolean,
    ) => void;
  onFormCancel: () => void;
}

interface IFeedbackBoardMetadataFormState {
  title: string;
  isBoardNameTaken: boolean;
  placeholderText: string;
  columnCards: IFeedbackColumnCard[];
  isBoardAnonymous: boolean;
  shouldShowFeedbackAfterCollect: boolean;

  isDeleteColumnConfirmationDialogHidden: boolean;
  isChooseColumnIconDialogHidden: boolean;
  isChooseColumnAccentColorDialogHidden: boolean;
  columnCardBeingEdited: IFeedbackColumnCard;
  selectedIconKey: string;
  selectedAccentColorKey: string;
}

interface IFeedbackColumnCard {
  column: IFeedbackColumn;
  markedForDeletion: boolean;
}

export default class FeedbackBoardMetadataForm 
  extends React.Component<IFeedbackBoardMetadataFormProps, IFeedbackBoardMetadataFormState> {
  constructor(props: any) {
    super(props);

    const defaultColumnCards: IFeedbackColumnCard[] = [{
      column: {
        accentColor: '#008000',
        iconClass: 'far fa-smile',
        id: uuid(),
        title: 'What went well',
      },
      markedForDeletion: false,
    }, {
      column: {
        accentColor: '#cc293d',
        iconClass: 'far fa-frown',
        id: uuid(),
        title: "What didn't go well",
      },
      markedForDeletion: false,
    }];

    this.state = {
      columnCardBeingEdited: undefined,
      columnCards: this.props.isNewBoardCreation ?
      defaultColumnCards :
      this.props.currentBoard.columns.map((column) => {
        return {
          // Need a deep copy of the column object here to avoid making changes to the original column.
          // This ensures no changes are made when the user hits Cancel.
          column: { ...column },
          markedForDeletion: false,
        };
      }),
      isBoardAnonymous: this.props.isNewBoardCreation ?
        false : (this.props.currentBoard.isAnonymous ? this.props.currentBoard.isAnonymous : false),
      isBoardNameTaken: false,
      isChooseColumnAccentColorDialogHidden: true,
      isChooseColumnIconDialogHidden: true,
      isDeleteColumnConfirmationDialogHidden: true,
      placeholderText: this.props.placeholderText,
      selectedAccentColorKey: undefined,
      selectedIconKey: undefined,
      shouldShowFeedbackAfterCollect: this.props.isNewBoardCreation ?
      false :
      (
        this.props.currentBoard.shouldShowFeedbackAfterCollect ?
        this.props.currentBoard.shouldShowFeedbackAfterCollect : false
      ),
      title: this.props.initialValue,
    };
  }

  private maxColumnCount = 4;

  public handleInputChange = (event: any, newValue: string) => {
    this.setState({
      title: newValue,
      isBoardNameTaken: false,
    });
  }

  public handleFormSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    // hit enter with blank or hit enter without changing the value.
    if (this.state.title.trim() === '') {
      return;
    }

    const isBoardNameTaken = await boardDataService.checkIfBoardNameIsTaken(this.props.teamId, this.state.title);

    if (isBoardNameTaken && this.props.initialValue !== this.state.title) {
      this.setState({
        isBoardNameTaken: true,
      });

      return;
    }

    this.props.onFormSubmit(
      this.state.title.trim(),
      this.state.columnCards.filter((columnCard) => !columnCard.markedForDeletion).map((columnCard) => columnCard.column),
      this.state.isBoardAnonymous,
      this.state.shouldShowFeedbackAfterCollect);
  }
  
  private handleIsAnonymousCheckboxChange = (ev: React.MouseEvent<HTMLElement>, checked: boolean) => {
    this.setState({
      isBoardAnonymous: checked,
    });
  }

  private handleShouldShowFeedbackAfterCollectChange = (ev: React.MouseEvent<HTMLElement>, checked: boolean) => {
    this.setState({
      shouldShowFeedbackAfterCollect: checked,
    });
  }

  private showDeleteColumnConfirmationDialog = () => {
    this.setState({
      isDeleteColumnConfirmationDialogHidden: false,
    });
  }

  private hideDeleteColumnConfirmationDialog = () => {
    this.setState({
      isDeleteColumnConfirmationDialogHidden: true,
    });
  }

  private isSaveButtonEnabled = () => {
    if (!this.state.title.trim()) {
      return false;
    }

    if (!this.state.columnCards.filter((columnCard) => !columnCard.markedForDeletion).length) {
      return false;
    }

    if (this.state.columnCards.find((columnCard) => !columnCard.column.title.trim())) {
      return false;
    }

    return true;
  }

  private getRandomArrayElement = <T extends {}>(array: T[]) => {
    return array[Math.floor(Math.random() * array.length)];
  }

  private allIconClassNames: { friendlyName: string, iconClass: string }[] = [
    {
      friendlyName: 'smile',
      iconClass: 'far fa-smile',
    },
    {
      friendlyName: 'frown',
      iconClass: 'far fa-frown',
    },
    {
      friendlyName: 'chalkboard',
      iconClass: 'fas fa-chalkboard',
    },
    {
      friendlyName: 'comments',
      iconClass: 'far fa-comments',
    },
    {
      friendlyName: 'question',
      iconClass: 'fas fa-question',
    },
    {
      friendlyName: 'exclamation',
      iconClass: 'fas fa-exclamation',
    }
  ];

  private allAccentColors: { friendlyName: string, colorCode: string }[] = [
    {
      friendlyName: 'green',
      colorCode: '#008000'
    },
    {
      friendlyName: 'red',
      colorCode: '#cc293d'
    },
    {
      friendlyName: 'yellow',
      colorCode: '#f6af08'
    },
    {
      friendlyName: 'blue',
      colorCode: '#0078d4'
    },
    {
      friendlyName: 'purple',
      colorCode: '#8063bf'
    },
    {
      friendlyName: 'grey',
      colorCode: '#555555'
    },
  ];

  public render() {
    return (
      <div className="board-metadata-form">
        <img src={NoWorkSvg} alt="No Retrospectives found, create your first one to get started." width="160" className="board-metadata-logo" />
        <div className="board-metadata-form-section-header">Retrospective Title</div>
        <TextField autoFocus
          ariaLabel="Please enter new retrospective name"
          placeholder={this.props.placeholderText}
          className="title-input-container"
          value={this.state.title}
          maxLength={100}
          onChange={this.handleInputChange} />
        {this.state.isBoardNameTaken && <span className="input-validation-message">A board with this name already exists. Please choose a different name.</span>}
        <div className="board-metadata-form-anonymous-feedback-section hide-mobile">
          <div className="board-metadata-form-section-subheader">
              <Checkbox
                label="Make all feedback anonymous"
                ariaLabel="Make all feedback anonymous. This selection cannot be modified after board creation."
                boxSide="end"
                defaultChecked={this.state.isBoardAnonymous}
                disabled={!this.props.isNewBoardCreation}
                onChange={this.handleIsAnonymousCheckboxChange}
                styles={{
                  root: {
                    justifyContent: 'center',
                    width: '100%',
                    display: 'flex',
                  },
                }} />
          </div>

          <div className="board-metadata-form-section-subheader">
              <Checkbox
                label="Only show feedback after Collect phase"
                ariaLabel="Only show feedback after Collect phase. This selection cannot be modified after board creation."
                boxSide="end"
                defaultChecked={this.state.shouldShowFeedbackAfterCollect}
                disabled={!this.props.isNewBoardCreation}
                onChange={this.handleShouldShowFeedbackAfterCollectChange}
                styles={{
                  root: {
                    justifyContent: 'center',
                    width: '100%',
                    display: 'flex',
                  },
                }} />
                Note: These selections cannot be modified after board creation.
          </div>
        </div>
        <div className="board-metadata-form-edit-column-section hide-desktop">
          <div className="board-metadata-form-section-header">Columns</div>
          <div className="board-metadata-form-section-subheader">Editing columns is supported on the desktop version only. 
          Please use a device with a larger screen and expand the window width if you would like to add, edit, or remove columns.</div>
        </div>
        <div className="board-metadata-form-edit-column-section hide-mobile">
          <div className="board-metadata-form-section-header">Columns</div>
          <div className="board-metadata-form-section-subheader">You can create a maximum of {this.maxColumnCount} columns in a retrospective.</div>
          <List
            items={this.state.columnCards}
            onRenderCell={(columnCard: IFeedbackColumnCard, index: number) => {
              return (<DocumentCard
                className={classNames({
                  'feedback-column-card': true,
                  'marked-for-deletion': columnCard.markedForDeletion,
                })}
                type={DocumentCardType.compact}>
                <DefaultButton
                  className="feedback-column-card-icon-button"
                  ariaLabel="Change column icon"
                  disabled={columnCard.markedForDeletion}
                  onClick={
                    () => {
                      this.setState({
                        columnCardBeingEdited: columnCard,
                        isChooseColumnIconDialogHidden: false,
                      });
                    }}>
                  <i className={classNames('feedback-column-card-icon', columnCard.column.iconClass)} />
                </DefaultButton>
                <DefaultButton
                  className="feedback-column-card-accent-color-button"
                  ariaLabel="Change column color"
                  disabled={columnCard.markedForDeletion}
                  onClick={
                    () => {
                      this.setState({
                        columnCardBeingEdited: columnCard,
                        isChooseColumnAccentColorDialogHidden: false,
                      });
                    }}>
                  <i className={classNames('feedback-column-card-accent-color', 'fas fa-square')}
                    style={{ color: columnCard.column.accentColor }}
                  />
                </DefaultButton>
                <EditableDocumentCardTitle
                  isDisabled={columnCard.markedForDeletion}
                  isMultiline={false}
                  maxLength={25}
                  title={columnCard.column.title}
                  onSave={(newText: string) => {
                    columnCard.column.title = newText
                    this.setState({
                      columnCards: [].concat(this.state.columnCards),
                    });
                  }} />
                <IconButton
                  className="feedback-column-card-move-up-button"
                  iconProps={{ iconName: 'Up' }}
                  title="Move Up"
                  ariaLabel="Move Up"
                  disabled={columnCard.markedForDeletion || index === 0}
                  onClick={() => {
                    const newColumns = [].concat(this.state.columnCards);
                    [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
                    this.setState({
                      columnCards: newColumns,
                    });
                  }} />
                <IconButton
                  className="feedback-column-card-move-down-button"
                  iconProps={{ iconName: 'Down' }}
                  title="Move Down"
                  ariaLabel="Move Down"
                  disabled={columnCard.markedForDeletion || index === this.state.columnCards.length - 1}
                  onClick={() => {
                    const newColumns = [].concat(this.state.columnCards);
                    [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
                    this.setState({
                      columnCards: newColumns,
                    });
                  }} />
                {!columnCard.markedForDeletion &&
                  <IconButton
                    className="feedback-column-card-delete-button"
                    iconProps={{ iconName: 'Delete' }} title="Delete" ariaLabel="Delete"
                    disabled={this.state.columnCards.filter((columnCard) => !columnCard.markedForDeletion).length <= 1}
                    onClick={() => {
                      const newColumns = [].concat(this.state.columnCards);
                      newColumns[index].markedForDeletion = true;
                      this.setState({
                        columnCards: newColumns,
                      });
                    }}
                  />}
                {columnCard.markedForDeletion &&
                  <IconButton
                    className="feedback-column-card-undelete-button"
                    iconProps={{ iconName: 'Undo' }} title="Undo Delete" ariaLabel="Undo Delete"
                    disabled={this.state.columnCards.filter((columnCard) => !columnCard.markedForDeletion).length >= this.maxColumnCount}
                    onClick={() => {
                      const newColumns = [].concat(this.state.columnCards);
                      newColumns[index].markedForDeletion = false;
                      this.setState({
                        columnCards: newColumns,
                      });
                    }}
                  />}
              </DocumentCard>);
            }} />
          <div className="create-feedback-column-card-button-wrapper">
            <ActionButton
              className="create-feedback-column-card-button"
              aria-label="Add new column"
              iconProps={{ iconName: 'Add' }}
              disabled={this.state.columnCards.filter((columnCard) => !columnCard.markedForDeletion).length >= this.maxColumnCount}
              onClick={() => {
                const newColumns: IFeedbackColumnCard[] = [].concat(this.state.columnCards);
                const newColumnId = uuid();
                newColumns.push(
                  {
                    column: {
                      id: newColumnId,
                      title: "New Column",
                      iconClass: this.getRandomArrayElement(this.allIconClassNames).iconClass,
                      accentColor: this.getRandomArrayElement(this.allAccentColors).colorCode,
                    },
                    markedForDeletion: false,
                  });
                this.setState({
                  columnCards: newColumns,
                });
              }}>
              Add new column
          </ActionButton>
          </div>
        </div>
        <DialogFooter>
          <PrimaryButton
            disabled={!this.isSaveButtonEnabled()}
            onClick={(event) => {
              if (this.props.isNewBoardCreation || this.state.columnCards.every((columnCard) => !columnCard.markedForDeletion)) {
                this.handleFormSubmit(event);
              } else {
                // Ask for confirmation if user is deleting existing column(s).
                this.showDeleteColumnConfirmationDialog();
              }
            }} text="Save" />
          <DefaultButton onClick={this.props.onFormCancel} text="Cancel" />
        </DialogFooter>
        {this.props.currentBoard && <Dialog
          hidden={this.state.isDeleteColumnConfirmationDialogHidden}
          onDismiss={this.hideDeleteColumnConfirmationDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: 'Confirm Changes',
            subText: `Are you sure you want to remove columns from '${this.props.currentBoard.title}'? The feedback items in those columns will also be deleted. You will not be able to recover this data.`,
          }}
          modalProps={{
            isBlocking: true,
            containerClassName: 'retrospectives-confirm-changes-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          <DialogFooter>
            <PrimaryButton onClick={this.handleFormSubmit} text="Confirm" />
            <DefaultButton onClick={this.hideDeleteColumnConfirmationDialog} text="Cancel" />
          </DialogFooter>
        </Dialog>}
        {this.state.columnCardBeingEdited && <Dialog
          hidden={this.state.isChooseColumnIconDialogHidden}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Choose Column Icon',
            subText: `Choose the column icon for column '${this.state.columnCardBeingEdited.column.title}'`,
          }}
          modalProps={{
            isBlocking: false,
            containerClassName: 'retrospectives-choose-column-icon-dialog',
            className: 'retrospectives-dialog-modal',
          }}
          onDismiss={() => {
            this.setState({
              isChooseColumnIconDialogHidden: true,
              columnCardBeingEdited: null,
            });
          }}
        >
          {this.allIconClassNames.map((iconClassName) => {
            return <DefaultButton
              ariaLabel={'Choose the icon ' + iconClassName.friendlyName}
              className="choose-feedback-column-icon-button"
              key={iconClassName.friendlyName}
              onClick={() => {
                this.state.columnCardBeingEdited.column.iconClass = iconClassName.iconClass;
                this.setState({
                  isChooseColumnIconDialogHidden: true,
                  columnCardBeingEdited: null,
                  columnCards: [].concat(this.state.columnCards),
                });
              }}>
              <i className={iconClassName.iconClass} />
            </DefaultButton>
          })}
        </Dialog>}
        {this.state.columnCardBeingEdited && <Dialog
          hidden={this.state.isChooseColumnAccentColorDialogHidden}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Choose Column Color',
            subText: `Choose the column color for column '${this.state.columnCardBeingEdited.column.title}'`,
          }}
          modalProps={{
            isBlocking: false,
            containerClassName: 'retrospectives-choose-column-accent-color-dialog',
            className: 'retrospectives-dialog-modal',
          }}
          onDismiss={() => {
            this.setState({
              isChooseColumnAccentColorDialogHidden: true,
              columnCardBeingEdited: null,
            });
          }}>
          {this.allAccentColors.map((accentColor) => {
            return <DefaultButton
              key={accentColor.friendlyName}
              ariaLabel={'Choose the color ' + accentColor.friendlyName}
              className="choose-feedback-column-accent-color-button"
              onClick={() => {
                this.state.columnCardBeingEdited.column.accentColor = accentColor.colorCode;
                this.setState({
                  isChooseColumnAccentColorDialogHidden: true,
                  columnCardBeingEdited: undefined,
                  columnCards: [].concat(this.state.columnCards),
                });
              }}>
              <i className={'fas fa-square'}
                style={{
                  color: accentColor.colorCode,
                }} />
            </DefaultButton>
          })}
        </Dialog>}
      </div>
    );
  }
}
