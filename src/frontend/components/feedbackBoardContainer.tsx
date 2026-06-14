import React from "react";

import { WorkflowPhase } from "../interfaces/workItem";
import WorkflowStage from "./workflowStage";
import BoardDataService from "../dal/boardDataService";
import { FeedbackBoardDocumentHelper, IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions, IFeedbackColumn, IFeedbackItemDocument, ITeamAssessmentQuestion } from "../interfaces/feedback";
import { reflectBackendService } from "../dal/reflectBackendService";
import BoardSummaryTable from "./boardSummaryTable";
import FeedbackBoardMetadataForm from "./feedbackBoardMetadataForm";
import FeedbackBoard from "../components/feedbackBoard";
import FeedbackCarousel, { type FocusModeModel } from "./feedbackCarousel";
import { type FeedbackColumnSortMode } from "./feedbackColumnSorting";

import { azureDevOpsCoreService } from "../dal/azureDevOpsCoreService";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { getBoardUrl } from "../utilities/boardUrlHelper";
import { userDataService } from "../dal/userDataService";
import ExtensionSettingsMenu from "./extensionSettingsMenu";
import { ToastContainer, toast } from "./toastNotifications";
import { WorkItemType, WorkItemTypeReference } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { shareBoardHelper } from "../utilities/shareBoardHelper";
import { itemDataService } from "../dal/itemDataService";
import { TeamMember } from "azure-devops-extension-api/WebApi";
import EffectivenessMeasurementRow from "./effectivenessMeasurementRow";

import { obfuscateUserId, getUserIdentity } from "../utilities/userIdentityHelper";
import { questions } from "../utilities/effectivenessMeasurementQuestionHelper";

import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { appInsights, reactPlugin, TelemetryEvents } from "../utilities/telemetryClient";
import { copyToClipboard } from "../utilities/clipboardHelper";
import { closeTopMostDialog } from "../utilities/dialogHelper";
import { getColumnsByTemplateId } from "../utilities/boardColumnsHelper";
import { formatDate, formatNumber, t } from "../utilities/localization";
import { buildSprintRetrospectiveTitle, getCurrentIteration } from "../utilities/sprintRetrospectiveHelper";
import { FeedbackBoardPermissionOption } from "./feedbackBoardMetadataFormPermissions";
import { CommonServiceIds, IHostNavigationService } from "azure-devops-extension-api/Common/CommonServices";
import { getService } from "azure-devops-extension-sdk";
import { getIconElement } from "./icons";
import { playStartChime, playStopChime } from "../utilities/audioHelper";
import { createPdfFromText, downloadPdfBlob, generatePdfFileName } from "../utilities/pdfHelper";
import { formatBoardTimer } from "../utilities/useBoardTimer";
import { TeamAssessmentHistoryChart } from "./teamAssessmentHistoryChart";
import { workService } from "../dal/azureDevOpsWorkService";

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
  isBackendServiceReconnecting: boolean;
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
  actColumnSortMode: FeedbackColumnSortMode;
  isIncludeTeamEffectivenessMeasurementDialogHidden: boolean;
  isLiveSyncInTfsIssueMessageBarVisible: boolean;
  isDropIssueInEdgeMessageBarVisible: boolean;
  allowCrossColumnGroups: boolean;
  feedbackItems: IFeedbackItemDocument[];
  contributors: { id: string; name: string; imageUrl: string }[];
  effectivenessMeasurementSummary: { questionId: number; question: string; average: number; teamAssessmentQuestion?: ITeamAssessmentQuestion }[];
  effectivenessMeasurementChartData: { questionId: number; red: number; yellow: number; green: number; teamAssessmentQuestion?: ITeamAssessmentQuestion }[];
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
  isBackendServiceReconnecting: false,
  focusModeModel: null,
  actColumnSortMode: "time",
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

type DialogVisibilityState = {
  isArchiveBoardDialogVisible: boolean;
  isBoardCreationDialogVisible: boolean;
  isBoardDuplicateDialogVisible: boolean;
  isBoardUpdateDialogVisible: boolean;
  isCarouselDialogVisible: boolean;
  isDiscussAndActDialogVisible: boolean;
  isPreviewEmailDialogVisible: boolean;
  isRetroSummaryDialogVisible: boolean;
  isTeamAssessmentHistoryDialogVisible: boolean;
  isTeamEffectivenessDialogVisible: boolean;
};

const initialDialogVisibilityState: DialogVisibilityState = {
  isArchiveBoardDialogVisible: false,
  isBoardCreationDialogVisible: false,
  isBoardDuplicateDialogVisible: false,
  isBoardUpdateDialogVisible: false,
  isCarouselDialogVisible: false,
  isDiscussAndActDialogVisible: false,
  isPreviewEmailDialogVisible: false,
  isRetroSummaryDialogVisible: false,
  isTeamAssessmentHistoryDialogVisible: false,
  isTeamEffectivenessDialogVisible: false,
};

function useShowModalWhenVisible(isVisible: boolean, dialogRef: React.RefObject<HTMLDialogElement | null>): void {
  React.useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!isVisible || !dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }, [dialogRef, isVisible]);
}

export function FeedbackBoardContainer({ isHostedAzureDevOps, projectId }: { isHostedAzureDevOps: boolean; projectId: string }) {
  const trackActivity = useTrackMetric(reactPlugin, "FeedbackBoardContainer");

  const [state, setContainerState] = React.useState<FeedbackBoardContainerState>(() => ({ ...initialState }));
  const [visibleDialogs, setVisibleDialogs] = React.useState<DialogVisibilityState>(initialDialogVisibilityState);

  const boardTimerIntervalIdRef = React.useRef<number | undefined>(undefined);
  const connectionWatchdogIntervalIdRef = React.useRef<number | undefined>(undefined);

  const prevCurrentTeamRef = React.useRef<WebApiTeam | undefined>(undefined);
  const prevCurrentBoardRef = React.useRef<IFeedbackBoardDocument | undefined>(undefined);
  const prevActiveTabRef = React.useRef<FeedbackBoardContainerState["activeTab"]>(initialState.activeTab);

  const boardActionsMenuRootRef = React.useRef<HTMLDivElement | null>(null);

  const carouselDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const previewEmailDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const archiveBoardDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const boardCreationDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const boardDuplicateDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const boardUpdateDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const discussAndActDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const teamEffectivenessDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const retroSummaryDialogRef = React.useRef<HTMLDialogElement | null>(null);
  const teamAssessmentHistoryDialogRef = React.useRef<HTMLDialogElement | null>(null);

  const [boardCreationInitialTitleOverride, setBoardCreationInitialTitleOverride] = React.useState<string | undefined>(undefined);

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

  const setDialogVisible = React.useCallback((dialog: keyof DialogVisibilityState, isVisible: boolean) => {
    setVisibleDialogs(previousVisibility => (previousVisibility[dialog] === isVisible ? previousVisibility : { ...previousVisibility, [dialog]: isVisible }));
  }, []);

  const hideDialog = React.useCallback(
    (dialog: keyof DialogVisibilityState, dialogRef: React.RefObject<HTMLDialogElement | null>) => {
      if (dialogRef.current) {
        dialogRef.current.close();
      }

      setDialogVisible(dialog, false);
    },
    [setDialogVisible],
  );

  useShowModalWhenVisible(visibleDialogs.isArchiveBoardDialogVisible, archiveBoardDialogRef);
  useShowModalWhenVisible(visibleDialogs.isBoardCreationDialogVisible, boardCreationDialogRef);
  useShowModalWhenVisible(visibleDialogs.isBoardDuplicateDialogVisible, boardDuplicateDialogRef);
  useShowModalWhenVisible(visibleDialogs.isBoardUpdateDialogVisible, boardUpdateDialogRef);
  useShowModalWhenVisible(visibleDialogs.isCarouselDialogVisible, carouselDialogRef);
  useShowModalWhenVisible(visibleDialogs.isDiscussAndActDialogVisible, discussAndActDialogRef);
  useShowModalWhenVisible(visibleDialogs.isPreviewEmailDialogVisible, previewEmailDialogRef);
  useShowModalWhenVisible(visibleDialogs.isRetroSummaryDialogVisible, retroSummaryDialogRef);
  useShowModalWhenVisible(visibleDialogs.isTeamAssessmentHistoryDialogVisible, teamAssessmentHistoryDialogRef);
  useShowModalWhenVisible(visibleDialogs.isTeamEffectivenessDialogVisible, teamEffectivenessDialogRef);

  const handleBackendConnectionClosed = React.useCallback(() => {
    appInsights.trackEvent({ name: TelemetryEvents.LiveSyncConnectionClosed });
    setContainerState(previousState => ({ ...previousState, isBackendServiceConnected: false, isBackendServiceReconnecting: false }));
  }, []);

  const handleBackendConnectionReconnecting = React.useCallback(() => {
    appInsights.trackEvent({ name: TelemetryEvents.LiveSyncReconnecting });
    setContainerState(previousState => ({ ...previousState, isBackendServiceConnected: false, isBackendServiceReconnecting: true }));
  }, []);

  const handleBackendConnectionReconnected = React.useCallback(() => {
    appInsights.trackEvent({ name: TelemetryEvents.LiveSyncReconnected });
    setContainerState(previousState => ({ ...previousState, isBackendServiceConnected: true, isBackendServiceReconnecting: false }));
  }, []);

  const handleBoardActionsDocumentPointerDown = React.useCallback((event: PointerEvent) => {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    const menuRoots = [boardActionsMenuRootRef.current].filter((root): root is HTMLDivElement => Boolean(root));
    for (const root of menuRoots) {
      const openDetails = Array.from(root.querySelectorAll("details[open]"));
      for (const detailsElement of openDetails) {
        if (!detailsElement.contains(target)) {
          detailsElement.removeAttribute("open");
        }
      }
    }
  }, []);

  const handleBoardActionMenuItemClick = React.useCallback(async (handler: () => void | Promise<void>, event: React.MouseEvent<HTMLButtonElement>) => {
    const detailsElement = event.currentTarget.closest("details");
    detailsElement?.removeAttribute("open");
    await handler();
  }, []);

  const initializeOnMount = React.useCallback(async () => {
    const currentUserId = getUserIdentity()?.id ?? "";
    setContainerState(previousState => ({ ...previousState, currentUserId }));

    let initialCurrentTeam: WebApiTeam | undefined;
    let initialCurrentBoard: IFeedbackBoardDocument | undefined;

    if (isHostedAzureDevOps) {
      try {
        const isBackendServiceConnected = await reflectBackendService.startConnection();
        setContainerState(previousState => ({ ...previousState, isBackendServiceConnected, isBackendServiceReconnecting: false }));
      } catch (error) {
        appInsights.trackException(error, {
          action: "connect",
        });
      }
    } else {
      setContainerState(previousState => ({ ...previousState, isBackendServiceConnected: false, isBackendServiceReconnecting: false }));
    }

    try {
      const initializedTeamAndBoardState = await initializeFeedbackBoard();
      initialCurrentTeam = initializedTeamAndBoardState.currentTeam;
      initialCurrentBoard = initializedTeamAndBoardState.currentBoard;

      await initializeProjectTeams(initialCurrentTeam);

      setContainerState(previousState => ({ ...previousState, ...initializedTeamAndBoardState, isTeamDataLoaded: true }));
      reflectBackendService.switchToTeam(initialCurrentTeam ? initialCurrentTeam.id : undefined);
      reflectBackendService.switchToBoard(initialCurrentBoard ? initialCurrentBoard.id : undefined);
    } catch (error) {
      appInsights.trackException(error, {
        action: "initializeTeamAndBoardState",
      });
      setContainerState(previousState => ({ ...previousState, isTeamDataLoaded: true }));
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
      const voteMetricsState = getVoteMetricsState(initialCurrentBoard);
      setContainerState(previousState => ({ ...previousState, ...voteMetricsState }));
    } catch (error) {
      appInsights.trackException(error, {
        action: "votes",
      });
    }

    try {
      reflectBackendService.onConnectionClose(handleBackendConnectionClosed);
      reflectBackendService.onConnectionReconnecting(handleBackendConnectionReconnecting);
      reflectBackendService.onConnectionReconnected(handleBackendConnectionReconnected);

      reflectBackendService.onReceiveNewBoard(handleBoardCreated);
      reflectBackendService.onReceiveDeletedBoard(handleBoardDeleted);
      reflectBackendService.onReceiveUpdatedBoard(handleBoardUpdated);
    } catch (e) {
      appInsights.trackException(e, {
        action: "catchError",
      });
    }

    setContainerState(previousState => ({ ...previousState, isAppInitialized: true }));

    document.addEventListener("pointerdown", handleBoardActionsDocumentPointerDown);
  }, [handleBackendConnectionClosed, handleBackendConnectionReconnected, handleBackendConnectionReconnecting, handleBoardActionsDocumentPointerDown]);

  const cleanupOnUnmount = React.useCallback(() => {
    reflectBackendService.removeOnConnectionClose(handleBackendConnectionClosed);
    reflectBackendService.removeOnConnectionReconnecting(handleBackendConnectionReconnecting);
    reflectBackendService.removeOnConnectionReconnected(handleBackendConnectionReconnected);
    reflectBackendService.removeOnReceiveNewBoard(handleBoardCreated);
    reflectBackendService.removeOnReceiveDeletedBoard(handleBoardDeleted);
    reflectBackendService.removeOnReceiveUpdatedBoard(handleBoardUpdated);
    reflectBackendService.switchToBoard(undefined);
    reflectBackendService.switchToTeam(undefined);
    if (boardTimerIntervalIdRef.current !== undefined) {
      window.clearInterval(boardTimerIntervalIdRef.current);
      boardTimerIntervalIdRef.current = undefined;
    }

    if (connectionWatchdogIntervalIdRef.current !== undefined) {
      window.clearInterval(connectionWatchdogIntervalIdRef.current);
      connectionWatchdogIntervalIdRef.current = undefined;
    }

    document.removeEventListener("pointerdown", handleBoardActionsDocumentPointerDown);
  }, [handleBackendConnectionClosed, handleBackendConnectionReconnected, handleBackendConnectionReconnecting, handleBoardActionsDocumentPointerDown]);

  React.useEffect(() => {
    void initializeOnMount();
    return () => {
      cleanupOnUnmount();
    };
  }, [initializeOnMount, cleanupOnUnmount]);

  React.useEffect(() => {
    const prevCurrentTeam = prevCurrentTeamRef.current;
    const prevCurrentBoard = prevCurrentBoardRef.current;
    const prevActiveTab = prevActiveTabRef.current;

    if (prevCurrentTeam !== undefined && prevCurrentTeam !== state.currentTeam && state.currentTeam) {
      reflectBackendService.switchToTeam(state.currentTeam.id);
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
    if (boardTimerIntervalIdRef.current !== undefined) {
      return;
    }

    const isTimerMode = state.countdownDurationMinutes === 0;

    if (state.boardTimerSeconds === 0 && !isTimerMode) {
      playStartChime();
      setContainerState(previousState => ({ ...previousState, boardTimerSeconds: state.countdownDurationMinutes * 60, hasPlayedStopChime: false }));
      boardTimerIntervalIdRef.current = window.setInterval(() => {
        setContainerState(previousState => {
          const newSeconds = previousState.boardTimerSeconds - 1;
          if (newSeconds === 0 && !previousState.hasPlayedStopChime) {
            playStopChime();
            return { ...previousState, boardTimerSeconds: newSeconds, hasPlayedStopChime: true as const };
          }
          return { ...previousState, boardTimerSeconds: newSeconds };
        });
      }, 1000);
    } else {
      playStartChime();
      boardTimerIntervalIdRef.current = window.setInterval(() => {
        setContainerState(previousState => {
          const isTimerMode = previousState.countdownDurationMinutes === 0;

          if (isTimerMode) {
            return { ...previousState, boardTimerSeconds: previousState.boardTimerSeconds + 1 };
          } else {
            const newSeconds = previousState.boardTimerSeconds - 1;
            if (newSeconds === 0 && !previousState.hasPlayedStopChime) {
              playStopChime();
              return { ...previousState, boardTimerSeconds: newSeconds, hasPlayedStopChime: true as const };
            }
            return { ...previousState, boardTimerSeconds: newSeconds };
          }
        });
      }, 1000);
    }

    if (!state.isBoardTimerRunning) {
      setContainerState(previousState => ({ ...previousState, isBoardTimerRunning: true }));
    }
  }, [state, clearBoardTimerInterval]);

  const pauseBoardTimer = React.useCallback(() => {
    const wasRunning = state.isBoardTimerRunning;
    const hadInterval = boardTimerIntervalIdRef.current !== undefined;
    clearBoardTimerInterval();

    if (wasRunning || hadInterval) {
      setContainerState(previousState => ({ ...previousState, isBoardTimerRunning: false }));
    }
  }, [state.isBoardTimerRunning, clearBoardTimerInterval]);

  const resetBoardTimer = React.useCallback(() => {
    const shouldReset = state.boardTimerSeconds !== 0 || state.isBoardTimerRunning || boardTimerIntervalIdRef.current !== undefined;

    if (!shouldReset) {
      return;
    }

    clearBoardTimerInterval();
    setContainerState(previousState => ({ ...previousState, boardTimerSeconds: 0, isBoardTimerRunning: false, hasPlayedStopChime: false }));
  }, [state.boardTimerSeconds, state.isBoardTimerRunning, clearBoardTimerInterval]);

  const handleBoardTimerToggle = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (state.isBoardTimerRunning) {
        pauseBoardTimer();
        return;
      }

      startBoardTimer();
    },
    [state.isBoardTimerRunning, pauseBoardTimer, startBoardTimer],
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
      setContainerState(previousState => ({ ...previousState, countdownDurationMinutes: duration }));
    },
    [],
  );

  const renderWorkflowTimerControls = React.useCallback(() => {
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
  }, [state, handleBoardTimerReset, handleBoardTimerToggle, handleCountdownDurationChange]);

  const updateUrlWithBoardAndTeamInformation = React.useCallback(async (teamId: string, boardId: string) => {
    getService<IHostNavigationService>(CommonServiceIds.HostNavigationService).then(service => {
      const phase = state.currentBoard?.activePhase;
      service.setHash(`teamId=${teamId}&boardId=${boardId}${phase ? `&phase=${phase}` : ""}`);
    });
  }, [state.currentBoard?.activePhase]);

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

      setContainerState(previousState => ({
        ...previousState,
        actionItemIds: actionItemIds.filter(item => item !== undefined),
        feedbackItems,
        contributors: [...new Set(contributors.map(e => e.id))].map(e => contributors.find(i => i.id === e)),
        ...voteMetricsState,
      }));
    },
    [updateUrlWithBoardAndTeamInformation],
  );

  const getVoteMetricsState = React.useCallback((board: IFeedbackBoardDocument | undefined): Pick<FeedbackBoardContainerState, "castedVoteCount" | "currentVoteCount" | "teamVoteCapacity"> => {
    if (!board || !state.currentUserId) {
      return {
        castedVoteCount: 0,
        currentVoteCount: "0",
        teamVoteCapacity: 0,
      };
    }

    const voteCollection = board.boardVoteCollection || {};
    const votes = Object.values(voteCollection);
    const totalVotesUsed = votes.length > 0 ? votes.reduce((sum, vote) => sum + vote, 0) : 0;

    const userIdKey = obfuscateUserId(state.currentUserId);
    const currentUserVotes = voteCollection[userIdKey]?.toString() || "0";

    const voterCount = Object.keys(voteCollection).length;
    const maxVotesPerUser = board.maxVotesPerUser ?? 0;
    const teamVoteCapacity = voterCount > 0 && maxVotesPerUser > 0 ? voterCount * maxVotesPerUser : 0;

    return {
      castedVoteCount: totalVotesUsed,
      currentVoteCount: currentUserVotes,
      teamVoteCapacity,
    };
  }, [state.currentUserId]);

  const numberFormatter = React.useCallback((value: number) => {
    return formatNumber(value, { style: "decimal", minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }, []);

  const percentageFormatter = React.useCallback((value: number) => {
    return formatNumber(value / 100, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }, []);

  const handleBoardCreated = React.useCallback(async (teamId: string, boardId: string) => {
      if (!teamId) {
        return;
      }

      const boardToAdd = await BoardDataService.getBoardForTeamById(teamId, boardId);

      if (!boardToAdd) {
        return;
      }

      setContainerState(prevState => {
        if (!prevState.currentTeam || prevState.currentTeam.id !== teamId) {
          return prevState;
        }

        const boardsForTeam = [...prevState.boards, boardToAdd]
          .filter((board: IFeedbackBoardDocument) =>
            FeedbackBoardDocumentHelper.filter(
              board,
              prevState.userTeams.map(t => t.id),
              prevState.currentUserId,
            ),
          )
          .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));

        const newCurrentBoard = boardsForTeam.length === 1 ? boardsForTeam[0] : prevState.currentBoard;

        return {
          ...prevState,
          boards: boardsForTeam,
          currentBoard: newCurrentBoard,
          isTeamBoardDeletedInfoDialogHidden: true,
        };
      });
    }, []);

  const setSupportedWorkItemTypesForProject = React.useCallback(async (): Promise<void> => {
    const allWorkItemTypes: WorkItemType[] = await workItemService.getWorkItemTypesForCurrentProject();
    const hiddenWorkItemTypes: WorkItemTypeReference[] = await workItemService.getHiddenWorkItemTypes();

    const hiddenWorkItemTypeNames = hiddenWorkItemTypes.map(workItemType => workItemType.name);

    const nonHiddenWorkItemTypes = allWorkItemTypes.filter(workItemType => hiddenWorkItemTypeNames.indexOf(workItemType.name) === -1);

    setContainerState(previousState => ({
      ...previousState,
      nonHiddenWorkItemTypes: nonHiddenWorkItemTypes,
      allWorkItemTypes: allWorkItemTypes,
    }));
  }, []);

  const replaceBoard = React.useCallback(
    (updatedBoard: IFeedbackBoardDocument) => {
      setContainerState(prevState => {
        const newBoards = prevState.boards.map(board => (board.id === updatedBoard.id ? updatedBoard : board));

        const currentBoard = prevState.currentBoard;
        const newCurrentBoard = currentBoard && currentBoard.id === updatedBoard.id ? updatedBoard : currentBoard;

        return {
          ...prevState,
          boards: newBoards,
          currentBoard: newCurrentBoard,
        };
      });
    },
    [],
  );

  const handleBoardUpdated = React.useCallback(async (teamId: string, updatedBoardId: string) => {
      if (!teamId || !state.currentTeam || state.currentTeam.id !== teamId) {
        return;
      }

      const updatedBoard = await BoardDataService.getBoardForTeamById(teamId, updatedBoardId);

      if (!updatedBoard) {
        // Board has been deleted after the update. Just ignore the update. The delete should be handled on its own.
        return;
      }

      setContainerState(prevState => {
        if (!prevState.currentTeam || prevState.currentTeam.id !== teamId) {
          return prevState;
        }

        const boards = prevState.boards.map(board => (board.id === updatedBoard.id ? updatedBoard : board));
        const currentBoard = prevState.currentBoard?.id === updatedBoard.id ? updatedBoard : prevState.currentBoard;

        return {
          ...prevState,
          boards,
          currentBoard,
        };
      });
    }, [state.currentTeam]);

  const handleBoardDeleted = React.useCallback(async (teamId: string, deletedBoardId: string) => {
      if (!teamId) {
        return;
      }

      let selectedBoardId: string | undefined;
      let shouldAddVisit = false;
      setContainerState(prevState => {
        if (!prevState.currentTeam || prevState.currentTeam.id !== teamId) {
          return prevState;
        }

        shouldAddVisit = true;
        selectedBoardId = prevState.currentBoard?.id;
        const currentBoards = prevState.boards;
        const boardsForTeam = currentBoards.filter(board => board.id !== deletedBoardId);

        if (prevState.currentBoard && deletedBoardId === prevState.currentBoard.id) {
          if (!boardsForTeam || boardsForTeam.length === 0) {
            selectedBoardId = undefined;
            reflectBackendService.switchToBoard(undefined);
            return {
              ...prevState,
              boards: [],
              currentBoard: null,
              isTeamBoardDeletedInfoDialogHidden: false,
              teamBoardDeletedDialogTitle: "Retrospective archived or deleted",
              teamBoardDeletedDialogMessage: "The retrospective you were viewing has been archived or deleted by another user.",
            };
          }

          const currentBoard = boardsForTeam[0];
          selectedBoardId = currentBoard.id;
          reflectBackendService.switchToBoard(currentBoard.id);
          return {
            ...prevState,
            boards: boardsForTeam,
            currentBoard: currentBoard,
            isTeamBoardDeletedInfoDialogHidden: false,
            teamBoardDeletedDialogTitle: "Retrospective archived or deleted",
            teamBoardDeletedDialogMessage: "The retrospective you were viewing has been archived or deleted by another user. You will be switched to the last created retrospective for this team.",
          };
        }

        return {
          ...prevState,
          boards: boardsForTeam,
        };
      });
      if (shouldAddVisit) {
        await userDataService.addVisit(teamId, selectedBoardId);
      }
    }, []);

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
    const userTeams = await azureDevOpsCoreService.getAllTeams(projectId, true);
    userTeams?.sort((t1, t2) => {
      return t1.name.localeCompare(t2.name, [], { sensitivity: "accent" });
    });

    const defaultTeam = userTeams?.length ? userTeams[0] : await azureDevOpsCoreService.getDefaultTeam(projectId);

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
        const matchedTeam = await azureDevOpsCoreService.getTeam(projectId, teamId);
        if (matchedTeam) {
          setContainerState(previousState => ({ ...previousState, currentTeam: matchedTeam }));
        }
      }
      if (state.currentTeam === undefined) {
        setContainerState(previousState => ({ ...previousState, currentTeam: defaultTeam }));
      }

      const newBoard = await createBoard(name, parseInt(maxVotes), columns, isTeamAssessment === "true", false, false, { Members: [], Teams: [] });

      parent.location.href = await getBoardUrl(state.currentTeam.id, newBoard.id, newBoard.activePhase);
    }

    const info = await parseUrlForBoardAndTeamInformation();
    try {
      if (!info) {
        if (!isHostedAzureDevOps) {
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
    const matchedTeam = await azureDevOpsCoreService.getTeam(projectId, teamIdQueryParam);

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
            state.userTeams.map(t => t.id),
            state.currentUserId,
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
    const allTeams = await azureDevOpsCoreService.getAllTeams(projectId, true);
    allTeams.sort((t1, t2) => {
      return t1.name.localeCompare(t2.name, [], { sensitivity: "accent" });
    });

    const promises = [];
    for (const team of allTeams) {
      promises.push(azureDevOpsCoreService.getMembers(projectId, team.id));
    }
    // if user is member of more than one team, then will return duplicates
    Promise.all(promises).then(values => {
      const allTeamMembers: TeamMember[] = [];
      for (const members of values) {
        allTeamMembers.push(...members);
      }
      // Use the helper function
      const uniqueTeamMembers = deduplicateTeamMembers(allTeamMembers);

      setContainerState(previousState => ({
        ...previousState,
        allMembers: uniqueTeamMembers,
        projectTeams: allTeams?.length > 0 ? allTeams : [defaultTeam],
        filteredProjectTeams: allTeams?.length > 0 ? allTeams : [defaultTeam],
        isAllTeamsLoaded: true,
      }));
    });
  };

  const isCurrentUserTeamAdmin = (): boolean => {
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
      const mostRecentTeam = await azureDevOpsCoreService.getTeam(projectId, mostRecentUserVisit.teamId);

      if (mostRecentTeam) {
        let boardsForTeam = await BoardDataService.getBoardsForTeam(mostRecentTeam.id);
        if (boardsForTeam?.length > 0) {
          boardsForTeam = boardsForTeam
            .filter((board: IFeedbackBoardDocument) =>
              FeedbackBoardDocumentHelper.filter(
                board,
                userTeams.map(t => t.id),
                state.currentUserId,
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
            state.currentUserId,
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
    setContainerState(previousState => ({ ...previousState, isTeamDataLoaded: false }));
    try {
      const matchedTeam = state.projectTeams.find(team => team.id === teamId) || state.userTeams.find(team => team.id === teamId);

      if (matchedTeam) {
        let boardsForTeam = await BoardDataService.getBoardsForTeam(matchedTeam.id);
        if (boardsForTeam?.length) {
          boardsForTeam = boardsForTeam
            .filter((board: IFeedbackBoardDocument) =>
              FeedbackBoardDocumentHelper.filter(
                board,
                state.userTeams.map(t => t.id),
                state.currentUserId,
              ),
            )
            .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));
        }

        setContainerState(prevState => {
          if (!prevState.currentTeam || prevState.currentTeam.id !== matchedTeam.id) {
            return {
              ...prevState,
              boards: boardsForTeam?.length ? boardsForTeam : [],
              currentBoard: boardsForTeam?.length ? boardsForTeam[0] : null,
              currentTeam: matchedTeam,
              isTeamDataLoaded: true,
            };
          }

          return prevState;
        });
      } else {
        setContainerState(previousState => ({ ...previousState, isTeamDataLoaded: true }));
      }
    } catch (error) {
      appInsights.trackException(error, {
        action: "setCurrentTeam",
      });
      setContainerState(previousState => ({ ...previousState, isTeamDataLoaded: true }));
    }
  };

  const handleArchiveToggle = (): void => {
    setContainerState(previousState => ({ ...previousState, hasToggledArchive: true }));
  };

  // Handle when "Board" tab is clicked
  const handlePivotClick = async (tabName: "Board" | "History"): Promise<void> => {
    setContainerState(previousState => ({ ...previousState, activeTab: tabName }));

    if (tabName === "Board") {
      // Check if "Board" tab is clicked
      if (state.hasToggledArchive) {
        // Reload only if archive was toggled
        await reloadBoardsForCurrentTeam();
        setContainerState(previousState => ({ ...previousState, hasToggledArchive: false })); // Reset the flag after reload
      }
    }
  };

  /**
   * @description Loads all feedback boards for the current team. Defaults the selected board to
   * the most recently created board.
   */
  const reloadBoardsForCurrentTeam = async (preferredBoardId?: string) => {
    setContainerState(previousState => ({ ...previousState, isTeamDataLoaded: false }));

    try {
      let boardsForTeam = await BoardDataService.getBoardsForTeam(state.currentTeam.id);

      if (!boardsForTeam.length) {
        setContainerState(previousState => ({
          ...previousState,
          isTeamDataLoaded: true,
          boards: [],
          currentBoard: null,
        }));

        return;
      }

      boardsForTeam = boardsForTeam
        .filter((board: IFeedbackBoardDocument) =>
          FeedbackBoardDocumentHelper.filter(
            board,
            state.userTeams.map(t => t.id),
            state.currentUserId,
          ),
        )
        .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));

      const preferredBoard = preferredBoardId ? boardsForTeam.find(board => board.id === preferredBoardId) : undefined;

      setContainerState(previousState => ({
        ...previousState,
        isTeamDataLoaded: true,
        boards: boardsForTeam,
        currentBoard: preferredBoard ?? boardsForTeam[0],
      }));
    } catch (error) {
      appInsights.trackException(error, {
        action: "reloadBoardsForCurrentTeam",
      });
      setContainerState(previousState => ({ ...previousState, isTeamDataLoaded: true }));
    }
  };

  /**
   * @description Attempts to select a board from the specified boardId. If the boardId is valid,
   * currentBoard is set to the new board. If not, nothing changes.
   * @param boardId The id of the board to select.
   */
  const setCurrentBoard = (selectedBoard: IFeedbackBoardDocument) => {
    const matchedBoard = state.boards.find(board => board.id === selectedBoard.id);

    if (!matchedBoard) {
      return;
    }

    if (matchedBoard.teamEffectivenessMeasurementVoteCollection === undefined) {
      matchedBoard.teamEffectivenessMeasurementVoteCollection = [];
    }

    setContainerState(prevState => {
      // Ensure that we are actually changing boards to prevent needless rerenders.
      if (!prevState.currentBoard || prevState.currentBoard.id !== matchedBoard.id) {
        return {
          ...prevState,
          currentBoard: matchedBoard,
        };
      }

      return prevState;
    });
  };

  const changeSelectedTeam = async (team: WebApiTeam) => {
    if (team) {
      if (state.currentTeam?.id === team.id) {
        return;
      }

      await setCurrentTeam(team.id);
      appInsights.trackEvent({ name: TelemetryEvents.TeamSelectionChanged, properties: { teamId: team.id } });
    }
  };

  const changeSelectedBoard = async (board: IFeedbackBoardDocument) => {
    if (board) {
      setCurrentBoard(board);
      await updateUrlWithBoardAndTeamInformation(state.currentTeam.id, board.id);
      appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardSelectionChanged, properties: { boardId: board.id } });
    }
  };

  const clickWorkflowStateCallback = (_: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLDivElement>, newPhase: WorkflowPhase) => {
    appInsights.trackEvent({ name: TelemetryEvents.WorkflowPhaseChanged, properties: { oldWorkflowPhase: state.currentBoard.activePhase, newWorkflowPhase: newPhase } });

    setContainerState(prevState => {
      const updatedCurrentBoard = { ...prevState.currentBoard, activePhase: newPhase };

      return {
        ...prevState,
        currentBoard: updatedCurrentBoard,
      };
    });
  };

  const createBoard = async (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, shouldShowFeedbackAfterCollect: boolean, isBoardAnonymous: boolean, permissions: IFeedbackBoardDocumentPermissions, teamAssessmentQuestions?: ITeamAssessmentQuestion[]) => {
    const createdBoard = await BoardDataService.createBoardForTeam(
      state.currentTeam.id,
      title,
      maxVotesPerUser,
      columns,
      isIncludeTeamEffectivenessMeasurement,
      shouldShowFeedbackAfterCollect,
      isBoardAnonymous,
      undefined, // Start Date
      undefined, // End Date
      permissions,
      teamAssessmentQuestions,
    );
    await reloadBoardsForCurrentTeam();
    hideBoardCreationDialog();
    hideBoardDuplicateDialog();
    reflectBackendService.broadcastNewBoard(state.currentTeam.id, createdBoard.id);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardCreated, properties: { boardId: createdBoard.id } });
    return createdBoard;
  };

  const showBoardCreationDialog = (initialTitleOverride?: string): void => {
    setBoardCreationInitialTitleOverride(initialTitleOverride);
    setDialogVisible("isBoardCreationDialogVisible", true);
  };

  const hideBoardCreationDialog = (): void => {
    setBoardCreationInitialTitleOverride(undefined);
    hideDialog("isBoardCreationDialogVisible", boardCreationDialogRef);
  };

  const createCurrentSprintRetrospective = async (): Promise<void> => {
    const currentTeam = state.currentTeam;
    if (!currentTeam) {
      return;
    }

    try {
      const currentIterations = await workService.getIterations(currentTeam.id, "current");
      const currentIteration = getCurrentIteration(currentIterations) ?? currentIterations[0];

      if (!currentIteration) {
        toast(t("sprint_retro_current_not_found"), { intent: "error" });
        return;
      }

      showBoardCreationDialog(buildSprintRetrospectiveTitle(currentIteration));
    } catch (error) {
      appInsights.trackException(error, { action: "prefillSprintRetrospectiveTitle", teamId: currentTeam.id });
      toast(t("sprint_retro_current_not_found"), { intent: "error" });
    }
  };

  const showRetroSummaryDialog = async () => {
    const measurements: { id: number; selected: number }[] = [];
    const board = await BoardDataService.getBoardForTeamById(state.currentTeam.id, state.currentBoard.id);
    const boardQuestions = board.teamAssessmentQuestions?.length ? board.teamAssessmentQuestions : questions;
    const voteCollection = board.teamEffectivenessMeasurementVoteCollection || [];

    voteCollection.forEach(vote => {
      vote?.responses?.forEach(response => {
        measurements.push({ id: response.questionId, selected: response.selection });
      });
    });

    const average: { questionId: number; question: string; average: number; teamAssessmentQuestion?: ITeamAssessmentQuestion }[] = [];

    [...new Set(measurements.map(item => item.id))].forEach(e => {
      const teamAssessmentQuestion = boardQuestions.find(question => question.id === e);
      if (teamAssessmentQuestion) {
        average.push({ questionId: e, question: teamAssessmentQuestion.title, average: measurements.filter(m => m.id === e).reduce((a, b) => a + b.selected, 0) / measurements.filter(m => m.id === e).length, teamAssessmentQuestion });
      }
    });

    const chartData: { questionId: number; red: number; yellow: number; green: number; teamAssessmentQuestion?: ITeamAssessmentQuestion }[] = [];

    boardQuestions.forEach(question => {
      chartData.push({ questionId: question.id, red: 0, yellow: 0, green: 0, teamAssessmentQuestion: question });
    });

    voteCollection?.forEach(vote => {
      boardQuestions.forEach(question => {
        const selection = vote.responses.find(response => response.questionId === question.id)?.selection;
        const data = chartData.find(d => d.questionId === question.id);
        if (selection === undefined || !data) {
          return;
        }
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

    await updateFeedbackItemsAndContributors(state.currentTeam, board);

    setContainerState(previousState => ({
      ...previousState,
      currentBoard: board,
      effectivenessMeasurementChartData: chartData,
      effectivenessMeasurementSummary: average,
    }));
    setDialogVisible("isRetroSummaryDialogVisible", true);
  };

  const hideRetroSummaryDialog = (): void => {
    hideDialog("isRetroSummaryDialogVisible", retroSummaryDialogRef);
  };

  const showTeamAssessmentHistoryDialog = async () => {
    const allBoards = await BoardDataService.getBoardsForTeam(state.currentTeam.id);

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
      [...new Set(measurements.map(item => item.id))]
        .filter(questionId => questions.some(question => question.id === questionId))
        .forEach(questionId => {
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

    setContainerState(previousState => ({
      ...previousState,
      teamAssessmentHistoryData: historyData,
    }));

    setDialogVisible("isTeamAssessmentHistoryDialogVisible", true);

    appInsights.trackEvent({ name: TelemetryEvents.TeamAssessmentHistoryViewed });
  };

  const hideTeamAssessmentHistoryDialog = (): void => {
    hideDialog("isTeamAssessmentHistoryDialogVisible", teamAssessmentHistoryDialogRef);
  };

  const updateBoardMetadata = async (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, shouldShowFeedbackAfterCollect: boolean, isBoardAnonymous: boolean, permissions: IFeedbackBoardDocumentPermissions, _teamAssessmentQuestions?: ITeamAssessmentQuestion[]) => {
    const updatedBoard = await BoardDataService.updateBoardMetadata(state.currentTeam.id, state.currentBoard.id, maxVotesPerUser, title, columns, permissions);

    updateBoardAndBroadcast(updatedBoard);
  };

  const showBoardUpdateDialog = (): void => {
    setDialogVisible("isBoardUpdateDialogVisible", true);
  };

  const hideBoardUpdateDialog = (): void => {
    hideDialog("isBoardUpdateDialogVisible", boardUpdateDialogRef);
  };

  const showBoardDuplicateDialog = (): void => {
    setDialogVisible("isBoardDuplicateDialogVisible", true);
  };

  const hideBoardDuplicateDialog = (): void => {
    hideDialog("isBoardDuplicateDialogVisible", boardDuplicateDialogRef);
  };

  const showArchiveBoardConfirmationDialog = () => {
    setDialogVisible("isArchiveBoardDialogVisible", true);
  };

  const showBoardUrlCopiedToast = () => {
    const board = state.currentBoard;
    toast(t("feedback_board_link_copied", { title: board.title, phase: board.activePhase }));
  };

  const showEmailCopiedToast = () => {
    const board = state.currentBoard;
    copyToClipboard(board.emailContent);
    toast(t("feedback_board_email_copied", { title: board.title }));
  };

  const archiveCurrentBoard = async () => {
    await BoardDataService.archiveFeedbackBoard(state.currentTeam.id, state.currentBoard.id);
    reflectBackendService.broadcastDeletedBoard(state.currentTeam.id, state.currentBoard.id);
    hideDialog("isArchiveBoardDialogVisible", archiveBoardDialogRef);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardArchived, properties: { boardId: state.currentBoard.id } });
    await reloadBoardsForCurrentTeam();
  };

  const copyBoardUrl = async () => {
    const boardDeepLinkUrl = await getBoardUrl(state.currentTeam.id, state.currentBoard.id, state.currentBoard.activePhase);
    copyToClipboard(boardDeepLinkUrl);
    showBoardUrlCopiedToast();
  };

  const generateCSVContent = async () => {
    await shareBoardHelper.generateCSVContent(state.currentBoard);
  };

  const generateEmailSummaryContent = async () => {
    const boardUrl = await getBoardUrl(state.currentTeam.id, state.currentBoard.id, state.currentBoard.activePhase);
    const emailContent = await shareBoardHelper.generateEmailText(state.currentBoard, boardUrl, false);
    setContainerState(prevState => ({
      ...prevState,
      currentBoard: { ...prevState.currentBoard, emailContent },
    }));

    setDialogVisible("isPreviewEmailDialogVisible", true);
  };

  const downloadEmailSummaryPdf = (): void => {
    const board = state.currentBoard;
    if (!board) {
      return;
    }

    const pdfBlob = createPdfFromText(board.emailContent || "", board.title || "Retrospective Email Summary");
    const fileName = generatePdfFileName(board.title || "Retrospective", "Email_Summary");
    downloadPdfBlob(pdfBlob, fileName);
  };

  const renderBoardUpdateMetadataFormDialog = (
    dialogRef: React.RefObject<HTMLDialogElement>,
    isNewBoardCreation: boolean,
    isDuplicatingBoard: boolean,
    onDismiss: () => void,
    dialogTitle: string,
    placeholderText: string,
    onSubmit: (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, shouldShowFeedbackAfterCollect: boolean, isBoardAnonymous: boolean, permissions: IFeedbackBoardDocumentPermissions, teamAssessmentQuestions: ITeamAssessmentQuestion[]) => void,
    onCancel: () => void,
    initialTitleOverride?: string,
    onDialogClose?: () => void,
  ) => {
    const permissionOptions: FeedbackBoardPermissionOption[] = [];

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
      <dialog className="board-metadata-dialog dialog-width-lg" ref={dialogRef} role="dialog" aria-label={dialogTitle} onClose={onDialogClose}>
        <div className="header">
          <h2 className="title">{dialogTitle}</h2>
          <button type="button" onClick={onDismiss} aria-label="Close">
            {getIconElement("close")}
          </button>
        </div>
        <FeedbackBoardMetadataForm isNewBoardCreation={isNewBoardCreation} isDuplicatingBoard={isDuplicatingBoard} currentBoard={state.currentBoard} initialTitleOverride={initialTitleOverride} teamId={state.currentTeam.id} maxVotesPerUser={state.maxVotesPerUser} placeholderText={placeholderText} availablePermissionOptions={permissionOptions} currentUserId={state.currentUserId} onFormSubmit={onSubmit} onFormCancel={onCancel} />
      </dialog>
    );
  };

  const updateCurrentVoteCount = React.useCallback(async () => {
    const boardItem = await itemDataService.getBoardItem(state.currentTeam.id, state.currentBoard.id);
    if (!boardItem) {
      return;
    }

    const voteMetricsState = getVoteMetricsState(boardItem);
    setContainerState(previousState => ({ ...previousState, ...voteMetricsState }));
  }, [getVoteMetricsState]);

  const updateBoardAndBroadcast = (updatedBoard: IFeedbackBoardDocument) => {
    if (!updatedBoard) {
      void handleBoardDeleted(state.currentTeam.id, state.currentBoard.id);
    }

    replaceBoard(updatedBoard);

    hideBoardUpdateDialog();
    reflectBackendService.broadcastUpdatedBoard(state.currentTeam.id, updatedBoard.id);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardMetadataUpdated, properties: { boardId: updatedBoard.id } });
  };

  const persistColumnNotes = async (columnId: string, notes: string): Promise<void> => {
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
    setDialogVisible("isCarouselDialogVisible", true);
  };

  const toggleActColumnSortMode = () => {
    setContainerState(previousState => ({ ...previousState, actColumnSortMode: previousState.actColumnSortMode === "time" ? "votes" : "time" }));
  };

  const currentActSortLabel = state.actColumnSortMode === "time" ? t("sorted_by_time") : t("sorted_by_votes");

  const hideCarouselDialog = () => {
    hideDialog("isCarouselDialogVisible", carouselDialogRef);
  };

  const hideLiveSyncInTfsIssueMessageBar = () => {
    setContainerState(previousState => ({ ...previousState, isLiveSyncInTfsIssueMessageBarVisible: false }));
  };

  const hideDropIssueInEdgeMessageBar = () => {
    setContainerState(previousState => ({ ...previousState, isDropIssueInEdgeMessageBarVisible: false }));
  };

  const attemptBackendReconnect = React.useCallback(
    async (isManualRetry: boolean): Promise<void> => {
      if (state.isBackendServiceReconnecting) {
        return;
      }

      if (isManualRetry) {
        appInsights.trackEvent({ name: TelemetryEvents.LiveSyncManualRetry });
      }

      setContainerState(previousState => ({ ...previousState, isBackendServiceReconnecting: true }));

      const isBackendServiceConnected = await reflectBackendService.retryConnection();
      if (!isBackendServiceConnected && isManualRetry) {
        appInsights.trackEvent({ name: TelemetryEvents.LiveSyncManualRetryFailed });
      }

      setContainerState(previousState => ({ ...previousState, isBackendServiceConnected, isBackendServiceReconnecting: false }));

      if (isBackendServiceConnected && state.currentTeam && state.currentBoard) {
        await updateFeedbackItemsAndContributors(state.currentTeam, state.currentBoard);
      }
    },
    [state.isBackendServiceReconnecting, state.currentTeam, state.currentBoard, updateFeedbackItemsAndContributors],
  );

  const retryBackendConnection = async () => {
    await attemptBackendReconnect(true);
  };

  React.useEffect(() => {
    if (isHostedAzureDevOps) {
      connectionWatchdogIntervalIdRef.current = window.setInterval(() => {
        if (state.isBackendServiceConnected || state.isBackendServiceReconnecting) {
          return;
        }

        void attemptBackendReconnect(false);
      }, 5000);
    }

    return () => {
      if (connectionWatchdogIntervalIdRef.current !== undefined) {
        window.clearInterval(connectionWatchdogIntervalIdRef.current);
        connectionWatchdogIntervalIdRef.current = undefined;
      }
    };
  }, [isHostedAzureDevOps, state.isBackendServiceConnected, state.isBackendServiceReconnecting, attemptBackendReconnect]);

  if (!state.isAppInitialized || !state.isTeamDataLoaded) {
    return (
      <div className="spinner" aria-live="assertive">
        <div></div>
        <span>{t("common_loading")}</span>
      </div>
    );
  }

  if (!state.currentTeam) {
    return <div>{t("feedback_board_team_list_error")}</div>;
  }

  const handleTeamSelectionChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTeamId = event.target.value;
    const selectedTeam = state.userTeams.find(team => team.id === selectedTeamId);
    if (selectedTeam) {
      await changeSelectedTeam(selectedTeam);
    }
  };

  const handleBoardSelectionChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBoardId = event.target.value;
    const selectedBoard = state.boards.find(board => board.id === selectedBoardId);
    if (selectedBoard) {
      await changeSelectedBoard(selectedBoard);
    }
  };

  const saveTeamEffectivenessMeasurement = () => {
    const currentBoard = state.currentBoard;
    if (!currentBoard) {
      return;
    }

    const boardQuestions = currentBoard.teamAssessmentQuestions?.length ? currentBoard.teamAssessmentQuestions : questions;
    const teamEffectivenessMeasurementVoteCollection = currentBoard.teamEffectivenessMeasurementVoteCollection || [];
    const currentUserId = obfuscateUserId(state.currentUserId);
    const currentUserVote = teamEffectivenessMeasurementVoteCollection.find(vote => vote.userId === currentUserId);
    const responseCount = currentUserVote?.responses?.length || 0;

    if (responseCount < boardQuestions.length) {
      toast(t("feedback_board_answer_all_questions"));
      return;
    }

    itemDataService.updateTeamEffectivenessMeasurement(currentBoard.id, state.currentTeam.id, currentUserId, teamEffectivenessMeasurementVoteCollection);

    hideTeamEffectivenessDialog();
  };

  const showTeamEffectivenessDialog = () => {
    setDialogVisible("isTeamEffectivenessDialogVisible", true);
  };

  const hideTeamEffectivenessDialog = () => {
    hideDialog("isTeamEffectivenessDialogVisible", teamEffectivenessDialogRef);
  };

  const showDiscussAndActDialog = (questionId: number) => {
    setContainerState(previousState => ({ ...previousState, questionIdForDiscussAndActBoardUpdate: questionId }));
    setDialogVisible("isDiscussAndActDialogVisible", true);
  };

  const hideDiscussAndActDialog = () => {
    setContainerState(previousState => ({ ...previousState, questionIdForDiscussAndActBoardUpdate: -1 }));
    hideDialog("isDiscussAndActDialogVisible", discussAndActDialogRef);
  };

  const effectivenessMeasurementSelectionChanged = (questionId: number, selected: number) => {
    setContainerState(previousState => {
      const currentBoard = previousState.currentBoard;
      if (!currentBoard) {
        return previousState;
      }

      const currentUserId = obfuscateUserId(previousState.currentUserId);
      const voteCollection = currentBoard.teamEffectivenessMeasurementVoteCollection ?? [];
      const existingVote = voteCollection.find(vote => vote.userId === currentUserId);
      const updatedResponses = existingVote
        ? existingVote.responses.some(response => response.questionId === questionId)
          ? existingVote.responses.map(response => (response.questionId === questionId ? { ...response, selection: selected } : response))
          : [...existingVote.responses, { questionId, selection: selected }]
        : [{ questionId, selection: selected }];

      const updatedVoteCollection = existingVote
        ? voteCollection.map(vote => (vote.userId === currentUserId ? { ...vote, responses: updatedResponses } : vote))
        : [...voteCollection, { userId: currentUserId, responses: updatedResponses }];

      return {
        ...previousState,
        currentBoard: {
          ...currentBoard,
          teamEffectivenessMeasurementVoteCollection: updatedVoteCollection,
        },
      };
    });
  };

  const teamEffectivenessResponseCount = state.currentBoard?.teamEffectivenessMeasurementVoteCollection?.length;

  return (
    <div className="flex flex-col h-screen" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      <div className="flex items-center shrink-0 mt-2 ml-4">
        {visibleDialogs.isDiscussAndActDialogVisible && (
          <dialog ref={discussAndActDialogRef} className="delete-feedback-item-dialog dialog-width-sm" role="dialog" aria-label="Discuss and Act" onClose={() => setDialogVisible("isDiscussAndActDialogVisible", false)}>
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
              <button type="button" className="button default" onClick={hideDiscussAndActDialog}>
                Cancel
              </button>
            </div>
          </dialog>
        )}

        <h1 className="header-title" aria-label="Retrospectives">
          Retrospectives
        </h1>
        <div className="flex items-center" role="group" aria-label="Team selector">
          <label htmlFor="team-selector" className="sr-only">
            Team
          </label>
          <select id="team-selector" className="selector-option" value={state.currentTeam?.id || ""} onChange={handleTeamSelectionChange} aria-label="Team">
            {state.userTeams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
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
              <div className="header-tabs">
                <div className={`pivot-tab board ${state.activeTab === "Board" ? "active" : ""}`} onClick={() => handlePivotClick("Board")}>
                  Board
                </div>
                <div className={`pivot-tab history ${state.activeTab === "History" ? "active" : ""}`} onClick={() => handlePivotClick("History")}>
                  History
                </div>
              </div>
              {state.activeTab === "Board" && (
                <>
                  <div className="flex items-center justify-start">
                    <div className="board-selector">
                      <label htmlFor="board-selector" className="sr-only">
                        Retrospective Board
                      </label>
                      <select id="board-selector" className="selector-option" value={state.currentBoard?.id || ""} onChange={handleBoardSelectionChange} aria-label="Retrospective Board">
                        {state.boards.map(board => (
                          <option key={board.id} value={board.id}>
                            {board.title}
                          </option>
                        ))}
                      </select>
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
                          <button key="createBoardForCurrentSprint" type="button" title={t("sprint_retro_create_current")} onClick={event => handleBoardActionMenuItemClick(createCurrentSprintRetrospective, event)}>
                            {getIconElement("add")}
                            {t("sprint_retro_create_current")}
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
                          {visibleDialogs.isTeamEffectivenessDialogVisible && (
                            <dialog ref={teamEffectivenessDialogRef} className="team-effectiveness-dialog dialog-width-lg" role="dialog" aria-label="Team Assessment" onClose={() => setDialogVisible("isTeamEffectivenessDialogVisible", false)}>
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
                                      {(state.currentBoard.teamAssessmentQuestions?.length ? state.currentBoard.teamAssessmentQuestions : questions).map(question => {
                                        return <EffectivenessMeasurementRow key={question.id} questionId={question.id} votes={state.currentBoard.teamEffectivenessMeasurementVoteCollection} onSelectedChange={selected => effectivenessMeasurementSelectionChanged(question.id, selected)} iconClassName={question.iconClassName} title={question.shortTitle} subtitle={question.title} tooltip={question.tooltip} />;
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              <div className="inner">
                                <button type="button" className="button" onClick={saveTeamEffectivenessMeasurement}>
                                  Save
                                </button>
                                <button type="button" className="button default" onClick={hideTeamEffectivenessDialog}>
                                  Cancel
                                </button>
                              </div>
                            </dialog>
                          )}
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
                          <button
                            className="sort-mode-button focus-mode-button"
                            onClick={toggleActColumnSortMode}
                            title={currentActSortLabel}
                            aria-label={currentActSortLabel}
                            type="button"
                          >
                            {getIconElement(state.actColumnSortMode === "time" ? "sort-by-time" : "sort-by-votes")}
                            <span>{currentActSortLabel}</span>
                          </button>
                          <button className="focus-mode-button" onClick={showCarouselDialog} title="Focus Mode allows your team to focus on one feedback item at a time. Try it!" aria-label="Focus Mode" type="button">
                            {getIconElement("adjust")}
                            <span>Focus Mode</span>
                          </button>
                          {visibleDialogs.isCarouselDialogVisible && (
                            <dialog ref={carouselDialogRef} className="carousel-dialog dialog-width-lg" role="dialog" aria-label="Focus Mode" onClose={() => setDialogVisible("isCarouselDialogVisible", false)}>
                              <div className="header">
                                <h2 className="title">Focus Mode</h2>
                                <button onClick={hideCarouselDialog} aria-label="Close">
                                  {getIconElement("close")}
                                </button>
                              </div>
                              <div className="subText">Now is the time to focus! Discuss one feedback item at a time and create actionable work items.</div>
                              <div className="subText">{state.focusModeModel && <FeedbackCarousel focusModeModel={state.focusModeModel} isFocusModalHidden={false} />}</div>
                            </dialog>
                          )}
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
              <button title="Create Board" onClick={() => showBoardCreationDialog()} className="create-new-board-button">
                Create Board
              </button>
            </div>
          )}
          {state.activeTab === "Board" && state.currentBoard && (
            <div className="feedback-board-container">
              {state.currentTeam && state.currentBoard && (
                <>
                  {!isHostedAzureDevOps && state.isLiveSyncInTfsIssueMessageBarVisible && !state.isBackendServiceConnected && (
                    <div className="retro-message-bar">
                      <span>
                        <em>Retrospectives</em> does not support live updates for on-premise installations. To see updates from other users, please refresh the page.
                      </span>
                      <div className="actions">
                        <button type="button" className="dismiss" onClick={hideLiveSyncInTfsIssueMessageBar} aria-label="Dismiss notification">
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {!isHostedAzureDevOps && state.isDropIssueInEdgeMessageBarVisible && !state.isBackendServiceConnected && (
                    <div className="retro-message-bar" role="alert" aria-live="assertive">
                      <span>If your browser does not support grouping a card by dragging and dropping, we recommend using the ellipsis menu on the top-right corner of the feedback.</span>
                      <div className="actions">
                        <button type="button" className="dismiss" onClick={hideDropIssueInEdgeMessageBar} aria-label="Dismiss notification">
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {isHostedAzureDevOps && state.isLiveSyncInTfsIssueMessageBarVisible && !state.isBackendServiceConnected && (
                    <div className="retro-message-bar" role="alert" aria-live="assertive">
                      <span>
                        {state.isBackendServiceReconnecting
                          ? "We are reconnecting to the live syncing service."
                          : <>We are unable to connect to the live syncing service. You can continue to create and edit items as usual, but changes will not be updated in real-time to or from other users. <a href="https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#live-sync-troubleshooting" target="_blank" rel="noopener noreferrer">Troubleshooting steps</a></>
                        }
                      </span>
                      <div className="actions">
                        <button
                          type="button"
                          onClick={retryBackendConnection}
                          aria-label="Retry live sync"
                          title="Retry live sync"
                          disabled={state.isBackendServiceReconnecting}
                        >
                          <span>{state.isBackendServiceReconnecting ? "Retrying..." : "Retry"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={hideLiveSyncInTfsIssueMessageBar}
                          aria-label="Dismiss notification"
                          title="Dismiss notification"
                        >
                          <span>Dismiss</span>
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
                      setContainerState(previousState => ({ ...previousState, focusModeModel }));
                    }}
                    sortMode={state.actColumnSortMode}
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
      {state.currentBoard && visibleDialogs.isArchiveBoardDialogVisible && (
        <dialog className="archive-board-dialog dialog-width-sm" aria-label={t("feedback_board_archive_title")} role="dialog" ref={archiveBoardDialogRef} onClose={() => setDialogVisible("isArchiveBoardDialogVisible", false)}>
          <div className="header">
            <h2 className="title">{t("feedback_board_archive_title")}</h2>
            <button onClick={() => hideDialog("isArchiveBoardDialogVisible", archiveBoardDialogRef)} aria-label={t("common_close")}>
              {getIconElement("close")}
            </button>
          </div>
          <div className="subText">{t("feedback_board_archive_message", { title: state.currentBoard.title })}</div>
          <div className="subText">{t("feedback_board_archive_note")}</div>
          <div className="inner">
            <button className="button" onClick={() => archiveCurrentBoard()}>
              {t("feedback_board_archive_button")}
            </button>
            <button className="default button" onClick={() => hideDialog("isArchiveBoardDialogVisible", archiveBoardDialogRef)}>
              {t("common_cancel")}
            </button>
          </div>
        </dialog>
      )}
      {visibleDialogs.isBoardCreationDialogVisible && renderBoardUpdateMetadataFormDialog(
        boardCreationDialogRef,
        true,
        false,
        hideBoardCreationDialog,
        t("feedback_board_create_new"),
        t("feedback_board_create_example", { date: formatDate(new Date(), { year: "numeric", month: "long" }) }),
        createBoard,
        hideBoardCreationDialog,
        boardCreationInitialTitleOverride,
        () => {
          setBoardCreationInitialTitleOverride(undefined);
          setDialogVisible("isBoardCreationDialogVisible", false);
        },
      )}
      {state.currentBoard && visibleDialogs.isBoardDuplicateDialogVisible && renderBoardUpdateMetadataFormDialog(boardDuplicateDialogRef, true, true, hideBoardDuplicateDialog, t("feedback_board_create_copy"), "", createBoard, hideBoardDuplicateDialog, undefined, () => setDialogVisible("isBoardDuplicateDialogVisible", false))}
      {state.currentBoard && visibleDialogs.isBoardUpdateDialogVisible && renderBoardUpdateMetadataFormDialog(boardUpdateDialogRef, false, false, hideBoardUpdateDialog, t("feedback_board_edit"), "", updateBoardMetadata, hideBoardUpdateDialog, undefined, () => setDialogVisible("isBoardUpdateDialogVisible", false))}
      {state.currentBoard && visibleDialogs.isPreviewEmailDialogVisible && (
        <dialog ref={previewEmailDialogRef} className="preview-email-dialog dialog-width-md" aria-label={t("feedback_board_email_summary")} role="dialog" onClose={() => setDialogVisible("isPreviewEmailDialogVisible", false)}>
          <div className="header">
            <h2 className="title">{t("feedback_board_email_summary")}</h2>
            <button onClick={() => hideDialog("isPreviewEmailDialogVisible", previewEmailDialogRef)} aria-label={t("common_close")}>
              {getIconElement("close")}
            </button>
          </div>
          <div className="subText">
            <textarea rows={20} className="preview-email-content" readOnly={true} aria-label={t("feedback_board_email_summary_aria")} value={state.currentBoard.emailContent}></textarea>
          </div>
          <div className="inner">
            <button title={t("common_copy_to_clipboard")} aria-label={t("common_copy_to_clipboard")} onClick={showEmailCopiedToast}>
              {getIconElement("content-copy")}
              {t("common_copy_to_clipboard")}
            </button>
            <button title={t("common_download_pdf")} aria-label={t("common_download_pdf")} onClick={downloadEmailSummaryPdf} className="default button">
              {getIconElement("sim-card-download")}
              {t("common_download_pdf")}
            </button>
          </div>
        </dialog>
      )}
      {state.currentBoard && visibleDialogs.isRetroSummaryDialogVisible && (
        <dialog ref={retroSummaryDialogRef} className="retro-summary-dialog dialog-width-lg" aria-label={t("feedback_board_retro_summary")} role="dialog" onClose={() => setDialogVisible("isRetroSummaryDialogVisible", false)}>
          <div className="header">
            <h2 className="title">{t("feedback_board_retro_summary")}</h2>
            <button type="button" onClick={hideRetroSummaryDialog} aria-label={t("common_close")}>
              {getIconElement("close")}
            </button>
          </div>
          <div className="subText">
            <section className="retro-summary-section">
              <div className="retro-summary-section-header">{t("feedback_board_basic_settings")}</div>
              <div id="retro-summary-created-date">{t("feedback_board_created_date", { date: formatDate(new Date(state.currentBoard.createdDate), { year: "numeric", month: "short", day: "numeric" }) })}</div>
              <div id="retro-summary-created-by">
                {t("feedback_board_created_by")} <img className="avatar" src={state.currentBoard?.createdBy.imageUrl} alt={state.currentBoard?.createdBy.displayName} /> {state.currentBoard?.createdBy.displayName}{" "}
              </div>
            </section>
            <section className="retro-summary-section">
              <div className="retro-summary-section-header">{t("feedback_board_participant_summary")}</div>
              <div className="retro-summary-section-item">{t("feedback_board_contributors_count", { count: state.contributors.length })}</div>

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
                  {t("feedback_board_votes_summary", {
                    participants: Object.keys(state.currentBoard?.boardVoteCollection || {}).length,
                    votes: state.castedVoteCount,
                  })}
                </div>
                <div className="retro-summary-section-item horizontal-group-item">{t("feedback_board_feedback_items_created", { count: state.feedbackItems.length })}</div>
                <div className="retro-summary-section-item horizontal-group-item">{t("feedback_board_action_items_created", { count: state.actionItemIds.length })}</div>
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
                        const teamAssessmentQuestion = data.teamAssessmentQuestion || state.effectivenessMeasurementSummary.find(summary => summary.questionId === data.questionId)?.teamAssessmentQuestion || questions.find(question => question.id === data.questionId);
                        const averageScore = state.effectivenessMeasurementSummary.filter(e => e.questionId == data.questionId)[0]?.average ?? 0;
                        const greenScore = (data.green * 100) / teamEffectivenessResponseCount;
                        const yellowScore = (data.yellow * 100) / teamEffectivenessResponseCount;
                        const redScore = (data.red * 100) / teamEffectivenessResponseCount;
                        if (!teamAssessmentQuestion) {
                          return null;
                        }
                        return (
                          <li className="chart-question-block" key={data.questionId}>
                            <div className="chart-question">
                              {getIconElement(teamAssessmentQuestion.iconClassName)} &nbsp;
                              {teamAssessmentQuestion.shortTitle}
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
                            {!teamAssessmentQuestion.isCustom && (
                              <button className="assessment-chart-action" title={`${state.feedbackItems.length > 0 ? "There are feedback items created for this board, you cannot change the board template" : `Clicking this will modify the board template to the "${teamAssessmentQuestion.shortTitle} template" allowing your team to discuss and take actions using the retrospective board`}`} disabled={state.feedbackItems.length > 0} onClick={() => showDiscussAndActDialog(data.questionId)}>
                                Discuss and Act
                              </button>
                            )}
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
      {visibleDialogs.isTeamAssessmentHistoryDialogVisible && <dialog ref={teamAssessmentHistoryDialogRef} className="team-assessment-history-dialog dialog-width-xl" aria-label={t("feedback_board_team_assessment_history")} role="dialog" onClose={() => setDialogVisible("isTeamAssessmentHistoryDialogVisible", false)}>
        <div className="header">
          <h2>{t("feedback_board_team_assessment_history")}</h2>
          <button type="button" onClick={hideTeamAssessmentHistoryDialog} aria-label={t("common_close")}>
            {getIconElement("close")}
          </button>
        </div>
        {state.teamAssessmentHistoryData.slice(-13).length === 0 ? (
          <div className="subText">
            <p>{t("feedback_board_team_assessment_no_history")}</p>
            <p>{t("feedback_board_team_assessment_trends")}</p>
          </div>
        ) : (
          <div className="subText">
            <p className="team-assessment-info-text">
              {t("feedback_board_team_assessment_showing_average_scores", {
                count: state.teamAssessmentHistoryData.slice(-13).length,
                suffix: state.teamAssessmentHistoryData.slice(-13).length !== 1 ? "s" : "",
              })}
            </p>
            <TeamAssessmentHistoryChart historyData={state.teamAssessmentHistoryData.slice(-13)} numberFormatter={numberFormatter} />
          </div>
        )}
      </dialog>}
      <ToastContainer className="retrospective-notification-toast-container" toastClassName="retrospective-notification-toast" progressClassName="retrospective-notification-toast-progress-bar" />
    </div>
  );
}

export default FeedbackBoardContainer;
