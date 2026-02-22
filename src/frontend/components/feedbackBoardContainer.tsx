import React from "react";

import { WorkflowPhase } from "../interfaces/workItem";
import WorkflowStage from "./workflowStage";
import BoardDataService from "../dal/boardDataService";
import { FeedbackBoardDocumentHelper, IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions, IFeedbackColumn, IFeedbackItemDocument } from "../interfaces/feedback";
import { reflectBackendService } from "../dal/reflectBackendService";
import BoardSummaryTable from "./boardSummaryTable";
import FeedbackBoardMetadataForm from "./feedbackBoardMetadataForm";
import FeedbackBoard from "../components/feedbackBoard";
import FeedbackCarousel, { type FocusModeModel } from "./feedbackCarousel";

import { azureDevOpsCoreService } from "../dal/azureDevOpsCoreService";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { getBoardUrl } from "../utilities/boardUrlHelper";
import { userDataService } from "../dal/userDataService";
import ExtensionSettingsMenu from "./extensionSettingsMenu";
import SelectorCombo, { ISelectorList } from "./selectorCombo";
import { ToastContainer, toast } from "./toastNotifications";
import { WorkItemType, WorkItemTypeReference } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { shareBoardHelper } from "../utilities/shareBoardHelper";
import { itemDataService } from "../dal/itemDataService";
import { TeamMember } from "azure-devops-extension-api/WebApi";
import EffectivenessMeasurementRow from "./effectivenessMeasurementRow";

import { obfuscateUserId, getUserIdentity } from "../utilities/userIdentityHelper";
import { getQuestionName, getQuestionShortName, getQuestionTooltip, getQuestionIconClassName, questions } from "../utilities/effectivenessMeasurementQuestionHelper";

import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { appInsights, reactPlugin, TelemetryEvents } from "../utilities/telemetryClient";
import { copyToClipboard } from "../utilities/clipboardHelper";
import { closeTopMostDialog } from "../utilities/dialogHelper";
import { getColumnsByTemplateId } from "../utilities/boardColumnsHelper";
import { FeedbackBoardPermissionOption } from "./feedbackBoardMetadataFormPermissions";
import { CommonServiceIds, IHostNavigationService } from "azure-devops-extension-api/Common/CommonServices";
import { getService } from "azure-devops-extension-sdk";
import { getIconElement } from "./icons";
import { playStartChime, playStopChime } from "../utilities/audioHelper";
import { createPdfFromText, downloadPdfBlob, generatePdfFileName } from "../utilities/pdfHelper";
import { formatBoardTimer } from "../utilities/useBoardTimer";
import { TeamAssessmentHistoryChart } from "./teamAssessmentHistoryChart";

export interface FeedbackBoardContainerProps {
  isHostedAzureDevOps: boolean;
  projectId: string;
  deferInitialization?: boolean;
}

export type FeedbackBoardContainerHandle = {
  readonly state: FeedbackBoardContainerState;
  setState: (updater: Partial<FeedbackBoardContainerState> | ((prevState: FeedbackBoardContainerState) => Partial<FeedbackBoardContainerState>), callback?: () => void) => void;
  componentDidMount: () => Promise<void>;
  componentDidUpdate: (prevProps: FeedbackBoardContainerProps, prevState: FeedbackBoardContainerState) => void;
  componentWillUnmount: () => void;

  get boardTimerIntervalId(): number | undefined;
  set boardTimerIntervalId(value: number | undefined);

  handleBoardCreated: (teamId: string, boardId: string) => Promise<void>;
  handleBoardUpdated: (teamId: string, updatedBoardId: string) => Promise<void>;
  handleBoardDeleted: (teamId: string, deletedBoardId: string) => Promise<void>;
  handlePivotClick: (tab: "Board" | "History") => Promise<void>;
  persistColumnNotes: (columnId: string, notes: string) => Promise<void>;
  setSupportedWorkItemTypesForProject: () => Promise<void>;
  loadRecentlyVisitedOrDefaultTeamAndBoardState: (defaultTeam: WebApiTeam, userTeams: WebApiTeam[]) => Promise<{ currentTeam: WebApiTeam; currentBoard: IFeedbackBoardDocument; boards: IFeedbackBoardDocument[] }>;
  reloadBoardsForCurrentTeam: () => Promise<void>;

  startBoardTimer: () => void;
  pauseBoardTimer: () => void;
  resetBoardTimer: () => void;
  clearBoardTimerInterval: () => void;
  renderWorkflowTimerControls: () => React.ReactNode;
  handleCountdownDurationChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  handleBoardTimerToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleBoardTimerReset: (event: React.MouseEvent<HTMLButtonElement>) => void;

  parseUrlForBoardAndTeamInformation: () => Promise<{ teamId: string; boardId: string; phase?: WorkflowPhase }>;
  updateUrlWithBoardAndTeamInformation: (teamId: string, boardId: string) => Promise<void>;

  createBoard: (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, isBoardAnonymous: boolean, shouldShowFeedbackAfterCollect: boolean, permissions: IFeedbackBoardDocumentPermissions) => Promise<IFeedbackBoardDocument>;
  updateBoardMetadata: (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, shouldShowFeedbackAfterCollect: boolean, isBoardAnonymous: boolean, permissions: IFeedbackBoardDocumentPermissions) => Promise<void>;
  archiveCurrentBoard: () => Promise<void>;
  generateEmailSummaryContent: () => Promise<void>;

  showBoardCreationDialog: () => void;
  hideBoardCreationDialog: () => void;
  showBoardDuplicateDialog: () => void;
  hideBoardDuplicateDialog: () => void;
  showBoardUpdateDialog: () => void;
  hideBoardUpdateDialog: () => void;
  showArchiveBoardConfirmationDialog: () => void;
  showRetroSummaryDialog: () => void;
  hideRetroSummaryDialog: () => void;
  showCarouselDialog: () => void;
  hideCarouselDialog: () => void;
  showTeamAssessmentHistoryDialog: () => void;
  hideTeamAssessmentHistoryDialog: () => void;
  hideLiveSyncInTfsIssueMessageBar: () => void;
  hideDropIssueInEdgeMessageBar: () => void;

  changeSelectedTeam: (team: WebApiTeam) => Promise<void>;
  changeSelectedBoard: (board: IFeedbackBoardDocument) => Promise<void>;

  getVoteMetricsState: (board: IFeedbackBoardDocument | undefined) => Pick<FeedbackBoardContainerState, "castedVoteCount" | "currentVoteCount" | "teamVoteCapacity">;
  updateFeedbackItemsAndContributors: (team: WebApiTeam, board: IFeedbackBoardDocument) => Promise<void>;

  numberFormatter: (value: number) => string;
  percentageFormatter: (value: number) => string;

  archiveBoardDialogRef: React.RefObject<HTMLDialogElement>;
  previewEmailDialogRef: React.RefObject<HTMLDialogElement>;
  boardCreationDialogRef: React.RefObject<HTMLDialogElement>;
  boardDuplicateDialogRef: React.RefObject<HTMLDialogElement>;
  boardUpdateDialogRef: React.RefObject<HTMLDialogElement>;
  discussAndActDialogRef: React.RefObject<HTMLDialogElement>;
  teamEffectivenessDialogRef: React.RefObject<HTMLDialogElement>;
  retroSummaryDialogRef: React.RefObject<HTMLDialogElement>;
  teamAssessmentHistoryDialogRef: React.RefObject<HTMLDialogElement>;
  carouselDialogRef: React.RefObject<HTMLDialogElement>;
};

export interface FeedbackBoardContainerState {
  boards: IFeedbackBoardDocument[];
  currentUserId: string;
  currentBoard: IFeedbackBoardDocument;
  currentTeam: WebApiTeam;
  filteredProjectTeams: WebApiTeam[];
  filteredUserTeams: WebApiTeam[];
  hasToggledArchive: boolean;
  isAppInitialized: boolean;
  isBackendServiceConnected: boolean;
  isTeamDataLoaded: boolean;
  isAllTeamsLoaded: boolean;
  maxVotesPerUser: number;
  /**
   * Teams that the current user is specifically a member of.
   */
  userTeams: WebApiTeam[];
  /**
   * All teams within the current organization.
   */
  projectTeams: WebApiTeam[];
  nonHiddenWorkItemTypes: WorkItemType[];
  allWorkItemTypes: WorkItemType[];
  isMobileBoardActionsDialogHidden: boolean;
  isMobileTeamSelectorDialogHidden: boolean;
  isTeamBoardDeletedInfoDialogHidden: boolean;
  isTeamSelectorCalloutVisible: boolean;
  teamBoardDeletedDialogMessage: string;
  teamBoardDeletedDialogTitle: string;
  focusModeModel: FocusModeModel | null;
  isIncludeTeamEffectivenessMeasurementDialogHidden: boolean;
  isLiveSyncInTfsIssueMessageBarVisible: boolean;
  isDropIssueInEdgeMessageBarVisible: boolean;
  allowCrossColumnGroups: boolean;
  feedbackItems: IFeedbackItemDocument[];
  contributors: { id: string; name: string; imageUrl: string }[];
  effectivenessMeasurementSummary: { questionId: number; question: string; average: number }[];
  effectivenessMeasurementChartData: { questionId: number; red: number; yellow: number; green: number }[];
  teamEffectivenessMeasurementAverageVisibilityClassName: string;
  actionItemIds: number[];
  allMembers: TeamMember[];
  castedVoteCount: number;
  currentVoteCount: string;
  teamVoteCapacity: number;
  boardColumns: IFeedbackColumn[];
  questionIdForDiscussAndActBoardUpdate: number;
  activeTab: "Board" | "History";
  boardTimerSeconds: number;
  isBoardTimerRunning: boolean;
  countdownDurationMinutes: number;
  hasPlayedStopChime: boolean;
  teamAssessmentHistoryData: {
    boardTitle: string;
    boardId: string;
    createdDate: Date;
    questionAverages: { questionId: number; average: number }[];
  }[];
}

export function deduplicateTeamMembers(allTeamMembers: TeamMember[]): TeamMember[] {
  const memberGroups = new Map<string, TeamMember[]>();
  for (const member of allTeamMembers) {
    const memberArray = memberGroups.get(member.identity.id) || [];
    memberArray.push(member);
    memberGroups.set(member.identity.id, memberArray);
  }
  return Array.from(memberGroups.values()).map(members => {
    const admin = members.find(m => m.isTeamAdmin);
    return admin || members[0];
  });
}

const initialState: FeedbackBoardContainerState = {
  allWorkItemTypes: [],
  allowCrossColumnGroups: false,
  boards: [],
  currentUserId: "",
  currentBoard: undefined,
  currentTeam: undefined,
  filteredProjectTeams: [],
  filteredUserTeams: [],
  hasToggledArchive: false,
  isAllTeamsLoaded: false,
  isAppInitialized: false,
  isBackendServiceConnected: false,
  focusModeModel: null,
  isIncludeTeamEffectivenessMeasurementDialogHidden: true,
  isDropIssueInEdgeMessageBarVisible: true,
  isLiveSyncInTfsIssueMessageBarVisible: true,
  isMobileBoardActionsDialogHidden: true,
  isMobileTeamSelectorDialogHidden: true,
  isTeamBoardDeletedInfoDialogHidden: true,
  isTeamDataLoaded: false,
  isTeamSelectorCalloutVisible: false,
  nonHiddenWorkItemTypes: [],
  projectTeams: [],
  teamBoardDeletedDialogMessage: "",
  teamBoardDeletedDialogTitle: "",
  userTeams: [],
  maxVotesPerUser: 5,
  feedbackItems: [],
  contributors: [],
  effectivenessMeasurementSummary: [],
  effectivenessMeasurementChartData: [],
  teamEffectivenessMeasurementAverageVisibilityClassName: "hidden",
  actionItemIds: [],
  allMembers: [],
  castedVoteCount: 0,
  currentVoteCount: "0",
  teamVoteCapacity: 0,
  boardColumns: [],
  questionIdForDiscussAndActBoardUpdate: -1,
  activeTab: "Board",
  boardTimerSeconds: 0,
  isBoardTimerRunning: false,
  countdownDurationMinutes: 5,
  hasPlayedStopChime: false,
  teamAssessmentHistoryData: [],
};

export const FeedbackBoardContainer = React.forwardRef<FeedbackBoardContainerHandle, FeedbackBoardContainerProps>(function FeedbackBoardContainer(props, ref) {
  const trackActivity = useTrackMetric(reactPlugin, "FeedbackBoardContainer");

  const handleRef = React.useRef<FeedbackBoardContainerHandle | null>(null);
  const stateRef = React.useRef<FeedbackBoardContainerState>({ ...initialState });
  const [, forceRender] = React.useReducer((x: number) => x + 1, 0);

  const boardTimerIntervalIdRef = React.useRef<number | undefined>(undefined);
  const didMountRef = React.useRef(false);

  const prevCurrentTeamRef = React.useRef<WebApiTeam | undefined>(undefined);
  const prevCurrentBoardRef = React.useRef<IFeedbackBoardDocument | undefined>(undefined);
  const prevActiveTabRef = React.useRef<FeedbackBoardContainerState["activeTab"]>(initialState.activeTab);

  const boardActionsMenuRootRef = React.useRef<HTMLDivElement | null>(null);

  const carouselDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const previewEmailDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const archiveBoardDialogRef = React.useRef<HTMLDialogElement | null>(null);

  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (closeTopMostDialog()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleEscapeKey, true);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey, true);
    };
  }, []);
  const boardCreationDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const boardDuplicateDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const boardUpdateDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const discussAndActDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const teamEffectivenessDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const retroSummaryDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const teamAssessmentHistoryDialogRef = React.useRef<HTMLDialogElement | null>(null);

  const setState: FeedbackBoardContainerHandle["setState"] = React.useCallback((updater, callback) => {
    const currentState = stateRef.current;
    const updatePartial = typeof updater === "function" ? updater(currentState) : updater;
    if (updatePartial) {
      Object.assign(currentState, updatePartial);
    }
    forceRender();
    if (callback) {
      callback();
    }
  }, []);

  const handleBoardActionsDocumentPointerDown = React.useCallback((event: PointerEvent) => {
    const root = boardActionsMenuRootRef.current;
    if (!root) {
      return;
    }

    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    const openDetails = Array.from(root.querySelectorAll("details[open]"));
    for (const detailsElement of openDetails) {
      if (!detailsElement.contains(target)) {
        detailsElement.removeAttribute("open");
      }
    }
  }, []);

  const handleBoardActionMenuItemClick = React.useCallback(async (handler: () => void | Promise<void>, event: React.MouseEvent<HTMLButtonElement>) => {
    const detailsElement = event.currentTarget.closest("details");
    detailsElement?.removeAttribute("open");
    await handler();
  }, []);

  const componentDidMount = React.useCallback(async () => {
    if (didMountRef.current) {
      return;
    }
    didMountRef.current = true;

    const currentUserId = getUserIdentity()?.id ?? "";
    setState({ currentUserId });

    let initialCurrentTeam: WebApiTeam | undefined;
    let initialCurrentBoard: IFeedbackBoardDocument | undefined;

    if (props.isHostedAzureDevOps) {
      try {
        const isBackendServiceConnected = await reflectBackendService.startConnection();
        setState({ isBackendServiceConnected });
      } catch (error) {
        appInsights.trackException(error, {
          action: "connect",
        });
      }
    } else {
      setState({ isBackendServiceConnected: false });
    }

    try {
      const initializedTeamAndBoardState = await initializeFeedbackBoard();
      initialCurrentTeam = initializedTeamAndBoardState.currentTeam;
      initialCurrentBoard = initializedTeamAndBoardState.currentBoard;

      await initializeProjectTeams(initialCurrentTeam);

      setState({ ...initializedTeamAndBoardState, isTeamDataLoaded: true });
    } catch (error) {
      appInsights.trackException(error, {
        action: "initializeTeamAndBoardState",
      });
      setState({ isTeamDataLoaded: true });
    }

    try {
      await setSupportedWorkItemTypesForProject();
    } catch (error) {
      appInsights.trackException(error, {
        action: "setSupportedWorkItemTypesForProject",
      });
    }

    try {
      await updateFeedbackItemsAndContributors(initialCurrentTeam, initialCurrentBoard);
    } catch (error) {
      appInsights.trackException(error, {
        action: "updateFeedbackItemsAndContributors",
      });
    }

    try {
      setState(getVoteMetricsState(initialCurrentBoard));
    } catch (error) {
      appInsights.trackException(error, {
        action: "votes",
      });
    }

    try {
      reflectBackendService.onConnectionClose(() => {
        setState({ isBackendServiceConnected: false });
      });

      reflectBackendService.onReceiveNewBoard(handleBoardCreated);
      reflectBackendService.onReceiveDeletedBoard(handleBoardDeleted);
      reflectBackendService.onReceiveUpdatedBoard(handleBoardUpdated);
    } catch (e) {
      appInsights.trackException(e, {
        action: "catchError",
      });
    }

    setState({ isAppInitialized: true });

    document.addEventListener("pointerdown", handleBoardActionsDocumentPointerDown);
  }, [handleBoardActionsDocumentPointerDown, setState]);

  const componentWillUnmount = React.useCallback(() => {
    reflectBackendService.removeOnReceiveNewBoard(handleBoardCreated);
    reflectBackendService.removeOnReceiveDeletedBoard(handleBoardDeleted);
    reflectBackendService.removeOnReceiveUpdatedBoard(handleBoardUpdated);
    clearBoardTimerInterval();

    document.removeEventListener("pointerdown", handleBoardActionsDocumentPointerDown);
  }, [handleBoardActionsDocumentPointerDown]);

  React.useEffect(() => {
    if (!props.deferInitialization) {
      void componentDidMount();
    }
    return () => {
      componentWillUnmount();
    };
  }, [componentDidMount, componentWillUnmount, props.deferInitialization]);

  React.useEffect(() => {
    const state = stateRef.current;

    const prevCurrentTeam = prevCurrentTeamRef.current;
    const prevCurrentBoard = prevCurrentBoardRef.current;
    const prevActiveTab = prevActiveTabRef.current;

    if (prevCurrentTeam !== undefined && prevCurrentTeam !== state.currentTeam && state.currentTeam) {
      appInsights.trackEvent({ name: TelemetryEvents.TeamSelectionChanged, properties: { teamId: state.currentTeam.id } });
    }

    if (prevCurrentBoard !== undefined && prevCurrentBoard !== state.currentBoard) {
      reflectBackendService.switchToBoard(state.currentBoard ? state.currentBoard.id : undefined);
      appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardSelectionChanged, properties: { boardId: state.currentBoard?.id } });
      if (state.isAppInitialized && state.currentTeam) {
        userDataService.addVisit(state.currentTeam.id, state.currentBoard ? state.currentBoard.id : undefined);
      }
      if (state.currentTeam && state.currentBoard) {
        void updateFeedbackItemsAndContributors(state.currentTeam, state.currentBoard);
      }
      if (prevCurrentBoard?.id !== state.currentBoard?.id) {
        resetBoardTimer();
      }
    }

    if (prevActiveTab !== state.activeTab && state.activeTab !== "Board") {
      pauseBoardTimer();
    }

    prevCurrentTeamRef.current = state.currentTeam;
    prevCurrentBoardRef.current = state.currentBoard;
    prevActiveTabRef.current = state.activeTab;
  });

  const clearBoardTimerInterval = React.useCallback(() => {
    if (boardTimerIntervalIdRef.current !== undefined) {
      window.clearInterval(boardTimerIntervalIdRef.current);
      boardTimerIntervalIdRef.current = undefined;
    }
  }, []);

  const startBoardTimer = React.useCallback(() => {
    const state = stateRef.current;
    if (boardTimerIntervalIdRef.current !== undefined) {
      return;
    }

    const isTimerMode = state.countdownDurationMinutes === 0;

    if (state.boardTimerSeconds === 0 && !isTimerMode) {
      playStartChime();
      setState({ boardTimerSeconds: state.countdownDurationMinutes * 60, hasPlayedStopChime: false }, () => {
        boardTimerIntervalIdRef.current = window.setInterval(() => {
          setState(previousState => {
            const newSeconds = previousState.boardTimerSeconds - 1;
            if (newSeconds === 0 && !previousState.hasPlayedStopChime) {
              playStopChime();
              return { boardTimerSeconds: newSeconds, hasPlayedStopChime: true as const };
            }
            return { boardTimerSeconds: newSeconds, hasPlayedStopChime: previousState.hasPlayedStopChime };
          });
        }, 1000);
      });
    } else {
      playStartChime();
      boardTimerIntervalIdRef.current = window.setInterval(() => {
        setState(previousState => {
          const isTimerMode = stateRef.current.countdownDurationMinutes === 0;

          if (isTimerMode) {
            return { boardTimerSeconds: previousState.boardTimerSeconds + 1, hasPlayedStopChime: previousState.hasPlayedStopChime };
          } else {
            const newSeconds = previousState.boardTimerSeconds - 1;
            if (newSeconds === 0 && !previousState.hasPlayedStopChime) {
              playStopChime();
              return { boardTimerSeconds: newSeconds, hasPlayedStopChime: true as const };
            }
            return { boardTimerSeconds: newSeconds, hasPlayedStopChime: previousState.hasPlayedStopChime };
          }
        });
      }, 1000);
    }

    if (!state.isBoardTimerRunning) {
      setState({ isBoardTimerRunning: true });
    }
  }, [clearBoardTimerInterval, setState]);

  const pauseBoardTimer = React.useCallback(() => {
    const state = stateRef.current;
    const wasRunning = state.isBoardTimerRunning;
    const hadInterval = boardTimerIntervalIdRef.current !== undefined;
    clearBoardTimerInterval();

    if (wasRunning || hadInterval) {
      setState({ isBoardTimerRunning: false });
    }
  }, [clearBoardTimerInterval, setState]);

  const resetBoardTimer = React.useCallback(() => {
    const state = stateRef.current;
    const shouldReset = state.boardTimerSeconds !== 0 || state.isBoardTimerRunning || boardTimerIntervalIdRef.current !== undefined;

    if (!shouldReset) {
      return;
    }

    clearBoardTimerInterval();
    setState({ boardTimerSeconds: 0, isBoardTimerRunning: false, hasPlayedStopChime: false });
  }, [clearBoardTimerInterval, setState]);

  const componentDidUpdate = React.useCallback(
    (_prevProps: FeedbackBoardContainerProps, prevState: FeedbackBoardContainerState) => {
      const state = stateRef.current;

      if (prevState.currentTeam !== state.currentTeam && state.currentTeam) {
        appInsights.trackEvent({ name: TelemetryEvents.TeamSelectionChanged, properties: { teamId: state.currentTeam.id } });
      }

      if (prevState.currentBoard !== state.currentBoard) {
        reflectBackendService.switchToBoard(state.currentBoard ? state.currentBoard.id : undefined);
        appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardSelectionChanged, properties: { boardId: state.currentBoard?.id } });

        if (state.isAppInitialized && state.currentTeam) {
          userDataService.addVisit(state.currentTeam.id, state.currentBoard ? state.currentBoard.id : undefined);
        }

        if (state.currentTeam && state.currentBoard) {
          const updateFn = handleRef.current?.updateFeedbackItemsAndContributors ?? updateFeedbackItemsAndContributors;
          void updateFn(state.currentTeam, state.currentBoard);
        }

        if (prevState.currentBoard?.id !== state.currentBoard?.id) {
          const resetFn = handleRef.current?.resetBoardTimer ?? resetBoardTimer;
          resetFn();
        }
      }

      if (prevState.activeTab !== state.activeTab && state.activeTab !== "Board") {
        const pauseFn = handleRef.current?.pauseBoardTimer ?? pauseBoardTimer;
        pauseFn();
      }
    },
    [pauseBoardTimer, resetBoardTimer],
  );

  const handleBoardTimerToggle = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (stateRef.current.isBoardTimerRunning) {
        pauseBoardTimer();
        return;
      }

      startBoardTimer();
    },
    [pauseBoardTimer, startBoardTimer],
  );

  const handleBoardTimerReset = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      resetBoardTimer();
    },
    [resetBoardTimer],
  );

  const handleCountdownDurationChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const duration = parseInt(event.target.value, 10);
      setState({ countdownDurationMinutes: duration });
    },
    [setState],
  );

  const renderWorkflowTimerControls = React.useCallback(() => {
    const state = stateRef.current;
    if (!state.currentBoard) {
      return null;
    }

    return (
      <div className="workflow-stage-timer" role="status" aria-live="polite">
        <button type="button" className="workflow-stage-timer-toggle" title={state.isBoardTimerRunning ? "Pause" : "Start"} aria-pressed={state.isBoardTimerRunning} aria-label={`${state.isBoardTimerRunning ? "Pause" : "Start"}. ${formatBoardTimer(state.boardTimerSeconds)} ${state.countdownDurationMinutes === 0 ? "elapsed" : "remaining"}.`} onClick={handleBoardTimerToggle}>
          {state.isBoardTimerRunning ? getIconElement("pause-circle") : getIconElement("play-circle")}
        </button>
        {!state.isBoardTimerRunning && state.boardTimerSeconds === 0 ? (
          <select value={state.countdownDurationMinutes} onChange={handleCountdownDurationChange} className="workflow-stage-timer-select" aria-label="Select countdown duration in minutes">
            <option value={0}>Stopwatch</option>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>
                {num} min
              </option>
            ))}
          </select>
        ) : (
          <span className={state.boardTimerSeconds < 0 ? "timer-overtime" : ""}>{formatBoardTimer(state.boardTimerSeconds)}</span>
        )}
        <button type="button" className="workflow-stage-timer-reset" title="Reset" aria-label="Reset" disabled={!state.boardTimerSeconds && !state.isBoardTimerRunning} onClick={handleBoardTimerReset}>
          {getIconElement("refresh")}
        </button>
      </div>
    );
  }, [handleBoardTimerReset, handleBoardTimerToggle, handleCountdownDurationChange]);

  const updateUrlWithBoardAndTeamInformation = React.useCallback(async (teamId: string, boardId: string) => {
    getService<IHostNavigationService>(CommonServiceIds.HostNavigationService).then(service => {
      const phase = stateRef.current.currentBoard?.activePhase;
      service.setHash(`teamId=${teamId}&boardId=${boardId}${phase ? `&phase=${phase}` : ""}`);
    });
  }, []);

  const parseUrlForBoardAndTeamInformation = React.useCallback(async (): Promise<{ teamId: string; boardId: string; phase?: WorkflowPhase }> => {
    const service = await getService<IHostNavigationService>(CommonServiceIds.HostNavigationService);
    let hash = await service.getHash();
    if (hash.startsWith("#")) {
      hash = hash.substring(1);
    }
    const hashParams = new URLSearchParams(hash);
    const teamId = hashParams.get("teamId");
    const boardId = hashParams.get("boardId");
    const phase = hashParams.get("phase") as WorkflowPhase;

    return { teamId, boardId, phase };
  }, []);

  const updateFeedbackItemsAndContributors = React.useCallback(
    async (currentTeam: WebApiTeam, currentBoard: IFeedbackBoardDocument) => {
      if (!currentTeam || !currentBoard) {
        return;
      }

      const board: IFeedbackBoardDocument = await itemDataService.getBoardItem(currentTeam.id, currentBoard.id);
      if (!board) {
        return;
      }

      const feedbackItems = (await itemDataService.getFeedbackItemsForBoard(board?.id)) ?? [];

      await updateUrlWithBoardAndTeamInformation(currentTeam.id, board.id);

      let actionItemIds: number[] = [];
      feedbackItems.forEach(item => {
        actionItemIds = actionItemIds.concat(item.associatedActionItemIds);
      });

      const contributors = feedbackItems
        .map(e => {
          return { id: e.userIdRef, name: e?.createdBy?.displayName, imageUrl: e?.createdBy?.imageUrl };
        })
        .filter((v, i, a) => a.indexOf(v) === i);

      const voteMetricsState = getVoteMetricsState(board);

      setState({
        actionItemIds: actionItemIds.filter(item => item !== undefined),
        feedbackItems,
        contributors: [...new Set(contributors.map(e => e.id))].map(e => contributors.find(i => i.id === e)),
        ...voteMetricsState,
      });
    },
    [setState, updateUrlWithBoardAndTeamInformation],
  );

  const getVoteMetricsState = React.useCallback((board: IFeedbackBoardDocument | undefined): Pick<FeedbackBoardContainerState, "castedVoteCount" | "currentVoteCount" | "teamVoteCapacity"> => {
    if (!board || !stateRef.current.currentUserId) {
      return {
        castedVoteCount: 0,
        currentVoteCount: "0",
        teamVoteCapacity: 0,
      };
    }

    const voteCollection = board.boardVoteCollection || {};
    const votes = Object.values(voteCollection);
    const totalVotesUsed = votes.length > 0 ? votes.reduce((sum, vote) => sum + vote, 0) : 0;

    const userIdKey = obfuscateUserId(stateRef.current.currentUserId);
    const currentUserVotes = voteCollection[userIdKey]?.toString() || "0";

    const voterCount = Object.keys(voteCollection).length;
    const maxVotesPerUser = board.maxVotesPerUser ?? 0;
    const teamVoteCapacity = voterCount > 0 && maxVotesPerUser > 0 ? voterCount * maxVotesPerUser : 0;

    return {
      castedVoteCount: totalVotesUsed,
      currentVoteCount: currentUserVotes,
      teamVoteCapacity,
    };
  }, []);

  const numberFormatter = React.useCallback((value: number) => {
    const formatter = new Intl.NumberFormat("en-US", { style: "decimal", minimumFractionDigits: 1, maximumFractionDigits: 1 });

    return formatter.format(value);
  }, []);

  const percentageFormatter = React.useCallback((value: number) => {
    const formatter = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

    return formatter.format(value / 100);
  }, []);

  const handleBoardCreated = React.useCallback(
    async (teamId: string, boardId: string) => {
      const state = stateRef.current;
      if (!teamId || !state.currentTeam || state.currentTeam.id !== teamId) {
        return;
      }

      const boardToAdd = await BoardDataService.getBoardForTeamById(state.currentTeam.id, boardId);

      if (!boardToAdd) {
        return;
      }

      setState(prevState => {
        const boardsForTeam = [...prevState.boards, boardToAdd]
          .filter((board: IFeedbackBoardDocument) =>
            FeedbackBoardDocumentHelper.filter(
              board,
              stateRef.current.userTeams.map(t => t.id),
              stateRef.current.currentUserId,
            ),
          )
          .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));

        const newCurrentBoard = boardsForTeam.length === 1 ? boardsForTeam[0] : prevState.currentBoard;

        return {
          boards: boardsForTeam,
          currentBoard: newCurrentBoard,
          isTeamBoardDeletedInfoDialogHidden: true,
        };
      });
    },
    [setState],
  );

  const setSupportedWorkItemTypesForProject = React.useCallback(async (): Promise<void> => {
    const allWorkItemTypes: WorkItemType[] = await workItemService.getWorkItemTypesForCurrentProject();
    const hiddenWorkItemTypes: WorkItemTypeReference[] = await workItemService.getHiddenWorkItemTypes();

    const hiddenWorkItemTypeNames = hiddenWorkItemTypes.map(workItemType => workItemType.name);

    const nonHiddenWorkItemTypes = allWorkItemTypes.filter(workItemType => hiddenWorkItemTypeNames.indexOf(workItemType.name) === -1);

    setState({
      nonHiddenWorkItemTypes: nonHiddenWorkItemTypes,
      allWorkItemTypes: allWorkItemTypes,
    });
  }, [setState]);

  const replaceBoard = React.useCallback(
    (updatedBoard: IFeedbackBoardDocument) => {
      setState(prevState => {
        const newBoards = prevState.boards.map(board => (board.id === updatedBoard.id ? updatedBoard : board));

        const currentBoard = stateRef.current.currentBoard;
        const newCurrentBoard = currentBoard && currentBoard.id === updatedBoard.id ? updatedBoard : currentBoard;

        return {
          boards: newBoards,
          currentBoard: newCurrentBoard,
        };
      });
    },
    [setState],
  );

  const handleBoardUpdated = React.useCallback(
    async (teamId: string, updatedBoardId: string) => {
      const state = stateRef.current;
      if (!teamId || !state.currentTeam || state.currentTeam.id !== teamId) {
        return;
      }

      const updatedBoard = await BoardDataService.getBoardForTeamById(state.currentTeam.id, updatedBoardId);

      if (!updatedBoard) {
        // Board has been deleted after the update. Just ignore the update. The delete should be handled on its own.
        return;
      }

      replaceBoard(updatedBoard);
    },
    [replaceBoard],
  );

  const handleBoardDeleted = React.useCallback(
    async (teamId: string, deletedBoardId: string) => {
      const state = stateRef.current;
      if (!teamId || !state.currentTeam || state.currentTeam.id !== teamId) {
        return;
      }

      setState(
        (prevState): Pick<FeedbackBoardContainerState, "boards" | "currentBoard" | "isTeamBoardDeletedInfoDialogHidden" | "teamBoardDeletedDialogTitle" | "teamBoardDeletedDialogMessage"> => {
          const currentBoards = prevState.boards;
          const boardsForTeam = currentBoards.filter(board => board.id !== deletedBoardId);

          if (prevState.currentBoard && deletedBoardId === prevState.currentBoard.id) {
            if (!boardsForTeam || boardsForTeam.length === 0) {
              reflectBackendService.switchToBoard(undefined);
              return {
                boards: [],
                currentBoard: null,
                isTeamBoardDeletedInfoDialogHidden: false,
                teamBoardDeletedDialogTitle: "Retrospective archived or deleted",
                teamBoardDeletedDialogMessage: "The retrospective you were viewing has been archived or deleted by another user.",
              };
            }

            const currentBoard = boardsForTeam[0];
            reflectBackendService.switchToBoard(currentBoard.id);
            return {
              boards: boardsForTeam,
              currentBoard: currentBoard,
              isTeamBoardDeletedInfoDialogHidden: false,
              teamBoardDeletedDialogTitle: "Retrospective archived or deleted",
              teamBoardDeletedDialogMessage: "The retrospective you were viewing has been archived or deleted by another user. You will be switched to the last created retrospective for this team.",
            };
          }

          return {
            boards: boardsForTeam,
            currentBoard: prevState.currentBoard,
            isTeamBoardDeletedInfoDialogHidden: prevState.isTeamBoardDeletedInfoDialogHidden,
            teamBoardDeletedDialogTitle: prevState.teamBoardDeletedDialogTitle,
            teamBoardDeletedDialogMessage: prevState.teamBoardDeletedDialogMessage,
          };
        },
        async () => {
          await userDataService.addVisit(stateRef.current.currentTeam?.id, stateRef.current.currentBoard?.id);
        },
      );
    },
    [setState],
  );

  /**
   * @description Loads team data for this project and the current user. Attempts to use query
   * params or user records to pre-select team and board, otherwise default to the first team
   * the current user is a part of and most recently created board.
   * @returns An object to update the state with initialized team and board data.
   */
  const initializeFeedbackBoard = async (): Promise<{
    userTeams: WebApiTeam[];
    filteredUserTeams: WebApiTeam[];
    currentTeam: WebApiTeam;
    boards: IFeedbackBoardDocument[];
    currentBoard: IFeedbackBoardDocument;
    isTeamBoardDeletedInfoDialogHidden: boolean;
    teamBoardDeletedDialogTitle: string;
    teamBoardDeletedDialogMessage: string;
  }> => {
    const userTeams = await azureDevOpsCoreService.getAllTeams(props.projectId, true);
    userTeams?.sort((t1, t2) => {
      return t1.name.localeCompare(t2.name, [], { sensitivity: "accent" });
    });

    const defaultTeam = userTeams?.length ? userTeams[0] : await azureDevOpsCoreService.getDefaultTeam(props.projectId);

    const baseTeamState = {
      userTeams,
      filteredUserTeams: userTeams,
      currentTeam: defaultTeam,
      isTeamBoardDeletedInfoDialogHidden: true,
      teamBoardDeletedDialogTitle: "",
      teamBoardDeletedDialogMessage: "",
    };

    const searchParams = new URLSearchParams(document.location.search);
    if (searchParams.has("name")) {
      const name = searchParams.get("name");
      const maxVotes = searchParams.get("maxVotes") || "5";
      const isTeamAssessment = searchParams.get("isTeamAssessment") || "true";
      const columns = getColumnsByTemplateId(searchParams.get("templateId") || "start-stop-continue");
      const teamId = searchParams.get("teamId");
      if (teamId) {
        const matchedTeam = await azureDevOpsCoreService.getTeam(props.projectId, teamId);
        if (matchedTeam) {
          setState({ currentTeam: matchedTeam });
        }
      }
      if (stateRef.current.currentTeam === undefined) {
        setState({ currentTeam: defaultTeam });
      }

      const newBoard = await createBoard(name, parseInt(maxVotes), columns, isTeamAssessment === "true", false, false, { Members: [], Teams: [] });

      parent.location.href = await getBoardUrl(stateRef.current.currentTeam.id, newBoard.id, newBoard.activePhase);
    }

    const info = await parseUrlForBoardAndTeamInformation();
    try {
      if (!info) {
        if (!props.isHostedAzureDevOps) {
          throw new Error("URL-related issue occurred with on-premise Azure DevOps");
        } else if (!document.referrer) {
          throw new Error("URL-related issue occurred with this URL: (Empty URL)");
        } else {
          const indexVisualStudioCom = document.location.href.indexOf("visualstudio.com");
          const indexDevAzureCom = document.location.href.indexOf("dev.azure.com");

          if (indexVisualStudioCom >= 0) {
            const indexSecondSlashAfterVisualStudioCom = document.location.href.indexOf("/", indexVisualStudioCom + "visualstudio.com/".length);
            throw new Error("URL-related issue occurred with this URL: " + document.location.href.substring(indexSecondSlashAfterVisualStudioCom));
          } else if (indexDevAzureCom >= 0) {
            const indexSecondSlashAfterDevAzureCom = document.location.href.indexOf("/", indexDevAzureCom + "dev.azure.com/".length);
            const indexThirdSlashAfterDevAzureCom = document.location.href.indexOf("/", indexSecondSlashAfterDevAzureCom + 1);
            throw new Error("URL-related issue occurred with this URL: " + document.location.href.substring(indexThirdSlashAfterDevAzureCom));
          } else {
            throw new Error("URL-related issue occurred with hosted Azure DevOps but document referrer does not contain dev.azure.com or visualstudio.com");
          }
        }
      }
    } catch (e) {
      appInsights.trackException(e);
    }

    if (!info?.teamId) {
      // If the teamId query param doesn't exist, attempt to pre-select a team and board by last
      // visited user records.
      const recentVisitState = await loadRecentlyVisitedOrDefaultTeamAndBoardState(defaultTeam, userTeams);

      return {
        ...baseTeamState,
        ...recentVisitState,
      };
    }

    // Attempt to pre-select the team based on the teamId query param.
    const teamIdQueryParam = info.teamId;
    const matchedTeam = await azureDevOpsCoreService.getTeam(props.projectId, teamIdQueryParam);

    if (!matchedTeam) {
      // If the teamId query param wasn't valid attempt to pre-select a team and board by last
      // visited user records.
      const recentVisitState = await loadRecentlyVisitedOrDefaultTeamAndBoardState(defaultTeam, userTeams);
      const recentVisitWithDialogState = {
        ...recentVisitState,
        isTeamBoardDeletedInfoDialogHidden: false,
        teamBoardDeletedDialogTitle: "Team not found",
        teamBoardDeletedDialogMessage: "Could not find the team specified in the URL.",
      };

      return {
        ...baseTeamState,
        ...recentVisitWithDialogState,
      };
    }

    let boardsForMatchedTeam = await BoardDataService.getBoardsForTeam(matchedTeam.id);
    if (boardsForMatchedTeam?.length) {
      boardsForMatchedTeam = boardsForMatchedTeam
        .filter((board: IFeedbackBoardDocument) =>
          FeedbackBoardDocumentHelper.filter(
            board,
            stateRef.current.userTeams.map(t => t.id),
            stateRef.current.currentUserId,
          ),
        )
        .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));
    }

    const queryParamTeamAndDefaultBoardState = {
      ...baseTeamState,
      currentBoard: boardsForMatchedTeam.length ? boardsForMatchedTeam[0] : null,
      currentTeam: matchedTeam,
      boards: boardsForMatchedTeam,
    };

    if (!info.boardId) {
      // If the boardId query param doesn't exist, we fall back to using the most recently
      // created board. We don't use the last visited records in this case since it may be for
      // a different team.
      return queryParamTeamAndDefaultBoardState;
    }

    // Attempt to pre-select the board based on the boardId query param.
    const boardIdQueryParam = info.boardId;
    const matchedBoard = boardsForMatchedTeam.find(board => board.id === boardIdQueryParam);

    if (matchedBoard) {
      if (matchedBoard.teamEffectivenessMeasurementVoteCollection === undefined) {
        matchedBoard.teamEffectivenessMeasurementVoteCollection = [];
      }

      // Set the active phase from URL if provided
      if (info.phase) {
        matchedBoard.activePhase = info.phase;
      }

      return {
        ...queryParamTeamAndDefaultBoardState,
        currentBoard: matchedBoard,
      };
    } else {
      // If the boardId query param wasn't valid, we fall back to using the most recently
      // created board. We don't use the last visited records in this case since it may be for
      // a different team.
      return {
        ...queryParamTeamAndDefaultBoardState,
        isTeamBoardDeletedInfoDialogHidden: false,
        teamBoardDeletedDialogTitle: "Board not found",
        teamBoardDeletedDialogMessage: "Could not find the board specified in the URL.",
      };
    }
  };

  const initializeProjectTeams = async (defaultTeam: WebApiTeam) => {
    // true returns all teams that user is a member in the project
    // false returns all teams that are in project
    // intentionally restricting to teams the user is a member
    const allTeams = await azureDevOpsCoreService.getAllTeams(props.projectId, true);
    allTeams.sort((t1, t2) => {
      return t1.name.localeCompare(t2.name, [], { sensitivity: "accent" });
    });

    const promises = [];
    for (const team of allTeams) {
      promises.push(azureDevOpsCoreService.getMembers(props.projectId, team.id));
    }
    // if user is member of more than one team, then will return duplicates
    Promise.all(promises).then(values => {
      const allTeamMembers: TeamMember[] = [];
      for (const members of values) {
        allTeamMembers.push(...members);
      }
      // Use the helper function
      const uniqueTeamMembers = deduplicateTeamMembers(allTeamMembers);

      setState({
        allMembers: uniqueTeamMembers,
        projectTeams: allTeams?.length > 0 ? allTeams : [defaultTeam],
        filteredProjectTeams: allTeams?.length > 0 ? allTeams : [defaultTeam],
        isAllTeamsLoaded: true,
      });
    });
  };

  const isCurrentUserTeamAdmin = (): boolean => {
    const state = stateRef.current;
    return state.allMembers?.some(m => m.identity.id === state.currentUserId && m.isTeamAdmin) ?? false;
  };

  /**
   * @description Load the last team and board that this user visited, if such records exist.
   * @returns An object to update the state with recently visited or default team and board data.
   */
  const loadRecentlyVisitedOrDefaultTeamAndBoardState = async (
    defaultTeam: WebApiTeam,
    userTeams: WebApiTeam[],
  ): Promise<{
    boards: IFeedbackBoardDocument[];
    currentBoard: IFeedbackBoardDocument;
    currentTeam: WebApiTeam;
  }> => {
    const mostRecentUserVisit = await userDataService.getMostRecentVisit();

    if (mostRecentUserVisit) {
      const mostRecentTeam = await azureDevOpsCoreService.getTeam(props.projectId, mostRecentUserVisit.teamId);

      if (mostRecentTeam) {
        let boardsForTeam = await BoardDataService.getBoardsForTeam(mostRecentTeam.id);
        if (boardsForTeam?.length > 0) {
          boardsForTeam = boardsForTeam
            .filter((board: IFeedbackBoardDocument) =>
              FeedbackBoardDocumentHelper.filter(
                board,
                userTeams.map(t => t.id),
                stateRef.current.currentUserId,
              ),
            )
            .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));
        }
        const currentBoard = boardsForTeam?.length > 0 ? boardsForTeam[0] : null;

        const recentVisitState = {
          boards: boardsForTeam,
          currentBoard,
          currentTeam: mostRecentTeam,
        };

        if (boardsForTeam?.length && mostRecentUserVisit.boardId) {
          const mostRecentBoard = boardsForTeam.find(board => board.id === mostRecentUserVisit.boardId);
          recentVisitState.currentBoard = mostRecentBoard || currentBoard;
        }

        return recentVisitState;
      }
    }

    let boardsForMatchedTeam = await BoardDataService.getBoardsForTeam(defaultTeam.id);
    if (boardsForMatchedTeam?.length) {
      boardsForMatchedTeam = boardsForMatchedTeam
        .filter((board: IFeedbackBoardDocument) =>
          FeedbackBoardDocumentHelper.filter(
            board,
            userTeams.map(t => t.id),
            stateRef.current.currentUserId,
          ),
        )
        .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));
    }

    return {
      boards: boardsForMatchedTeam,
      currentBoard: boardsForMatchedTeam?.length ? boardsForMatchedTeam[0] : null,
      currentTeam: defaultTeam,
    };
  };

  /**
   * @description Attempts to select a team from the specified teamId. If the teamId is valid,
   * currentTeam is set to the new team and that team's boards are loaded.
   * @param teamId The id of the team to select.
   */
  const setCurrentTeam = async (teamId: string) => {
    setState({ isTeamDataLoaded: false });
    try {
      const state = stateRef.current;
      const matchedTeam = state.projectTeams.find(team => team.id === teamId) || state.userTeams.find(team => team.id === teamId);

      if (matchedTeam) {
        let boardsForTeam = await BoardDataService.getBoardsForTeam(matchedTeam.id);
        if (boardsForTeam?.length) {
          boardsForTeam = boardsForTeam
            .filter((board: IFeedbackBoardDocument) =>
              FeedbackBoardDocumentHelper.filter(
                board,
                stateRef.current.userTeams.map(t => t.id),
                stateRef.current.currentUserId,
              ),
            )
            .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));
        }

        setState(prevState => {
          if (!prevState.currentTeam || prevState.currentTeam.id !== matchedTeam.id) {
            return {
              boards: boardsForTeam?.length ? boardsForTeam : [],
              currentBoard: boardsForTeam?.length ? boardsForTeam[0] : null,
              currentTeam: matchedTeam,
              isTeamDataLoaded: true,
            };
          }

          return null;
        });
      } else {
        setState({ isTeamDataLoaded: true });
      }
    } catch (error) {
      appInsights.trackException(error, {
        action: "setCurrentTeam",
      });
      setState({ isTeamDataLoaded: true });
    }
  };

  const handleArchiveToggle = (): void => {
    setState({ hasToggledArchive: true });
  };

  // Handle when "Board" tab is clicked
  const handlePivotClick = async (tabName: "Board" | "History"): Promise<void> => {
    setState({ activeTab: tabName });

    if (tabName === "Board") {
      // Check if "Board" tab is clicked
      if (stateRef.current.hasToggledArchive) {
        // Reload only if archive was toggled
        const reloadFn = handleRef.current?.reloadBoardsForCurrentTeam ?? reloadBoardsForCurrentTeam;
        await reloadFn();
        setState({ hasToggledArchive: false }); // Reset the flag after reload
      }
    }
  };

  /**
   * @description Loads all feedback boards for the current team. Defaults the selected board to
   * the most recently created board.
   */
  const reloadBoardsForCurrentTeam = async () => {
    setState({ isTeamDataLoaded: false });

    try {
      let boardsForTeam = await BoardDataService.getBoardsForTeam(stateRef.current.currentTeam.id);

      if (!boardsForTeam.length) {
        setState({
          isTeamDataLoaded: true,
          boards: [],
          currentBoard: null,
        });

        return;
      }

      boardsForTeam = boardsForTeam
        .filter((board: IFeedbackBoardDocument) =>
          FeedbackBoardDocumentHelper.filter(
            board,
            stateRef.current.userTeams.map(t => t.id),
            stateRef.current.currentUserId,
          ),
        )
        .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));

      setState({
        isTeamDataLoaded: true,
        boards: boardsForTeam,
        currentBoard: boardsForTeam[0],
      });
    } catch (error) {
      appInsights.trackException(error, {
        action: "reloadBoardsForCurrentTeam",
      });
      setState({ isTeamDataLoaded: true });
    }
  };

  /**
   * @description Attempts to select a board from the specified boardId. If the boardId is valid,
   * currentBoard is set to the new board. If not, nothing changes.
   * @param boardId The id of the board to select.
   */
  const setCurrentBoard = (selectedBoard: IFeedbackBoardDocument) => {
    const matchedBoard = stateRef.current.boards.find(board => board.id === selectedBoard.id);

    if (matchedBoard.teamEffectivenessMeasurementVoteCollection === undefined) {
      matchedBoard.teamEffectivenessMeasurementVoteCollection = [];
    }

    if (matchedBoard) {
      setState(prevState => {
        // Ensure that we are actually changing boards to prevent needless rerenders.
        if (!prevState.currentBoard || prevState.currentBoard.id !== matchedBoard.id) {
          return {
            currentBoard: matchedBoard,
          };
        }

        return null;
      });
    }
  };

  const changeSelectedTeam = async (team: WebApiTeam) => {
    if (team) {
      if (stateRef.current.currentTeam?.id === team.id) {
        return;
      }

      await setCurrentTeam(team.id);
      appInsights.trackEvent({ name: TelemetryEvents.TeamSelectionChanged, properties: { teamId: team.id } });
    }
  };

  const changeSelectedBoard = async (board: IFeedbackBoardDocument) => {
    if (board) {
      setCurrentBoard(board);
      await updateUrlWithBoardAndTeamInformation(stateRef.current.currentTeam.id, board.id);
      appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardSelectionChanged, properties: { boardId: board.id } });
    }
  };

  const clickWorkflowStateCallback = (_: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLDivElement>, newPhase: WorkflowPhase) => {
    appInsights.trackEvent({ name: TelemetryEvents.WorkflowPhaseChanged, properties: { oldWorkflowPhase: stateRef.current.currentBoard.activePhase, newWorkflowPhase: newPhase } });

    setState(prevState => {
      const updatedCurrentBoard = prevState.currentBoard;
      updatedCurrentBoard.activePhase = newPhase;

      return {
        currentBoard: updatedCurrentBoard,
      };
    });
  };

  const createBoard = async (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, isBoardAnonymous: boolean, shouldShowFeedbackAfterCollect: boolean, permissions: IFeedbackBoardDocumentPermissions) => {
    const createdBoard = await BoardDataService.createBoardForTeam(
      stateRef.current.currentTeam.id,
      title,
      maxVotesPerUser,
      columns,
      isIncludeTeamEffectivenessMeasurement,
      isBoardAnonymous,
      shouldShowFeedbackAfterCollect,
      undefined, // Start Date
      undefined, // End Date
      permissions,
    );
    await reloadBoardsForCurrentTeam();
    hideBoardCreationDialog();
    hideBoardDuplicateDialog();
    reflectBackendService.broadcastNewBoard(stateRef.current.currentTeam.id, createdBoard.id);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardCreated, properties: { boardId: createdBoard.id } });
    return createdBoard;
  };

  const showBoardCreationDialog = (): void => {
    boardCreationDialogRef?.current?.showModal();
  };

  const hideBoardCreationDialog = (): void => {
    boardCreationDialogRef?.current?.close();
  };

  const showRetroSummaryDialog = async () => {
    const measurements: { id: number; selected: number }[] = [];

    const state = stateRef.current;
    const board = await BoardDataService.getBoardForTeamById(state.currentTeam.id, state.currentBoard.id);
    const voteCollection = board.teamEffectivenessMeasurementVoteCollection || [];

    voteCollection.forEach(vote => {
      vote?.responses?.forEach(response => {
        measurements.push({ id: response.questionId, selected: response.selection });
      });
    });

    const average: { questionId: number; question: string; average: number }[] = [];

    [...new Set(measurements.map(item => item.id))].forEach(e => {
      average.push({ questionId: e, question: getQuestionName(e), average: measurements.filter(m => m.id === e).reduce((a, b) => a + b.selected, 0) / measurements.filter(m => m.id === e).length });
    });

    const chartData: { questionId: number; red: number; yellow: number; green: number }[] = [];

    [...Array(questions.length).keys()].forEach(e => {
      chartData.push({ questionId: e + 1, red: 0, yellow: 0, green: 0 });
    });

    voteCollection?.forEach(vote => {
      [...Array(questions.length).keys()].forEach(e => {
        const selection = vote.responses.find(response => response.questionId === e + 1)?.selection;
        const data = chartData.find(d => d.questionId === e + 1);
        if (selection <= 6) {
          data.red++;
        } else if (selection <= 8) {
          data.yellow++;
        } else {
          data.green++;
        }
      });
    });

    chartData.sort((a, b) => {
      if (a.red > b.red) {
        return -1;
      }
      if (a.red < b.red) {
        return 1;
      }
      const avgA = average.find(e => e.questionId === a.questionId)?.average;
      const avgB = average.find(e => e.questionId === b.questionId)?.average;
      if (avgA > avgB) {
        return 1;
      }
      if (avgA < avgB) {
        return -1;
      }
      return 0;
    });

    await updateFeedbackItemsAndContributors(stateRef.current.currentTeam, board);

    setState({
      currentBoard: board,
      effectivenessMeasurementChartData: chartData,
      effectivenessMeasurementSummary: average,
    });
    retroSummaryDialogRef?.current?.showModal();
  };

  const hideRetroSummaryDialog = (): void => {
    retroSummaryDialogRef?.current?.close();
  };

  const showTeamAssessmentHistoryDialog = async () => {
    const allBoards = await BoardDataService.getBoardsForTeam(stateRef.current.currentTeam.id);

    const boardsWithAssessments = allBoards.filter(board => board.isIncludeTeamEffectivenessMeasurement && board.teamEffectivenessMeasurementVoteCollection && board.teamEffectivenessMeasurementVoteCollection.length > 0);

    boardsWithAssessments.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());

    const historyData = boardsWithAssessments.map(board => {
      const measurements: { id: number; selected: number }[] = [];
      const voteCollection = board.teamEffectivenessMeasurementVoteCollection || [];

      voteCollection.forEach(vote => {
        vote?.responses?.forEach(response => {
          measurements.push({ id: response.questionId, selected: response.selection });
        });
      });

      const questionAverages: { questionId: number; average: number }[] = [];
      [...new Set(measurements.map(item => item.id))].forEach(questionId => {
        const responsesForQuestion = measurements.filter(m => m.id === questionId);
        const average = responsesForQuestion.reduce((sum, m) => sum + m.selected, 0) / responsesForQuestion.length;
        questionAverages.push({ questionId, average });
      });

      return {
        boardTitle: board.title,
        boardId: board.id,
        createdDate: board.createdDate,
        questionAverages,
      };
    });

    setState({
      teamAssessmentHistoryData: historyData,
    });

    teamAssessmentHistoryDialogRef?.current?.showModal();

    appInsights.trackEvent({ name: TelemetryEvents.TeamAssessmentHistoryViewed });
  };

  const hideTeamAssessmentHistoryDialog = (): void => {
    teamAssessmentHistoryDialogRef?.current?.close();
  };

  const updateBoardMetadata = async (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, shouldShowFeedbackAfterCollect: boolean, isBoardAnonymous: boolean, permissions: IFeedbackBoardDocumentPermissions) => {
    const state = stateRef.current;
    const updatedBoard = await BoardDataService.updateBoardMetadata(state.currentTeam.id, state.currentBoard.id, maxVotesPerUser, title, columns, permissions);

    updateBoardAndBroadcast(updatedBoard);
  };

  const showBoardUpdateDialog = (): void => {
    boardUpdateDialogRef?.current?.showModal();
  };

  const hideBoardUpdateDialog = (): void => {
    boardUpdateDialogRef?.current?.close();
  };

  const showBoardDuplicateDialog = (): void => {
    boardDuplicateDialogRef?.current?.showModal();
  };

  const hideBoardDuplicateDialog = (): void => {
    boardDuplicateDialogRef?.current?.close();
  };

  const showArchiveBoardConfirmationDialog = () => {
    archiveBoardDialogRef?.current?.showModal();
  };

  const showBoardUrlCopiedToast = () => {
    const board = stateRef.current.currentBoard;
    toast(`The link to retrospective ${board.title} (${board.activePhase} phase) has been copied to your clipboard.`);
  };

  const showEmailCopiedToast = () => {
    const board = stateRef.current.currentBoard;
    copyToClipboard(board.emailContent);
    toast(`The email summary for "${board.title}" has been copied to your clipboard.`);
  };

  const archiveCurrentBoard = async () => {
    const state = stateRef.current;
    await BoardDataService.archiveFeedbackBoard(state.currentTeam.id, state.currentBoard.id);
    reflectBackendService.broadcastDeletedBoard(state.currentTeam.id, state.currentBoard.id);
    archiveBoardDialogRef.current?.close();
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardArchived, properties: { boardId: state.currentBoard.id } });
    await reloadBoardsForCurrentTeam();
  };

  const copyBoardUrl = async () => {
    const state = stateRef.current;
    const boardDeepLinkUrl = await getBoardUrl(state.currentTeam.id, state.currentBoard.id, state.currentBoard.activePhase);
    copyToClipboard(boardDeepLinkUrl);
    showBoardUrlCopiedToast();
  };

  const generateCSVContent = async () => {
    await shareBoardHelper.generateCSVContent(stateRef.current.currentBoard);
  };

  const generateEmailSummaryContent = async () => {
    const state = stateRef.current;
    const boardUrl = await getBoardUrl(state.currentTeam.id, state.currentBoard.id, state.currentBoard.activePhase);
    const emailContent = await shareBoardHelper.generateEmailText(state.currentBoard, boardUrl, false);
    setState(prevState => ({
      currentBoard: { ...prevState.currentBoard, emailContent: emailContent },
    }));

    previewEmailDialogRef?.current?.showModal();
  };

  const downloadEmailSummaryPdf = (): void => {
    const board = stateRef.current.currentBoard;
    if (!board) {
      return;
    }

    const pdfBlob = createPdfFromText(board.emailContent || "", board.title || "Retrospective Email Summary");
    const fileName = generatePdfFileName(board.title || "Retrospective", "Email_Summary");
    downloadPdfBlob(pdfBlob, fileName);
  };

  const renderBoardUpdateMetadataFormDialog = (dialogRef: React.RefObject<HTMLDialogElement>, isNewBoardCreation: boolean, isDuplicatingBoard: boolean, onDismiss: () => void, dialogTitle: string, placeholderText: string, onSubmit: (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, shouldShowFeedbackAfterCollect: boolean, isBoardAnonymous: boolean, permissions: IFeedbackBoardDocumentPermissions) => void, onCancel: () => void) => {
    const permissionOptions: FeedbackBoardPermissionOption[] = [];

    const state = stateRef.current;

    for (const team of state.projectTeams) {
      permissionOptions.push({
        id: team.id,
        name: team.name,
        uniqueName: team.projectName,
        type: "team",
      });
    }

    for (const member of state.allMembers) {
      permissionOptions.push({
        id: member.identity.id,
        name: member.identity.displayName,
        uniqueName: member.identity.uniqueName,
        thumbnailUrl: member.identity.imageUrl,
        type: "member",
        isTeamAdmin: member.isTeamAdmin,
      });
    }

    return (
      <dialog className="board-metadata-dialog" ref={dialogRef} role="dialog" aria-label={dialogTitle}>
        <div className="header">
          <h2 className="ms-Dialog-title">{dialogTitle}</h2>
          <button type="button" onClick={onDismiss} aria-label="Close">
            {getIconElement("close")}
          </button>
        </div>
        <FeedbackBoardMetadataForm isNewBoardCreation={isNewBoardCreation} isDuplicatingBoard={isDuplicatingBoard} currentBoard={state.currentBoard} teamId={state.currentTeam.id} maxVotesPerUser={state.maxVotesPerUser} placeholderText={placeholderText} availablePermissionOptions={permissionOptions} currentUserId={state.currentUserId} onFormSubmit={onSubmit} onFormCancel={onCancel} />
      </dialog>
    );
  };

  const updateCurrentVoteCount = async () => {
    const state = stateRef.current;
    const boardItem = await itemDataService.getBoardItem(state.currentTeam.id, state.currentBoard.id);
    if (!boardItem) {
      return;
    }

    setState(getVoteMetricsState(boardItem));
  };

  const updateBoardAndBroadcast = (updatedBoard: IFeedbackBoardDocument) => {
    if (!updatedBoard) {
      void handleBoardDeleted(stateRef.current.currentTeam.id, stateRef.current.currentBoard.id);
    }

    replaceBoard(updatedBoard);

    hideBoardUpdateDialog();
    reflectBackendService.broadcastUpdatedBoard(stateRef.current.currentTeam.id, updatedBoard.id);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardMetadataUpdated, properties: { boardId: updatedBoard.id } });
  };

  const persistColumnNotes = async (columnId: string, notes: string): Promise<void> => {
    const state = stateRef.current;
    if (!state.currentTeam || !state.currentBoard) {
      return;
    }

    const updatedColumns = state.currentBoard.columns.map(column => (column.id === columnId ? { ...column, notes } : column));

    try {
      const updatedBoard = await BoardDataService.updateBoardMetadata(state.currentTeam.id, state.currentBoard.id, state.currentBoard.maxVotesPerUser, state.currentBoard.title, updatedColumns, state.currentBoard.permissions);

      if (!updatedBoard) {
        throw new Error("Failed to update board with new column notes.");
      }

      replaceBoard(updatedBoard);
      reflectBackendService.broadcastUpdatedBoard(state.currentTeam.id, updatedBoard.id);
    } catch (error) {
      appInsights.trackException(error, {
        action: "updateColumnNotes",
        boardId: state.currentBoard?.id,
        columnId,
      });

      throw error;
    }
  };

  const showCarouselDialog = () => {
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemCarouselLaunched });
    carouselDialogRef?.current?.showModal();
  };

  const hideCarouselDialog = () => {
    carouselDialogRef?.current?.close();
  };

  const hideLiveSyncInTfsIssueMessageBar = () => {
    setState({ isLiveSyncInTfsIssueMessageBarVisible: false });
  };

  const hideDropIssueInEdgeMessageBar = () => {
    setState({ isDropIssueInEdgeMessageBarVisible: false });
  };

  React.useImperativeHandle(ref, () => {
    const handle: FeedbackBoardContainerHandle = {
      get state() {
        return stateRef.current;
      },
      setState,
      componentDidMount,
      componentDidUpdate,
      componentWillUnmount,
      get boardTimerIntervalId() {
        return boardTimerIntervalIdRef.current;
      },
      set boardTimerIntervalId(value: number | undefined) {
        boardTimerIntervalIdRef.current = value;
      },
      handleBoardCreated,
      handleBoardUpdated,
      handleBoardDeleted,
      handlePivotClick,
      persistColumnNotes,
      setSupportedWorkItemTypesForProject,
      loadRecentlyVisitedOrDefaultTeamAndBoardState,
      reloadBoardsForCurrentTeam,
      startBoardTimer,
      pauseBoardTimer,
      resetBoardTimer,
      clearBoardTimerInterval,
      renderWorkflowTimerControls,
      handleCountdownDurationChange,
      handleBoardTimerToggle,
      handleBoardTimerReset,
      parseUrlForBoardAndTeamInformation,
      updateUrlWithBoardAndTeamInformation,
      createBoard,
      updateBoardMetadata,
      archiveCurrentBoard,
      generateEmailSummaryContent,
      showBoardCreationDialog,
      hideBoardCreationDialog,
      showBoardDuplicateDialog,
      hideBoardDuplicateDialog,
      showBoardUpdateDialog,
      hideBoardUpdateDialog,
      showArchiveBoardConfirmationDialog,
      showRetroSummaryDialog,
      hideRetroSummaryDialog,
      showCarouselDialog,
      hideCarouselDialog,
      showTeamAssessmentHistoryDialog,
      hideTeamAssessmentHistoryDialog,
      hideLiveSyncInTfsIssueMessageBar,
      hideDropIssueInEdgeMessageBar,
      changeSelectedTeam,
      changeSelectedBoard,
      getVoteMetricsState,
      updateFeedbackItemsAndContributors,
      numberFormatter,
      percentageFormatter,
      archiveBoardDialogRef,
      previewEmailDialogRef,
      boardCreationDialogRef,
      boardDuplicateDialogRef,
      boardUpdateDialogRef,
      discussAndActDialogRef,
      teamEffectivenessDialogRef,
      retroSummaryDialogRef,
      teamAssessmentHistoryDialogRef,
      carouselDialogRef,
    };

    handleRef.current = handle;
    return handle;
  });

  const state = stateRef.current;

  if (!state.isAppInitialized || !state.isTeamDataLoaded) {
    return (
      <div className="spinner" aria-live="assertive">
        <div></div>
        <span>Loading...</span>
      </div>
    );
  }

  if (!state.currentTeam) {
    return <div>We are unable to retrieve the list of teams for this project. Try reloading the page.</div>;
  }

  const teamSelectorList: ISelectorList<WebApiTeam> = {
    selectorListItems: [
      {
        finishedLoading: state.isAppInitialized,
        header: { id: "My Teams", title: "My Teams" },
        items: state.userTeams,
      },
    ],
  };

  const boardSelectorList: ISelectorList<IFeedbackBoardDocument> = {
    selectorListItems: [
      {
        finishedLoading: true,
        header: { id: "All Retrospectives", isHidden: true, title: "All Retrospectives" },
        items: state.boards,
      },
    ],
  };

  const saveTeamEffectivenessMeasurement = () => {
    const currentBoard = state.currentBoard;
    if (!currentBoard) {
      return;
    }

    const teamEffectivenessMeasurementVoteCollection = currentBoard.teamEffectivenessMeasurementVoteCollection || [];
    const currentUserId = obfuscateUserId(state.currentUserId);
    const currentUserVote = teamEffectivenessMeasurementVoteCollection.find(vote => vote.userId === currentUserId);
    const responseCount = currentUserVote?.responses?.length || 0;

    if (responseCount < questions.length) {
      toast("Please answer all questions before saving");
      return;
    }

    itemDataService.updateTeamEffectivenessMeasurement(currentBoard.id, state.currentTeam.id, currentUserId, teamEffectivenessMeasurementVoteCollection);

    teamEffectivenessDialogRef.current?.close();
  };

  const showTeamEffectivenessDialog = () => {
    teamEffectivenessDialogRef?.current?.showModal();
  };

  const hideTeamEffectivenessDialog = () => {
    teamEffectivenessDialogRef?.current?.close();
  };

  const showDiscussAndActDialog = (questionId: number) => {
    setState({ questionIdForDiscussAndActBoardUpdate: questionId });
    discussAndActDialogRef?.current?.showModal();
  };

  const hideDiscussAndActDialog = () => {
    setState({ questionIdForDiscussAndActBoardUpdate: -1 });
    discussAndActDialogRef?.current?.close();
  };

  const effectivenessMeasurementSelectionChanged = (questionId: number, selected: number) => {
    const currentBoard = stateRef.current.currentBoard;
    if (!currentBoard) {
      return;
    }

    if (currentBoard.teamEffectivenessMeasurementVoteCollection === undefined) {
      currentBoard.teamEffectivenessMeasurementVoteCollection = [];
    }

    const currentUserId = obfuscateUserId(stateRef.current.currentUserId);
    if (currentBoard.teamEffectivenessMeasurementVoteCollection.find(e => e.userId === currentUserId) === undefined) {
      currentBoard.teamEffectivenessMeasurementVoteCollection.push({
        userId: currentUserId,
        responses: [],
      });
    }

    const currentVote = currentBoard.teamEffectivenessMeasurementVoteCollection.find(e => e.userId === currentUserId)?.responses.find(e => e.questionId === questionId);

    if (!currentVote) {
      currentBoard.teamEffectivenessMeasurementVoteCollection
        .find(e => e.userId === currentUserId)
        ?.responses.push({
          questionId: questionId,
          selection: selected,
        });
    } else {
      currentVote.selection = selected;
    }

    setState({ currentBoard });
  };

  const teamEffectivenessResponseCount = state.currentBoard?.teamEffectivenessMeasurementVoteCollection?.length;

  return (
    <div className="flex flex-col h-screen" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      <div className="flex items-center shrink-0 mt-2 ml-4">
        <dialog ref={discussAndActDialogRef} className="delete-feedback-item-dialog" role="dialog" aria-label="Discuss and Act">
          <div className="header">
            <h2 className="title">Discuss and Act</h2>
            <button type="button" onClick={hideDiscussAndActDialog} aria-label="Close">
              {getIconElement("close")}
            </button>
          </div>
          <div className="subText">Are you sure you want to change the template of this board?</div>
          <div className="inner">
            <button
              type="button"
              className="button"
              onClick={async () => {
                if (!state.currentBoard || state.questionIdForDiscussAndActBoardUpdate === -1) {
                  hideDiscussAndActDialog();
                  return;
                }

                const question = questions.filter(question => question.id === state.questionIdForDiscussAndActBoardUpdate)[0];
                const templateName = question.discussActTemplate;
                const columns = getColumnsByTemplateId(templateName);

                const board = state.currentBoard;

                await updateBoardMetadata(board.title, board.maxVotesPerUser, columns, board.isIncludeTeamEffectivenessMeasurement, board.shouldShowFeedbackAfterCollect, board.isAnonymous, board.permissions);

                hideDiscussAndActDialog();
                hideRetroSummaryDialog();
              }}
            >
              Proceed
            </button>
            <button type="button" className="button default" onClick={() => discussAndActDialogRef.current!.close()}>
              Cancel
            </button>
          </div>
        </dialog>

        <h1 className="text-2xl font-medium tracking-tight" aria-label="Retrospectives">
          Retrospectives
        </h1>
        <SelectorCombo<WebApiTeam> className="flex items-center mx-6" currentValue={state.currentTeam} iconName="people" nameGetter={team => team.name} selectorList={teamSelectorList} selectorListItemOnClick={changeSelectedTeam} title={"Team"} />
        <div className="flex-grow-spacer"></div>
        <div className="header-menu-with-timer">
          {renderWorkflowTimerControls()}
          <ExtensionSettingsMenu />
        </div>
      </div>
      <div className="flex items-center justify-start shrink-0">
        <div className="w-full">
          {state.currentBoard && (
            <div className="flex items-center justify-start mt-2 ml-4 h-10">
              <div className={`pivot-tab board ${state.activeTab === "Board" ? "active" : ""}`} onClick={() => handlePivotClick("Board")}>
                Board
              </div>
              <div className={`pivot-tab history ${state.activeTab === "History" ? "active" : ""}`} onClick={() => handlePivotClick("History")}>
                History
              </div>
              {state.activeTab === "Board" && (
                <>
                  <div className="mx-4 vertical-tab-separator" />
                  <div className="flex items-center justify-start">
                    <div className="board-selector">
                      <SelectorCombo<IFeedbackBoardDocument> className="board-selector" currentValue={state.currentBoard} iconName="table-chart" nameGetter={feedbackBoard => feedbackBoard.title} selectorList={boardSelectorList} selectorListItemOnClick={changeSelectedBoard} title={"Retrospective Board"} />
                    </div>
                    <div className="board-actions-menu" ref={boardActionsMenuRootRef}>
                      <details className="flex items-center relative">
                        <summary aria-label="Board Actions Menu" title="Board Actions" className="contextual-menu-button">
                          {getIconElement("more-horizontal")}
                        </summary>
                        <div className="callout-menu left" role="menu" aria-label="Board Actions">
                          <button key="createBoard" type="button" title="Create new retrospective" onClick={event => handleBoardActionMenuItemClick(showBoardCreationDialog, event)}>
                            {getIconElement("add")}
                            Create new retrospective
                          </button>
                          <button key="duplicateBoard" type="button" title="Create copy of retrospective" onClick={event => handleBoardActionMenuItemClick(showBoardDuplicateDialog, event)}>
                            {getIconElement("content-copy")}
                            Create copy of retrospective
                          </button>
                          <button key="editBoard" type="button" title="Edit retrospective" onClick={event => handleBoardActionMenuItemClick(showBoardUpdateDialog, event)}>
                            {getIconElement("edit")}
                            Edit retrospective
                          </button>
                          <div key="seperator" className="divider" role="separator" />
                          <button key="copyLink" type="button" title={`Copy link to ${state.currentBoard.activePhase} phase`} onClick={event => handleBoardActionMenuItemClick(copyBoardUrl, event)}>
                            {getIconElement("link")}
                            {`Copy link to ${state.currentBoard.activePhase} phase`}
                          </button>
                          <div key="seperator" className="divider" role="separator" />
                          <button key="exportCSV" type="button" title="Export CSV content" onClick={event => handleBoardActionMenuItemClick(generateCSVContent, event)}>
                            {getIconElement("sim-card-download")}
                            Export CSV content
                          </button>
                          <button key="emailPreview" type="button" title="Create email summary" onClick={event => handleBoardActionMenuItemClick(generateEmailSummaryContent, event)}>
                            {getIconElement("forward-to-inbox")}
                            Create email summary
                          </button>
                          <div key="seperator" className="divider" role="separator" />
                          <button key="retroSummary" type="button" title="Show retrospective summary" onClick={event => handleBoardActionMenuItemClick(showRetroSummaryDialog, event)}>
                            {getIconElement("source")}
                            Show retrospective summary
                          </button>
                          <div key="seperator" className="divider" role="separator" />
                          <button key="archiveBoard" type="button" title="Archive retrospective" onClick={event => handleBoardActionMenuItemClick(showArchiveBoardConfirmationDialog, event)}>
                            {getIconElement("inventory")}
                            Archive retrospective
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>
                  <div className="flex items-center justify-start">
                    <div className="flex flex-row items-center workflow-stage-header 3">
                      {state.currentBoard.isIncludeTeamEffectivenessMeasurement && (
                        <>
                          <dialog ref={teamEffectivenessDialogRef} className="team-effectiveness-dialog" role="dialog" aria-label="Team Assessment">
                            <div className="header">
                              <h2 className="title">Team Assessment</h2>
                              <button type="button" onClick={hideTeamEffectivenessDialog} aria-label="Close">
                                {getIconElement("close")}
                              </button>
                            </div>
                            <div className="subText">
                              <div className="ms-Dialog-inner">
                                <div className="team-effectiveness-section-information">
                                  {getIconElement("info")}
                                  All answers will be saved anonymously
                                </div>
                                <table className="team-effectiveness-measurement-table">
                                  <thead>
                                    <tr>
                                      <th scope="col" className="text-left">
                                        Question
                                      </th>
                                      <th scope="col" className="text-left min-w-13">
                                        Details
                                      </th>
                                      <th scope="colgroup" colSpan={6} className="team-effectiveness-favorability-label">
                                        Unfavorable
                                      </th>
                                      <th scope="colgroup" colSpan={2} className="team-effectiveness-favorability-label">
                                        Neutral
                                      </th>
                                      <th scope="colgroup" colSpan={2} className="team-effectiveness-favorability-label">
                                        Favorable
                                      </th>
                                    </tr>
                                    <tr>
                                      <th scope="col" className="text-left"></th>
                                      <th scope="col" className="text-left"></th>
                                      <th scope="col" className="voting-measurement-index voting-measurement-index-unfavorable voting-index-1">
                                        1
                                      </th>
                                      <th scope="col" className="voting-measurement-index voting-measurement-index-unfavorable voting-index-2">
                                        2
                                      </th>
                                      <th scope="col" className="voting-measurement-index voting-measurement-index-unfavorable voting-index-3">
                                        3
                                      </th>
                                      <th scope="col" className="voting-measurement-index voting-measurement-index-unfavorable voting-index-4">
                                        4
                                      </th>
                                      <th scope="col" className="voting-measurement-index voting-measurement-index-unfavorable voting-index-5">
                                        5
                                      </th>
                                      <th scope="col" className="voting-measurement-index voting-measurement-index-unfavorable voting-index-6">
                                        6
                                      </th>
                                      <th scope="col" className="voting-measurement-index voting-measurement-index-neutral voting-index-7">
                                        7
                                      </th>
                                      <th scope="col" className="voting-measurement-index voting-measurement-index-neutral voting-index-8">
                                        8
                                      </th>
                                      <th scope="col" className="voting-measurement-index voting-measurement-index-favorable voting-index-9">
                                        9
                                      </th>
                                      <th scope="col" className="voting-measurement-index voting-measurement-index-favorable voting-index-10">
                                        10
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {questions.map(question => {
                                      return <EffectivenessMeasurementRow key={question.id} questionId={question.id} votes={state.currentBoard.teamEffectivenessMeasurementVoteCollection} onSelectedChange={selected => effectivenessMeasurementSelectionChanged(question.id, selected)} iconClassName={getQuestionIconClassName(question.id)} title={getQuestionShortName(question.id)} subtitle={getQuestionName(question.id)} tooltip={getQuestionTooltip(question.id)} />;
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            <div className="inner">
                              <button type="button" className="button" onClick={saveTeamEffectivenessMeasurement}>
                                Save
                              </button>
                              <button type="button" className="button default" onClick={() => teamEffectivenessDialogRef.current!.close()}>
                                Cancel
                              </button>
                            </div>
                          </dialog>
                          <button className="team-assessment-button" onClick={showTeamEffectivenessDialog} title="Team Assessment" aria-label="Team Assessment" type="button">
                            {getIconElement("assessment")}
                            <span className="hidden lg:inline">Team Assessment</span>
                          </button>
                        </>
                      )}
                      <div className="flex flex-row gap-3" role="tablist" aria-label="Workflow stage">
                        <WorkflowStage display="Collect" ariaPosInSet={1} value={WorkflowPhase.Collect} isActive={state.currentBoard.activePhase === WorkflowPhase.Collect} clickEventCallback={clickWorkflowStateCallback} />
                        <WorkflowStage display="Group" ariaPosInSet={2} value={WorkflowPhase.Group} isActive={state.currentBoard.activePhase === WorkflowPhase.Group} clickEventCallback={clickWorkflowStateCallback} />
                        <WorkflowStage display="Vote" ariaPosInSet={3} value={WorkflowPhase.Vote} isActive={state.currentBoard.activePhase === WorkflowPhase.Vote} clickEventCallback={clickWorkflowStateCallback} />
                        <WorkflowStage display="Act" ariaPosInSet={4} value={WorkflowPhase.Act} isActive={state.currentBoard.activePhase === WorkflowPhase.Act} clickEventCallback={clickWorkflowStateCallback} />
                      </div>
                      {state.currentBoard.activePhase === WorkflowPhase.Vote && (
                        <div className="feedback-votes-count" role="status" aria-live="polite">
                          <span className="entry" title={`You have used ${state.currentVoteCount} of ${state.currentBoard.maxVotesPerUser?.toString() || "0"} votes`} aria-label={`You have used ${state.currentVoteCount} of ${state.currentBoard.maxVotesPerUser?.toString() || "0"} votes`}>
                            {getIconElement("person")}
                            <span className="hidden lg:inline">My Votes:</span> {state.currentVoteCount}/{state.currentBoard.maxVotesPerUser?.toString() || "0"}
                          </span>
                          {state.castedVoteCount > 0 && state.teamVoteCapacity > 0 && (
                            <>
                              <span className="separator" aria-hidden="true">
                                |
                              </span>
                              <span className="entry" title={`The team has used ${state.castedVoteCount} of ${state.teamVoteCapacity} votes`} aria-label={`The team has used ${state.castedVoteCount} of ${state.teamVoteCapacity} votes`}>
                                {getIconElement("people")}
                                <span className="hidden lg:inline">Team Votes:</span> {state.castedVoteCount}/{state.teamVoteCapacity}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      {state.currentBoard.activePhase === WorkflowPhase.Act && (
                        <>
                          <button className="focus-mode-button" onClick={showCarouselDialog} title="Focus Mode allows your team to focus on one feedback item at a time. Try it!" aria-label="Focus Mode" type="button">
                            {getIconElement("adjust")}
                            <span>Focus Mode</span>
                          </button>
                          <dialog ref={carouselDialogRef} className="carousel-dialog" role="dialog" aria-label="Focus Mode">
                            <div className="header">
                              <h2 className="title">Focus Mode</h2>
                              <button onClick={hideCarouselDialog} aria-label="Close">
                                {getIconElement("close")}
                              </button>
                            </div>
                            <div className="subText">Now is the time to focus! Discuss one feedback item at a time and create actionable work items.</div>
                            <div className="subText">{state.focusModeModel && <FeedbackCarousel focusModeModel={state.focusModeModel} isFocusModalHidden={false} />}</div>
                          </dialog>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
              {state.activeTab === "History" && (
                <>
                  <div className="mx-4 vertical-tab-separator" />
                  <button className="team-assessment-history-button" onClick={showTeamAssessmentHistoryDialog} title="Team Assessment History" aria-label="Team Assessment History" type="button">
                    {getIconElement("insights")}
                    <span className="hidden lg:inline">Team Assessment History</span>
                  </button>
                </>
              )}
            </div>
          )}
          {state.currentBoard && state.activeTab === "History" && (
            <div className="flex-1 min-h-0 overflow-auto border-t-4 border-(--nav-header-active-item-background)">
              <BoardSummaryTable teamId={state.currentTeam.id} currentUserId={state.currentUserId} currentUserIsTeamAdmin={isCurrentUserTeamAdmin()} supportedWorkItemTypes={state.allWorkItemTypes} onArchiveToggle={handleArchiveToggle} />
            </div>
          )}
          {!state.currentBoard && (
            <div className="no-boards-container">
              <div className="no-boards-text">Get started with your first Retrospective</div>
              <div className="no-boards-sub-text">Create a new board to start collecting feedback and create new work items.</div>
              <button title="Create Board" onClick={showBoardCreationDialog} className="create-new-board-button">
                Create Board
              </button>
            </div>
          )}
          {state.activeTab === "Board" && state.currentBoard && (
            <div className="feedback-board-container">
              {state.currentTeam && state.currentBoard && (
                <>
                  {!props.isHostedAzureDevOps && state.isLiveSyncInTfsIssueMessageBarVisible && !state.isBackendServiceConnected && (
                    <>
                      <div className="retro-message-bar">
                        <span>
                          <em>Retrospectives</em> does not support live updates for on-premise installations. To see updates from other users, please refresh the page.
                        </span>
                      </div>
                      <div className="actions">
                        <button type="button" className="dismiss" onClick={hideLiveSyncInTfsIssueMessageBar} aria-label="Dismiss notification">
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    </>
                  )}
                  {!props.isHostedAzureDevOps && state.isDropIssueInEdgeMessageBarVisible && !state.isBackendServiceConnected && (
                    <div className="retro-message-bar" role="alert" aria-live="assertive">
                      <span>If your browser does not support grouping a card by dragging and dropping, we recommend using the ellipsis menu on the top-right corner of the feedback.</span>
                      <div className="actions">
                        <button type="button" className="dismiss" onClick={hideDropIssueInEdgeMessageBar} aria-label="Dismiss notification">
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {props.isHostedAzureDevOps && !state.isBackendServiceConnected && (
                    <div className="retro-message-bar" role="alert" aria-live="assertive">
                      <span>We are unable to connect to the live syncing service. You can continue to create and edit items as usual, but changes will not be updated in real-time to or from other users.</span>
                      <div className="actions">
                        <button
                          type="button"
                          onClick={() => {
                            setState({ isBackendServiceConnected: true });
                          }}
                          aria-label="Hide"
                          title="Hide"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <FeedbackBoard
                    board={state.currentBoard}
                    team={state.currentTeam}
                    displayBoard={true}
                    workflowPhase={state.currentBoard.activePhase}
                    nonHiddenWorkItemTypes={state.nonHiddenWorkItemTypes}
                    allWorkItemTypes={state.allWorkItemTypes}
                    onFocusModeModelChange={focusModeModel => {
                      setState({ focusModeModel });
                    }}
                    isAnonymous={state.currentBoard.isAnonymous ? state.currentBoard.isAnonymous : false}
                    hideFeedbackItems={state.currentBoard.shouldShowFeedbackAfterCollect ? state.currentBoard.activePhase == WorkflowPhase.Collect && state.currentBoard.shouldShowFeedbackAfterCollect : false}
                    userId={state.currentUserId}
                    onVoteCasted={updateCurrentVoteCount}
                    onColumnNotesChange={persistColumnNotes}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {state.currentBoard && (
        <dialog className="archive-board-dialog" aria-label="Archive Retrospective" role="dialog" ref={archiveBoardDialogRef}>
          <div className="header">
            <h2 className="title">Archive Retrospective</h2>
            <button onClick={() => archiveBoardDialogRef.current?.close()} aria-label="Close">
              {getIconElement("close")}
            </button>
          </div>
          <div className="subText">
            The retrospective board <strong>{state.currentBoard.title}</strong> with its feedback will be archived.
          </div>
          <div className="subText">
            <em>Note:</em> Archived retrospectives remain available on the <strong>History</strong> tab, where they can be <em>restored</em> or <em>deleted</em>.
          </div>
          <div className="inner">
            <button className="button" onClick={() => archiveCurrentBoard()}>
              Archive
            </button>
            <button className="default button" onClick={() => archiveBoardDialogRef.current?.close()}>
              Cancel
            </button>
          </div>
        </dialog>
      )}
      {renderBoardUpdateMetadataFormDialog(boardCreationDialogRef, true, false, hideBoardCreationDialog, "Create new retrospective", `Example: Retrospective ${new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date())}`, createBoard, hideBoardCreationDialog)}
      {state.currentBoard && renderBoardUpdateMetadataFormDialog(boardDuplicateDialogRef, true, true, hideBoardDuplicateDialog, "Create copy of retrospective", "", createBoard, hideBoardDuplicateDialog)}
      {state.currentBoard && renderBoardUpdateMetadataFormDialog(boardUpdateDialogRef, false, false, hideBoardUpdateDialog, "Edit retrospective", "", updateBoardMetadata, hideBoardUpdateDialog)}
      {state.currentBoard && (
        <dialog ref={previewEmailDialogRef} className="preview-email-dialog" aria-label="Email summary" role="dialog">
          <div className="header">
            <h2 className="title">Email summary</h2>
            <button onClick={() => previewEmailDialogRef.current?.close()} aria-label="Close">
              {getIconElement("close")}
            </button>
          </div>
          <div className="subText">
            <textarea rows={20} className="preview-email-content" readOnly={true} aria-label="Email summary for retrospective" value={state.currentBoard.emailContent}></textarea>
          </div>
          <div className="inner">
            <button title="Copy to clipboard" aria-label="Copy to clipboard" onClick={showEmailCopiedToast}>
              {getIconElement("content-copy")}
              Copy to clipboard
            </button>
            <button title="Download PDF" aria-label="Download email summary as PDF" onClick={downloadEmailSummaryPdf} className="default button">
              {getIconElement("sim-card-download")}
              Download PDF
            </button>
          </div>
        </dialog>
      )}
      {state.currentBoard && (
        <dialog ref={retroSummaryDialogRef} className="retro-summary-dialog" aria-label="Retrospective Board Summary" role="dialog">
        <div className="header">
          <h2 className="title">Retrospective Board Summary</h2>
          <button type="button" onClick={hideRetroSummaryDialog} aria-label="Close">
            {getIconElement("close")}
          </button>
        </div>
        <div className="subText">
          <section className="retro-summary-section">
            <div className="retro-summary-section-header">Basic Settings</div>
            <div id="retro-summary-created-date">Created date: {new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(state.currentBoard.createdDate))}</div>
            <div id="retro-summary-created-by">
              Created by <img className="avatar" src={state.currentBoard?.createdBy.imageUrl} alt={state.currentBoard?.createdBy.displayName} /> {state.currentBoard?.createdBy.displayName}{" "}
            </div>
          </section>
          <section className="retro-summary-section">
            <div className="retro-summary-section-header">Participant Summary</div>
            <div className="retro-summary-section-item">Contributors: {state.contributors.length} participant(s)</div>

            {!state.currentBoard.isAnonymous && state.contributors.length > 0 && (
              <div className="retro-summary-contributors-section">
                {state.contributors.map(contributor => (
                  <div key={contributor.id} className="retro-summary-contributor">
                    <img className="avatar" src={contributor.imageUrl} alt={contributor.name} /> {contributor.name}
                  </div>
                ))}
              </div>
            )}
            <div className="retro-summary-item-horizontal-group">
              <div className="retro-summary-section-item horizontal-group-item">
                {Object.keys(state.currentBoard?.boardVoteCollection || {}).length} participant(s) casted {state.castedVoteCount} vote(s)
              </div>
              <div className="retro-summary-section-item horizontal-group-item">{state.feedbackItems.length} feedback item(s) created</div>
              <div className="retro-summary-section-item horizontal-group-item">{state.actionItemIds.length} action item(s) created</div>
            </div>
          </section>
          {state.currentBoard.isIncludeTeamEffectivenessMeasurement && (
            <section className="retro-summary-section">
              <div className="retro-summary-section-header">Team Assessment</div>
              <div>
                Assessment with favorability percentages and average score <br />({teamEffectivenessResponseCount} {teamEffectivenessResponseCount == 1 ? "person" : "people"} responded)
                <div className="retro-summary-effectiveness-scores">
                  <ul className="chart">
                    {state.effectivenessMeasurementChartData.map(data => {
                      const averageScore = state.effectivenessMeasurementSummary.filter(e => e.questionId == data.questionId)[0]?.average ?? 0;
                      const greenScore = (data.green * 100) / teamEffectivenessResponseCount;
                      const yellowScore = (data.yellow * 100) / teamEffectivenessResponseCount;
                      const redScore = (data.red * 100) / teamEffectivenessResponseCount;
                      return (
                        <li className="chart-question-block" key={data.questionId}>
                          <div className="chart-question">
                            <i className={getQuestionIconClassName(data.questionId)} /> &nbsp;
                            {getQuestionShortName(data.questionId)}
                          </div>
                          {data.red > 0 && (
                            <div className="red-chart-response chart-response" style={{ width: `${redScore}%` }} title={`Unfavorable percentage is ${redScore}%`} aria-label={`Unfavorable percentage is ${redScore}%`}>
                              <span>{percentageFormatter(redScore)}</span>
                            </div>
                          )}
                          {data.yellow > 0 && (
                            <div className="yellow-chart-response chart-response" style={{ width: `${yellowScore}%` }} title={`Neutral percentage is ${yellowScore}%`} aria-label={`Neutral percentage is ${yellowScore}%`}>
                              <span>{percentageFormatter(yellowScore)}</span>
                            </div>
                          )}
                          {data.green > 0 && (
                            <div className="green-chart-response chart-response" style={{ width: `${greenScore}%` }} title={`Favorable percentage is ${greenScore}%`} aria-label={`Favorable percentage is ${greenScore}%`}>
                              <span>{percentageFormatter(greenScore)}</span>
                            </div>
                          )}
                          {averageScore > 0 && (
                            <div className="team-effectiveness-average-number" aria-label={`The average score for this question is ${numberFormatter(averageScore)}`}>
                              {numberFormatter(averageScore)}
                            </div>
                          )}
                          <button className="assessment-chart-action" title={`${state.feedbackItems.length > 0 ? "There are feedback items created for this board, you cannot change the board template" : `Clicking this will modify the board template to the "${getQuestionShortName(data.questionId)} template" allowing your team to discuss and take actions using the retrospective board`}`} disabled={state.feedbackItems.length > 0} onClick={() => showDiscussAndActDialog(data.questionId)}>
                            Discuss and Act
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="chart-legend-section">
                    <div className="chart-legend-group">
                      <section>
                        <div className="chart-legend-color-unfavorable"></div>
                        <span>Unfavorable</span>
                      </section>
                      <section>
                        <div className="chart-legend-color-neutral"></div>
                        <span>Neutral</span>
                      </section>
                      <section>
                        <div className="chart-legend-color-favorable"></div>
                        <span>Favorable</span>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
        </dialog>
      )}
      <dialog ref={teamAssessmentHistoryDialogRef} className="team-assessment-history-dialog" aria-label="Team Assessment History" role="dialog">
        <div className="header">
          <h2>Team Assessment History</h2>
          <button type="button" onClick={hideTeamAssessmentHistoryDialog} aria-label="Close">
            {getIconElement("close")}
          </button>
        </div>
        {state.teamAssessmentHistoryData.slice(-13).length === 0 ? (
          <div className="team-assessment-no-data">
            <p>No team assessment history available.</p>
            <p>Create retrospectives with team assessments to see historical trends.</p>
          </div>
        ) : (
          <>
            <p className="team-assessment-info-text">
              Showing average scores over time across {state.teamAssessmentHistoryData.slice(-13).length} retrospective{state.teamAssessmentHistoryData.slice(-13).length !== 1 ? "s" : ""}.
            </p>
            <TeamAssessmentHistoryChart historyData={state.teamAssessmentHistoryData.slice(-13)} numberFormatter={numberFormatter} />
          </>
        )}
      </dialog>
      <ToastContainer className="retrospective-notification-toast-container" toastClassName="retrospective-notification-toast" progressClassName="retrospective-notification-toast-progress-bar" />
    </div>
  );
});

export default FeedbackBoardContainer;
