import React, { ChangeEvent } from 'react';
import { PrimaryButton, DefaultButton, IconButton, ActionButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import Dialog, { DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';

import BoardDataService from '../dal/boardDataService';
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions, IFeedbackColumn } from '../interfaces/feedback';
import { List } from 'office-ui-fabric-react/lib/List';
import { DocumentCardType, DocumentCard } from 'office-ui-fabric-react/lib/DocumentCard';
import classNames from 'classnames'
import EditableDocumentCardTitle from './editableDocumentCardTitle';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/telemetryClient';
import { getColumnsByTemplateId } from '../utilities/boardColumnsHelper';
import { Pivot, PivotItem } from 'office-ui-fabric-react';
import FeedbackBoardMetadataFormPermissions, { FeedbackBoardPermissionOption, FeedbackBoardPermissionState } from './feedbackBoardMetadataFormPermissions';
import { generateUUID } from '../utilities/random';

export interface IFeedbackBoardMetadataFormProps {
  isNewBoardCreation: boolean;
  isDuplicatingBoard: boolean;
  currentBoard: IFeedbackBoardDocument;
  teamId: string;
  placeholderText: string;
  maxVotesPerUser: number;
  availablePermissionOptions: FeedbackBoardPermissionOption[]
  onFormSubmit: (
    title: string,
    maxVotesPerUser: number,
    columns: IFeedbackColumn[],
    isIncludeTeamEffectivenessMeasurement: boolean,
    isBoardAnonymous: boolean,
    shouldShowFeedbackAfterCollect: boolean,
    displayPrimeDirective: boolean,
    permissions: IFeedbackBoardDocumentPermissions) => void;
  onFormCancel: () => void;
}

interface IFeedbackBoardMetadataFormState {
  initialTitle: string;
  title: string;
  isBoardNameTaken: boolean;
  placeholderText: string;
  columnCards: IFeedbackColumnCard[];
  isIncludeTeamEffectivenessMeasurement: boolean;
  isBoardAnonymous: boolean;
  shouldShowFeedbackAfterCollect: boolean;
  displayPrimeDirective: boolean;
  maxVotesPerUser: number;
  isDeleteColumnConfirmationDialogHidden: boolean;
  isChooseColumnIconDialogHidden: boolean;
  isChooseColumnAccentColorDialogHidden: boolean;
  columnCardBeingEdited: IFeedbackColumnCard;
  selectedIconKey: string;
  selectedAccentColorKey: string;
  permissions: IFeedbackBoardDocumentPermissions
}

export interface IFeedbackColumnCard {
  column: IFeedbackColumn;
  markedForDeletion: boolean;
}

class FeedbackBoardMetadataForm extends React.Component<IFeedbackBoardMetadataFormProps, IFeedbackBoardMetadataFormState> {
  constructor(props: IFeedbackBoardMetadataFormProps) {
    super(props);

    let defaultTitle = '';
    let defaultColumns: IFeedbackColumnCard[] = getColumnsByTemplateId("").map(column => ({ column, markedForDeletion: false }));
    let defaultMaxVotes = 5;
    let defaultPermissions: IFeedbackBoardDocumentPermissions = { Teams: [], Members: [] };

    // Temporary default values for settings
    let defaultIncludeTeamEffectivenessMeasurement: boolean = true;
    let defaultDisplayPrimeDirective: boolean = false; //DPH, if this works set to default to true and correct test
    let defaultShowFeedbackAfterCollect: boolean = false;
    let defaultIsAnonymous: boolean = false;

    if (props.isDuplicatingBoard) {
        // If duplicating, inherit settings from the current board
        defaultTitle = `${props.currentBoard.title} - copy`;
        defaultColumns = props.currentBoard.columns.map(column => ({ column, markedForDeletion: false }));
        defaultMaxVotes = props.currentBoard.maxVotesPerUser;
        defaultIncludeTeamEffectivenessMeasurement = props.currentBoard.isIncludeTeamEffectivenessMeasurement;
        defaultDisplayPrimeDirective = props.currentBoard.displayPrimeDirective;
        defaultShowFeedbackAfterCollect = props.currentBoard.shouldShowFeedbackAfterCollect;
        defaultIsAnonymous = props.currentBoard.isAnonymous;
        defaultPermissions = props.currentBoard.permissions;
    }

    // DPH || props.isDuplicatingBoard
    this.state = {
        columnCardBeingEdited: undefined,
        columnCards: props.isNewBoardCreation
            ? defaultColumns : props.currentBoard.columns.map(column => ({ column, markedForDeletion: false })),
        isIncludeTeamEffectivenessMeasurement: props.isNewBoardCreation
            ? defaultIncludeTeamEffectivenessMeasurement : props.currentBoard.isIncludeTeamEffectivenessMeasurement,
        displayPrimeDirective: props.isNewBoardCreation
            ? defaultDisplayPrimeDirective : props.currentBoard.displayPrimeDirective,
        shouldShowFeedbackAfterCollect: props.isNewBoardCreation
            ? defaultShowFeedbackAfterCollect : props.currentBoard.shouldShowFeedbackAfterCollect,
        isBoardAnonymous: props.isNewBoardCreation
            ? defaultIsAnonymous : props.currentBoard.isAnonymous,
        maxVotesPerUser: props.isNewBoardCreation
            ? defaultMaxVotes : props.currentBoard.maxVotesPerUser,
        isBoardNameTaken: false,
        isChooseColumnAccentColorDialogHidden: true,
        isChooseColumnIconDialogHidden: true,
        isDeleteColumnConfirmationDialogHidden: true,
        placeholderText: props.placeholderText,
        selectedAccentColorKey: undefined,
        selectedIconKey: undefined,
        initialTitle: props.isNewBoardCreation
            ? defaultTitle : props.currentBoard.title,
        title: props.isNewBoardCreation
            ? defaultTitle : props.currentBoard.title,
        permissions: props.isNewBoardCreation
            ? defaultPermissions : props.currentBoard.permissions
/*
      isIncludeTeamEffectivenessMeasurement: this.props.isNewBoardCreation ? defaultIncludeTeamEffectivenessMeasurement : this.props.currentBoard.isIncludeTeamEffectivenessMeasurement,
      displayPrimeDirective: this.props.isNewBoardCreation ? defaultDisplayPrimeDirective : this.props.currentBoard.displayPrimeDirective,
      shouldShowFeedbackAfterCollect: this.props.isNewBoardCreation ? defaultShowFeedbackAfterCollect : this.props.currentBoard.shouldShowFeedbackAfterCollect,
      isBoardAnonymous: this.props.isNewBoardCreation ? defaultIsAnonymous : this.props.currentBoard.isAnonymous,
      maxVotesPerUser: this.props.isNewBoardCreation ? defaultMaxVotes : this.props.currentBoard.maxVotesPerUser,
      initialTitle: this.props.isNewBoardCreation ? defaultTitle : this.props.currentBoard.title,
      title: this.props.isNewBoardCreation ? defaultTitle : this.props.currentBoard.title,
      permissions: this.props.isNewBoardCreation ? defaultPermissions : this.props.currentBoard.permissions
*/
    };
  }

  // DPH new
  async componentDidMount() {
    try {
        if (this.props.isNewBoardCreation) {
            const [
                includeTeamEffectivenessMeasurement,
                displayPrimeDirective,
                showFeedbackAfterCollect,
                isAnonymous
            ] = await Promise.all([
                BoardDataService.getSetting("isIncludeTeamEffectivenessMeasurement"),
                BoardDataService.getSetting("displayPrimeDirective"),
                BoardDataService.getSetting("shouldShowFeedbackAfterCollect"),
                BoardDataService.getSetting("isBoardAnonymous"),
            ]);

            this.setState({
                isIncludeTeamEffectivenessMeasurement: includeTeamEffectivenessMeasurement,
                displayPrimeDirective: displayPrimeDirective,
                shouldShowFeedbackAfterCollect: showFeedbackAfterCollect,
                isBoardAnonymous: isAnonymous
            });
        }
    } catch (error) {
        console.error("Error retrieving user settings:", error);
    }
}

  private maxColumnCount = 5;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public handleInputChange = (event: any, newValue: string) => {
    this.setState({
      title: newValue,
      isBoardNameTaken: false,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async handleFormSubmit(event: any) {
    event.preventDefault();
    event.stopPropagation();

    if (this.state.title.trim() === '') return;

    const isBoardNameTaken = await BoardDataService.checkIfBoardNameIsTaken(this.props.teamId, this.state.title);
    if (isBoardNameTaken && this.state.initialTitle !== this.state.title) {
        this.setState({ isBoardNameTaken: true });
        return;
    }

    // DPH start
    try {
        const settingsToSave = {
            isIncludeTeamEffectivenessMeasurement: this.state.isIncludeTeamEffectivenessMeasurement,
            displayPrimeDirective: this.state.displayPrimeDirective,
            shouldShowFeedbackAfterCollect: this.state.shouldShowFeedbackAfterCollect,
            isBoardAnonymous: this.state.isBoardAnonymous
        };

        await Promise.all(Object.entries(settingsToSave).map(([key, value]) => BoardDataService.saveSetting(key, value)));
    } catch (error) {
        console.error("Error saving user settings:", error);
    }
    // DPH end

    // Proceed with form submission
    this.props.onFormSubmit(
        this.state.title.trim(),
        this.state.maxVotesPerUser,
        this.state.columnCards.filter((columnCard) => !columnCard.markedForDeletion).map((columnCard) => columnCard.column),
        this.state.isIncludeTeamEffectivenessMeasurement,
        this.state.isBoardAnonymous,
        this.state.shouldShowFeedbackAfterCollect,
        this.state.displayPrimeDirective,
        this.state.permissions
    );
  }

  private handleIsIncludeTeamEffectivenessMeasurementCheckboxChange = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
    this.setState({
      isIncludeTeamEffectivenessMeasurement: checked,
    });
  }

  private handleDisplayPrimeDirectiveChange = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
    this.setState({
      displayPrimeDirective: checked,
    });
  }

  private handleShouldShowFeedbackAfterCollectChange = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
    this.setState({
      shouldShowFeedbackAfterCollect: checked,
    });
  }

  private handleIsAnonymousCheckboxChange = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
    this.setState({
      isBoardAnonymous: checked,
    });
  }

  private handleMaxVotePerUserChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    this.setState({
      maxVotesPerUser: Number((event.target as HTMLInputElement | HTMLTextAreaElement)?.value),
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

  private handleColumnsTemplateChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const columns = getColumnsByTemplateId(event.target.value);
    this.setState({ columnCards: columns.map((column) => { return { column, markedForDeletion: false }; }) });
  };

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
      friendlyName: 'angry',
      iconClass: 'far fa-angry',
    },
    {
      friendlyName: 'question',
      iconClass: 'fas fa-question',
    },
    {
      friendlyName: 'comments',
      iconClass: 'far fa-comments',
    },
    {
      friendlyName: 'exclamation',
      iconClass: 'fas fa-exclamation',
    },
    {
      friendlyName: 'compass',
      iconClass: 'far fa-compass',
    },
    {
      friendlyName: 'eye',
      iconClass: 'far fa-eye',
    },
    {
      friendlyName: 'life-ring',
      iconClass: 'fas fa-life-ring',
    },
    {
      friendlyName: 'anchor',
      iconClass: 'fas fa-anchor',
    },
    {
      friendlyName: 'balance',
      iconClass: 'fas fa-scale-unbalanced-flip',
    },
    {
      friendlyName: 'rocket',
      iconClass: 'fas fa-rocket',
    },
    {
      friendlyName: 'chalkboard',
      iconClass: 'fas fa-chalkboard',
    },
    {
      friendlyName: 'book',
      iconClass: 'fas fa-book',
    },
    {
      friendlyName: 'celebrate',
      iconClass: 'fas fa-birthday-cake',
    },
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
      friendlyName: 'navy',
      colorCode: '#174170'
    },
    {
      friendlyName: 'orange',
      colorCode: '#F78A53'
    },
    {
      friendlyName: 'pink',
      colorCode: '#ff00cc'
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
      <div className="flex flex-col flex-nowrap">
        <Pivot>
          <PivotItem headerText={'General'} aria-label="Board General Settings">
            <div className="board-metadata-form">
              <section className="board-metadata-edit-column-settings hide-mobile">
                <h2 className="board-metadata-form-section-header">Board Settings</h2>
                <div className="board-metadata-form-section-subheader">
                  <label htmlFor="title-input-container">Retrospective Name<span style={{ color: "rgb(255 72 94)", position: "relative", fontSize: "0.8em", bottom: "6px", margin: "0 4px" }}>(*)</span>:</label>
                  <TextField
                    ariaLabel="Please enter new retrospective title"
                    aria-required={true}
                    placeholder={this.props.placeholderText}
                    className="title-input-container"
                    id="retrospective-title-input"
                    value={this.state.title}
                    maxLength={100}
                    onChange={this.handleInputChange} />
                  {this.state.isBoardNameTaken &&
                    <span className="input-validation-message">A board with this name already exists. Please choose a different name.</span>
                  }
                </div>
                <hr></hr>
                <div className="board-metadata-form-section-subheader">
                  <label className="board-metadata-form-setting-label" htmlFor="max-vote-counter">
                    Max Votes per User (Current: {this.props.isNewBoardCreation ? this.props.maxVotesPerUser : this.props.currentBoard.maxVotesPerUser}):
                  </label>
                  <TextField
                    className="title-input-container max-vote-counter"
                    id="max-vote-counter"
                    type="number"
                    min="3"
                    max="12"
                    value={this.state.maxVotesPerUser?.toString()}
                    onChange={this.handleMaxVotePerUserChange}
                  />
                </div>
                <hr></hr>
                <div className="board-metadata-form-section-information">
                  <i className="fas fa-exclamation-circle"></i>&nbsp;These settings cannot be modified after board creation.
                </div>
                <div className="board-metadata-form-section-subheader">
                  <div className="flex flex-col">
                    <Checkbox
                      id="include-team-assessment-checkbox"
                      label="Include Team Assessment"
                      ariaLabel="Include Team Assessment. This selection cannot be modified after board creation."
                      boxSide="start"
                      defaultChecked={this.state.isIncludeTeamEffectivenessMeasurement}
                      disabled={!this.props.isNewBoardCreation}
                      onChange={this.handleIsIncludeTeamEffectivenessMeasurementCheckboxChange}
                    />
                    <div className="italic text-sm font-thin text-left">
                      Note: All responses for team assessment are stored anonymously.
                    </div>
                  </div>
                </div>

                <div className="board-metadata-form-section-subheader">
                  <Checkbox
                    id="display-prime-directive"
                    label="Display 'Retrospective Prime Directive'"
                    ariaLabel="Display 'Retrospective Prime Directive.' This selection cannot be modified after board creation."
                    boxSide="start"
                    defaultChecked={this.state.displayPrimeDirective}
                    disabled={!this.props.isNewBoardCreation}
                    onChange={this.handleDisplayPrimeDirectiveChange}
                  />
                </div>

                <div className="board-metadata-form-section-subheader">
                  <Checkbox
                    id="obscure-feedback-checkbox"
                    label="Obscure the feedback of others until after Collect phase"
                    ariaLabel="Only show feedback after Collect phase. This selection cannot be modified after board creation."
                    boxSide="start"
                    defaultChecked={this.state.shouldShowFeedbackAfterCollect}
                    disabled={!this.props.isNewBoardCreation}
                    onChange={this.handleShouldShowFeedbackAfterCollectChange}
                  />
                </div>

                <div className="board-metadata-form-section-subheader">
                  <Checkbox
                    id="feedback-display-names-checkbox"
                    label="Do not display names in feedback"
                    ariaLabel="Do not display names in feedback. This selection cannot be modified after board creation."
                    boxSide="start"
                    defaultChecked={this.state.isBoardAnonymous}
                    disabled={!this.props.isNewBoardCreation}
                    onChange={this.handleIsAnonymousCheckboxChange}
                  />
                </div>
              </section>
              <section className="board-metadata-edit-column-settings hide-mobile">
                <h2 className="board-metadata-form-section-header">Column Settings</h2>
                <div className="board-metadata-form-section-information">
                  <i className="fas fa-exclamation-circle"></i>&nbsp;You can create a maximum of {this.maxColumnCount} columns in a retrospective.
                </div>
                {!this.props.isNewBoardCreation &&
                  <div className="board-metadata-form-section-information warning-information">
                    <i className="fas fa-exclamation-triangle"></i>&nbsp;Warning: Existing feedback items may not be<br />available after changing the board template!
                  </div>
                }
                <div className="board-metadata-form-section-subheader">
                  <label htmlFor="column-template-dropdown">Apply template:</label>
                  <select
                    onChange={this.handleColumnsTemplateChange}
                    id="column-template-dropdown"
                    className="title-input-container column-template-dropdown"
                  >
                    <option value="">Select a template</option>
                    <option disabled>─────────────</option>
                    <option value="start-stop-continue">Start-Stop-Continue</option>
                    <option value="good-improve-ideas-thanks">Good-Improve-Ideas-Thanks</option>
                    <option value="mad-sad-glad">Mad-Sad-Glad</option>
                    <option value="4ls">4Ls</option>
                    <option value="daki">Drop-Add-Keep-Improve</option>
                    <option value="kalm">Keep-Add-Less-More</option>
                    <option value="wlai">Went Well-Learned-Accelerators-Impediments</option>
                    <option value="1to1">Good-to-Done</option>
                    <option value="speedboat">Speedboat</option>
                    <option disabled>─────────────</option>
                    <option value="clarity">Clarity</option>
                    <option value="energy">Energy</option>
                    <option value="psy-safety">Psychological Safety</option>
                    <option value="wlb">Work-life Balance</option>
                    <option value="confidence">Confidence</option>
                    <option value="efficiency">Efficiency</option>
                  </select>
                </div>
                <List
                  items={this.state.columnCards}
                  onRenderCell={(columnCard: IFeedbackColumnCard, index: number) => {
                    return (<DocumentCard
                      className={classNames({
                        'feedback-column-card': true,
                        'marked-for-deletion': columnCard.markedForDeletion,
                      })}
                      type={DocumentCardType.compact}>
                      <div className="flex grow items-center">
                        <DefaultButton
                          className="feedback-column-card-icon-button"
                          ariaLabel="Change column icon"
                          title="Change column icon"
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
                          title="Change column color"
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
                          isChangeEventRequired={true}
                          onSave={(newText: string) => {
                            columnCard.column.title = newText
                            this.setState({
                              columnCards: [].concat(this.state.columnCards),
                            });
                          }} />
                      </div>
                      <div className="flex flex-none items-center">
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
                      </div>
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
                      const newColumnId = generateUUID();
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
              </section>
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
          </PivotItem>
          <PivotItem headerText={'Permissions'} aria-label="Board Permission Settings">
            <FeedbackBoardMetadataFormPermissions
              board={this.props.currentBoard}
              permissions={this.state.permissions}
              permissionOptions={this.props.availablePermissionOptions}
              onPermissionChanged={(s: FeedbackBoardPermissionState) => this.setState({ permissions: s.permissions })}
            />
          </PivotItem>
        </Pivot>
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
            }}
            text="Save"
            className="metadata-form-save-button" />
          <DefaultButton onClick={this.props.onFormCancel} text="Cancel" />
        </DialogFooter>
      </div>
    );
  }
}

export default withAITracking(reactPlugin, FeedbackBoardMetadataForm);
