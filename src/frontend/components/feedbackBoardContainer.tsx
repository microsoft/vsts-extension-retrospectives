import React from "react";
import { ActionButton, DefaultButton, IconButton, MessageBarButton, PrimaryButton } from "@fluentui/react/lib/Button";
import { ContextualMenuItemType, IContextualMenuItem } from "@fluentui/react/lib/ContextualMenu";
import { Dialog, DialogType, DialogFooter, DialogContent } from "@fluentui/react/lib/Dialog";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";

import { WorkflowPhase } from "../interfaces/workItem";
import WorkflowStage from "./workflowStage";
import BoardDataService from "../dal/boardDataService";
import { FeedbackBoardDocumentHelper, IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions, IFeedbackColumn, IFeedbackItemDocument } from "../interfaces/feedback";
import { reflectBackendService } from "../dal/reflectBackendService";
import BoardSummaryTable from "./boardSummaryTable";
import FeedbackBoardMetadataForm from "./feedbackBoardMetadataForm";
import FeedbackBoard from "../components/feedbackBoard";

import { azureDevOpsCoreService } from "../dal/azureDevOpsCoreService";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { getBoardUrl } from "../utilities/boardUrlHelper";
import NoFeedbackBoardsView from "./noFeedbackBoardsView";
import { userDataService } from "../dal/userDataService";
import ExtensionSettingsMenu from "./extensionSettingsMenu";
import SelectorCombo, { ISelectorList } from "./selectorCombo";
import FeedbackBoardPreviewEmail from "./feedbackBoardPreviewEmail";
import { ToastContainer, toast, Slide } from "react-toastify";
import { WorkItemType, WorkItemTypeReference } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { shareBoardHelper } from "../utilities/shareBoardHelper";
import { itemDataService } from "../dal/itemDataService";
import { TeamMember } from "azure-devops-extension-api/WebApi";
import EffectivenessMeasurementRow from "./effectivenessMeasurementRow";

import { encrypt, getUserIdentity } from "../utilities/userIdentityHelper";
import { getQuestionName, getQuestionShortName, getQuestionTooltip, getQuestionFontAwesomeClass, questions } from "../utilities/effectivenessMeasurementQuestionHelper";

import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { appInsights, reactPlugin, TelemetryEvents } from "../utilities/telemetryClient";
import { copyToClipboard } from "../utilities/clipboardHelper";
import { getColumnsByTemplateId } from "../utilities/boardColumnsHelper";
import { FeedbackBoardPermissionOption } from "./feedbackBoardMetadataFormPermissions";
import { CommonServiceIds, IHostNavigationService } from "azure-devops-extension-api/Common/CommonServices";
import { getService } from "azure-devops-extension-sdk";

export interface FeedbackBoardContainerProps {
  isHostedAzureDevOps: boolean;
  projectId: string;
}

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
  isReconnectingToBackendService: boolean;
  isSummaryDashboardVisible: boolean;
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
  isPreviewEmailDialogHidden: boolean;
  isRetroSummaryDialogHidden: boolean;
  isBoardCreationDialogHidden: boolean;
  isBoardDuplicateDialogHidden: boolean;
  isBoardUpdateDialogHidden: boolean;
  isArchiveBoardConfirmationDialogHidden: boolean;
  isMobileBoardActionsDialogHidden: boolean;
  isMobileTeamSelectorDialogHidden: boolean;
  isTeamBoardDeletedInfoDialogHidden: boolean;
  isTeamSelectorCalloutVisible: boolean;
  teamBoardDeletedDialogMessage: string;
  teamBoardDeletedDialogTitle: string;
  isCarouselDialogHidden: boolean;
  isIncludeTeamEffectivenessMeasurementDialogHidden: boolean;
  isTeamAssessmentHistoryDialogHidden: boolean;
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

class FeedbackBoardContainer extends React.Component<FeedbackBoardContainerProps, FeedbackBoardContainerState> {
  constructor(props: FeedbackBoardContainerProps) {
    super(props);
    this.state = {
      allWorkItemTypes: [],
      allowCrossColumnGroups: false,
      boards: [],
      currentUserId: getUserIdentity().id,
      currentBoard: undefined,
      currentTeam: undefined,
      filteredProjectTeams: [],
      filteredUserTeams: [],
      hasToggledArchive: false,
      isAllTeamsLoaded: false,
      isAppInitialized: false,
      isBackendServiceConnected: false,
      isBoardCreationDialogHidden: true,
      isBoardDuplicateDialogHidden: true,
      isBoardUpdateDialogHidden: true,
      isCarouselDialogHidden: true,
      isIncludeTeamEffectivenessMeasurementDialogHidden: true,
      isTeamAssessmentHistoryDialogHidden: true,
      isArchiveBoardConfirmationDialogHidden: true,
      isDropIssueInEdgeMessageBarVisible: true,
      isLiveSyncInTfsIssueMessageBarVisible: true,
      isMobileBoardActionsDialogHidden: true,
      isMobileTeamSelectorDialogHidden: true,
      isPreviewEmailDialogHidden: true,
      isRetroSummaryDialogHidden: true,
      isReconnectingToBackendService: false,
      isSummaryDashboardVisible: false,
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
      teamAssessmentHistoryData: [],
    };
  }

  private boardTimerIntervalId?: number;

  public async componentDidMount() {
    let initialCurrentTeam: WebApiTeam | undefined;
    let initialCurrentBoard: IFeedbackBoardDocument | undefined;

    try {
      const isBackendServiceConnected = await reflectBackendService.startConnection();
      this.setState({ isBackendServiceConnected });
    } catch (error) {
      appInsights.trackException(error, {
        action: "connect",
      });
    }

    try {
      const initializedTeamAndBoardState = await this.initializeFeedbackBoard();
      initialCurrentTeam = initializedTeamAndBoardState.currentTeam;
      initialCurrentBoard = initializedTeamAndBoardState.currentBoard;

      await this.initializeProjectTeams(initialCurrentTeam);

      this.setState({ ...initializedTeamAndBoardState, isTeamDataLoaded: true });
    } catch (error) {
      appInsights.trackException(error, {
        action: "initializeTeamAndBoardState",
      });
    }

    try {
      await this.setSupportedWorkItemTypesForProject();
    } catch (error) {
      appInsights.trackException(error, {
        action: "setSupportedWorkItemTypesForProject",
      });
    }

    try {
      await this.updateFeedbackItemsAndContributors(initialCurrentTeam, initialCurrentBoard);
    } catch (error) {
      appInsights.trackException(error, {
        action: "updateFeedbackItemsAndContributors",
      });
    }

    try {
      this.setState(this.getVoteMetricsState(initialCurrentBoard));
    } catch (error) {
      appInsights.trackException(error, {
        action: "votes",
      });
    }

    try {
      reflectBackendService.onConnectionClose(() => {
        this.setState({
          isBackendServiceConnected: false,
          isReconnectingToBackendService: true,
        });
        setTimeout(this.tryReconnectToBackend, 2000);
      });

      // Listen for signals for board updates.
      reflectBackendService.onReceiveNewBoard(this.handleBoardCreated);
      reflectBackendService.onReceiveDeletedBoard(this.handleBoardDeleted);
      reflectBackendService.onReceiveUpdatedBoard(this.handleBoardUpdated);
    } catch (e) {
      appInsights.trackException(e, {
        action: "catchError",
      });
    }

    this.setState({ isAppInitialized: true });
  }

  public componentDidUpdate(prevProps: FeedbackBoardContainerProps, prevState: FeedbackBoardContainerState) {
    if (prevState.currentTeam !== this.state.currentTeam) {
      appInsights.trackEvent({ name: TelemetryEvents.TeamSelectionChanged, properties: { teamId: this.state.currentTeam.id } });
    }
    if (prevState.currentBoard !== this.state.currentBoard) {
      reflectBackendService.switchToBoard(this.state.currentBoard ? this.state.currentBoard.id : undefined);
      appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardSelectionChanged, properties: { boardId: this.state.currentBoard?.id } });
      if (this.state.isAppInitialized) {
        userDataService.addVisit(this.state.currentTeam.id, this.state.currentBoard ? this.state.currentBoard.id : undefined);
      }
      // Update vote counts when board changes
      if (this.state.currentTeam && this.state.currentBoard) {
        this.updateFeedbackItemsAndContributors(this.state.currentTeam, this.state.currentBoard);
      }
      if (prevState.currentBoard?.id !== this.state.currentBoard?.id) {
        this.resetBoardTimer();
      }
    }
    if (prevState.activeTab !== this.state.activeTab && this.state.activeTab !== "Board") {
      this.pauseBoardTimer();
    }
  }

  public componentWillUnmount() {
    reflectBackendService.removeOnReceiveNewBoard(this.handleBoardCreated);
    reflectBackendService.removeOnReceiveDeletedBoard(this.handleBoardDeleted);
    reflectBackendService.removeOnReceiveUpdatedBoard(this.handleBoardUpdated);
    this.clearBoardTimerInterval();
  }

  private readonly clearBoardTimerInterval = () => {
    if (this.boardTimerIntervalId !== undefined) {
      window.clearInterval(this.boardTimerIntervalId);
      this.boardTimerIntervalId = undefined;
    }
  };

  private readonly startBoardTimer = () => {
    if (this.boardTimerIntervalId !== undefined) {
      return;
    }

    const isActPhase = this.getCurrentBoardPhase() === WorkflowPhase.Act;

    if (!isActPhase && this.state.boardTimerSeconds === 0) {
      this.setState({ boardTimerSeconds: this.state.countdownDurationMinutes * 60 });
    }

    this.boardTimerIntervalId = window.setInterval(() => {
      this.setState(previousState => {
        const isActPhase = this.getCurrentBoardPhase() === WorkflowPhase.Act;
        
        if (isActPhase) {
          return { boardTimerSeconds: previousState.boardTimerSeconds + 1 };
        } else {
          const newSeconds = previousState.boardTimerSeconds - 1;
          if (newSeconds <= 0) {
            this.pauseBoardTimer();
            return { boardTimerSeconds: 0 };
          }
          return { boardTimerSeconds: newSeconds };
        }
      });
    }, 1000);

    if (!this.state.isBoardTimerRunning) {
      this.setState({ isBoardTimerRunning: true });
    }
  };

  private readonly pauseBoardTimer = () => {
    const wasRunning = this.state.isBoardTimerRunning;
    const hadInterval = this.boardTimerIntervalId !== undefined;
    this.clearBoardTimerInterval();

    if (wasRunning || hadInterval) {
      this.setState({ isBoardTimerRunning: false });
    }
  };

  private readonly resetBoardTimer = () => {
    const shouldReset = this.state.boardTimerSeconds !== 0 || this.state.isBoardTimerRunning || this.boardTimerIntervalId !== undefined;

    if (!shouldReset) {
      return;
    }

    this.clearBoardTimerInterval();
    this.setState({ boardTimerSeconds: 0, isBoardTimerRunning: false });
  };

  private readonly handleBoardTimerToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (this.state.isBoardTimerRunning) {
      this.pauseBoardTimer();
      return;
    }

    this.startBoardTimer();
  };

  private readonly handleBoardTimerReset = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    this.resetBoardTimer();
  };

  private readonly handleCountdownDurationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const duration = parseInt(event.target.value, 10);
    this.setState({ countdownDurationMinutes: duration });
  };

  private readonly formatBoardTimer = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  private async updateUrlWithBoardAndTeamInformation(teamId: string, boardId: string) {
    const currentPhase = this.getCurrentBoardPhase();
    getService<IHostNavigationService>(CommonServiceIds.HostNavigationService).then(service => {
      service.setHash(`teamId=${teamId}&boardId=${boardId}&phase=${currentPhase}`);
    });
  }

  private async parseUrlForBoardAndTeamInformation(): Promise<{ teamId: string; boardId: string; phase?: WorkflowPhase }> {
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
  }

  private async updateFeedbackItemsAndContributors(currentTeam: WebApiTeam, currentBoard: IFeedbackBoardDocument) {
    if (!currentTeam || !currentBoard) {
      return;
    }

    const board: IFeedbackBoardDocument = await itemDataService.getBoardItem(currentTeam.id, currentBoard.id);

    const feedbackItems = (await itemDataService.getFeedbackItemsForBoard(board?.id)) ?? [];

    await this.updateUrlWithBoardAndTeamInformation(currentTeam.id, board.id);

    let actionItemIds: number[] = [];
    feedbackItems.forEach(item => {
      actionItemIds = actionItemIds.concat(item.associatedActionItemIds);
    });

    const contributors = feedbackItems
      .map(e => {
        return { id: e.userIdRef, name: e?.createdBy?.displayName, imageUrl: e?.createdBy?.imageUrl };
      })
      .filter((v, i, a) => a.indexOf(v) === i);

    const voteMetricsState = this.getVoteMetricsState(board);

    this.setState({
      actionItemIds: actionItemIds.filter(item => item !== undefined),
      feedbackItems,
      contributors: [...new Set(contributors.map(e => e.id))].map(e => contributors.find(i => i.id === e)),
      ...voteMetricsState,
    });
  }

  private readonly getVoteMetricsState = (
    board: IFeedbackBoardDocument | undefined,
  ): Pick<FeedbackBoardContainerState, "castedVoteCount" | "currentVoteCount" | "teamVoteCapacity"> => {
    if (!board || !this.state.currentUserId) {
      return {
        castedVoteCount: 0,
        currentVoteCount: "0",
        teamVoteCapacity: 0,
      };
    }

    const voteCollection = board.boardVoteCollection || {};
    const votes = Object.values(voteCollection);
    const totalVotesUsed = votes.length > 0 ? votes.reduce((sum, vote) => sum + vote, 0) : 0;

    const userIdKey = encrypt(this.state.currentUserId);
    const currentUserVotes = voteCollection[userIdKey]?.toString() || "0";

    const voterCount = Object.keys(voteCollection).length;
    const maxVotesPerUser = board.maxVotesPerUser ?? 0;
    const teamVoteCapacity = voterCount > 0 && maxVotesPerUser > 0 ? voterCount * maxVotesPerUser : 0;

    return {
      castedVoteCount: totalVotesUsed,
      currentVoteCount: currentUserVotes,
      teamVoteCapacity,
    };
  };

  private readonly numberFormatter = (value: number) => {
    const formatter = new Intl.NumberFormat("en-US", { style: "decimal", minimumFractionDigits: 1, maximumFractionDigits: 1 });

    return formatter.format(value);
  };

  private readonly percentageFormatter = (value: number) => {
    const formatter = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

    return formatter.format(value / 100);
  };

  private readonly handleBoardCreated = async (teamId: string, boardId: string) => {
    if (!teamId || this.state.currentTeam.id !== teamId) {
      return;
    }

    const boardToAdd = await BoardDataService.getBoardForTeamById(this.state.currentTeam.id, boardId);

    if (!boardToAdd) {
      return;
    }

    // @ts-ignore TS2345
    this.setState(prevState => {
      const boardsForTeam = [...prevState.boards, boardToAdd]
        .filter((board: IFeedbackBoardDocument) =>
          FeedbackBoardDocumentHelper.filter(
            board,
            this.state.userTeams.map(t => t.id),
            this.state.currentUserId,
          ),
        )
        .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));

      const baseResult = {
        boards: boardsForTeam,
        isTeamBoardDeletedInfoDialogHidden: true,
      };

      if (boardsForTeam.length === 1) {
        return {
          ...baseResult,
          currentBoard: boardsForTeam[0],
        };
      }

      return baseResult;
    });
  };

  private readonly setSupportedWorkItemTypesForProject = async (): Promise<void> => {
    const allWorkItemTypes: WorkItemType[] = await workItemService.getWorkItemTypesForCurrentProject();
    const hiddenWorkItemTypes: WorkItemTypeReference[] = await workItemService.getHiddenWorkItemTypes();

    const hiddenWorkItemTypeNames = hiddenWorkItemTypes.map(workItemType => workItemType.name);

    const nonHiddenWorkItemTypes = allWorkItemTypes.filter(workItemType => hiddenWorkItemTypeNames.indexOf(workItemType.name) === -1);

    this.setState({
      nonHiddenWorkItemTypes: nonHiddenWorkItemTypes,
      allWorkItemTypes: allWorkItemTypes,
    });
  };

  private readonly replaceBoard = (updatedBoard: IFeedbackBoardDocument) => {
    this.setState(prevState => {
      const newBoards = prevState.boards.map(board => (board.id === updatedBoard.id ? updatedBoard : board));

      const newCurrentBoard = this.state.currentBoard && this.state.currentBoard.id === updatedBoard.id ? updatedBoard : this.state.currentBoard;

      return {
        boards: newBoards,
        currentBoard: newCurrentBoard,
      };
    });
  };

  private readonly handleBoardUpdated = async (teamId: string, updatedBoardId: string) => {
    if (!teamId || this.state.currentTeam.id !== teamId) {
      return;
    }

    const updatedBoard = await BoardDataService.getBoardForTeamById(this.state.currentTeam.id, updatedBoardId);

    if (!updatedBoard) {
      // Board has been deleted after the update. Just ignore the update. The delete should be handled on its own.
      return;
    }

    this.replaceBoard(updatedBoard);
  };

  private readonly handleBoardDeleted = async (teamId: string, deletedBoardId: string) => {
    if (!teamId || this.state.currentTeam.id !== teamId) {
      return;
    }

    this.setState(
      (prevState): Pick<FeedbackBoardContainerState, "boards" | "currentBoard" | "isBoardUpdateDialogHidden" | "isTeamBoardDeletedInfoDialogHidden" | "isCarouselDialogHidden" | "teamBoardDeletedDialogTitle" | "teamBoardDeletedDialogMessage"> => {
        const currentBoards = prevState.boards;
        // Note: Javascript filter maintains order.
        const boardsForTeam = currentBoards.filter(board => board.id !== deletedBoardId);

        if (prevState.currentBoard && deletedBoardId === prevState.currentBoard.id) {
          if (!boardsForTeam || boardsForTeam.length === 0) {
            reflectBackendService.switchToBoard(undefined);
            return {
              boards: [],
              currentBoard: null,
              isBoardUpdateDialogHidden: true,
              isTeamBoardDeletedInfoDialogHidden: false,
              isCarouselDialogHidden: true,
              teamBoardDeletedDialogTitle: "Retrospective archived or deleted",
              teamBoardDeletedDialogMessage: "The retrospective you were viewing has been archived or deleted by another user.",
            };
          }

          const currentBoard = boardsForTeam[0];
          reflectBackendService.switchToBoard(currentBoard.id);
          return {
            boards: boardsForTeam,
            currentBoard: currentBoard,
            isBoardUpdateDialogHidden: true,
            isTeamBoardDeletedInfoDialogHidden: false,
            isCarouselDialogHidden: true,
            teamBoardDeletedDialogTitle: "Retrospective archived or deleted",
            teamBoardDeletedDialogMessage: "The retrospective you were viewing has been archived or deleted by another user. You will be switched to the last created retrospective for this team.",
          };
        }

        return {
          boards: boardsForTeam,
          currentBoard: prevState.currentBoard,
          isBoardUpdateDialogHidden: prevState.isBoardUpdateDialogHidden,
          isTeamBoardDeletedInfoDialogHidden: prevState.isTeamBoardDeletedInfoDialogHidden,
          isCarouselDialogHidden: prevState.isCarouselDialogHidden,
          teamBoardDeletedDialogTitle: prevState.teamBoardDeletedDialogTitle,
          teamBoardDeletedDialogMessage: prevState.teamBoardDeletedDialogMessage,
        };
      },
      async () => {
        await userDataService.addVisit(this.state.currentTeam?.id, this.state.currentBoard?.id);
      },
    );
  };

  /**
   * @description Loads team data for this project and the current user. Attempts to use query
   * params or user records to pre-select team and board, otherwise default to the first team
   * the current user is a part of and most recently created board.
   * @returns An object to update the state with initialized team and board data.
   */
  private readonly initializeFeedbackBoard = async (): Promise<{
    userTeams: WebApiTeam[];
    filteredUserTeams: WebApiTeam[];
    currentTeam: WebApiTeam;
    boards: IFeedbackBoardDocument[];
    currentBoard: IFeedbackBoardDocument;
    isTeamBoardDeletedInfoDialogHidden: boolean;
    teamBoardDeletedDialogTitle: string;
    teamBoardDeletedDialogMessage: string;
  }> => {
    const userTeams = await azureDevOpsCoreService.getAllTeams(this.props.projectId, true);
    userTeams?.sort((t1, t2) => {
      return t1.name.localeCompare(t2.name, [], { sensitivity: "accent" });
    });

    // Default to select first user team or the project's default team.
    const defaultTeam = userTeams?.length ? userTeams[0] : await azureDevOpsCoreService.getDefaultTeam(this.props.projectId);

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
        const matchedTeam = await azureDevOpsCoreService.getTeam(this.props.projectId, teamId);
        if (matchedTeam) {
          this.setState({ currentTeam: matchedTeam });
        }
      }
      if (this.state.currentTeam === undefined) {
        this.setState({ currentTeam: defaultTeam });
      }

      const newBoard = await this.createBoard(name, parseInt(maxVotes), columns, isTeamAssessment === "true", false, false, { Members: [], Teams: [] });

      parent.location.href = await getBoardUrl(this.state.currentTeam.id, newBoard.id, newBoard.activePhase);
    }

    const info = await this.parseUrlForBoardAndTeamInformation();
    try {
      if (!info) {
        if (!this.props.isHostedAzureDevOps) {
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
      const recentVisitState = await this.loadRecentlyVisitedOrDefaultTeamAndBoardState(defaultTeam, userTeams);

      return {
        ...baseTeamState,
        ...recentVisitState,
      };
    }

    // Attempt to pre-select the team based on the teamId query param.
    const teamIdQueryParam = info.teamId;
    const matchedTeam = await azureDevOpsCoreService.getTeam(this.props.projectId, teamIdQueryParam);

    if (!matchedTeam) {
      // If the teamId query param wasn't valid attempt to pre-select a team and board by last
      // visited user records.
      const recentVisitState = await this.loadRecentlyVisitedOrDefaultTeamAndBoardState(defaultTeam, userTeams);
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
            this.state.userTeams.map(t => t.id),
            this.state.currentUserId,
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

  private readonly initializeProjectTeams = async (defaultTeam: WebApiTeam) => {
    // true returns all teams that user is a member in the project
    // false returns all teams that are in project
    // intentionally restricting to teams the user is a member
    const allTeams = await azureDevOpsCoreService.getAllTeams(this.props.projectId, true);
    allTeams.sort((t1, t2) => {
      return t1.name.localeCompare(t2.name, [], { sensitivity: "accent" });
    });

    const promises = [];
    for (const team of allTeams) {
      promises.push(azureDevOpsCoreService.getMembers(this.props.projectId, team.id));
    }
    // if user is member of more than one team, then will return duplicates
    Promise.all(promises).then(values => {
      const allTeamMembers: TeamMember[] = [];
      for (const members of values) {
        allTeamMembers.push(...members);
      }
      // Use the helper function
      const uniqueTeamMembers = deduplicateTeamMembers(allTeamMembers);

      this.setState({
        allMembers: uniqueTeamMembers,
        projectTeams: allTeams?.length > 0 ? allTeams : [defaultTeam],
        filteredProjectTeams: allTeams?.length > 0 ? allTeams : [defaultTeam],
        isAllTeamsLoaded: true,
      });
    });
  };

  private isCurrentUserTeamAdmin(): boolean {
    return this.state.allMembers?.some(m => m.identity.id === this.state.currentUserId && m.isTeamAdmin) ?? false;
  }

  /**
   * @description Load the last team and board that this user visited, if such records exist.
   * @returns An object to update the state with recently visited or default team and board data.
   */
  private readonly loadRecentlyVisitedOrDefaultTeamAndBoardState = async (
    defaultTeam: WebApiTeam,
    userTeams: WebApiTeam[],
  ): Promise<{
    boards: IFeedbackBoardDocument[];
    currentBoard: IFeedbackBoardDocument;
    currentTeam: WebApiTeam;
  }> => {
    const mostRecentUserVisit = await userDataService.getMostRecentVisit();

    if (mostRecentUserVisit) {
      const mostRecentTeam = await azureDevOpsCoreService.getTeam(this.props.projectId, mostRecentUserVisit.teamId);

      if (mostRecentTeam) {
        let boardsForTeam = await BoardDataService.getBoardsForTeam(mostRecentTeam.id);
        if (boardsForTeam?.length > 0) {
          boardsForTeam = boardsForTeam
            .filter((board: IFeedbackBoardDocument) =>
              FeedbackBoardDocumentHelper.filter(
                board,
                userTeams.map(t => t.id),
                this.state.currentUserId,
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
            this.state.currentUserId,
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
  private readonly setCurrentTeam = async (teamId: string) => {
    this.setState({ isTeamDataLoaded: false });
    const matchedTeam = this.state.projectTeams.find(team => team.id === teamId) || this.state.userTeams.find(team => team.id === teamId);

    if (matchedTeam) {
      let boardsForTeam = await BoardDataService.getBoardsForTeam(matchedTeam.id);
      if (boardsForTeam?.length) {
        boardsForTeam = boardsForTeam
          .filter((board: IFeedbackBoardDocument) =>
            FeedbackBoardDocumentHelper.filter(
              board,
              this.state.userTeams.map(t => t.id),
              this.state.currentUserId,
            ),
          )
          .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));
      }

      // @ts-ignore TS2345
      this.setState(prevState => {
        // Ensure that we are actually changing teams to prevent needless rerenders.
        if (!prevState.currentTeam || prevState.currentTeam.id !== matchedTeam.id) {
          return {
            boards: boardsForTeam?.length ? boardsForTeam : [],
            currentBoard: boardsForTeam?.length ? boardsForTeam[0] : null,
            currentTeam: matchedTeam,
            isTeamDataLoaded: true,
          };
        }

        return {};
      });
    }
  };

  private readonly handleArchiveToggle = (): void => {
    this.setState({ hasToggledArchive: true });
  };

  // Handle when "Board" tab is clicked
  private readonly handlePivotClick = async (tabName: "Board" | "History"): Promise<void> => {
    this.setState({ activeTab: tabName });

    if (tabName === "Board") {
      // Check if "Board" tab is clicked
      if (this.state.hasToggledArchive) {
        // Reload only if archive was toggled
        await this.reloadBoardsForCurrentTeam();
        this.setState({ hasToggledArchive: false }); // Reset the flag after reload
      }
    }
  };

  /**
   * @description Loads all feedback boards for the current team. Defaults the selected board to
   * the most recently created board.
   */
  private readonly reloadBoardsForCurrentTeam = async () => {
    this.setState({ isTeamDataLoaded: false });

    let boardsForTeam = await BoardDataService.getBoardsForTeam(this.state.currentTeam.id);

    if (!boardsForTeam.length) {
      this.setState({
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
          this.state.userTeams.map(t => t.id),
          this.state.currentUserId,
        ),
      )
      .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));

    this.setState({
      isTeamDataLoaded: true,
      boards: boardsForTeam,
      currentBoard: boardsForTeam[0],
    });
  };

  /**
   * @description Attempts to select a board from the specified boardId. If the boardId is valid,
   * currentBoard is set to the new board. If not, nothing changes.
   * @param boardId The id of the board to select.
   */
  private readonly setCurrentBoard = (selectedBoard: IFeedbackBoardDocument) => {
    const matchedBoard = this.state.boards.find(board => board.id === selectedBoard.id);

    if (matchedBoard.teamEffectivenessMeasurementVoteCollection === undefined) {
      matchedBoard.teamEffectivenessMeasurementVoteCollection = [];
    }

    if (matchedBoard) {
      // @ts-ignore TS2345
      this.setState(prevState => {
        // Ensure that we are actually changing boards to prevent needless rerenders.
        if (!prevState.currentBoard || prevState.currentBoard.id !== matchedBoard.id) {
          return {
            currentBoard: matchedBoard,
          };
        }

        return {};
      });
    }
  };

  private readonly changeSelectedTeam = (team: WebApiTeam) => {
    if (team) {
      if (this.state.currentTeam.id === team.id) {
        return;
      }

      this.setCurrentTeam(team.id);
      appInsights.trackEvent({ name: TelemetryEvents.TeamSelectionChanged, properties: { teamId: team.id } });
    }
  };

  private readonly changeSelectedBoard = async (board: IFeedbackBoardDocument) => {
    if (board) {
      this.setCurrentBoard(board);
      this.updateUrlWithBoardAndTeamInformation(this.state.currentTeam.id, board.id);
      appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardSelectionChanged, properties: { boardId: board.id } });
    }
  };

  private readonly clickWorkflowStateCallback = (_: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLDivElement>, newPhase: WorkflowPhase) => {
    appInsights.trackEvent({ name: TelemetryEvents.WorkflowPhaseChanged, properties: { oldWorkflowPhase: this.state.currentBoard.activePhase, newWorkflowPhase: newPhase } });

    this.setState(prevState => {
      const updatedCurrentBoard = prevState.currentBoard;
      updatedCurrentBoard.activePhase = newPhase;

      return {
        currentBoard: updatedCurrentBoard,
      };
    });
  };

  private readonly createBoard = async (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, isBoardAnonymous: boolean, shouldShowFeedbackAfterCollect: boolean, permissions: IFeedbackBoardDocumentPermissions) => {
    const createdBoard = await BoardDataService.createBoardForTeam(
      this.state.currentTeam.id,
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
    await this.reloadBoardsForCurrentTeam();
    this.hideBoardCreationDialog();
    this.hideBoardDuplicateDialog();
    reflectBackendService.broadcastNewBoard(this.state.currentTeam.id, createdBoard.id);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardCreated, properties: { boardId: createdBoard.id } });
    return createdBoard;
  };

  private readonly showBoardCreationDialog = (): void => {
    this.setState({ isBoardCreationDialogHidden: false });
  };

  private readonly hideBoardCreationDialog = (): void => {
    this.setState({ isBoardCreationDialogHidden: true });
  };

  private readonly showPreviewEmailDialog = (): void => {
    this.setState({ isPreviewEmailDialogHidden: false });
  };

  private readonly showRetroSummaryDialog = async () => {
    const measurements: { id: number; selected: number }[] = [];

    const board = await BoardDataService.getBoardForTeamById(this.state.currentTeam.id, this.state.currentBoard.id);
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

    await this.updateFeedbackItemsAndContributors(this.state.currentTeam, board);

    this.setState({
      currentBoard: board,
      isRetroSummaryDialogHidden: false,
      effectivenessMeasurementChartData: chartData,
      effectivenessMeasurementSummary: average,
    });
  };

  private readonly hidePreviewEmailDialog = (): void => {
    this.setState({ isPreviewEmailDialogHidden: true });
  };

  private readonly hideRetroSummaryDialog = (): void => {
    this.setState({ isRetroSummaryDialogHidden: true });
  };

  private readonly showTeamAssessmentHistoryDialog = async () => {
    const allBoards = await BoardDataService.getBoardsForTeam(this.state.currentTeam.id);

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

    this.setState({
      teamAssessmentHistoryData: historyData,
      isTeamAssessmentHistoryDialogHidden: false,
    });

    appInsights.trackEvent({ name: TelemetryEvents.TeamAssessmentHistoryViewed });
  };

  private readonly hideTeamAssessmentHistoryDialog = (): void => {
    this.setState({ isTeamAssessmentHistoryDialogHidden: true });
  };

  private readonly updateBoardMetadata = async (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, shouldShowFeedbackAfterCollect: boolean, isBoardAnonymous: boolean, permissions: IFeedbackBoardDocumentPermissions) => {
    const updatedBoard = await BoardDataService.updateBoardMetadata(this.state.currentTeam.id, this.state.currentBoard.id, maxVotesPerUser, title, columns, permissions);

    this.updateBoardAndBroadcast(updatedBoard);
  };

  private readonly showBoardUpdateDialog = (): void => {
    this.setState({ isBoardUpdateDialogHidden: false });
  };

  private readonly hideBoardUpdateDialog = (): void => {
    this.setState({ isBoardUpdateDialogHidden: true });
  };

  private readonly showBoardDuplicateDialog = (): void => {
    this.setState({ isBoardDuplicateDialogHidden: false });
  };

  private readonly hideBoardDuplicateDialog = (): void => {
    this.setState({ isBoardDuplicateDialogHidden: true });
  };

  // Note: This is temporary, to support older boards that do not have an active phase.
  private readonly getCurrentBoardPhase = () => {
    if (!this.state.currentBoard?.activePhase) {
      return WorkflowPhase.Collect;
    }

    return this.state.currentBoard.activePhase;
  };

  private readonly showArchiveBoardConfirmationDialog = () => {
    this.setState({ isArchiveBoardConfirmationDialogHidden: false });
  };

  private readonly hideArchiveBoardConfirmationDialog = () => {
    this.setState({ isArchiveBoardConfirmationDialogHidden: true });
  };

  private readonly showBoardUrlCopiedToast = () => {
    const currentPhase = this.getCurrentBoardPhase();
    const phaseText = currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1);
    toast(`The link to retrospective ${this.state.currentBoard.title} (${phaseText} phase) has been copied to your clipboard.`);
  };

  private readonly showEmailCopiedToast = () => {
    toast(`The email summary for "${this.state.currentBoard.title}" has been copied to your clipboard.`);
  };

  private readonly tryReconnectToBackend = async () => {
    this.setState({ isReconnectingToBackendService: true });

    const backendConnectionResult = await reflectBackendService.startConnection();
    if (backendConnectionResult) {
      reflectBackendService.switchToBoard(this.state.currentBoard.id);
      this.setState({ isBackendServiceConnected: backendConnectionResult });
    }

    this.setState({ isReconnectingToBackendService: false });
  };

  private readonly archiveCurrentBoard = async () => {
    await BoardDataService.archiveFeedbackBoard(this.state.currentTeam.id, this.state.currentBoard.id);
    reflectBackendService.broadcastDeletedBoard(this.state.currentTeam.id, this.state.currentBoard.id);
    this.hideArchiveBoardConfirmationDialog();
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardArchived, properties: { boardId: this.state.currentBoard.id } });
    await this.reloadBoardsForCurrentTeam();
  };

  private readonly copyBoardUrl = async () => {
    const currentPhase = this.getCurrentBoardPhase();
    const boardDeepLinkUrl = await getBoardUrl(this.state.currentTeam.id, this.state.currentBoard.id, currentPhase);
    copyToClipboard(boardDeepLinkUrl);
  };

  private readonly renderBoardUpdateMetadataFormDialog = (isNewBoardCreation: boolean, isDuplicatingBoard: boolean, hidden: boolean, onDismiss: () => void, dialogTitle: string, placeholderText: string, onSubmit: (title: string, maxVotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, shouldShowFeedbackAfterCollect: boolean, isBoardAnonymous: boolean, permissions: IFeedbackBoardDocumentPermissions) => void, onCancel: () => void) => {
    const permissionOptions: FeedbackBoardPermissionOption[] = [];

    for (const team of this.state.projectTeams) {
      permissionOptions.push({
        id: team.id,
        name: team.name,
        uniqueName: team.projectName,
        type: "team",
      });
    }

    for (const member of this.state.allMembers) {
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
      <Dialog
        hidden={hidden}
        onDismiss={onDismiss}
        dialogContentProps={{
          type: DialogType.normal,
          title: dialogTitle,
        }}
        modalProps={{
          containerClassName: "retrospectives-board-metadata-dialog",
          className: "retrospectives-dialog-modal",
        }}
      >
        <FeedbackBoardMetadataForm isNewBoardCreation={isNewBoardCreation} isDuplicatingBoard={isDuplicatingBoard} currentBoard={this.state.currentBoard} teamId={this.state.currentTeam.id} maxVotesPerUser={this.state.maxVotesPerUser} placeholderText={placeholderText} availablePermissionOptions={permissionOptions} currentUserId={this.state.currentUserId} onFormSubmit={onSubmit} onFormCancel={onCancel} />
      </Dialog>
    );
  };

  private readonly updateCurrentVoteCount = async () => {
    const boardItem = await itemDataService.getBoardItem(this.state.currentTeam.id, this.state.currentBoard.id);
    if (!boardItem) {
      return;
    }

    this.setState(this.getVoteMetricsState(boardItem));
  };

  private readonly updateBoardAndBroadcast = (updatedBoard: IFeedbackBoardDocument) => {
    if (!updatedBoard) {
      this.handleBoardDeleted(this.state.currentTeam.id, this.state.currentBoard.id);
    }

    this.replaceBoard(updatedBoard);

    this.hideBoardUpdateDialog();
    reflectBackendService.broadcastUpdatedBoard(this.state.currentTeam.id, updatedBoard.id);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardMetadataUpdated, properties: { boardId: updatedBoard.id } });
  };

  private readonly persistColumnNotes = async (columnId: string, notes: string): Promise<void> => {
    if (!this.state.currentTeam || !this.state.currentBoard) {
      return;
    }

    const updatedColumns = this.state.currentBoard.columns.map(column => (column.id === columnId ? { ...column, notes } : column));

    try {
      const updatedBoard = await BoardDataService.updateBoardMetadata(this.state.currentTeam.id, this.state.currentBoard.id, this.state.currentBoard.maxVotesPerUser, this.state.currentBoard.title, updatedColumns, this.state.currentBoard.permissions);

      if (!updatedBoard) {
        throw new Error("Failed to update board with new column notes.");
      }

      this.replaceBoard(updatedBoard);
      reflectBackendService.broadcastUpdatedBoard(this.state.currentTeam.id, updatedBoard.id);
    } catch (error) {
      appInsights.trackException(error, {
        action: "updateColumnNotes",
        boardId: this.state.currentBoard?.id,
        columnId,
      });

      throw error;
    }
  };

  private readonly getBoardActionContextualMenuItems = (): IContextualMenuItem[] => {
    const currentPhase = this.getCurrentBoardPhase();
    const phaseText = currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1);

    return [
      {
        key: "createBoard",
        iconProps: { iconName: "Add" },
        onClick: this.showBoardCreationDialog,
        text: "Create new retrospective",
        title: "Create new retrospective",
      },
      {
        key: "duplicateBoard",
        iconProps: { iconName: "Copy" },
        onClick: this.showBoardDuplicateDialog,
        text: "Create copy of retrospective",
        title: "Create copy of retrospective",
      },
      {
        key: "editBoard",
        iconProps: { iconName: "Edit" },
        onClick: this.showBoardUpdateDialog,
        text: "Edit retrospective",
        title: "Edit retrospective",
      },
      {
        key: "seperator",
        itemType: ContextualMenuItemType.Divider,
      },
      {
        key: "copyLink",
        iconProps: { iconName: "Link" },
        onClick: async () => {
          await this.copyBoardUrl();
          this.showBoardUrlCopiedToast();
        },
        text: `Copy retrospective link (for ${phaseText} phase)`,
        title: `Copy retrospective link (for ${phaseText} phase)`,
      },
      {
        key: "seperator",
        itemType: ContextualMenuItemType.Divider,
      },
      {
        key: "exportCSV",
        iconProps: { iconName: "DownloadDocument" },
        onClick: () => {
          shareBoardHelper.generateCSVContent(this.state.currentBoard);
        },
        text: "Export CSV content",
        title: "Export CSV content",
      },
      {
        key: "emailPreview",
        iconProps: { iconName: "Mail" },
        onClick: this.showPreviewEmailDialog,
        text: "Create email summary",
        title: "Create email summary",
      },
      {
        key: "seperator",
        itemType: ContextualMenuItemType.Divider,
      },
      {
        key: "retroSummary",
        iconProps: { iconName: "ReportDocument" },
        onClick: this.showRetroSummaryDialog,
        text: "Show retrospective summary",
        title: "Show retrospective summary",
      },
      {
        key: "teamAssessmentHistory",
        iconProps: { iconName: "TimelineProgress" },
        onClick: this.showTeamAssessmentHistoryDialog,
        text: "Team assessment history",
        title: "Team assessment history",
      },
      {
        key: "seperator",
        itemType: ContextualMenuItemType.Divider,
      },
      {
        key: "archiveBoard",
        iconProps: { iconName: "Archive" },
        onClick: this.showArchiveBoardConfirmationDialog,
        text: "Archive retrospective",
        title: "Archive retrospective",
      },
    ];
  };

  private readonly hideMobileBoardActionsDialog = () => {
    this.setState({
      isMobileBoardActionsDialogHidden: true,
    });
  };

  private readonly showCarouselDialog = () => {
    this.setState({ isCarouselDialogHidden: false });
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackItemCarouselLaunched });
  };

  private readonly hideCarouselDialog = () => {
    this.setState({ isCarouselDialogHidden: true });
  };

  private readonly hideLiveSyncInTfsIssueMessageBar = () => {
    this.setState({ isLiveSyncInTfsIssueMessageBarVisible: false });
  };

  private readonly hideDropIssueInEdgeMessageBar = () => {
    this.setState({ isDropIssueInEdgeMessageBarVisible: false });
  };

  public render() {
    if (!this.state.isAppInitialized || !this.state.isTeamDataLoaded) {
      return <Spinner className="initialization-spinner" size={SpinnerSize.large} label="Loading..." ariaLive="assertive" />;
    }

    const teamSelectorList: ISelectorList<WebApiTeam> = {
      selectorListItems: [
        {
          finishedLoading: this.state.isAppInitialized,
          header: { id: "My Teams", title: "My Teams" },
          items: this.state.userTeams,
        },
        // Removed All Teams
        // Retrospectives should be safe space for team members to share feedback.
        // Therefore, should not have access to other teams's retrospective boards.
      ],
    };

    const boardSelectorList: ISelectorList<IFeedbackBoardDocument> = {
      selectorListItems: [
        {
          finishedLoading: true,
          header: { id: "All Retrospectives", isHidden: true, title: "All Retrospectives" },
          items: this.state.boards,
        },
      ],
    };

    const saveTeamEffectivenessMeasurement = () => {
      const teamEffectivenessMeasurementVoteCollection = this.state.currentBoard.teamEffectivenessMeasurementVoteCollection;
      const currentUserId = encrypt(this.state.currentUserId);
      const currentUserVote = teamEffectivenessMeasurementVoteCollection.find(vote => vote.userId === currentUserId);
      const responseCount = currentUserVote?.responses?.length || 0;

      if (responseCount < questions.length) {
        toast("Please answer all questions before saving");
        return;
      }

      itemDataService.updateTeamEffectivenessMeasurement(this.state.currentBoard.id, this.state.currentTeam.id, currentUserId, this.state.currentBoard.teamEffectivenessMeasurementVoteCollection);

      this.setState({ isIncludeTeamEffectivenessMeasurementDialogHidden: true });
    };

    const effectivenessMeasurementSelectionChanged = (questionId: number, selected: number) => {
      const currentBoard = this.state.currentBoard;

      if (currentBoard.teamEffectivenessMeasurementVoteCollection === undefined) {
        currentBoard.teamEffectivenessMeasurementVoteCollection = [];
      }

      const currentUserId = encrypt(this.state.currentUserId);
      if (currentBoard.teamEffectivenessMeasurementVoteCollection.find(e => e.userId === currentUserId) === undefined) {
        currentBoard.teamEffectivenessMeasurementVoteCollection.push({
          userId: currentUserId,
          responses: [],
        });
      }

      const currentVote = currentBoard.teamEffectivenessMeasurementVoteCollection.find(e => e.userId === currentUserId).responses.find(e => e.questionId === questionId);

      if (!currentVote) {
        currentBoard.teamEffectivenessMeasurementVoteCollection
          .find(e => e.userId === currentUserId)
          .responses.push({
            questionId: questionId,
            selection: selected,
          });
      } else {
        currentVote.selection = selected;
      }

      this.setState({ currentBoard });
    };

    const teamEffectivenessResponseCount = this.state.currentBoard?.teamEffectivenessMeasurementVoteCollection?.length;

    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center flex-shrink-0 mt-2 ml-4">
          <Dialog
            hidden={this.state.questionIdForDiscussAndActBoardUpdate === -1}
            onDismiss={() => this.setState({ questionIdForDiscussAndActBoardUpdate: -1 })}
            dialogContentProps={{
              type: DialogType.close,
              title: "Discuss and Act",
              subText: `Are you sure you want to change the template of this board?`,
            }}
            modalProps={{
              isBlocking: true,
              containerClassName: "retrospectives-delete-feedback-item-dialog",
              className: "retrospectives-dialog-modal",
            }}
          >
            <DialogFooter>
              <PrimaryButton
                onClick={async () => {
                  const question = questions.filter(question => question.id === this.state.questionIdForDiscussAndActBoardUpdate)[0];
                  const templateName = question.discussActTemplate;
                  const columns = getColumnsByTemplateId(templateName);

                  const board = this.state.currentBoard;

                  await this.updateBoardMetadata(board.title, board.maxVotesPerUser, columns, board.isIncludeTeamEffectivenessMeasurement, board.shouldShowFeedbackAfterCollect, board.isAnonymous, board.permissions);

                  this.setState({ questionIdForDiscussAndActBoardUpdate: -1, isRetroSummaryDialogHidden: true });
                }}
                text="Proceed"
              />
              <DefaultButton onClick={() => this.setState({ questionIdForDiscussAndActBoardUpdate: -1 })} text="Cancel" />
            </DialogFooter>
          </Dialog>

          <h1 className="text-2xl font-medium tracking-tight" aria-label="Retrospectives">
            Retrospectives
          </h1>
          <SelectorCombo<WebApiTeam> className="flex items-center mx-6" currentValue={this.state.currentTeam} iconName="users" nameGetter={team => team.name} selectorList={teamSelectorList} selectorListItemOnClick={this.changeSelectedTeam} title={"Team"} />
          <div className="flex-grow-spacer"></div>
          <ExtensionSettingsMenu />
        </div>
        <div className="flex items-center justify-start flex-shrink-0">
          <div className="w-full">
            <div className="flex items-center justify-start mt-2 ml-4 h-10">
              <div className={`px-2.5 py-1.5 cursor-pointer text-sm ${this.state.activeTab === "Board" ? "font-bold border-b-2 border-[#0078d4]" : ""}`} onClick={() => this.handlePivotClick("Board")}>
                Board
              </div>
              <div className={`px-2.5 py-1.5 cursor-pointer text-sm ${this.state.activeTab === "History" ? "font-bold border-b-2 border-[#0078d4]" : ""}`} onClick={() => this.handlePivotClick("History")}>
                History
              </div>
              {this.state.activeTab === "Board" && (
                <>
                  <div className="mx-4 vertical-tab-separator" />
                  <div className="flex items-center justify-start">
                    <div className="board-selector">
                      <SelectorCombo<IFeedbackBoardDocument> className="board-selector" currentValue={this.state.currentBoard} iconName="table-columns" nameGetter={feedbackBoard => feedbackBoard.title} selectorList={boardSelectorList} selectorListItemOnClick={this.changeSelectedBoard} title={"Retrospective Board"} />
                    </div>
                    <div className="board-actions-menu">
                      <DefaultButton
                        className="contextual-menu-button"
                        aria-label="Board Actions Menu"
                        title="Board Actions"
                        menuProps={{
                          className: "board-actions-menu",
                          items: this.getBoardActionContextualMenuItems(),
                        }}
                      >
                        <span className="ms-Button-icon">
                          <i className="fa-solid fa-ellipsis-h"></i>
                        </span>
                        &nbsp;
                      </DefaultButton>
                      <Dialog
                        hidden={this.state.isMobileBoardActionsDialogHidden}
                        onDismiss={this.hideMobileBoardActionsDialog}
                        modalProps={{
                          isBlocking: false,
                          containerClassName: "ms-dialogMainOverride",
                          className: "retrospectives-dialog-modal",
                        }}
                      >
                        <div className="mobile-contextual-menu-list">
                          {this.getBoardActionContextualMenuItems().map((boardAction: IContextualMenuItem) => (
                            <ActionButton
                              key={boardAction.key}
                              className={boardAction.className}
                              iconProps={boardAction.iconProps}
                              aria-label="Board Actions Menu"
                              onClick={() => {
                                this.hideMobileBoardActionsDialog();
                                boardAction.onClick();
                              }}
                              text={boardAction.text}
                              title={boardAction.title}
                            />
                          ))}
                        </div>
                        <DialogFooter>
                          <DefaultButton onClick={this.hideMobileBoardActionsDialog} text="Close" />
                        </DialogFooter>
                      </Dialog>
                    </div>
                  </div>
                  <div className="flex items-center justify-start">
                    <div className="flex flex-row items-center workflow-stage-header 3">
                      {this.state.currentBoard.isIncludeTeamEffectivenessMeasurement && (
                        <div className="border border-solid border-[var(--nav-header-active-item-background)] rounded-lg">
                          <Dialog
                            hidden={this.state.isIncludeTeamEffectivenessMeasurementDialogHidden}
                            onDismiss={() => {
                              this.setState({ isIncludeTeamEffectivenessMeasurementDialogHidden: true });
                            }}
                            dialogContentProps={{
                              type: DialogType.close,
                            }}
                            minWidth={640}
                            modalProps={{
                              isBlocking: true,
                              containerClassName: "team-effectiveness-dialog",
                              className: "retrospectives-dialog-modal",
                            }}
                          >
                            <DialogContent>
                              <div className="team-effectiveness-section-information">
                                <i className="fa fa-info-circle" />
                                &nbsp;All answers will be saved anonymously
                              </div>
                              <table className="team-effectiveness-measurement-table">
                                <thead>
                                  <tr>
                                    <th></th>
                                    <th></th>
                                    <th colSpan={6} className="team-effectiveness-favorability-label">
                                      Unfavorable
                                    </th>
                                    <th colSpan={2} className="team-effectiveness-favorability-label">
                                      Neutral
                                    </th>
                                    <th colSpan={2} className="team-effectiveness-favorability-label">
                                      Favorable
                                    </th>
                                  </tr>
                                  <tr>
                                    <th></th>
                                    <th></th>
                                    <th className="voting-measurement-index voting-measurement-index-unfavorable voting-index-1">1</th>
                                    <th className="voting-measurement-index voting-measurement-index-unfavorable voting-index-2">2</th>
                                    <th className="voting-measurement-index voting-measurement-index-unfavorable voting-index-3">3</th>
                                    <th className="voting-measurement-index voting-measurement-index-unfavorable voting-index-4">4</th>
                                    <th className="voting-measurement-index voting-measurement-index-unfavorable voting-index-5">5</th>
                                    <th className="voting-measurement-index voting-measurement-index-unfavorable voting-index-6">6</th>
                                    <th className="voting-measurement-index voting-measurement-index-neutral voting-index-7">7</th>
                                    <th className="voting-measurement-index voting-measurement-index-neutral voting-index-8">8</th>
                                    <th className="voting-measurement-index voting-measurement-index-favorable voting-index-9">9</th>
                                    <th className="voting-measurement-index voting-measurement-index-favorable voting-index-10">10</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {questions.map(question => {
                                    return <EffectivenessMeasurementRow key={question.id} questionId={question.id} votes={this.state.currentBoard.teamEffectivenessMeasurementVoteCollection} onSelectedChange={selected => effectivenessMeasurementSelectionChanged(question.id, selected)} iconClass={getQuestionFontAwesomeClass(question.id)} title={getQuestionShortName(question.id)} subtitle={getQuestionName(question.id)} tooltip={getQuestionTooltip(question.id)} />;
                                  })}
                                </tbody>
                              </table>
                            </DialogContent>
                            <DialogFooter>
                              <PrimaryButton
                                className="team-effectiveness-submit-button"
                                onClick={() => {
                                  saveTeamEffectivenessMeasurement();
                                }}
                                text="Submit"
                              />
                              <DefaultButton
                                onClick={() => {
                                  this.setState({ isIncludeTeamEffectivenessMeasurementDialogHidden: true });
                                }}
                                text="Cancel"
                              />
                            </DialogFooter>
                          </Dialog>
                          <button
                            className="flex items-center bg-transparent border-0 cursor-pointer text-sm py-2 px-4 hover:bg-transparent focus:outline-none"
                            onClick={() => {
                              this.setState({ isIncludeTeamEffectivenessMeasurementDialogHidden: false });
                            }}
                            title="Team Assessment"
                            aria-label="Team Assessment"
                            type="button"
                          >
                            <span className="inline-flex items-center justify-center lg:mr-1">
                              <i className="fas fa-chart-line"></i>
                            </span>
                            <span className="hidden lg:inline">Team Assessment</span>
                          </button>
                        </div>
                      )}
                      <div className="flex flex-row gap-3" role="tablist" aria-label="Workflow stage">
                        <WorkflowStage display="Collect" ariaPosInSet={1} value={WorkflowPhase.Collect} isActive={this.getCurrentBoardPhase() === WorkflowPhase.Collect} clickEventCallback={this.clickWorkflowStateCallback} />
                        <WorkflowStage display="Group" ariaPosInSet={2} value={WorkflowPhase.Group} isActive={this.getCurrentBoardPhase() === WorkflowPhase.Group} clickEventCallback={this.clickWorkflowStateCallback} />
                        <WorkflowStage display="Vote" ariaPosInSet={3} value={WorkflowPhase.Vote} isActive={this.getCurrentBoardPhase() === WorkflowPhase.Vote} clickEventCallback={this.clickWorkflowStateCallback} />
                        <WorkflowStage display="Act" ariaPosInSet={4} value={WorkflowPhase.Act} isActive={this.getCurrentBoardPhase() === WorkflowPhase.Act} clickEventCallback={this.clickWorkflowStateCallback} />
                      </div>
                      <div className="workflow-stage-timer" role="status" aria-live="polite">
                        <button type="button" className="workflow-stage-timer-toggle" title={this.state.isBoardTimerRunning ? "Pause timer" : "Start timer"} aria-pressed={this.state.isBoardTimerRunning} aria-label={`${this.state.isBoardTimerRunning ? "Pause" : "Start"} timer. ${this.formatBoardTimer(this.state.boardTimerSeconds)} ${this.getCurrentBoardPhase() === WorkflowPhase.Act ? "elapsed" : "remaining"}.`} onClick={this.handleBoardTimerToggle}>
                          <i className={this.state.isBoardTimerRunning ? "fa fa-pause-circle" : "fa fa-play-circle"} />
                        </button>
                        {this.getCurrentBoardPhase() !== WorkflowPhase.Act && !this.state.isBoardTimerRunning && this.state.boardTimerSeconds === 0 ? (
                          <select value={this.state.countdownDurationMinutes} onChange={this.handleCountdownDurationChange} className="workflow-stage-timer-select" aria-label="Select countdown duration in minutes">
                            {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num}>
                                {num} min
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{this.formatBoardTimer(this.state.boardTimerSeconds)}</span>
                        )}
                        <button type="button" className="workflow-stage-timer-reset" title="Reset timer" aria-label="Reset timer" disabled={!this.state.boardTimerSeconds && !this.state.isBoardTimerRunning} onClick={this.handleBoardTimerReset}>
                          <i className="fa fa-undo" />
                        </button>
                      </div>
                      {this.getCurrentBoardPhase() === WorkflowPhase.Vote && (
                        <div className="feedback-maxvotes-per-user" role="status" aria-live="polite">
                          <span className="feedback-maxvotes-label">Votes Used:</span>
                          <span
                            className="feedback-maxvotes-entry"
                            aria-label={`You have used ${this.state.currentVoteCount} of ${this.state.currentBoard.maxVotesPerUser?.toString() || "0"} votes`}
                          >
                            <strong>{this.state.currentVoteCount}</strong> / {this.state.currentBoard.maxVotesPerUser?.toString() || "0"} (me)
                          </span>
                          <span className="feedback-maxvotes-separator" aria-hidden="true">
                            ,
                          </span>
                          <span
                            className="feedback-maxvotes-entry"
                            aria-label={`The team has used ${this.state.castedVoteCount} of ${this.state.teamVoteCapacity} votes`}
                          >
                            <strong>{this.state.castedVoteCount}</strong> / {this.state.teamVoteCapacity} (team)
                          </span>
                        </div>
                      )}
                      {this.getCurrentBoardPhase() === WorkflowPhase.Act && (
                        <button className="flex items-center bg-transparent border-0 cursor-pointer text-sm py-2 px-4 hover:bg-transparent focus:outline-none" onClick={this.showCarouselDialog} title="Focus Mode allows your team to focus on one feedback item at a time. Try it!" aria-label="Focus Mode" type="button">
                          <span className="inline-flex items-center justify-center mr-1">
                            <i className="fas fa-bullseye"></i>
                          </span>
                          <span className="hidden lg:inline">Focus Mode</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {this.state.activeTab === "History" && (
              <div className="flex-1 min-h-0 overflow-auto border-t-4 border-[var(--nav-header-active-item-background)]">
                <BoardSummaryTable teamId={this.state.currentTeam.id} currentUserId={this.state.currentUserId} currentUserIsTeamAdmin={this.isCurrentUserTeamAdmin()} supportedWorkItemTypes={this.state.allWorkItemTypes} onArchiveToggle={this.handleArchiveToggle} />
              </div>
            )}
            {this.state.activeTab === "Board" && (
              <div className="flex-1 min-h-0 flex flex-col feedback-board-container border-t-4 border-[var(--nav-header-active-item-background)]">
                {this.state.currentTeam && this.state.currentBoard && !this.state.isSummaryDashboardVisible && (
                  <>
                    {!this.props.isHostedAzureDevOps && this.state.isLiveSyncInTfsIssueMessageBarVisible && !this.state.isBackendServiceConnected && (
                      <MessageBar
                        className="info-message-bar"
                        messageBarType={MessageBarType.info}
                        isMultiline={true}
                        onDismiss={this.hideLiveSyncInTfsIssueMessageBar}
                        styles={{
                          root: {
                            background: "#cceeff",
                          },
                        }}
                      >
                        <span>
                          <em>Retrospectives</em> does not support live updates for on-premise installations. To see updates from other users, please refresh the page.
                        </span>
                      </MessageBar>
                    )}
                    {!this.props.isHostedAzureDevOps && this.state.isDropIssueInEdgeMessageBarVisible && !this.state.isBackendServiceConnected && (
                      <MessageBar className="info-message-bar" messageBarType={MessageBarType.warning} isMultiline={true} onDismiss={this.hideDropIssueInEdgeMessageBar}>
                        <span>If your browser does not support grouping a card by dragging and dropping, we recommend using the ellipsis menu on the top-right corner of the feedback.</span>
                      </MessageBar>
                    )}
                    {this.props.isHostedAzureDevOps && !this.state.isBackendServiceConnected && (
                      <MessageBar
                        className="info-message-bar"
                        messageBarType={MessageBarType.warning}
                        isMultiline={true}
                        actions={
                          <div className="info-message-bar-action">
                            {this.state.isReconnectingToBackendService && <Spinner label="Reconnecting..." labelPosition="right" className="info-message-bar-action-spinner" />}
                            {!this.state.isReconnectingToBackendService && (
                              <>
                                <MessageBarButton className="info-message-bar-action-button" onClick={this.tryReconnectToBackend} disabled={this.state.isReconnectingToBackendService} text="Reconnect" />
                                <IconButton
                                  className="info-message-bar-action-button"
                                  onClick={() => {
                                    this.setState({ isBackendServiceConnected: true });
                                  }}
                                  disabled={this.state.isReconnectingToBackendService}
                                  title="Hide"
                                >
                                  <span className="ms-Button-icon">
                                    <i className="fas fa-times"></i>
                                  </span>
                                </IconButton>
                              </>
                            )}
                          </div>
                        }
                      >
                        <span>We are unable to connect to the live syncing service. You can continue to create and edit items as usual, but changes will not be updated in real-time to or from other users.</span>
                      </MessageBar>
                    )}
                    <FeedbackBoard board={this.state.currentBoard} team={this.state.currentTeam} displayBoard={true} workflowPhase={this.state.currentBoard.activePhase} nonHiddenWorkItemTypes={this.state.nonHiddenWorkItemTypes} allWorkItemTypes={this.state.allWorkItemTypes} isCarouselDialogHidden={this.state.isCarouselDialogHidden} hideCarouselDialog={this.hideCarouselDialog} isAnonymous={this.state.currentBoard.isAnonymous ? this.state.currentBoard.isAnonymous : false} hideFeedbackItems={this.state.currentBoard.shouldShowFeedbackAfterCollect ? this.state.currentBoard.activePhase == WorkflowPhase.Collect && this.state.currentBoard.shouldShowFeedbackAfterCollect : false} userId={this.state.currentUserId} onVoteCasted={this.updateCurrentVoteCount} onColumnNotesChange={this.persistColumnNotes} />
                    <Dialog
                      hidden={this.state.isArchiveBoardConfirmationDialogHidden}
                      onDismiss={this.hideArchiveBoardConfirmationDialog}
                      dialogContentProps={{
                        type: DialogType.close,
                        title: "Archive Retrospective",
                      }}
                      modalProps={{
                        isBlocking: true,
                        containerClassName: "retrospectives-archive-board-confirmation-dialog",
                        className: "retrospectives-dialog-modal",
                      }}
                    >
                      <DialogContent>
                        <p>
                          The retrospective board <strong>{this.state.currentBoard.title}</strong> with its feedback will be archived.
                        </p>
                        <br />
                        <p>
                          <em>Note:</em> Archived retrospectives remain available on the <strong>History</strong> tab, where they can be <em>restored</em> or <em>deleted</em>.
                        </p>
                      </DialogContent>
                      <DialogFooter>
                        <PrimaryButton onClick={this.archiveCurrentBoard} text="Archive" className="prime-directive-close-button" />
                        <DefaultButton onClick={this.hideArchiveBoardConfirmationDialog} text="Cancel" />
                      </DialogFooter>
                    </Dialog>
                  </>
                )}
                <Dialog
                  hidden={this.state.isArchiveBoardConfirmationDialogHidden}
                  onDismiss={this.hideArchiveBoardConfirmationDialog}
                  dialogContentProps={{
                    type: DialogType.close,
                    title: "Archive Retrospective",
                  }}
                  modalProps={{
                    isBlocking: true,
                    containerClassName: "retrospectives-archive-board-confirmation-dialog",
                    className: "retrospectives-dialog-modal",
                  }}
                >
                  <DialogContent>
                    <p>
                      The retrospective board <strong>{this.state.currentBoard.title}</strong> with its feedback will be archived.
                    </p>
                    <br />
                    <p>
                      <em>Note:</em> Archived retrospectives remain available on the <strong>History</strong> tab, where they can be <em>restored</em> or <em>deleted</em>.
                    </p>
                  </DialogContent>
                  <DialogFooter>
                    <PrimaryButton onClick={this.archiveCurrentBoard} text="Archive" className="prime-directive-close-button" />
                    <DefaultButton onClick={this.hideArchiveBoardConfirmationDialog} text="Cancel" />
                  </DialogFooter>
                </Dialog>
              </div>
            )}
          </div>
        </div>
        {this.state.isTeamDataLoaded && !this.state.boards.length && !this.state.isSummaryDashboardVisible && <NoFeedbackBoardsView onCreateBoardClick={this.showBoardCreationDialog} />}
        {this.state.isTeamDataLoaded && !this.state.currentTeam && <div>We are unable to retrieve the list of teams for this project. Try reloading the page.</div>}
        {this.renderBoardUpdateMetadataFormDialog(true, false, this.state.isBoardCreationDialogHidden, this.hideBoardCreationDialog, "Create new retrospective", `Example: Retrospective ${new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date())}`, this.createBoard, this.hideBoardCreationDialog)}
        {this.renderBoardUpdateMetadataFormDialog(true, true, this.state.isBoardDuplicateDialogHidden, this.hideBoardDuplicateDialog, "Create copy of retrospective", "", this.createBoard, this.hideBoardDuplicateDialog)}
        {this.state.currentBoard && this.renderBoardUpdateMetadataFormDialog(false, false, this.state.isBoardUpdateDialogHidden, this.hideBoardUpdateDialog, "Edit retrospective", "", this.updateBoardMetadata, this.hideBoardUpdateDialog)}
        <Dialog
          hidden={this.state.isPreviewEmailDialogHidden}
          onDismiss={this.hidePreviewEmailDialog}
          dialogContentProps={{
            type: DialogType.normal,
            title: "Email summary",
          }}
          modalProps={{
            containerClassName: "retrospectives-preview-email-dialog",
            className: "retrospectives-dialog-modal",
          }}
        >
          <FeedbackBoardPreviewEmail teamId={this.state.currentTeam.id} board={this.state.currentBoard} onCopy={this.showEmailCopiedToast} />
        </Dialog>
        <Dialog
          hidden={this.state.isRetroSummaryDialogHidden}
          onDismiss={this.hideRetroSummaryDialog}
          dialogContentProps={{
            type: DialogType.normal,
            title: `Retrospective Board Summary`,
          }}
          modalProps={{
            containerClassName: "retrospectives-retro-summary-dialog",
            className: "retrospectives-dialog-modal",
          }}
        >
          {this.state.currentBoard && (
            <>
              <section className="retro-summary-section">
                <div className="retro-summary-section-header">Basic Settings</div>
                <div id="retro-summary-created-date">Created date: {new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(this.state.currentBoard.createdDate))}</div>
                <div id="retro-summary-created-by">
                  Created by <img className="avatar" src={this.state.currentBoard?.createdBy.imageUrl} alt={this.state.currentBoard?.createdBy.displayName} /> {this.state.currentBoard?.createdBy.displayName}{" "}
                </div>
              </section>
              <section className="retro-summary-section">
                <div className="retro-summary-section-header">Participant Summary</div>
                <div className="retro-summary-section-item">Contributors: {this.state.contributors.length} participant(s)</div>

                {!this.state.currentBoard.isAnonymous && this.state.contributors.length > 0 && (
                  <div className="retro-summary-contributors-section">
                    {this.state.contributors.map(contributor => (
                      <div key={contributor.id} className="retro-summary-contributor">
                        <img className="avatar" src={contributor.imageUrl} alt={contributor.name} /> {contributor.name}
                      </div>
                    ))}
                  </div>
                )}
                <div className="retro-summary-item-horizontal-group">
                  <div className="retro-summary-section-item horizontal-group-item">
                    {Object.keys(this.state.currentBoard?.boardVoteCollection || {}).length} participant(s) casted {this.state.castedVoteCount} vote(s)
                  </div>
                  <div className="retro-summary-section-item horizontal-group-item">{this.state.feedbackItems.length} feedback item(s) created</div>
                  <div className="retro-summary-section-item horizontal-group-item">{this.state.actionItemIds.length} action item(s) created</div>
                </div>
              </section>
              {this.state.currentBoard.isIncludeTeamEffectivenessMeasurement && (
                <section className="retro-summary-section">
                  <div className="retro-summary-section-header">Team Assessment</div>
                  <div>
                    Assessment with favorability percentages and average score <br />({teamEffectivenessResponseCount} {teamEffectivenessResponseCount == 1 ? "person" : "people"} responded)
                    <div className="retro-summary-effectiveness-scores">
                      <ul className="chart">
                        {this.state.effectivenessMeasurementChartData.map(data => {
                          const averageScore = this.state.effectivenessMeasurementSummary.filter(e => e.questionId == data.questionId)[0]?.average ?? 0;
                          const greenScore = (data.green * 100) / teamEffectivenessResponseCount;
                          const yellowScore = (data.yellow * 100) / teamEffectivenessResponseCount;
                          const redScore = (data.red * 100) / teamEffectivenessResponseCount;
                          return (
                            <li className="chart-question-block" key={data.questionId}>
                              <div className="chart-question">
                                <i className={getQuestionFontAwesomeClass(data.questionId)} /> &nbsp;
                                {getQuestionShortName(data.questionId)}
                              </div>
                              {data.red > 0 && (
                                <div className="red-chart-response chart-response" style={{ width: `${redScore}%` }} title={`Unfavorable percentage is ${redScore}%`} aria-label={`Unfavorable percentage is ${redScore}%`}>
                                  {this.percentageFormatter(redScore)}
                                </div>
                              )}
                              {data.yellow > 0 && (
                                <div className="yellow-chart-response chart-response" style={{ width: `${yellowScore}%` }} title={`Neutral percentage is ${yellowScore}%`} aria-label={`Neutral percentage is ${yellowScore}%`}>
                                  {this.percentageFormatter(yellowScore)}
                                </div>
                              )}
                              {data.green > 0 && (
                                <div className="green-chart-response chart-response" style={{ width: `${greenScore}%` }} title={`Favorable percentage is ${greenScore}%`} aria-label={`Favorable percentage is ${greenScore}%`}>
                                  {this.percentageFormatter(greenScore)}
                                </div>
                              )}
                              {averageScore > 0 && (
                                <div className="team-effectiveness-average-number" aria-label={`The average score for this question is ${this.numberFormatter(averageScore)}`}>
                                  {this.numberFormatter(averageScore)}
                                </div>
                              )}
                              <button className="assessment-chart-action" title={`${this.state.feedbackItems.length > 0 ? "There are feedback items created for this board, you cannot change the board template" : `Clicking this will modify the board template to the "${getQuestionShortName(data.questionId)} template" allowing your team to discuss and take actions using the retrospective board`}`} disabled={this.state.feedbackItems.length > 0} onClick={() => this.setState({ questionIdForDiscussAndActBoardUpdate: data.questionId })}>
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
            </>
          )}
        </Dialog>
        <Dialog
          hidden={this.state.isTeamAssessmentHistoryDialogHidden}
          onDismiss={this.hideTeamAssessmentHistoryDialog}
          dialogContentProps={{
            type: DialogType.normal,
            title: "Team Assessment History",
          }}
          modalProps={{
            containerClassName: "retrospectives-team-assessment-history-dialog",
            className: "retrospectives-dialog-modal",
          }}
        >
          {this.state.teamAssessmentHistoryData.length === 0 ? (
            <div className="team-assessment-no-data">
              <p>No team assessment history available.</p>
              <p>Create retrospectives with team assessments to see historical trends.</p>
            </div>
          ) : (
            <>
              <p className="team-assessment-info-text">At v2.0.1 and later (scheduled to be published on Jan 1st 2026), there will be a Widget that you can add to your Azure DevOps dashboard to see team assessment trends over time. Please check Extensions config to make sure the Retrospective Extension is updated to the latest version.</p>
              <p className="team-assessment-info-text">
                Showing average scores over time across {this.state.teamAssessmentHistoryData.length} retrospective{this.state.teamAssessmentHistoryData.length !== 1 ? "s" : ""}.
              </p>
              {(() => {
                const questionColors = [
                  "#0078d4", // Blue
                  "#107c10", // Green
                  "#d83b01", // Orange-Red
                  "#8764b8", // Purple
                  "#00b7c3", // Cyan
                  "#e81123", // Red
                ];

                const svgWidth = 1100;
                const svgHeight = 500;
                const padding = { top: 40, right: 230, bottom: 80, left: 80 };
                const chartWidth = svgWidth - padding.left - padding.right;
                const chartHeight = svgHeight - padding.top - padding.bottom;

                const yScale = (value: number) => padding.top + chartHeight - (value / 10) * chartHeight;

                const allDates = this.state.teamAssessmentHistoryData.map(board => new Date(board.createdDate).getTime());
                const minDate = Math.min(...allDates);
                const maxDate = Math.max(...allDates);
                const dateRange = maxDate - minDate || 1;
                const xScale = (date: Date) => padding.left + ((date.getTime() - minDate) / dateRange) * chartWidth;

                return (
                  <div>
                    <svg width={svgWidth} height={svgHeight} className="team-assessment-history-svg">
                      {[0, 2, 4, 6, 8, 10].map(value => (
                        <g key={value}>
                          <line x1={padding.left} y1={yScale(value)} x2={svgWidth - padding.right} y2={yScale(value)} stroke="#e0e0e0" strokeWidth="1" />
                          <text x={padding.left - 10} y={yScale(value)} textAnchor="end" fontSize="14" fill="#666" dominantBaseline="middle">
                            {value}
                          </text>
                        </g>
                      ))}

                      <line x1={padding.left} y1={svgHeight - padding.bottom} x2={svgWidth - padding.right} y2={svgHeight - padding.bottom} stroke="#666" strokeWidth="2" />

                      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={svgHeight - padding.bottom} stroke="#666" strokeWidth="2" />

                      {questions.map((question, qIndex) => {
                        const color = questionColors[qIndex % questionColors.length];
                        const dataPoints = this.state.teamAssessmentHistoryData
                          .map(board => {
                            const questionData = board.questionAverages.find(qa => qa.questionId === question.id);
                            return questionData ? { date: new Date(board.createdDate), average: questionData.average, boardTitle: board.boardTitle } : null;
                          })
                          .filter(Boolean);

                        if (dataPoints.length === 0) {
                          return null;
                        }

                        const linePath = dataPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${xScale(point.date)} ${yScale(point.average)}`).join(" ");

                        return (
                          <g key={question.id}>
                            <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" opacity="0.8" />

                            {dataPoints.map((point, index) => (
                              <circle key={index} cx={xScale(point.date)} cy={yScale(point.average)} r="4" fill={color} stroke="#fff" strokeWidth="2">
                                <title>{`${question.shortTitle}\n${point.boardTitle}\nDate: ${new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(point.date)}\nAverage: ${this.numberFormatter(point.average)}`}</title>
                              </circle>
                            ))}
                          </g>
                        );
                      })}

                      {this.state.teamAssessmentHistoryData.map((board, index) => {
                        const date = new Date(board.createdDate);
                        const shouldShowLabel = index === 0 || index === this.state.teamAssessmentHistoryData.length - 1 || this.state.teamAssessmentHistoryData.length <= 5 || (this.state.teamAssessmentHistoryData.length > 5 && index % Math.ceil(this.state.teamAssessmentHistoryData.length / 5) === 0);

                        if (!shouldShowLabel) return null;

                        return (
                          <text key={index} x={xScale(date)} y={svgHeight - padding.bottom + 20} textAnchor="end" fontSize="12" fill="#666" transform={`rotate(-45 ${xScale(date)} ${svgHeight - padding.bottom + 20})`}>
                            {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "2-digit" }).format(date)}
                          </text>
                        );
                      })}

                      <text x={padding.left - 50} y={svgHeight / 2} textAnchor="middle" fontSize="16" fill="#333" fontWeight="600" transform={`rotate(-90 ${padding.left - 50} ${svgHeight / 2})`}>
                        Average Score
                      </text>
                      <text x={(padding.left + svgWidth - padding.right) / 2} y={svgHeight - 40} textAnchor="middle" fontSize="16" fill="#333" fontWeight="600">
                        Retrospective Date
                      </text>

                      {questions.map((question, qIndex) => {
                        const color = questionColors[qIndex % questionColors.length];
                        const legendX = svgWidth - padding.right + 15;
                        const legendY = padding.top + qIndex * 70;

                        return (
                          <g key={question.id}>
                            <line x1={legendX} y1={legendY} x2={legendX + 30} y2={legendY} stroke={color} strokeWidth="2.5" />
                            <circle cx={legendX + 15} cy={legendY} r="4" fill={color} stroke="#fff" strokeWidth="2" />
                            <text x={legendX + 40} y={legendY - 5} fontSize="13" fill="#333" fontWeight="600">
                              <tspan>{question.shortTitle}</tspan>
                            </text>
                            <text x={legendX + 40} y={legendY + 10} fontSize="10" fill="#666">
                              <tspan>
                                {question.title.substring(0, 25)}
                                {question.title.length > 25 ? "..." : ""}
                              </tspan>
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
            </>
          )}
        </Dialog>
        <ToastContainer transition={Slide} closeButton={false} className="retrospective-notification-toast-container" toastClassName="retrospective-notification-toast" progressClassName="retrospective-notification-toast-progress-bar" />
      </div>
    );
  }
}

export default withAITracking(reactPlugin, FeedbackBoardContainer);
