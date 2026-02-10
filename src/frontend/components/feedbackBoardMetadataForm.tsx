import React, { ChangeEvent, useState, useEffect, useRef, useCallback } from "react";
import { PrimaryButton, DefaultButton, IconButton } from "@fluentui/react/lib/Button";
import { TextField } from "@fluentui/react/lib/TextField";
import Dialog, { DialogFooter, DialogType } from "@fluentui/react/lib/Dialog";
import { Checkbox } from "@fluentui/react/lib/Checkbox";
import { List } from "@fluentui/react/lib/List";
import { DocumentCardType, DocumentCard } from "@fluentui/react/lib/DocumentCard";
import { Pivot, PivotItem } from "@fluentui/react/lib/Pivot";
import { cn } from "../utilities/classNameHelper";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";

import BoardDataService from "../dal/boardDataService";
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions, IFeedbackColumn } from "../interfaces/feedback";
import EditableDocumentCardTitle from "./editableDocumentCardTitle";
import { reactPlugin } from "../utilities/telemetryClient";
import { getColumnsByTemplateId } from "../utilities/boardColumnsHelper";
import FeedbackBoardMetadataFormPermissions, { FeedbackBoardPermissionOption, FeedbackBoardPermissionState } from "./feedbackBoardMetadataFormPermissions";
import { generateUUID } from "../utilities/random";
import { availableIcons, getIconElement } from "./icons";

export interface IFeedbackBoardMetadataFormProps {
  isNewBoardCreation: boolean;
  isDuplicatingBoard: boolean;
  currentBoard: IFeedbackBoardDocument;
  teamId: string;
  placeholderText: string;
  maxVotesPerUser: number;
  availablePermissionOptions: FeedbackBoardPermissionOption[];
  currentUserId: string;
  onFormSubmit: (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, shouldShowFeedbackAfterCollect: boolean, isBoardAnonymous: boolean, permissions: IFeedbackBoardDocumentPermissions) => void;
  onFormCancel: () => void;
}

export interface IFeedbackColumnCard {
  column: IFeedbackColumn;
  markedForDeletion: boolean;
}

const maxColumnCount = 5;

const allIconClassNames = availableIcons.filter(icon => icon.tags && icon.tags.length > 0);

const allAccentColors: { friendlyName: string; colorCode: string }[] = [
  {
    friendlyName: "green",
    colorCode: "#008000",
  },
  {
    friendlyName: "red",
    colorCode: "#cc293d",
  },
  {
    friendlyName: "navy",
    colorCode: "#174170",
  },
  {
    friendlyName: "orange",
    colorCode: "#F78A53",
  },
  {
    friendlyName: "pink",
    colorCode: "#ff00cc",
  },
  {
    friendlyName: "yellow",
    colorCode: "#f6af08",
  },
  {
    friendlyName: "blue",
    colorCode: "#0078d4",
  },
  {
    friendlyName: "purple",
    colorCode: "#8063bf",
  },
  {
    friendlyName: "grey",
    colorCode: "#555555",
  },
];

const getRandomArrayElement = <T extends {}>(array: T[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getInitialState = (props: IFeedbackBoardMetadataFormProps) => {
  const isCopyRetrospective = props.isNewBoardCreation && props.isDuplicatingBoard;
  const isEditRetrospective = !props.isNewBoardCreation;

  let defaultMaxVotes = 5;
  let defaultIncludeTeamEffectivenessMeasurement = true;
  let defaultShowFeedbackAfterCollect = false;
  let defaultIsAnonymous = false;

  let defaultColumns: IFeedbackColumnCard[] = getColumnsByTemplateId("").map(column => ({
    column: {
      ...column,
      icon: getIconElement(column.iconClass),
    },
    markedForDeletion: false,
  }));
  let defaultPermissions: IFeedbackBoardDocumentPermissions = { Teams: [], Members: [] };

  if (isCopyRetrospective || isEditRetrospective) {
    defaultColumns = props.currentBoard.columns.map(column => ({
      column: {
        ...column,
        icon: getIconElement(column.iconClass),
      },
      markedForDeletion: false,
    }));
    defaultMaxVotes = props.currentBoard.maxVotesPerUser;
    defaultIncludeTeamEffectivenessMeasurement = props.currentBoard.isIncludeTeamEffectivenessMeasurement;
    defaultShowFeedbackAfterCollect = props.currentBoard.shouldShowFeedbackAfterCollect;
    defaultIsAnonymous = props.currentBoard.isAnonymous;
    defaultPermissions = props.currentBoard.permissions;
  }

  const defaultTitle = isCopyRetrospective ? `${props.currentBoard.title} - copy` : isEditRetrospective ? props.currentBoard.title : "";

  return {
    columnCards: defaultColumns,
    maxVotesPerUser: defaultMaxVotes,
    isIncludeTeamEffectivenessMeasurement: defaultIncludeTeamEffectivenessMeasurement,
    shouldShowFeedbackAfterCollect: defaultShowFeedbackAfterCollect,
    isBoardAnonymous: defaultIsAnonymous,
    permissions: defaultPermissions,
    initialTitle: defaultTitle,
    title: defaultTitle,
  };
};

export const FeedbackBoardMetadataForm: React.FC<IFeedbackBoardMetadataFormProps> = props => {
  const { isNewBoardCreation, isDuplicatingBoard, currentBoard, teamId, placeholderText, availablePermissionOptions, currentUserId, onFormSubmit, onFormCancel } = props;
  const trackActivity = useTrackMetric(reactPlugin, "FeedbackBoardMetadataForm");

  const initialState = getInitialState(props);

  const [title, setTitle] = useState(initialState.title);
  const [initialTitle] = useState(initialState.initialTitle);
  const [isBoardNameTaken, setIsBoardNameTaken] = useState(false);
  const [columnCards, setColumnCards] = useState<IFeedbackColumnCard[]>(initialState.columnCards);
  const [maxVotesPerUser, setMaxVotesPerUser] = useState(initialState.maxVotesPerUser);
  const [isIncludeTeamEffectivenessMeasurement, setIsIncludeTeamEffectivenessMeasurement] = useState(initialState.isIncludeTeamEffectivenessMeasurement);
  const [shouldShowFeedbackAfterCollect, setShouldShowFeedbackAfterCollect] = useState(initialState.shouldShowFeedbackAfterCollect);
  const [isBoardAnonymous, setIsBoardAnonymous] = useState(initialState.isBoardAnonymous);
  const [isDeleteColumnConfirmationDialogHidden, setIsDeleteColumnConfirmationDialogHidden] = useState(true);
  const [isChooseColumnAccentColorDialogHidden, setIsChooseColumnAccentColorDialogHidden] = useState(true);
  const [columnCardBeingEdited, setColumnCardBeingEdited] = useState<IFeedbackColumnCard | null>(null);
  const [isChooseColumnIconDialogOpen, setIsChooseColumnIconDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState<IFeedbackBoardDocumentPermissions>(initialState.permissions);

  const chooseColumnIconDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (columnCardBeingEdited && isChooseColumnIconDialogOpen) {
      chooseColumnIconDialogRef.current!.showModal();
    }
  }, [columnCardBeingEdited, isChooseColumnIconDialogOpen]);

  useEffect(() => {
    const loadSettings = async () => {
      if (isNewBoardCreation && !isDuplicatingBoard) {
        const settingsToLoad = [BoardDataService.getSetting<number>("lastVotes"), BoardDataService.getSetting<boolean>("lastTeamEffectiveness"), BoardDataService.getSetting<boolean>("lastShowFeedback"), BoardDataService.getSetting<boolean>("lastAnonymous")];

        const [lastVotes, lastTeamEffectiveness, lastShowFeedback, lastAnonymous] = await Promise.all(settingsToLoad);

        if (typeof lastVotes === "number") setMaxVotesPerUser(lastVotes);
        if (typeof lastTeamEffectiveness === "boolean") setIsIncludeTeamEffectivenessMeasurement(lastTeamEffectiveness);
        if (typeof lastShowFeedback === "boolean") setShouldShowFeedbackAfterCollect(lastShowFeedback);
        if (typeof lastAnonymous === "boolean") setIsBoardAnonymous(lastAnonymous);
      }
    };

    loadSettings();
  }, [isNewBoardCreation, isDuplicatingBoard]);

  const handleInputChange = useCallback((_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string) => {
    setTitle(newValue);
    setIsBoardNameTaken(false);
  }, []);

  const handleFormSubmit = useCallback(
    async (event: Pick<React.SyntheticEvent, "preventDefault" | "stopPropagation">) => {
      event.preventDefault();
      event.stopPropagation();

      const isTaken = await BoardDataService.checkIfBoardNameIsTaken(teamId, title);
      if (isTaken) {
        if (initialTitle !== title) {
          setIsBoardNameTaken(true);
          return;
        }
      }

      if (isNewBoardCreation && !isDuplicatingBoard) {
        await BoardDataService.saveSetting("lastVotes", maxVotesPerUser);
        await BoardDataService.saveSetting("lastTeamEffectiveness", isIncludeTeamEffectivenessMeasurement);
        await BoardDataService.saveSetting("lastShowFeedback", shouldShowFeedbackAfterCollect);
        await BoardDataService.saveSetting("lastAnonymous", isBoardAnonymous);
      }

      onFormSubmit(
        title.trim(),
        maxVotesPerUser,
        columnCards.filter(columnCard => !columnCard.markedForDeletion).map(columnCard => columnCard.column),
        isIncludeTeamEffectivenessMeasurement,
        shouldShowFeedbackAfterCollect,
        isBoardAnonymous,
        permissions,
      );
    },
    [title, teamId, initialTitle, isNewBoardCreation, isDuplicatingBoard, maxVotesPerUser, isIncludeTeamEffectivenessMeasurement, shouldShowFeedbackAfterCollect, isBoardAnonymous, onFormSubmit, columnCards, permissions],
  );

  const handleDeleteColumnConfirm = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDeleteColumnConfirmationDialogHidden(true);
      handleFormSubmit(event);
    },
    [handleFormSubmit],
  );

  const handleIsIncludeTeamEffectivenessMeasurementCheckboxChange = useCallback((_: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
    const nextChecked = typeof checked === "boolean" ? checked : Boolean((_.target as HTMLInputElement | null)?.checked);
    setIsIncludeTeamEffectivenessMeasurement(nextChecked);
  }, []);

  const handleShouldShowFeedbackAfterCollectChange = useCallback((_: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
    const nextChecked = typeof checked === "boolean" ? checked : Boolean((_.target as HTMLInputElement | null)?.checked);
    setShouldShowFeedbackAfterCollect(nextChecked);
  }, []);

  const handleIsAnonymousCheckboxChange = useCallback((_: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
    const nextChecked = typeof checked === "boolean" ? checked : Boolean((_.target as HTMLInputElement | null)?.checked);
    setIsBoardAnonymous(nextChecked);
  }, []);

  const handleMaxVotePerUserChange = useCallback((event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMaxVotesPerUser(Number((event.target as HTMLInputElement | HTMLTextAreaElement).value));
  }, []);

  const showDeleteColumnConfirmationDialog = useCallback(() => {
    setIsDeleteColumnConfirmationDialogHidden(false);
  }, []);

  const hideDeleteColumnConfirmationDialog = useCallback(() => {
    setIsDeleteColumnConfirmationDialogHidden(true);
  }, []);

  const openChooseColumnIconDialog = useCallback((columnCard: IFeedbackColumnCard) => {
    setColumnCardBeingEdited(columnCard);
    setIsChooseColumnIconDialogOpen(true);
  }, []);

  const handleChooseColumnIconDialogClose = useCallback(() => {
    setIsChooseColumnIconDialogOpen(false);
    setColumnCardBeingEdited(null);
  }, []);

  const isSaveButtonEnabled = useCallback(() => {
    if (!title.trim()) {
      return false;
    }

    const nonDeletedColumns = columnCards.filter(columnCard => !columnCard.markedForDeletion);
    if (nonDeletedColumns.find(columnCard => !columnCard.column.title.trim())) {
      return false;
    }

    return true;
  }, [title, columnCards]);

  const handleColumnsTemplateChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const columns = getColumnsByTemplateId(event.target.value);
    setColumnCards(
      columns.map(column => {
        return {
          column: {
            ...column,
            icon: getIconElement(column.iconClass),
          },
          markedForDeletion: false,
        };
      }),
    );
  }, []);

  return (
    <div className="flex flex-col flex-nowrap" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      <Pivot>
        <PivotItem headerText={"General"} aria-label="Board General Settings">
          <div className="board-metadata-form">
            <section className="board-metadata-edit-column-settings">
              <h2 className="board-metadata-form-section-header">Board Settings</h2>
              <div className="board-metadata-form-section-subheader">
                <label htmlFor="title-input-container">
                  Retrospective Name<span style={{ color: "rgb(255 72 94)", position: "relative", fontSize: "0.8em", bottom: "6px", margin: "0 4px" }}>(*)</span>:
                </label>
                <TextField ariaLabel="Please enter new retrospective title" aria-required={true} placeholder={placeholderText} className="title-input-container" id="retrospective-title-input" value={title} maxLength={100} onChange={handleInputChange} />
                {isBoardNameTaken && <span className="input-validation-message">A board with this name already exists. Please choose a different name.</span>}
              </div>
              <hr></hr>
              <div className="board-metadata-form-section-subheader">
                <label className="board-metadata-form-setting-label" htmlFor="max-vote-counter">
                  Max Votes per User (Current: {isNewBoardCreation ? maxVotesPerUser : currentBoard.maxVotesPerUser}):
                </label>
                <TextField className="title-input-container max-vote-counter" id="max-vote-counter" type="number" min="1" max="12" value={String(maxVotesPerUser)} onChange={handleMaxVotePerUserChange} />
              </div>
              <hr></hr>
              <div className="board-metadata-form-section-information">{getIconElement("exclamation")} These settings cannot be modified after board creation</div>
              <div className="board-metadata-form-section-subheader">
                <div className="flex flex-col">
                  <Checkbox id="include-team-assessment-checkbox" label="Include Team Assessment" ariaLabel="Include Team Assessment. This selection cannot be modified after board creation." boxSide="start" checked={isIncludeTeamEffectivenessMeasurement} disabled={!isNewBoardCreation} onChange={handleIsIncludeTeamEffectivenessMeasurementCheckboxChange} />
                  <div className="italic text-sm font-thin text-left">Note: All responses for team assessment are stored anonymously.</div>
                </div>
              </div>
              <div className="board-metadata-form-section-subheader">
                <Checkbox id="obscure-feedback-checkbox" label="Hide the feedback of others until after Collect phase" ariaLabel="Only show feedback after Collect phase. This selection cannot be modified after board creation." boxSide="start" checked={shouldShowFeedbackAfterCollect} disabled={!isNewBoardCreation} onChange={handleShouldShowFeedbackAfterCollectChange} />
              </div>
              <div className="board-metadata-form-section-subheader">
                <Checkbox id="feedback-display-names-checkbox" label="Do not display names in feedback" ariaLabel="Do not display names in feedback. This selection cannot be modified after board creation." boxSide="start" checked={isBoardAnonymous} disabled={!isNewBoardCreation} onChange={handleIsAnonymousCheckboxChange} />
              </div>
            </section>
            <section className="board-metadata-edit-column-settings">
              <h2 className="board-metadata-form-section-header">Column Settings</h2>
              <div className="board-metadata-form-section-information">
                {getIconElement("exclamation")} You can create a maximum of {maxColumnCount} columns in a retrospective
              </div>
              {!isNewBoardCreation && <div className="board-metadata-form-section-information warning-information">{getIconElement("report-problem")}Warning: Existing feedback items may not be available after changing the board template!</div>}
              <div className="board-metadata-form-section-subheader">
                <label htmlFor="column-template-dropdown">Apply template:</label>
                <select onChange={handleColumnsTemplateChange} id="column-template-dropdown" className="title-input-container column-template-dropdown">
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
                items={columnCards}
                onRenderCell={(columnCard: IFeedbackColumnCard, index: number) => {
                  return (
                    <DocumentCard className={cn("feedback-column-card", columnCard.markedForDeletion && "marked-for-deletion")} type={DocumentCardType.compact}>
                      <div className="flex grow items-center">
                        <button
                          className="feedback-column-card-icon-button"
                          aria-label="Change column icon"
                          title="Change column icon"
                          disabled={columnCard.markedForDeletion}
                          onClick={() => {
                            openChooseColumnIconDialog(columnCard);
                          }}
                        >
                          {getIconElement(columnCard.column.iconClass)}
                        </button>
                        <button
                          className="feedback-column-card-accent-color-button"
                          aria-label="Change column color"
                          title="Change column color"
                          disabled={columnCard.markedForDeletion}
                          onClick={() => {
                            setColumnCardBeingEdited(columnCard);
                            setIsChooseColumnAccentColorDialogHidden(false);
                          }}
                        >
                          <i className={cn("feedback-column-card-accent-color", "fas fa-square")} style={{ color: columnCard.column.accentColor }} />
                        </button>
                        <EditableDocumentCardTitle
                          isDisabled={columnCard.markedForDeletion}
                          isMultiline={false}
                          maxLength={25}
                          title={columnCard.column.title}
                          isChangeEventRequired={true}
                          onSave={(newText: string) => {
                            columnCard.column.title = newText;
                            setColumnCards([...columnCards]);
                          }}
                        />
                      </div>
                      <div className="flex flex-none items-center">
                        <IconButton
                          className="feedback-column-card-move-up-button"
                          iconProps={{ iconName: "Up" }}
                          title="Move Up"
                          ariaLabel="Move Up"
                          disabled={columnCard.markedForDeletion || index === 0}
                          onClick={() => {
                            const newColumns = [...columnCards];
                            [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
                            setColumnCards(newColumns);
                          }}
                        />
                        <IconButton
                          className="feedback-column-card-move-down-button"
                          iconProps={{ iconName: "Down" }}
                          title="Move Down"
                          ariaLabel="Move Down"
                          disabled={columnCard.markedForDeletion || index === columnCards.length - 1}
                          onClick={() => {
                            const newColumns = [...columnCards];
                            [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
                            setColumnCards(newColumns);
                          }}
                        />
                        {!columnCard.markedForDeletion && (
                          <IconButton
                            className="feedback-column-card-delete-button"
                            iconProps={{ iconName: "Delete" }}
                            title="Delete"
                            ariaLabel="Delete"
                            disabled={columnCards.filter(cc => !cc.markedForDeletion).length <= 1}
                            onClick={() => {
                              const newColumns = [...columnCards];
                              newColumns[index].markedForDeletion = true;
                              setColumnCards(newColumns);
                            }}
                          />
                        )}
                        {columnCard.markedForDeletion && (
                          <IconButton
                            className="feedback-column-card-undelete-button"
                            iconProps={{ iconName: "Undo" }}
                            title="Undo Delete"
                            ariaLabel="Undo Delete"
                            disabled={columnCards.filter(cc => !cc.markedForDeletion).length >= maxColumnCount}
                            onClick={() => {
                              const newColumns = [...columnCards];
                              newColumns[index].markedForDeletion = false;
                              setColumnCards(newColumns);
                            }}
                          />
                        )}
                      </div>
                    </DocumentCard>
                  );
                }}
              />
              <button
                className="create-feedback-column-card-button"
                aria-label="Add new column"
                disabled={columnCards.filter(columnCard => !columnCard.markedForDeletion).length >= maxColumnCount}
                onClick={() => {
                  const newColumns: IFeedbackColumnCard[] = [...columnCards];
                  newColumns.push({
                    column: {
                      id: generateUUID(),
                      title: "New Column",
                      iconClass: getRandomArrayElement(allIconClassNames).id,
                      accentColor: getRandomArrayElement(allAccentColors).colorCode,
                      notes: "",
                    },
                    markedForDeletion: false,
                  });
                  setColumnCards(newColumns);
                }}
              >
                {getIconElement("add")}
                Add new column
              </button>
            </section>
            {currentBoard && (
              <Dialog
                hidden={isDeleteColumnConfirmationDialogHidden}
                onDismiss={hideDeleteColumnConfirmationDialog}
                dialogContentProps={{
                  type: DialogType.close,
                  title: "Confirm Changes",
                  subText: `Are you sure you want to remove columns from '${currentBoard.title}'? The feedback items in those columns will also be deleted. You will not be able to recover this data.`,
                }}
                modalProps={{
                  isBlocking: true,
                  containerClassName: "retrospectives-confirm-changes-dialog",
                  className: "retrospectives-dialog-modal",
                }}
              >
                <DialogFooter>
                  <PrimaryButton onClick={handleDeleteColumnConfirm} text="Confirm" />
                  <DefaultButton onClick={hideDeleteColumnConfirmationDialog} text="Cancel" />
                </DialogFooter>
              </Dialog>
            )}
            {columnCardBeingEdited && isChooseColumnIconDialogOpen && (
              <dialog className="retrospectives-choose-column-icon-dialog" aria-label="Choose Column Icon" ref={chooseColumnIconDialogRef} onClose={handleChooseColumnIconDialogClose}>
                <div className="header">
                  <h2 className="title">Choose Column Icon</h2>
                  <button onClick={() => chooseColumnIconDialogRef.current!.close()} aria-label="Close">
                    {getIconElement("close")}
                  </button>
                </div>
                <div className="subText">{`Choose the column icon for column '${columnCardBeingEdited.column.title}'`}</div>
                <div className="subText">
                  <div className="grid grid-cols-7 gap-2 justify-items-center items-center">
                    {allIconClassNames.map(iconOption => {
                      return (
                        <button
                          title={`Choose the icon: ${iconOption.name}`}
                          aria-label={`Choose the icon: ${iconOption.name}`}
                          className="choose-feedback-column-icon-button"
                          key={iconOption.id}
                          onClick={() => {
                            columnCardBeingEdited.column.iconClass = iconOption.id;
                            setColumnCards([...columnCards]);
                            chooseColumnIconDialogRef.current!.close();
                          }}
                        >
                          {getIconElement(iconOption.id)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="inner">
                  <button className="default button" onClick={() => chooseColumnIconDialogRef.current!.close()}>
                    Close
                  </button>
                </div>
              </dialog>
            )}
            {columnCardBeingEdited && (
              <Dialog
                hidden={isChooseColumnAccentColorDialogHidden}
                dialogContentProps={{
                  type: DialogType.normal,
                  title: "Choose Column Color",
                  subText: `Choose the column color for column '${columnCardBeingEdited.column.title}'`,
                }}
                modalProps={{
                  isBlocking: false,
                  containerClassName: "retrospectives-choose-column-accent-color-dialog",
                  className: "retrospectives-dialog-modal",
                }}
                onDismiss={() => {
                  setIsChooseColumnAccentColorDialogHidden(true);
                  setColumnCardBeingEdited(null);
                }}
              >
                {allAccentColors.map(accentColor => {
                  return (
                    <DefaultButton
                      key={accentColor.friendlyName}
                      ariaLabel={"Choose the color " + accentColor.friendlyName}
                      className="choose-feedback-column-accent-color-button"
                      onClick={() => {
                        columnCardBeingEdited.column.accentColor = accentColor.colorCode;
                        setIsChooseColumnAccentColorDialogHidden(true);
                        setColumnCardBeingEdited(null);
                        setColumnCards([...columnCards]);
                      }}
                    >
                      <i
                        className={"fas fa-square"}
                        style={{
                          color: accentColor.colorCode,
                        }}
                      />
                    </DefaultButton>
                  );
                })}
              </Dialog>
            )}
          </div>
        </PivotItem>
        <PivotItem headerText={"Permissions"} aria-label="Board Permission Settings">
          <FeedbackBoardMetadataFormPermissions board={currentBoard} permissions={permissions} permissionOptions={availablePermissionOptions} currentUserId={currentUserId} isNewBoardCreation={isNewBoardCreation} onPermissionChanged={(s: FeedbackBoardPermissionState) => setPermissions(s.permissions)} />
        </PivotItem>
      </Pivot>
      <DialogFooter>
        <PrimaryButton
          disabled={!isSaveButtonEnabled()}
          onClick={event => {
            if (isNewBoardCreation || columnCards.every(columnCard => !columnCard.markedForDeletion)) {
              handleFormSubmit(event);
            } else {
              showDeleteColumnConfirmationDialog();
            }
          }}
          text="Save"
          className="metadata-form-save-button"
        />
        <DefaultButton onClick={onFormCancel} text="Cancel" />
      </DialogFooter>
    </div>
  );
};

export default FeedbackBoardMetadataForm;
