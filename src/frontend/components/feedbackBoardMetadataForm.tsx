import React, { ChangeEvent, useState, useEffect, useRef, useCallback } from "react";
import { List } from "@fluentui/react/lib/List";
import { Pivot, PivotItem } from "@fluentui/react/lib/Pivot";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";

import BoardDataService from "../dal/boardDataService";
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions, IFeedbackColumn, ITeamAssessmentQuestion } from "../interfaces/feedback";
import { t } from "../utilities/localization";
import EditableDocumentCardTitle from "./editableDocumentCardTitle";
import { reactPlugin } from "../utilities/telemetryClient";
import { getColumnsByTemplateId } from "../utilities/boardColumnsHelper";
import FeedbackBoardMetadataFormPermissions, { FeedbackBoardPermissionOption, FeedbackBoardPermissionState } from "./feedbackBoardMetadataFormPermissions";
import { generateUUID } from "../utilities/random";
import { availableIcons, getIconElement } from "./icons";
import { questions } from "../utilities/effectivenessMeasurementQuestionHelper";

export interface IFeedbackBoardMetadataFormProps {
  isNewBoardCreation: boolean;
  isDuplicatingBoard: boolean;
  currentBoard: IFeedbackBoardDocument;
  initialTitleOverride?: string;
  teamId: string;
  placeholderText: string;
  maxVotesPerUser: number;
  availablePermissionOptions: FeedbackBoardPermissionOption[];
  currentUserId: string;
  onFormSubmit: (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, shouldShowFeedbackAfterCollect: boolean, isBoardAnonymous: boolean, permissions: IFeedbackBoardDocumentPermissions, teamAssessmentQuestions: ITeamAssessmentQuestion[]) => void;
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
  const boardTeamAssessmentQuestions = props.currentBoard && props.currentBoard.teamAssessmentQuestions ? props.currentBoard.teamAssessmentQuestions : [];

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

  const defaultTitle = props.initialTitleOverride ?? (isCopyRetrospective ? `${props.currentBoard.title} - copy` : isEditRetrospective ? props.currentBoard.title : "");

  return {
    columnCards: defaultColumns,
    maxVotesPerUser: defaultMaxVotes,
    isIncludeTeamEffectivenessMeasurement: defaultIncludeTeamEffectivenessMeasurement,
    shouldShowFeedbackAfterCollect: defaultShowFeedbackAfterCollect,
    isBoardAnonymous: defaultIsAnonymous,
    permissions: defaultPermissions,
    initialTitle: defaultTitle,
    title: defaultTitle,
    customTeamAssessmentQuestions: isCopyRetrospective || isEditRetrospective ? boardTeamAssessmentQuestions.filter(question => question.isCustom).map(question => question.title) : [],
  };
};

export const FeedbackBoardMetadataForm: React.FC<IFeedbackBoardMetadataFormProps> = props => {
  const { isNewBoardCreation, isDuplicatingBoard, currentBoard, teamId, placeholderText, availablePermissionOptions, currentUserId, onFormSubmit, onFormCancel } = props;
  const trackActivity = useTrackMetric(reactPlugin, "FeedbackBoardMetadataForm");

  const [initialState] = useState(() => getInitialState(props));

  const [title, setTitle] = useState(initialState.title);
  const [initialTitle] = useState(initialState.initialTitle);
  const [columnCards, setColumnCards] = useState<IFeedbackColumnCard[]>(initialState.columnCards);
  const [maxVotesPerUser, setMaxVotesPerUser] = useState(initialState.maxVotesPerUser);
  const [isIncludeTeamEffectivenessMeasurement, setIsIncludeTeamEffectivenessMeasurement] = useState(initialState.isIncludeTeamEffectivenessMeasurement);
  const [shouldShowFeedbackAfterCollect, setShouldShowFeedbackAfterCollect] = useState(initialState.shouldShowFeedbackAfterCollect);
  const [isBoardAnonymous, setIsBoardAnonymous] = useState(initialState.isBoardAnonymous);
  const [customTeamAssessmentQuestions, setCustomTeamAssessmentQuestions] = useState<string[]>(initialState.customTeamAssessmentQuestions);
  const [isDeleteColumnConfirmationDialogHidden, setIsDeleteColumnConfirmationDialogHidden] = useState(true);
  const [isChooseColumnAccentColorDialogHidden, setIsChooseColumnAccentColorDialogHidden] = useState(true);
  const [columnCardBeingEdited, setColumnCardBeingEdited] = useState<IFeedbackColumnCard | null>(null);
  const [isChooseColumnIconDialogOpen, setIsChooseColumnIconDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState<IFeedbackBoardDocumentPermissions>(initialState.permissions);
  const [error, setError] = useState<string>("");

  const chooseColumnIconDialogRef = useRef<HTMLDialogElement>(null);
  const deleteColumnConfirmDialogRef = useRef<HTMLDialogElement>(null);
  const chooseColumnAccentColorDialogRef = useRef<HTMLDialogElement>(null);

  const retrospectiveNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (columnCardBeingEdited && isChooseColumnIconDialogOpen) {
      chooseColumnIconDialogRef.current!.showModal();
    }
  }, [columnCardBeingEdited, isChooseColumnIconDialogOpen]);

  useEffect(() => {
    if (currentBoard && !isDeleteColumnConfirmationDialogHidden) {
      deleteColumnConfirmDialogRef.current?.showModal();
    }
  }, [currentBoard, isDeleteColumnConfirmationDialogHidden]);

  useEffect(() => {
    if (columnCardBeingEdited && !isChooseColumnAccentColorDialogHidden) {
      chooseColumnAccentColorDialogRef.current?.showModal();
    }
  }, [columnCardBeingEdited, isChooseColumnAccentColorDialogHidden]);

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

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    event.target.setCustomValidity("");
    setTitle(event.target.value);
    setError("");
  }, []);

  const handleFormSubmit = useCallback(
    async (event: Pick<React.SyntheticEvent, "preventDefault" | "stopPropagation">) => {
      event.preventDefault();
      event.stopPropagation();

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
        isIncludeTeamEffectivenessMeasurement
          ? questions.concat(
              customTeamAssessmentQuestions
                .map(question => question.trim())
                .filter(Boolean)
                .map((question, index) => ({
                  id: questions.length + index + 1,
                  shortTitle: question.length > 30 ? `${question.slice(0, 27)}...` : question,
                  title: question,
                  iconClassName: "assessment",
                  tooltip: "",
                  isCustom: true,
                })),
            )
          : [],
      );
    },
    [title, teamId, initialTitle, isNewBoardCreation, isDuplicatingBoard, maxVotesPerUser, isIncludeTeamEffectivenessMeasurement, shouldShowFeedbackAfterCollect, isBoardAnonymous, onFormSubmit, columnCards, permissions, customTeamAssessmentQuestions],
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

  const handleIsIncludeTeamEffectivenessMeasurementCheckboxChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIsIncludeTeamEffectivenessMeasurement(event.target.checked);
  }, []);

  const handleShouldShowFeedbackAfterCollectChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setShouldShowFeedbackAfterCollect(event.target.checked);
  }, []);

  const handleIsAnonymousCheckboxChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIsBoardAnonymous(event.target.checked);
  }, []);

  const handleMaxVotePerUserChange = useCallback((event: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMaxVotesPerUser(Number((event.target as HTMLInputElement | HTMLTextAreaElement).value));
  }, []);

  const retrospectiveNameInput = React.useMemo(
    () => (
      <input
        ref={retrospectiveNameInputRef}
        aria-label="Please enter new retrospective title"
        aria-required={true}
        placeholder={placeholderText}
        aria-describedby="retrospective-name-label"
        className="title-input-container"
        id="retrospective-title-input"
        value={title}
        maxLength={100}
        onChange={handleInputChange}
      />
    ),
    [handleInputChange, placeholderText, title],
  );

  const maxVotesPerUserInput = React.useMemo(
    () => <input className="title-input-container" id="max-vote-counter" type="number" min="1" max="12" value={String(maxVotesPerUser)} onChange={handleMaxVotePerUserChange} />,
    [handleMaxVotePerUserChange, maxVotesPerUser],
  );

  const shouldShowFeedbackAfterCollectInput = React.useMemo(
    () => <input id="obscure-feedback-checkbox" type="checkbox" aria-label="Only show feedback after Collect phase. This selection cannot be modified after board creation." checked={shouldShowFeedbackAfterCollect} disabled={!isNewBoardCreation} onChange={handleShouldShowFeedbackAfterCollectChange} />,
    [handleShouldShowFeedbackAfterCollectChange, isNewBoardCreation, shouldShowFeedbackAfterCollect],
  );

  const isBoardAnonymousInput = React.useMemo(
    () => <input id="feedback-display-names-checkbox" type="checkbox" aria-label="Make participant feedback anonymous. This selection cannot be modified after board creation." checked={isBoardAnonymous} disabled={!isNewBoardCreation} onChange={handleIsAnonymousCheckboxChange} />,
    [handleIsAnonymousCheckboxChange, isBoardAnonymous, isNewBoardCreation],
  );

  const isIncludeTeamEffectivenessMeasurementInput = React.useMemo(
    () => <input id="include-team-assessment-checkbox" type="checkbox" aria-label="Include Team Assessment. This selection cannot be modified after board creation." checked={isIncludeTeamEffectivenessMeasurement} disabled={!isNewBoardCreation} onChange={handleIsIncludeTeamEffectivenessMeasurementCheckboxChange} />,
    [handleIsIncludeTeamEffectivenessMeasurementCheckboxChange, isIncludeTeamEffectivenessMeasurement, isNewBoardCreation],
  );

  const customTeamAssessmentQuestionInputs = React.useMemo(
    () =>
      customTeamAssessmentQuestions.map((question, index) => (
        <div key={index} className="flex gap-2 items-center mt-2 w-full border border-gray-300 p-2">
          <input
            aria-label={`Custom team assessment question ${index + 1}`}
            className="grow"
            maxLength={200}
            placeholder="Enter a custom team assessment question"
            value={question}
            onChange={event => {
              setCustomTeamAssessmentQuestions(previousQuestions => {
                const nextQuestions = [...previousQuestions];
                nextQuestions[index] = event.target.value;
                return nextQuestions;
              });
            }}
          />
          <button
            className="feedback-column-card-delete-button"
            title="Delete"
            aria-label={`Remove custom team assessment question ${index + 1}`}
            type="button"
            onClick={() => setCustomTeamAssessmentQuestions(previousQuestions => previousQuestions.filter((_, currentIndex) => currentIndex !== index))}
          >
            {getIconElement("delete")}
          </button>
        </div>
      )),
    [customTeamAssessmentQuestions],
  );

  const showDeleteColumnConfirmationDialog = useCallback(() => {
    setIsDeleteColumnConfirmationDialogHidden(false);
  }, []);

  const hideDeleteColumnConfirmationDialog = useCallback(() => {
    setIsDeleteColumnConfirmationDialogHidden(true);
    deleteColumnConfirmDialogRef.current?.close();
  }, []);

  const openChooseColumnIconDialog = useCallback((columnCard: IFeedbackColumnCard) => {
    setColumnCardBeingEdited(columnCard);
    setIsChooseColumnIconDialogOpen(true);
  }, []);

  const handleChooseColumnIconDialogClose = useCallback((event?: React.SyntheticEvent<HTMLDialogElement>) => {
    event?.stopPropagation();
    setIsChooseColumnIconDialogOpen(false);
    setColumnCardBeingEdited(null);
  }, []);

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
    <div className="flex flex-col flex-nowrap px-5 py-3" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      <Pivot>
        <PivotItem headerText={"General"} aria-label="Board General Settings">
          <div className="board-metadata-form">
            <section className="board-metadata-edit-column-settings board-metadata-board-settings-section">
              <h2 className="board-metadata-form-section-header">Board Settings</h2>
              <div className="board-metadata-form-section-subheader board-metadata-title-row">
                <label id="retrospective-name-label" htmlFor="retrospective-title-input">
                  Retrospective Name:
                </label>
                {retrospectiveNameInput}
              </div>
              <div className="board-metadata-form-section-subheader">
                <label className="board-metadata-form-setting-label" htmlFor="max-vote-counter">
                  Max Votes per User:
                </label>
                {maxVotesPerUserInput}
              </div>
              <div className="board-metadata-form-section-information">{getIconElement("exclamation")} These settings cannot be modified after board creation.</div>
              <div className="board-metadata-form-section-subheader board-metadata-form-option-row">
                <label className="flex items-center gap-2" htmlFor="obscure-feedback-checkbox">
                  {shouldShowFeedbackAfterCollectInput}
                  <span>Hide feedback during Collect phase</span>
                </label>
                <span className="board-metadata-form-option-helper">Feedback displayed in Group, Vote, and Act phases.</span>
              </div>
              <div className="board-metadata-form-section-subheader board-metadata-form-option-row">
                <label className="flex items-center gap-2" htmlFor="feedback-display-names-checkbox">
                  {isBoardAnonymousInput}
                  <span>Make participant feedback anonymous</span>
                </label>
                <span className="board-metadata-form-option-helper">Participant names not tracked on board, nor in summary.</span>
              </div>
              <div className="board-metadata-form-section-subheader board-metadata-form-option-row">
                <label className="flex items-center gap-2" htmlFor="include-team-assessment-checkbox">
                  {isIncludeTeamEffectivenessMeasurementInput}
                  <span>Include Team Assessment</span>
                </label>
                <span className="board-metadata-form-option-helper">Team assessment responses always stored anonymously.</span>
              </div>
            </section>
            {isNewBoardCreation && isIncludeTeamEffectivenessMeasurement && (
              <section className="board-metadata-edit-column-settings">
                <h2 className="board-metadata-form-section-header">Custom Team Assessment Questions</h2>
                <div className="board-metadata-form-section-subheader grid-cols-1!">
                  {customTeamAssessmentQuestionInputs}
                </div>
                <button type="button" className="create-feedback-column-card-button" aria-label="Add custom question" onClick={() => setCustomTeamAssessmentQuestions([...customTeamAssessmentQuestions, ""])}>
                  {getIconElement("add")}
                  Add custom question
                </button>
              </section>
            )}
            <section className="board-metadata-edit-column-settings">
              <h2 className="board-metadata-form-section-header">Column Settings</h2>
              <div className="board-metadata-form-section-information">
                {getIconElement("exclamation")} You can create a maximum of {maxColumnCount} columns in a retrospective.
              </div>
              {!isNewBoardCreation && <div className="board-metadata-form-section-information warning-information">{getIconElement("report-problem")}Changing template after feedback entered may result in loss of feedback!</div>}
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
                    <div className={columnCard.markedForDeletion ? "feedback-column-card marked-for-deletion" : "feedback-column-card"}>
                      <div className="flex grow items-center">
                        <button
                          className="feedback-column-card-icon-button"
                          aria-label="Change column icon"
                          title="Change column icon"
                          disabled={columnCard.markedForDeletion}
                          type="button"
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
                          <i className="feedback-column-card-accent-color fas fa-square" style={{ color: columnCard.column.accentColor }} />
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
                        <button
                          className="feedback-column-card-move-up-button"
                          title="Move Up"
                          aria-label="Move Up"
                          disabled={columnCard.markedForDeletion || index === 0}
                          type="button"
                          onClick={() => {
                            const newColumns = [...columnCards];
                            [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
                            setColumnCards(newColumns);
                          }}
                        >
                          {getIconElement("chevron-up")}
                        </button>
                        <button
                          className="feedback-column-card-move-down-button"
                          title="Move Down"
                          aria-label="Move Down"
                          disabled={columnCard.markedForDeletion || index === columnCards.length - 1}
                          type="button"
                          onClick={() => {
                            const newColumns = [...columnCards];
                            [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
                            setColumnCards(newColumns);
                          }}
                        >
                          {getIconElement("chevron-down")}
                        </button>
                        {!columnCard.markedForDeletion && (
                          <button
                            className="feedback-column-card-delete-button"
                            title="Delete"
                            aria-label="Delete"
                            disabled={columnCards.filter(cc => !cc.markedForDeletion).length <= 1}
                            type="button"
                            onClick={() => {
                              const newColumns = [...columnCards];
                              newColumns[index].markedForDeletion = true;
                              setColumnCards(newColumns);
                            }}
                          >
                            {getIconElement("delete")}
                          </button>
                        )}
                        {columnCard.markedForDeletion && (
                          <button
                            className="feedback-column-card-undelete-button"
                            title="Undo Delete"
                            aria-label="Undo Delete"
                            disabled={columnCards.filter(cc => !cc.markedForDeletion).length >= maxColumnCount}
                            type="button"
                            onClick={() => {
                              const newColumns = [...columnCards];
                              newColumns[index].markedForDeletion = false;
                              setColumnCards(newColumns);
                            }}
                          >
                            {getIconElement("undo")}
                          </button>
                        )}
                      </div>
                    </div>
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
            {currentBoard && !isDeleteColumnConfirmationDialogHidden && (
              <dialog
                ref={deleteColumnConfirmDialogRef}
                className="confirm-changes-dialog"
                aria-label="Confirm Changes"
                onClose={() => setIsDeleteColumnConfirmationDialogHidden(true)}
              >
                <div className="header">
                  <h2 className="title">Confirm Changes</h2>
                  <button onClick={hideDeleteColumnConfirmationDialog} aria-label="Close">
                    {getIconElement("close")}
                  </button>
                </div>
                <div className="subText">{`Are you sure you want to remove columns from '${currentBoard.title}'? The feedback items in those columns will also be deleted. You will not be able to recover this data.`}</div>
                <div className="inner">
                  <button onClick={handleDeleteColumnConfirm}>
                    {t("common_confirm")}
                  </button>
                  <button className="default button" onClick={hideDeleteColumnConfirmationDialog}>{t("common_cancel")}</button>
                </div>
              </dialog>
            )}
            {columnCardBeingEdited && isChooseColumnIconDialogOpen && (
              <dialog className="choose-column-icon-dialog" aria-label="Choose column icon" ref={chooseColumnIconDialogRef} onClose={handleChooseColumnIconDialogClose}>
                <div className="header">
                  <h2 className="title">Choose column icon</h2>
                  <button type="button" onClick={() => chooseColumnIconDialogRef.current!.close()} aria-label="Close">
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
                          type="button"
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
                  <button type="button" className="default button" onClick={() => chooseColumnIconDialogRef.current!.close()}>
                    {t("common_close")}
                  </button>
                </div>
              </dialog>
            )}
            {columnCardBeingEdited && !isChooseColumnAccentColorDialogHidden && (
              <dialog
                ref={chooseColumnAccentColorDialogRef}
                className="choose-column-accent-color-dialog"
                aria-label="Choose Column Color"
                onClose={event => {
                  event.stopPropagation();
                  setIsChooseColumnAccentColorDialogHidden(true);
                  setColumnCardBeingEdited(null);
                }}
              >
                <div className="header">
                  <h2 className="title">Choose Column Color</h2>
                  <button
                    onClick={() => {
                      chooseColumnAccentColorDialogRef.current?.close();
                    }}
                    aria-label="Close"
                  >
                    {getIconElement("close")}
                  </button>
                </div>
                <div className="subText">{`Choose the column color for column '${columnCardBeingEdited.column.title}'`}</div>
                <div className="subText">
                  {allAccentColors.map(accentColor => {
                    return (
                      <button
                        key={accentColor.friendlyName}
                        aria-label={"Choose the color " + accentColor.friendlyName}
                        title={"Choose the color " + accentColor.friendlyName}
                        className="choose-feedback-column-accent-color-button"
                        onClick={() => {
                          columnCardBeingEdited.column.accentColor = accentColor.colorCode;
                          setIsChooseColumnAccentColorDialogHidden(true);
                          setColumnCardBeingEdited(null);
                          setColumnCards([...columnCards]);
                          chooseColumnAccentColorDialogRef.current?.close();
                        }}
                      >
                        <i
                          className={"fas fa-square"}
                          style={{
                            color: accentColor.colorCode,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </dialog>
            )}
          </div>
        </PivotItem>
        <PivotItem headerText={t("feedback_board_permissions")} aria-label={t("feedback_board_permission_settings")}>
          <FeedbackBoardMetadataFormPermissions board={currentBoard} permissions={permissions} permissionOptions={availablePermissionOptions} currentUserId={currentUserId} isNewBoardCreation={isNewBoardCreation} onPermissionChanged={(s: FeedbackBoardPermissionState) => setPermissions(s.permissions)} />
        </PivotItem>
      </Pivot>
      <div className="inner">
        {error && <span className="input-validation-message">{getIconElement("report")} {error}</span>}
        <button
          className="metadata-form-save-button"
          onClick={async event => {
            const titleInput = retrospectiveNameInputRef.current!;
            titleInput.setCustomValidity("");

            if (title.trim().length === 0) {
              const errorMessage = "⛔ Field 'Retrospective Name' cannot be empty.";
              setError(errorMessage);
              titleInput.setCustomValidity(errorMessage);
              titleInput.focus();
              return;
            }
            const activeColumnCards = columnCards.filter(columnCard => !columnCard.markedForDeletion);
            if (activeColumnCards.length === 0) {
              setError("At least one column must be active");
              return;
            }
            if (activeColumnCards.some(columnCard => columnCard.column.title.trim().length === 0)) {
              setError("Column name is required");
              return;
            }
            const isDuplicateBoardName = await BoardDataService.checkIfBoardNameIsTaken(teamId, title.trim());
            const isExistingBoardNameUnchanged = !isNewBoardCreation && title.trim() === initialTitle.trim();
            if (isDuplicateBoardName && !isExistingBoardNameUnchanged) {
              const errorMessage = "🚫 Field 'Retrospective Name' must be unique.";
              setError(errorMessage);
              titleInput.setCustomValidity(errorMessage);
              titleInput.focus();
              return;
            }
            setError("");
            if (isNewBoardCreation || columnCards.every(columnCard => !columnCard.markedForDeletion)) {
              handleFormSubmit(event);
            } else {
              showDeleteColumnConfirmationDialog();
            }
          }}
        >
          {t("common_save")}
        </button>
        <button className="default button" onClick={onFormCancel}>
          {t("common_cancel")}
        </button>
      </div>
    </div>
  );
};

export default FeedbackBoardMetadataForm;
