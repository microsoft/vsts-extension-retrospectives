import React from 'react';
import { ActionButton, DefaultButton, IconButton, MessageBarButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { Dialog, DialogType, DialogFooter, DialogContent } from 'office-ui-fabric-react/lib/Dialog';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import { MobileWidthBreakpoint } from '../config/constants';
import { WorkflowPhase } from '../interfaces/workItem';
import WorkflowStage from './workflowStage';
import BoardDataService from '../dal/boardDataService';
import { FeedbackBoardDocumentHelper, IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions, IFeedbackColumn, IFeedbackItemDocument } from '../interfaces/feedback';
import { reflectBackendService } from '../dal/reflectBackendService';
import BoardSummaryTable from './boardSummaryTable';
import FeedbackBoardMetadataForm from './feedbackBoardMetadataForm';
import FeedbackBoard from '../components/feedbackBoard';

import { azureDevOpsCoreService } from '../dal/azureDevOpsCoreService';
import { workItemService } from '../dal/azureDevOpsWorkItemService';
import { WebApiTeam } from 'azure-devops-extension-api/Core';
import { getBoardUrl } from '../utilities/boardUrlHelper';
import NoFeedbackBoardsView from './noFeedbackBoardsView';
import { userDataService } from '../dal/userDataService';
import ExtensionSettingsMenu from './extensionSettingsMenu';
import SelectorCombo, { ISelectorList } from './selectorCombo';
import FeedbackBoardPreviewEmail from './feedbackBoardPreviewEmail';
import { ToastContainer, toast, Slide } from 'react-toastify';
import { WorkItemType, WorkItemTypeReference } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';
import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip';
import { shareBoardHelper } from '../utilities/shareBoardHelper';
import { itemDataService } from '../dal/itemDataService';
import { TeamMember } from 'azure-devops-extension-api/WebApi';
import EffectivenessMeasurementRow from './effectivenessMeasurementRow';

import { encrypt, getUserIdentity } from '../utilities/userIdentityHelper';
import { getQuestionName, getQuestionShortName, getQuestionTooltip, getQuestionFontAwesomeClass, questions } from '../utilities/effectivenessMeasurementQuestionHelper';

import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { appInsights, reactPlugin, TelemetryEvents } from '../utilities/telemetryClient';
import copyToClipboard from 'copy-to-clipboard';
import { getColumnsByTemplateId } from '../utilities/boardColumnsHelper';
import { FeedbackBoardPermissionOption } from './feedbackBoardMetadataFormPermissions';
import { CommonServiceIds, IHostNavigationService } from 'azure-devops-extension-api/Common/CommonServices';
import { getService } from 'azure-devops-extension-sdk';
import { FontIcon } from 'office-ui-fabric-react';

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
  isAppInitialized: boolean;
  isBackendServiceConnected: boolean;
  isReconnectingToBackendService: boolean;
  isSummaryDashboardVisible: boolean;
  isTeamDataLoaded: boolean;
  isAllTeamsLoaded: boolean;
  maxvotesPerUser: number;
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
  isDeleteBoardConfirmationDialogHidden: boolean;
  isMobileBoardActionsDialogHidden: boolean;
  isMobileTeamSelectorDialogHidden: boolean;
  isTeamBoardDeletedInfoDialogHidden: boolean;
  isTeamSelectorCalloutVisible: boolean;
  teamBoardDeletedDialogMessage: string;
  teamBoardDeletedDialogTitle: string;
  isCarouselDialogHidden: boolean;
  isIncludeTeamEffectivenessMeasurementDialogHidden: boolean;
  isPrimeDirectiveDialogHidden: boolean;
  isLiveSyncInTfsIssueMessageBarVisible: boolean;
  isDropIssueInEdgeMessageBarVisible: boolean;
  isDesktop: boolean;
  isAutoResizeEnabled: boolean;
  allowCrossColumnGroups: boolean;
  feedbackItems: IFeedbackItemDocument[];
  contributors: { id: string, name: string, imageUrl: string }[];
  effectivenessMeasurementSummary: { questionId: number, question: string, average: number }[];
  effectivenessMeasurementChartData: { questionId: number, red: number, yellow: number, green: number }[];
  teamEffectivenessMeasurementAverageVisibilityClassName: string;
  actionItemIds: number[];
  /**
   * Members of the all teams that the current user access to. This may not be all the team
   * members within the organization.
   */
  allMembers: TeamMember[];
  castedVoteCount: number;
  boardColumns: IFeedbackColumn[];
  questionIdForDiscussAndActBoardUpdate: number;
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
      isAllTeamsLoaded: false,
      isAppInitialized: false,
      isAutoResizeEnabled: true,
      isBackendServiceConnected: false,
      isBoardCreationDialogHidden: true,
      isBoardDuplicateDialogHidden: true,
      isBoardUpdateDialogHidden: true,
      isCarouselDialogHidden: true,
      isIncludeTeamEffectivenessMeasurementDialogHidden: true,
      isPrimeDirectiveDialogHidden: true,
      isArchiveBoardConfirmationDialogHidden: true,
      isDeleteBoardConfirmationDialogHidden: true,
      isDesktop: true,
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
      teamBoardDeletedDialogMessage: '',
      teamBoardDeletedDialogTitle: '',
      userTeams: [],
      maxvotesPerUser: 5,
      feedbackItems: [],
      contributors: [],
      effectivenessMeasurementSummary: [],
      effectivenessMeasurementChartData: [],
      teamEffectivenessMeasurementAverageVisibilityClassName: "hidden",
      actionItemIds: [],
      allMembers: [],
      castedVoteCount: 0,
      boardColumns: [],
      questionIdForDiscussAndActBoardUpdate: -1
    };
  }

  public async componentDidMount() {
    let initialCurrentTeam: WebApiTeam | undefined;
    let initialCurrentBoard: IFeedbackBoardDocument | undefined;

    try {
      const isBackendServiceConnected = await reflectBackendService.startConnection();
      this.setState({ isBackendServiceConnected });
    } catch (error) {
      console.error({ m: "isBackendServiceConnected", error });
    }

    try {
      const initializedTeamAndBoardState = await this.initializeFeedbackBoard();
      initialCurrentTeam = initializedTeamAndBoardState.currentTeam;
      initialCurrentBoard = initializedTeamAndBoardState.currentBoard;

      await this.initializeProjectTeams(initialCurrentTeam);

      this.setState({ ...initializedTeamAndBoardState, isTeamDataLoaded: true, });
    } catch (error) {
      console.error({ m: "initializedTeamAndBoardState", error });
    }

    try {
      await this.setSupportedWorkItemTypesForProject();
    } catch (error) {
      console.error({ m: "setSupportedWorkItemTypesForProject", error });
    }

    try {
      await this.updateFeedbackItemsAndContributors(initialCurrentTeam, initialCurrentBoard);
    } catch (error) {
      console.error({ m: "updateFeedbackItemsAndContributors", error });
    }

    try {
      const votes = Object.values(initialCurrentBoard?.boardVoteCollection || []);

      this.setState({ castedVoteCount: (votes !== null && votes.length > 0) ? votes.reduce((a, b) => a + b) : 0 });
    } catch (error) {
      console.error({ m: "votes", error });
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
      reflectBackendService.onReceiveNewBoard(this.handleNewBoardAvailable);
      reflectBackendService.onReceiveDeletedBoard(this.handleBoardDeleted);
      reflectBackendService.onReceiveUpdatedBoard(this.handleBoardUpdated);
    }
    catch (e) {
      console.error(e);
      appInsights.trackException(e);
    }

    this.setState({ isAppInitialized: true });
  }

  public componentDidUpdate(prevProps: FeedbackBoardContainerProps, prevState: FeedbackBoardContainerState) {
    if (prevState.currentTeam !== this.state.currentTeam) {
      appInsights.trackEvent({name: TelemetryEvents.TeamSelectionChanged, properties: {teamId: this.state.currentTeam.id}});
    }
    if (prevState.currentBoard !== this.state.currentBoard) {
      reflectBackendService.switchToBoard(this.state.currentBoard ? this.state.currentBoard.id : undefined);
      appInsights.trackEvent({name: TelemetryEvents.FeedbackBoardSelectionChanged, properties: {boardId: this.state.currentBoard?.id}});
      if (this.state.isAppInitialized) {
        userDataService.addVisit(this.state.currentTeam.id, this.state.currentBoard ? this.state.currentBoard.id : undefined);
      }
    }
  }

  public componentWillUnmount() {
    window.removeEventListener('resize', this.handleResolutionChange);
    reflectBackendService.removeOnReceiveNewBoard(this.handleNewBoardAvailable);
    reflectBackendService.removeOnReceiveDeletedBoard(this.handleBoardDeleted);
    reflectBackendService.removeOnReceiveUpdatedBoard(this.handleBoardUpdated);
  }

  private async updateUrlWithBoardAndTeamInformation(teamId: string, boardId: string) {
    getService<IHostNavigationService>(CommonServiceIds.HostNavigationService).then(service => {
      service.setHash(`teamId=${teamId}&boardId=${boardId}`);
    });
  }

  private async parseUrlForBoardAndTeamInformation(): Promise<{ teamId: string, boardId: string }> {
    const service = await getService<IHostNavigationService>(CommonServiceIds.HostNavigationService);
    let hash = await service.getHash();
    if (hash.startsWith('#')) {
      hash = hash.substring(1);
    }
    const hashParams = new URLSearchParams(hash);
    const teamId = hashParams.get("teamId");
    const boardId = hashParams.get("boardId");

    return { teamId, boardId };
  }

  private async updateFeedbackItemsAndContributors(currentTeam: WebApiTeam, currentBoard: IFeedbackBoardDocument) {
    if (!currentTeam || !currentBoard) {
      return;
    }

    const board: IFeedbackBoardDocument = await itemDataService.getBoardItem(currentTeam.id, currentBoard.id);

    const feedbackItems = await itemDataService.getFeedbackItemsForBoard(board?.id) ?? [];

    await this.updateUrlWithBoardAndTeamInformation(currentTeam.id, board.id);

    let actionItemIds: number[] = [];
    feedbackItems.forEach(item => {
      actionItemIds = actionItemIds.concat(item.associatedActionItemIds);
    });

    const contributors = feedbackItems.map(e => { return { id: e.userIdRef, name: e?.createdBy?.displayName, imageUrl: e?.createdBy?.imageUrl }; }).filter((v, i, a) => a.indexOf(v) === i);

    const votes = Object.values(board.boardVoteCollection || []);

    this.setState({
      actionItemIds: actionItemIds.filter(item => item !== undefined),
      feedbackItems,
      contributors: [...new Set(contributors.map(e => e.id))].map(e => contributors.find(i => i.id === e)),
      castedVoteCount: (votes !== null && votes.length > 0) ? votes.reduce((a, b) => a + b) : 0
    });
  }

  private toggleAndFixResolution = () => {
    const newView = !this.state.isDesktop;

    this.setState({
      isAutoResizeEnabled: false,
      isDesktop: newView,
    });
  }

  private handleResolutionChange = () => {
    const isDesktop = window.innerWidth >= MobileWidthBreakpoint;

    if (this.state.isAutoResizeEnabled && this.state.isDesktop != isDesktop) {
      this.setState({
        isDesktop: isDesktop,
      });
    }
  }

  private numberFormatter = (value: number) => {
    const formatter = new Intl.NumberFormat("en-US", { style: "decimal", minimumFractionDigits: 1, maximumFractionDigits: 1 });

    return formatter.format(value);
  }

  private percentageFormatter = (value: number) => {
    const formatter = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

    return formatter.format(value / 100);
  }

  private handleNewBoardAvailable = async (teamId: string, boardId: string) => {
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
        .filter((board: IFeedbackBoardDocument) => FeedbackBoardDocumentHelper.filter(board, this.state.userTeams.map(t => t.id), this.state.currentUserId))
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
  }

  private setSupportedWorkItemTypesForProject = async (): Promise<void> => {
    const allWorkItemTypes: WorkItemType[] = await workItemService.getWorkItemTypesForCurrentProject();
    const hiddenWorkItemTypes: WorkItemTypeReference[] = await workItemService.getHiddenWorkItemTypes();

    const hiddenWorkItemTypeNames = hiddenWorkItemTypes.map((workItemType) => workItemType.name);

    const nonHiddenWorkItemTypes = allWorkItemTypes.filter(workItemType => hiddenWorkItemTypeNames.indexOf(workItemType.name) === -1);

    this.setState({
      nonHiddenWorkItemTypes: nonHiddenWorkItemTypes,
      allWorkItemTypes: allWorkItemTypes,
    });
  }

  private replaceBoard = (updatedBoard: IFeedbackBoardDocument) => {
    this.setState(prevState => {
      const newBoards = prevState.boards.map((board) => board.id === updatedBoard.id ? updatedBoard : board);

      const newCurrentBoard = this.state.currentBoard && this.state.currentBoard.id === updatedBoard.id ? updatedBoard : this.state.currentBoard;

      return {
        boards: newBoards,
        currentBoard: newCurrentBoard,
      };
    })
  }

  private handleBoardUpdated = async (teamId: string, updatedBoardId: string) => {
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

  private handleBoardDeleted = async (teamId: string, deletedBoardId: string) => {
    if (!teamId || this.state.currentTeam.id !== teamId) {
      return;
    }

    // @ts-ignore TS2345
    this.setState(prevState => {
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
            teamBoardDeletedDialogTitle: 'Retrospective deleted',
            teamBoardDeletedDialogMessage: 'The retrospective you were viewing has been deleted by another user.',
          }
        }

        const currentBoard = boardsForTeam[0];
        reflectBackendService.switchToBoard(currentBoard.id);
        return {
          boards: boardsForTeam,
          currentBoard: currentBoard,
          isBoardUpdateDialogHidden: true,
          isTeamBoardDeletedInfoDialogHidden: false,
          teamBoardDeletedDialogTitle: 'Retrospective deleted',
          teamBoardDeletedDialogMessage: 'The retrospective you were viewing has been deleted by another user. You will be switched to the last created retrospective for this team.',
        };
      }

      return {
        boards: boardsForTeam,
      };
    }, async () => {
      await userDataService.addVisit(this.state.currentTeam?.id, this.state.currentBoard?.id);
    });
  }

  /**
   * @description Loads team data for this project and the current user. Attempts to use query
   * params or user records to pre-select team and board, otherwise default to the first team
   * the current user is a part of and most recently created board.
   * @returns An object to update the state with initialized team and board data.
   */
  private initializeFeedbackBoard = async (): Promise<{
    userTeams: WebApiTeam[],
    filteredUserTeams: WebApiTeam[],
    currentTeam: WebApiTeam,
    boards: IFeedbackBoardDocument[],
    currentBoard: IFeedbackBoardDocument,
    isTeamBoardDeletedInfoDialogHidden: boolean,
    teamBoardDeletedDialogTitle: string,
    teamBoardDeletedDialogMessage: string,
  }> => {
    const userTeams = await azureDevOpsCoreService.getAllTeams(this.props.projectId, true);
    userTeams?.sort((t1, t2) => {
      return t1.name.localeCompare(t2.name, [], { sensitivity: "accent" });
    });

    // Default to select first user team or the project's default team.
    const defaultTeam = (userTeams?.length) ? userTeams[0] : await azureDevOpsCoreService.getDefaultTeam(this.props.projectId);

    const baseTeamState = {
      userTeams,
      filteredUserTeams: userTeams,
      currentTeam: defaultTeam,
      isTeamBoardDeletedInfoDialogHidden: true,
      teamBoardDeletedDialogTitle: '',
      teamBoardDeletedDialogMessage: '',
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

      const newBoard = await this.createBoard(name, parseInt(maxVotes), columns, isTeamAssessment === "true", false, false, false, { Members: [], Teams: [] });

      parent.location.href = await getBoardUrl(this.state.currentTeam.id, newBoard.id);
    }

    const info = await this.parseUrlForBoardAndTeamInformation();
    try {
      if (!info) {
        if (!this.props.isHostedAzureDevOps) {
          throw new Error("URL-related issue occurred with on-premise Azure DevOps");
        }
        else if (!document.referrer) {
          throw new Error("URL-related issue occurred with this URL: (Empty URL)");
        }
        else {
          const indexVisualStudioCom = document.location.href.indexOf("visualstudio.com");
          const indexDevAzureCom = document.location.href.indexOf("dev.azure.com");

          if (indexVisualStudioCom >= 0) {
            const indexSecondSlashAfterVisualStudioCom = document.location.href.indexOf("/", indexVisualStudioCom + "visualstudio.com/".length);
            throw new Error("URL-related issue occurred with this URL: " + document.location.href.substring(indexSecondSlashAfterVisualStudioCom));
          }
          else if (indexDevAzureCom >= 0) {
            const indexSecondSlashAfterDevAzureCom = document.location.href.indexOf("/", indexDevAzureCom + "dev.azure.com/".length);
            const indexThirdSlashAfterDevAzureCom = document.location.href.indexOf("/", indexSecondSlashAfterDevAzureCom + 1);
            throw new Error("URL-related issue occurred with this URL: " + document.location.href.substring(indexThirdSlashAfterDevAzureCom));
          }
          else {
            throw new Error("URL-related issue occurred with hosted Azure DevOps but document referrer does not contain dev.azure.com or visualstudio.com");
          }
        }
      }
    }
    catch (e) {
      appInsights.trackException(e);
    }

    if (!info || !info.teamId) {
      // If the teamId query param doesn't exist, attempt to pre-select a team and board by last
      // visited user records.
      const recentVisitState = await this.loadRecentlyVisitedOrDefaultTeamAndBoardState(defaultTeam, userTeams);

      return {
        ...baseTeamState,
        ...recentVisitState,
      }
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
        teamBoardDeletedDialogTitle: 'Team not found',
        teamBoardDeletedDialogMessage: 'Could not find the team specified in the url.',
      }

      return {
        ...baseTeamState,
        ...recentVisitWithDialogState,
      };
    }

    let boardsForMatchedTeam = await BoardDataService.getBoardsForTeam(matchedTeam.id);
    if (boardsForMatchedTeam && boardsForMatchedTeam.length) {
      boardsForMatchedTeam = boardsForMatchedTeam
        .filter((board: IFeedbackBoardDocument) => FeedbackBoardDocumentHelper.filter(board, this.state.userTeams.map(t => t.id), this.state.currentUserId))
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
    const matchedBoard = boardsForMatchedTeam.find((board) => board.id === boardIdQueryParam);

    if (matchedBoard) {
      if (matchedBoard.teamEffectivenessMeasurementVoteCollection === undefined) {
        matchedBoard.teamEffectivenessMeasurementVoteCollection = [];
      }
      return {
        ...queryParamTeamAndDefaultBoardState,
        currentBoard: matchedBoard,
      }
    } else {
      // If the boardId query param wasn't valid, we fall back to using the most recently
      // created board. We don't use the last visited records in this case since it may be for
      // a different team.
      return {
        ...queryParamTeamAndDefaultBoardState,
        isTeamBoardDeletedInfoDialogHidden: false,
        teamBoardDeletedDialogTitle: 'Board not found',
        teamBoardDeletedDialogMessage: 'Could not find the board specified in the url.'
      };
    }
  }

  private initializeProjectTeams = async (defaultTeam: WebApiTeam) => {
    const allTeams = await azureDevOpsCoreService.getAllTeams(this.props.projectId, true);
    allTeams.sort((t1, t2) => {
      return t1.name.localeCompare(t2.name, [], { sensitivity: "accent" });
    });

    const promises = []
    for (const team of allTeams) {
      promises.push(azureDevOpsCoreService.getMembers(this.props.projectId, team.id));
    }
    Promise.all(promises).then((values) => {
      const allTeamMembers: TeamMember[] = [];
      for (const members of values) {
        allTeamMembers.push(...members);
      }
      this.setState({
        allMembers: allTeamMembers,
        projectTeams: allTeams?.length > 0 ? allTeams : [defaultTeam],
        filteredProjectTeams: allTeams?.length > 0 ? allTeams : [defaultTeam],
        isAllTeamsLoaded: true,
      });
    });
  }

  /**
   * @description Load the last team and board that this user visited, if such records exist.
   * @returns An object to update the state with recently visited or default team and board data.
   */
  private loadRecentlyVisitedOrDefaultTeamAndBoardState = async (defaultTeam: WebApiTeam, userTeams: WebApiTeam[]): Promise<{
    boards: IFeedbackBoardDocument[],
    currentBoard: IFeedbackBoardDocument,
    currentTeam: WebApiTeam,
  }> => {
    const mostRecentUserVisit = await userDataService.getMostRecentVisit();

    if (mostRecentUserVisit) {
      const mostRecentTeam = await azureDevOpsCoreService.getTeam(this.props.projectId, mostRecentUserVisit.teamId);

      if (mostRecentTeam) {
        let boardsForTeam = await BoardDataService.getBoardsForTeam(mostRecentTeam.id);
        if (boardsForTeam?.length > 0) {
          boardsForTeam = boardsForTeam
            .filter((board: IFeedbackBoardDocument) => FeedbackBoardDocumentHelper.filter(board, userTeams.map(t => t.id), this.state.currentUserId))
            .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));
        }
        const currentBoard = boardsForTeam?.length > 0 ? boardsForTeam.at(0) : null;

        const recentVisitState = {
          boards: boardsForTeam,
          currentBoard,
          currentTeam: mostRecentTeam,
        };

        if (boardsForTeam?.length && mostRecentUserVisit.boardId) {
          const mostRecentBoard = boardsForTeam.find((board) => board.id === mostRecentUserVisit.boardId);
          recentVisitState.currentBoard = mostRecentBoard ? mostRecentBoard : currentBoard;
        }

        return recentVisitState;
      }
    }

    let boardsForMatchedTeam = await BoardDataService.getBoardsForTeam(defaultTeam.id);
    if (boardsForMatchedTeam?.length) {
      boardsForMatchedTeam = boardsForMatchedTeam
        .filter((board: IFeedbackBoardDocument) => FeedbackBoardDocumentHelper.filter(board, userTeams.map(t => t.id), this.state.currentUserId))
        .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));
    }

    return {
      boards: boardsForMatchedTeam,
      currentBoard: (boardsForMatchedTeam?.length) ? boardsForMatchedTeam[0] : null,
      currentTeam: defaultTeam,
    };
  }

  /**
   * @description Attempts to select a team from the specified teamId. If the teamId is valid,
   * currentTeam is set to the new team and that team's boards are loaded.
   * @param teamId The id of the team to select.
   */
  private setCurrentTeam = async (teamId: string) => {
    this.setState({ isTeamDataLoaded: false });
    const matchedTeam = this.state.projectTeams.find((team) => team.id === teamId) ||
      this.state.userTeams.find((team) => team.id === teamId);

    if (matchedTeam) {
      let boardsForTeam = await BoardDataService.getBoardsForTeam(matchedTeam.id);
      if (boardsForTeam?.length) {
        boardsForTeam = boardsForTeam
          .filter((board: IFeedbackBoardDocument) => FeedbackBoardDocumentHelper.filter(board, this.state.userTeams.map(t => t.id), this.state.currentUserId))
          .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));
      }

      // @ts-ignore TS2345
      this.setState(prevState => {
        // Ensure that we are actually changing teams to prevent needless rerenders.
        if (!prevState.currentTeam || prevState.currentTeam.id !== matchedTeam.id) {

          return {
            boards: (boardsForTeam?.length) ? boardsForTeam : [],
            currentBoard: (boardsForTeam?.length) ? boardsForTeam[0] : null,
            currentTeam: matchedTeam,
            isTeamDataLoaded: true,
          }
        }

        return {};
      });
    }
  }

  /**
   * @description Loads all feedback boards for the current team. Defaults the selected board to
   * the most recently created board.
   */
  private reloadBoardsForCurrentTeam = async () => {
    this.setState({ isTeamDataLoaded: false });

    let boardsForTeam = await BoardDataService.getBoardsForTeam(this.state.currentTeam.id);

    if (!boardsForTeam.length) {
      this.setState({
        isTeamDataLoaded: true,
        boards: [],
        currentBoard: null
      });

      return;
    }

    boardsForTeam = boardsForTeam
      .filter((board: IFeedbackBoardDocument) => FeedbackBoardDocumentHelper.filter(board, this.state.userTeams.map(t => t.id), this.state.currentUserId))
      .sort((b1, b2) => FeedbackBoardDocumentHelper.sort(b1, b2));

    const currentBoard: IFeedbackBoardDocument = boardsForTeam[0];

    this.setState({
      boards: boardsForTeam,
      currentBoard: currentBoard,
      isTeamDataLoaded: true,
    });
  }

  /**
   * @description Attempts to select a board from the specified boardId. If the boardId is valid,
   * currentBoard is set to the new board. If not, nothing changes.
   * @param boardId The id of the board to select.
   */
  private setCurrentBoard = (selectedBoard: IFeedbackBoardDocument) => {
    const matchedBoard = this.state.boards.find((board) => board.id === selectedBoard.id);

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
  }

  private changeSelectedTeam = (team: WebApiTeam) => {
    if (team) {
      if (this.state.currentTeam.id === team.id) {
        return;
      }

      this.setCurrentTeam(team.id);
      appInsights.trackEvent({name: TelemetryEvents.TeamSelectionChanged, properties: {teamId: team.id}});
    }
  }

  private changeSelectedBoard = async (board: IFeedbackBoardDocument) => {
    if (board) {
      this.setCurrentBoard(board);
      this.updateUrlWithBoardAndTeamInformation(this.state.currentTeam.id, board.id);
      appInsights.trackEvent({name: TelemetryEvents.FeedbackBoardSelectionChanged, properties: {boardId: board.id}});
    }
  }

  private clickWorkflowStateCallback = (_: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLDivElement>, newPhase: WorkflowPhase) => {
    appInsights.trackEvent({name: TelemetryEvents.WorkflowPhaseChanged, properties: {oldWorkflowPhase: this.state.currentBoard.activePhase, newWorkflowPhase: newPhase}});

    this.setState(prevState => {
      const updatedCurrentBoard = prevState.currentBoard;
      updatedCurrentBoard.activePhase = newPhase;

      return {
        currentBoard: updatedCurrentBoard,
      };
    });
  }

  private createBoard = async (title: string, maxvotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, isBoardAnonymous: boolean, shouldShowFeedbackAfterCollect: boolean, displayPrimeDirective: boolean, permissions: IFeedbackBoardDocumentPermissions) => {
    const createdBoard = await BoardDataService.createBoardForTeam(this.state.currentTeam.id,
      title,
      maxvotesPerUser,
      columns,
      isIncludeTeamEffectivenessMeasurement,
      isBoardAnonymous,
      shouldShowFeedbackAfterCollect,
      displayPrimeDirective,
      undefined, // Start Date
      undefined, // End Date
      permissions);
    await this.reloadBoardsForCurrentTeam();
    this.hideBoardCreationDialog();
    this.hideBoardDuplicateDialog();
    reflectBackendService.broadcastNewBoard(this.state.currentTeam.id, createdBoard.id);
    appInsights.trackEvent({name: TelemetryEvents.FeedbackBoardCreated, properties: {boardId: createdBoard.id}});
    return createdBoard;
  }

  private showBoardCreationDialog = (): void => {
    this.setState({ isBoardCreationDialogHidden: false });
  }

  private hideBoardCreationDialog = (): void => {
    this.setState({ isBoardCreationDialogHidden: true });
  }

  private showPreviewEmailDialog = (): void => {
    this.setState({ isPreviewEmailDialogHidden: false });
  }

  private showRetroSummaryDialog = async () => {
    const measurements: { id: number, selected: number }[] = [];

    const board = await BoardDataService.getBoardForTeamById(this.state.currentTeam.id, this.state.currentBoard.id);
    const voteCollection = board.teamEffectivenessMeasurementVoteCollection || [];

    voteCollection.forEach(vote => {
      vote?.responses?.forEach(response => {
        measurements.push({ id: response.questionId, selected: response.selection });
      });
    });

    const average: { questionId: number, question: string, average: number }[] = [];

    [...new Set(measurements.map(item => item.id))].forEach(e => {
      average.push({ questionId: e, question: getQuestionName(e), average: measurements.filter(m => m.id === e).reduce((a, b) => a + b.selected, 0) / measurements.filter(m => m.id === e).length });
    });

    const chartData: { questionId: number, red: number, yellow: number, green: number }[] = [];

    [...Array(questions.length).keys()].forEach(e => {
      chartData.push({ questionId: (e + 1), red: 0, yellow: 0, green: 0 });
    });

    voteCollection?.forEach(vote => {
      [...Array(questions.length).keys()].forEach(e => {
        const selection = vote.responses.find(response => response.questionId === (e + 1))?.selection;
        const data = chartData.find(d => d.questionId === (e + 1));
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
  }

  private hidePreviewEmailDialog = (): void => {
    this.setState({ isPreviewEmailDialogHidden: true });
  }

  private hideRetroSummaryDialog = (): void => {
    this.setState({ isRetroSummaryDialogHidden: true });
  }

  private updateBoardMetadata = async (title: string, maxvotesPerUser: number, columns: IFeedbackColumn[], isIncludeTeamEffectivenessMeasurement: boolean, isBoardAnonymous: boolean, shouldShowFeedbackAfterCollect: boolean, displayPrimeDirective: boolean, permissions: IFeedbackBoardDocumentPermissions) => {
    const updatedBoard =
      await BoardDataService.updateBoardMetadata(this.state.currentTeam.id, this.state.currentBoard.id, maxvotesPerUser, title, columns, permissions);

    this.updateBoardAndBroadcast(updatedBoard);
  }

  private showBoardUpdateDialog = (): void => {
    this.setState({ isBoardUpdateDialogHidden: false });
  }

  private hideBoardUpdateDialog = (): void => {
    this.setState({ isBoardUpdateDialogHidden: true });
  }

  private showBoardDuplicateDialog = (): void => {
    this.setState({ isBoardDuplicateDialogHidden: false });
  }

  private hideBoardDuplicateDialog = (): void => {
    this.setState({ isBoardDuplicateDialogHidden: true });
  }

  // Note: This is temporary, to support older boards that do not have an active phase.
  private getCurrentBoardPhase = () => {
    if (!this.state.currentBoard?.activePhase) {
      return WorkflowPhase.Collect;
    }

    return this.state.currentBoard.activePhase;
  }

  private showDeleteBoardConfirmationDialog = () => {
    this.setState({ isDeleteBoardConfirmationDialogHidden: false });
  }

  private hideDeleteBoardConfirmationDialog = () => {
    this.setState({ isDeleteBoardConfirmationDialogHidden: true });
  }

  private showArchiveBoardConfirmationDialog = () => {
    this.setState({ isArchiveBoardConfirmationDialogHidden: false });
  }

  private hideArchiveBoardConfirmationDialog = () => {
    this.setState({ isArchiveBoardConfirmationDialogHidden: true });
  }

  private hideTeamBoardDeletedInfoDialog = () => {
    this.setState(
      {
        isTeamBoardDeletedInfoDialogHidden: true,
        teamBoardDeletedDialogTitle: '',
        teamBoardDeletedDialogMessage: '',
      }
    );
  }

  private showBoardUrlCopiedToast = () => {
    toast(`The link to retrospective ${this.state.currentBoard.title} has been copied to your clipboard.`);
  }

  private showEmailCopiedToast = () => {
    toast(`The email summary for "${this.state.currentBoard.title}" has been copied to your clipboard.`);
  }

  private tryReconnectToBackend = async () => {
    this.setState({ isReconnectingToBackendService: true });

    const backendConnectionResult = await reflectBackendService.startConnection();
    if (backendConnectionResult) {
      reflectBackendService.switchToBoard(this.state.currentBoard.id);
      this.setState({ isBackendServiceConnected: backendConnectionResult });
    }

    this.setState({ isReconnectingToBackendService: false });
  }

  private archiveCurrentBoard = async () => {
    await BoardDataService.archiveFeedbackBoard(this.state.currentTeam.id, this.state.currentBoard.id);
    reflectBackendService.broadcastDeletedBoard(this.state.currentTeam.id, this.state.currentBoard.id);
    this.hideArchiveBoardConfirmationDialog();
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardArchived, properties: { boardId: this.state.currentBoard.id } });
  }

  private deleteCurrentBoard = async () => {
    await BoardDataService.deleteFeedbackBoard(this.state.currentTeam.id, this.state.currentBoard.id);
    reflectBackendService.broadcastDeletedBoard(this.state.currentTeam.id, this.state.currentBoard.id);
    await this.reloadBoardsForCurrentTeam();
    this.hideDeleteBoardConfirmationDialog();
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardDeleted, properties: { boardId: this.state.currentBoard.id } });
  }

  private copyBoardUrl = async () => {
    const boardDeepLinkUrl = await getBoardUrl(this.state.currentTeam.id, this.state.currentBoard.id);
    copyToClipboard(boardDeepLinkUrl);
  }

  private renderBoardUpdateMetadataFormDialog = (
    isNewBoardCreation: boolean,
    isDuplicatingBoard: boolean,
    hidden: boolean,
    onDismiss: () => void,
    dialogTitle: string,
    placeholderText: string,
    onSubmit: (
      title: string,
      maxVotesPerUser: number,
      columns: IFeedbackColumn[],
      isIncludeTeamEffectivenessMeasurement: boolean,
      isBoardAnonymous: boolean,
      shouldShowFeedbackAfterCollect: boolean,
      displayPrimeDirective: boolean,
      permissions: IFeedbackBoardDocumentPermissions
    ) => void,
    onCancel: () => void) => {

    const permissionOptions: FeedbackBoardPermissionOption[] = []

    for (const team of this.state.projectTeams) {
      permissionOptions.push({
        id: team.id,
        name: team.name,
        uniqueName: team.projectName,
        type: 'team',
      })
    }

    for (const member of this.state.allMembers) {
      permissionOptions.push({
        id: member.identity.id,
        name: member.identity.displayName,
        uniqueName: member.identity.uniqueName,
        thumbnailUrl: member.identity.imageUrl,
        type: 'member',
      })
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
          containerClassName: 'retrospectives-board-metadata-dialog',
          className: 'retrospectives-dialog-modal',
        }}>
        <FeedbackBoardMetadataForm
          isNewBoardCreation={isNewBoardCreation}
          isDuplicatingBoard={isDuplicatingBoard}
          currentBoard={this.state.currentBoard}
          teamId={this.state.currentTeam.id}
          maxvotesPerUser={this.state.maxvotesPerUser}
          placeholderText={placeholderText}
          availablePermissionOptions={permissionOptions}
          onFormSubmit={onSubmit}
          onFormCancel={onCancel} />
      </Dialog>);
  }

  private updateBoardAndBroadcast = (updatedBoard: IFeedbackBoardDocument) => {
    if (!updatedBoard) {
      this.handleBoardDeleted(this.state.currentTeam.id, this.state.currentBoard.id);
    }

    this.replaceBoard(updatedBoard);

    this.hideBoardUpdateDialog();
    reflectBackendService.broadcastUpdatedBoard(this.state.currentTeam.id, updatedBoard.id);
    appInsights.trackEvent({ name: TelemetryEvents.FeedbackBoardMetadataUpdated, properties: { boardId: updatedBoard.id } });
  }

  private readonly boardActionContexualMenuItems: IContextualMenuItem[] = [
    {
      key: 'createBoard',
      className: 'hide-mobile',
      iconProps: { iconName: 'Add' },
      onClick: this.showBoardCreationDialog,
      text: 'Create new retrospective',
      title: 'Create new retrospective',
    },
    {
      key: 'duplicateBoard',
      className: 'hide-mobile',
      iconProps: { iconName: 'Copy' },
      onClick: this.showBoardDuplicateDialog,
      text: 'Create a copy of retrospective',
      title: 'Create a copy of retrospective',
    },
    {
      key: 'editBoard',
      iconProps: { iconName: 'Edit' },
      onClick: this.showBoardUpdateDialog,
      text: 'Edit retrospective',
      title: 'Edit retrospective',
    },
    {
      key: 'copyLink',
      iconProps: { iconName: 'Link' },
      onClick: async () => {
        await this.copyBoardUrl();
        this.showBoardUrlCopiedToast();
      },
      text: 'Copy retrospective link',
      title: 'Copy retrospective link',
    },
    {
      key: 'exportCSV',
      className: 'hide-mobile',
      iconProps: { iconName: 'DownloadDocument' },
      onClick: () => { shareBoardHelper.generateCSVContent(this.state.currentBoard) },
      text: 'Export CSV content',
      title: 'Export CSV content',
    },
    {
      key: 'emailPreview',
      className: 'hide-mobile',
      iconProps: { iconName: 'Mail' },
      onClick: this.showPreviewEmailDialog,
      text: 'Create email summary',
      title: 'Create email summary',
    },
    {
      key: 'retroSummary',
      className: 'hide-mobile',
      iconProps: { iconName: 'ReportDocument' },
      onClick: this.showRetroSummaryDialog,
      text: 'Show Retrospective Summary',
      title: 'Show Retrospective Summary',
    },
    {
      key: 'archiveBoard',
      iconProps: { iconName: 'Archive' },
      onClick: this.showArchiveBoardConfirmationDialog,
      text: 'Archive retrospective',
      title: 'Archive retrospective',
    },
    {
      key: 'deleteBoard',
      iconProps: { iconName: 'Delete' },
      onClick: this.showDeleteBoardConfirmationDialog,
      text: 'Delete retrospective',
      title: 'Delete retrospective',
    },
  ];

  private hideMobileBoardActionsDialog = () => {
    this.setState({
      isMobileBoardActionsDialogHidden: true,
    });
  }

  private showCarouselDialog = () => {
    this.setState({ isCarouselDialogHidden: false });
    appInsights.trackEvent({name: TelemetryEvents.FeedbackItemCarouselLaunched});
  }

  private hideCarouselDialog = () => {
    this.setState({ isCarouselDialogHidden: true });
  }

  private hideLiveSyncInTfsIssueMessageBar = () => {
    this.setState({ isLiveSyncInTfsIssueMessageBarVisible: false });
  }

  private hideDropIssueInEdgeMessageBar = () => {
    this.setState({ isDropIssueInEdgeMessageBarVisible: false });
  }

  public render() {
    if (!this.state.isAppInitialized || !this.state.isTeamDataLoaded) {
      return (
        <Spinner className="initialization-spinner"
          size={SpinnerSize.large}
          label="Loading..."
          ariaLive="assertive" />
      );
    }

    const teamSelectorList: ISelectorList<WebApiTeam> = {
      selectorListItems: [
        {
          finishedLoading: this.state.isAppInitialized,
          header: { id: 'My Teams', title: 'My Teams' },
          items: this.state.userTeams,
        },
        {
          finishedLoading: this.state.isAllTeamsLoaded,
          header: { id: 'All Teams', title: 'All Teams' },
          items: this.state.projectTeams,
        },
      ],
    };

    const boardSelectorList: ISelectorList<IFeedbackBoardDocument> = {
      selectorListItems: [
        {
          finishedLoading: true,
          header: { id: 'All Retrospectives', isHidden: true, title: 'All Retrospectives' },
          items: this.state.boards,
        },
      ],
    };

    const saveTeamEffectivenessMeasurement = () => {
      const teamEffectivenessMeasurementVoteCollection = this.state.currentBoard.teamEffectivenessMeasurementVoteCollection;
console.log("teamEffectivenessMeasurementVoteCollection", teamEffectivenessMeasurementVoteCollection);
const currentUserId = encrypt(this.state.currentUserId);
console.log("currentUserIdFromState", this.state.currentUserId);
console.log("currentUserId", currentUserId);
      const currentUserVote = teamEffectivenessMeasurementVoteCollection.find((vote) => vote.userId === currentUserId);
console.log("currentUserVote", currentUserVote);
      const responseCount = currentUserVote?.responses?.length || 0;
console.log("responseCount", responseCount);
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
console.log("currentUserId", currentUserId);
console.log("currentBoard", currentBoard);
const currentVote = currentBoard.teamEffectivenessMeasurementVoteCollection.find(e => e.userId === currentUserId).responses.find(e => e.questionId === questionId);
console.log("currentVote", currentVote);

      if (!currentVote) {
        currentBoard.teamEffectivenessMeasurementVoteCollection.find(e => e.userId === currentUserId).responses.push({
          questionId: questionId,
          selection: selected,
        });
      } else {
        currentVote.selection = selected;
      }
console.log("currentBoard", currentBoard);

      this.setState({ currentBoard });
    }

    const teamEffectivenessResponseCount = this.state.currentBoard?.teamEffectivenessMeasurementVoteCollection?.length;

    return (
      <div className="retrospective-feedback-board-container">
        <div className="flex items-center px-2 py-2">
          <Dialog
            hidden={this.state.questionIdForDiscussAndActBoardUpdate === -1}
            onDismiss={() => this.setState({ questionIdForDiscussAndActBoardUpdate: -1 })}
            dialogContentProps={{
              type: DialogType.close,
              title: 'Discuss and Act',
              subText: `Are you sure you want to change the template of this board?`,
            }}
            modalProps={{
              isBlocking: true,
              containerClassName: 'retrospectives-delete-feedback-item-dialog',
              className: 'retrospectives-dialog-modal',
            }}>
            <DialogFooter>
              <PrimaryButton onClick={async () => {
                const question = questions.filter((question) => question.id === this.state.questionIdForDiscussAndActBoardUpdate)[0];
                const templateName = question.discussActTemplate;
                const columns = getColumnsByTemplateId(templateName);

                const board = this.state.currentBoard;

                await this.updateBoardMetadata(board.title, board.maxVotesPerUser, columns, board.isIncludeTeamEffectivenessMeasurement, board.isAnonymous, board.shouldShowFeedbackAfterCollect, board.displayPrimeDirective, board.permissions);

                /*
                TODO (enpolat) : in the future we may need to create feedback items based on the answers of the questions
                this.state.currentBoard.teamEffectivenessMeasurementVoteCollection.flatMap(e => e.responses).filter(e => e.questionId === question.id).forEach(async vote => {
                  const item = await itemDataService.createItemForBoard(board.id, vote.selection.toString(), columnId, true);
                  reflectBackendService.broadcastNewItem(columnId, item.id);
                });
                */

                this.setState({ questionIdForDiscussAndActBoardUpdate: -1, isRetroSummaryDialogHidden: true });
              }} text="Proceed" />
              <DefaultButton onClick={() => this.setState({ questionIdForDiscussAndActBoardUpdate: -1 })} text="Cancel" />
            </DialogFooter>
          </Dialog>

          <h1 className="text-2xl font-medium tracking-tight" aria-label="Retrospectives">
            Retrospectives
          </h1>
          <SelectorCombo<WebApiTeam>
            className="flex items-center mx-6"
            currentValue={this.state.currentTeam}
            iconName="users"
            nameGetter={(team) => team.name}
            selectorList={teamSelectorList}
            selectorListItemOnClick={this.changeSelectedTeam}
            title={"Team"}
          />
          <div style={{ flexGrow: 1 }}></div>
          <ExtensionSettingsMenu
            isDesktop={this.state.isDesktop}
            onScreenViewModeChanged={this.toggleAndFixResolution}
          />
        </div>
        <div className="flex w-full items-center justify-start">
          <Pivot>
            <PivotItem headerText="Board">
              {this.state.currentTeam && this.state.currentBoard && !this.state.isSummaryDashboardVisible &&
                <div className="pivot-content-wrapper">
                  <div className="feedback-board-container-header">
                    <div className="vertical-tab-separator hide-mobile" />
                    <div className="board-selector-group">
                      <div className="board-selector">
                        <SelectorCombo<IFeedbackBoardDocument>
                          className="board-selector"
                          currentValue={this.state.currentBoard}
                          iconName="table-columns"
                          nameGetter={(feedbackBoard) => feedbackBoard.title}
                          selectorList={boardSelectorList}
                          selectorListItemOnClick={this.changeSelectedBoard}
                          title={"Retrospective Board"} />
                      </div>
                      <div className="board-actions-menu">
                        <DefaultButton
                          className="contextual-menu-button hide-mobile"
                          aria-label="Board Actions Menu"
                          title="Board actions"
                          menuProps={{
                            className: "board-actions-menu",
                            items: this.boardActionContexualMenuItems,
                          }}
                        >
                          <span className="ms-Button-icon"><i className="fa-solid fa-ellipsis-h"></i></span>&nbsp;
                        </DefaultButton>
                        <Dialog
                          hidden={this.state.isMobileBoardActionsDialogHidden}
                          onDismiss={this.hideMobileBoardActionsDialog}
                          modalProps={{
                            isBlocking: false,
                            containerClassName: 'ms-dialogMainOverride',
                            className: 'retrospectives-dialog-modal',
                          }}
                        >
                          <div className="mobile-contextual-menu-list">
                            {
                              this.boardActionContexualMenuItems.map((boardAction) =>
                                <ActionButton
                                  key={boardAction.key}
                                  className={boardAction.className}
                                  iconProps={boardAction.iconProps}
                                  aria-label="User Settings Menu"
                                  onClick={() => {
                                    this.hideMobileBoardActionsDialog();
                                    boardAction.onClick();
                                  }}
                                  text={boardAction.text}
                                  title={boardAction.title}
                                />
                              )
                            }
                          </div>
                          <DialogFooter>
                            <DefaultButton onClick={this.hideMobileBoardActionsDialog} text="Close" />
                          </DialogFooter>
                        </Dialog>
                      </div>
                    </div>
                    <div className="feedback-workflow-wrapper">
                      {this.state.currentBoard.displayPrimeDirective &&
                        <div className="prime-directive-dialog-section">
                          <Dialog
                            hidden={this.state.isPrimeDirectiveDialogHidden}
                            onDismiss={() => { this.setState({ isPrimeDirectiveDialogHidden: true }); }}
                            dialogContentProps={{
                              type: DialogType.close,
                              title: 'The Prime Directive',
                            }}
                            minWidth={600}
                            modalProps={{
                              isBlocking: true,
                              containerClassName: 'prime-directive-dialog',
                              className: 'retrospectives-dialog-modal',
                            }}>
                            <DialogContent>
                              The purpose of the Prime Directive is to assure that a retrospective has the right culture to make it a positive and result oriented event. It makes a retrospective become an effective team gathering to learn and find solutions to improve the way of working.
                              <br /><br />
                              <strong>&quot;Regardless of what we discover, we understand and truly believe that everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand.&quot;</strong>
                              <br /><br />
                              <em>--Norm Kerth, Project Retrospectives: A Handbook for Team Review</em>
                            </DialogContent>
                            <DialogFooter>
                              <DefaultButton onClick={() => {
                                window.open('https://retrospectivewiki.org/index.php?title=The_Prime_Directive', '_blank');
                              }}
                                text="Open Retrospective Wiki Page" />
                              <PrimaryButton onClick={() => {
                                this.setState({ isPrimeDirectiveDialogHidden: true });
                              }}
                                text="Close"
                                className="prime-directive-close-button" />
                            </DialogFooter>
                          </Dialog>
                          <TooltipHost
                            hostClassName="toggle-carousel-button-tooltip-wrapper"
                            content="Prime Directive"
                            calloutProps={{ gapSpace: 0 }}>
                            <ActionButton
                              className="toggle-carousel-button"
                              text="Prime Directive"
                              iconProps={{ iconName: 'BookAnswers' }}
                              onClick={() => { this.setState({ isPrimeDirectiveDialogHidden: false }); }}>
                            </ActionButton>
                          </TooltipHost>
                        </div>
                      }
                      {this.state.currentBoard.isIncludeTeamEffectivenessMeasurement &&
                        <div className="team-effectiveness-dialog-section">
                          <Dialog
                            hidden={this.state.isIncludeTeamEffectivenessMeasurementDialogHidden}
                            onDismiss={() => { this.setState({ isIncludeTeamEffectivenessMeasurementDialogHidden: true }); }}
                            dialogContentProps={{
                              type: DialogType.close,
                            }}
                            minWidth={640}
                            modalProps={{
                              isBlocking: true,
                              containerClassName: 'team-effectiveness-dialog',
                              className: 'retrospectives-dialog-modal',
                            }}>
                            <DialogContent>
                              <div className="team-effectiveness-section-information"><i className="fa fa-info-circle" />&nbsp;All answers will be saved anonymously</div>
                              <table className="team-effectiveness-measurement-table">
                                <thead>
                                  <tr>
                                    <th></th>
                                    <th></th>
                                    <th colSpan={6} className="team-effectiveness-favorability-label">Unfavorable</th>
                                    <th colSpan={2} className="team-effectiveness-favorability-label">Neutral</th>
                                    <th colSpan={2} className="team-effectiveness-favorability-label">Favorable</th>
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
                                    return (
                                      <EffectivenessMeasurementRow
                                        key={question.id}
                                        questionId={question.id}
                                        votes={this.state.currentBoard.teamEffectivenessMeasurementVoteCollection}
                                        onSelectedChange={selected => effectivenessMeasurementSelectionChanged(question.id, selected)}
                                        iconClass={getQuestionFontAwesomeClass(question.id)}
                                        title={getQuestionShortName(question.id)}
                                        subtitle={getQuestionName(question.id)}
                                        tooltip={getQuestionTooltip(question.id)}
                                      />
                                    )
                                  })}
                                </tbody>
                              </table>
                            </DialogContent>
                            <DialogFooter>
                              <PrimaryButton className="team-effectiveness-submit-button" onClick={() => { saveTeamEffectivenessMeasurement(); }} text="Submit" />
                              <DefaultButton onClick={() => { this.setState({ isIncludeTeamEffectivenessMeasurementDialogHidden: true }); }} text="Cancel" />
                            </DialogFooter>
                          </Dialog>
                          <TooltipHost
                            hostClassName="toggle-carousel-button-tooltip-wrapper"
                            content="Team Assessment"
                            calloutProps={{ gapSpace: 0 }}>
                            <ActionButton
                              className="toggle-carousel-button"
                              iconProps={{ iconName: 'Chart' }}
                              text="Team Assessment"
                              onClick={() => { this.setState({ isIncludeTeamEffectivenessMeasurementDialogHidden: false }); }}>
                            </ActionButton>
                          </TooltipHost>
                        </div>
                      }
                      <div className="workflow-stage-tab-container" role="tablist">
                        <WorkflowStage
                          display="Collect"
                          ariaPosInSet={1}
                          value={WorkflowPhase.Collect}
                          isActive={this.getCurrentBoardPhase() === WorkflowPhase.Collect}
                          clickEventCallback={this.clickWorkflowStateCallback} />
                        <WorkflowStage
                          display="Group"
                          ariaPosInSet={2}
                          value={WorkflowPhase.Group}
                          isActive={this.getCurrentBoardPhase() === WorkflowPhase.Group}
                          clickEventCallback={this.clickWorkflowStateCallback} />
                        <WorkflowStage
                          display="Vote"
                          ariaPosInSet={3}
                          value={WorkflowPhase.Vote}
                          isActive={this.getCurrentBoardPhase() === WorkflowPhase.Vote}
                          clickEventCallback={this.clickWorkflowStateCallback} />
                        <WorkflowStage
                          display="Act"
                          ariaPosInSet={4}
                          value={WorkflowPhase.Act}
                          isActive={this.getCurrentBoardPhase() === WorkflowPhase.Act}
                          clickEventCallback={this.clickWorkflowStateCallback} />
                      </div>
                    </div>
                    {
                      this.getCurrentBoardPhase() === WorkflowPhase.Act &&
                      <TooltipHost
                        hostClassName="toggle-carousel-button-tooltip-wrapper"
                        content="Focus Mode allows your team to focus on one feedback item at a time. Try it!"
                        calloutProps={{ gapSpace: 0 }}>
                        <ActionButton
                          className="toggle-carousel-button hide-mobile"
                          text="Focus Mode"
                          iconProps={{ iconName: 'Bullseye' }}
                          onClick={this.showCarouselDialog}>
                        </ActionButton>
                      </TooltipHost>
                    }
                  </div>
                  {
                    !this.props.isHostedAzureDevOps && this.state.isLiveSyncInTfsIssueMessageBarVisible && !this.state.isBackendServiceConnected &&
                    <MessageBar
                      className="info-message-bar"
                      messageBarType={MessageBarType.info}
                      isMultiline={true}
                      onDismiss={this.hideLiveSyncInTfsIssueMessageBar}
                      styles={
                        {
                          root: {
                            background: '#cceeff'
                          }
                        }
                      }>
                      <span>
                        <em>Retrospectives</em> does not support live updates for on-premise installations. To see updates from other users, please refresh the page.
                      </span>
                    </MessageBar>
                  }
                  {
                    !this.props.isHostedAzureDevOps && this.state.isDropIssueInEdgeMessageBarVisible && !this.state.isBackendServiceConnected &&
                    <MessageBar
                      className="info-message-bar"
                      messageBarType={MessageBarType.warning}
                      isMultiline={true}
                      onDismiss={this.hideDropIssueInEdgeMessageBar}>
                      <span>
                        If your browser does not support grouping a card by dragging and dropping, we recommend using the ellipsis menu on the top-right corner of the feedback.
                      </span>
                    </MessageBar>
                  }
                  {
                    this.props.isHostedAzureDevOps && !this.state.isBackendServiceConnected &&
                    <MessageBar
                      className="info-message-bar"
                      messageBarType={MessageBarType.warning}
                      isMultiline={true}
                      actions={
                        <div className="info-message-bar-action">
                          {this.state.isReconnectingToBackendService &&
                            <Spinner
                              label="Reconnecting..."
                              labelPosition="right"
                              className="info-message-bar-action-spinner" />}
                          {!this.state.isReconnectingToBackendService &&
                            <>
                              <MessageBarButton
                                className="info-message-bar-action-button"
                                onClick={this.tryReconnectToBackend}
                                disabled={this.state.isReconnectingToBackendService}
                                text="Reconnect" />
                              <IconButton
                                className="info-message-bar-action-button"
                                onClick={() => { this.setState({ isBackendServiceConnected: true }) }}
                                disabled={this.state.isReconnectingToBackendService}
                                title="Hide">
                                <span className="ms-Button-icon"><i className="fas fa-times"></i></span>
                              </IconButton>
                            </>
                          }
                        </div>
                      }>
                      <span>We are unable to connect to the live syncing service. You can continue to create and edit items as usual, but changes will not be updated in real-time to or from other users.</span>
                    </MessageBar>
                  }
                  <div className="feedback-board-container">
                    <FeedbackBoard
                      board={this.state.currentBoard}
                      team={this.state.currentTeam}
                      displayBoard={true}
                      workflowPhase={this.state.currentBoard.activePhase}
                      nonHiddenWorkItemTypes={this.state.nonHiddenWorkItemTypes}
                      allWorkItemTypes={this.state.allWorkItemTypes}
                      isCarouselDialogHidden={this.state.isCarouselDialogHidden}
                      hideCarouselDialog={this.hideCarouselDialog}
                      isAnonymous={this.state.currentBoard.isAnonymous ? this.state.currentBoard.isAnonymous : false}
                      hideFeedbackItems={this.state.currentBoard.shouldShowFeedbackAfterCollect ?
                        this.state.currentBoard.activePhase == WorkflowPhase.Collect && this.state.currentBoard.shouldShowFeedbackAfterCollect :
                        false
                      }
                      userId={this.state.currentUserId}
                    />
                  </div>
                  <Dialog
                    hidden={this.state.isDeleteBoardConfirmationDialogHidden}
                    onDismiss={this.hideDeleteBoardConfirmationDialog}
                    dialogContentProps={{
                      type: DialogType.close,
                      title: 'Delete Retrospective',
                      subText: `Are you sure you want to delete the retrospective '${this.state.currentBoard.title}' and all of its feedback items?`,
                    }}
                    modalProps={{
                      isBlocking: true,
                      containerClassName: 'retrospectives-delete-board-confirmation-dialog',
                      className: 'retrospectives-dialog-modal',
                    }}>
                    <DialogFooter>
                      <PrimaryButton onClick={this.deleteCurrentBoard} text="Delete" />
                      <DefaultButton onClick={this.hideDeleteBoardConfirmationDialog} text="Cancel" />
                    </DialogFooter>
                  </Dialog>
                  <Dialog
                    hidden={this.state.isArchiveBoardConfirmationDialogHidden}
                    onDismiss={this.hideArchiveBoardConfirmationDialog}
                    dialogContentProps={{
                      type: DialogType.close,
                      title: 'Archive Retrospective',
                    }}
                    modalProps={{
                      isBlocking: true,
                      containerClassName: 'team-archive-dialog',
                      className: 'retrospectives-dialog-modal',
                    }}>
                    <DialogContent>
                      Are you sure you want to archive the retrospective `<i className="accent3">{this.state.currentBoard.title}</i>` and all of its feedback items?
                      <br /><br />
                      <i className="accent3"><FontIcon iconName="LocationDot" /> Archived retrospectives are not visible in the board list.</i>
                      <br /><br />
                      <i className="accent3"><FontIcon iconName="LocationDot" /> No data will be deleted, Retrospective Board will be visible in the `History` tab.</i>
                    </DialogContent>
                    <DialogFooter>
                      <PrimaryButton onClick={this.archiveCurrentBoard} text="Archive" className="prime-directive-close-button" />
                      <DefaultButton onClick={this.hideArchiveBoardConfirmationDialog} text="Cancel" />
                    </DialogFooter>
                  </Dialog>
                </div>
              }
            </PivotItem>
            <PivotItem headerText="History">
              <div className="pivot-content-wrapper">
                <BoardSummaryTable teamId={this.state.currentTeam.id} supportedWorkItemTypes={this.state.allWorkItemTypes} />
              </div>
            </PivotItem>
          </Pivot>
        </div>
        {this.state.isTeamDataLoaded &&
          !this.state.boards.length &&
          !this.state.isSummaryDashboardVisible &&
          <NoFeedbackBoardsView onCreateBoardClick={this.showBoardCreationDialog} />
        }
        {this.state.isTeamDataLoaded && !this.state.currentTeam &&
          <div>
            We are unable to retrieve the list of teams for this project. Try reloading the page.
          </div>
        }
        {this.renderBoardUpdateMetadataFormDialog(
          true,
          false,
          this.state.isBoardCreationDialogHidden,
          this.hideBoardCreationDialog,
          'Create new retrospective',
          `Example: Retrospective ${new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date())}`,
          this.createBoard,
          this.hideBoardCreationDialog)}
        {this.renderBoardUpdateMetadataFormDialog(
          true,
          true,
          this.state.isBoardDuplicateDialogHidden,
          this.hideBoardDuplicateDialog,
          'Create a copy of retrospective',
          '',
          this.createBoard,
          this.hideBoardDuplicateDialog)}
        {this.state.currentBoard && this.renderBoardUpdateMetadataFormDialog(
          false,
          false,
          this.state.isBoardUpdateDialogHidden,
          this.hideBoardUpdateDialog,
          'Edit retrospective',
          '',
          this.updateBoardMetadata,
          this.hideBoardUpdateDialog)}
        <Dialog
          hidden={this.state.isPreviewEmailDialogHidden}
          onDismiss={this.hidePreviewEmailDialog}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Email summary',
          }}
          modalProps={{
            containerClassName: 'retrospectives-preview-email-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
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
            containerClassName: 'retrospectives-retro-summary-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          {this.state.currentBoard &&
            <>
              <section className="retro-summary-section">
                <div className="retro-summary-section-header">Basic Settings</div>
                <div id="retro-summary-session-date">Session date: {new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(this.state.currentBoard.startDate)}</div>
                <div id="retro-summary-created-by">Created by <img className="avatar" src={this.state.currentBoard?.createdBy.imageUrl} alt={this.state.currentBoard?.createdBy.displayName} /> {this.state.currentBoard?.createdBy.displayName} </div>
              </section>
              <section className="retro-summary-section">
                <div className="retro-summary-section-header">Participant Summary</div>
                <div className="retro-summary-section-item">Contributors: {this.state.contributors.length} participant(s)</div>

                {!this.state.currentBoard.isAnonymous && this.state.contributors.length > 0 &&
                  <div className="retro-summary-contributors-section">
                    {this.state.contributors.map((contributor) =>
                      <div key={contributor.id} className="retro-summary-contributor">
                        <img className="avatar" src={contributor.imageUrl} alt={contributor.name} /> {contributor.name}
                      </div>
                    )}
                  </div>
                }
                <div className="retro-summary-item-horizontal-group">
                  <div className="retro-summary-section-item horizontal-group-item">{Object.keys(this.state.currentBoard?.boardVoteCollection || {}).length} participant(s) casted {this.state.castedVoteCount} vote(s)</div>
                  <div className="retro-summary-section-item horizontal-group-item">{this.state.feedbackItems.length} feedback item(s) created</div>
                  <div className="retro-summary-section-item horizontal-group-item">{this.state.actionItemIds.length} action item(s) created</div>
                </div>
              </section>
              {this.state.currentBoard.isIncludeTeamEffectivenessMeasurement &&
                <section className="retro-summary-section">
                  <div className="retro-summary-section-header">Team Assessment</div>
                  <div>
                    Assessment with favorability percentages and average score <br />
                    ({teamEffectivenessResponseCount} {teamEffectivenessResponseCount == 1 ? 'person' : 'people'} responded)
                    <div className="retro-summary-effectiveness-scores">
                      <ul className="chart">
                        {this.state.effectivenessMeasurementChartData.map((data) => {
                          const averageScore = this.state.effectivenessMeasurementSummary.filter(e => e.questionId == data.questionId)[0]?.average ?? 0;
                          const greenScore = (data.green * 100) / teamEffectivenessResponseCount;
                          const yellowScore = (data.yellow * 100) / teamEffectivenessResponseCount;
                          const redScore = ((data.red * 100) / teamEffectivenessResponseCount);
                          return (
                            <li className="chart-question-block" key={data.questionId}>
                              <div className="chart-question">
                                <i className={getQuestionFontAwesomeClass(data.questionId)} /> &nbsp;
                                {getQuestionShortName(data.questionId)}
                              </div>
                              {data.red > 0 &&
                                <div
                                  className="red-chart-response chart-response"
                                  style={{ width: `${redScore}%` }}
                                  title={`Unfavorable percentage is ${redScore}%`}
                                  aria-label={`Unfavorable percentage is ${redScore}%`}
                                >
                                  {this.percentageFormatter(redScore)}
                                </div>
                              }
                              {data.yellow > 0 &&
                                <div
                                  className="yellow-chart-response chart-response"
                                  style={{ width: `${yellowScore}%` }}
                                  title={`Neutral percentage is ${yellowScore}%`}
                                  aria-label={`Neutral percentage is ${yellowScore}%`}
                                >
                                  {this.percentageFormatter(yellowScore)}
                                </div>
                              }
                              {data.green > 0 &&
                                <div
                                  className="green-chart-response chart-response"
                                  style={{ width: `${greenScore}%` }}
                                  title={`Favorable percentage is ${greenScore}%`}
                                  aria-label={`Favorable percentage is ${greenScore}%`}
                                >
                                  {this.percentageFormatter(greenScore)}
                                </div>
                              }
                              {averageScore > 0 &&
                                <div className="team-effectiveness-average-number"
                                  aria-label={`The average score for this question is ${this.numberFormatter(averageScore)}`}>
                                  {this.numberFormatter(averageScore)}
                                </div>
                              }
                              <button
                                className="assessment-chart-action"
                                title={`${this.state.feedbackItems.length > 0 ? "There are feedback items created for this board, you cannot change the board template" : `Clicking this will modify the board template to the "${getQuestionShortName(data.questionId)} template" allowing your team to discuss and take actions using the retrospective board`}`}
                                disabled={this.state.feedbackItems.length > 0}
                                onClick={() => this.setState({ questionIdForDiscussAndActBoardUpdate: data.questionId })}
                              >Discuss and Act</button>
                            </li>
                          )
                        })
                        }
                      </ul>
                      <div className="chart-legend-section">
                        <div className="chart-legend-group">
                          <section >
                            <div style={{ backgroundColor: "#d6201f" }}></div>
                            <span>Unfavorable</span>
                          </section>
                          <section>
                            <div style={{ backgroundColor: "#ffd302" }}></div>
                            <span>Neutral</span>
                          </section>
                          <section>
                            <div style={{ backgroundColor: "#006b3d" }}></div>
                            <span>Favorable</span>
                          </section>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              }
            </>
          }
        </Dialog>
        <Dialog
          hidden={this.state.isTeamBoardDeletedInfoDialogHidden}
          onDismiss={this.hideTeamBoardDeletedInfoDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: this.state.teamBoardDeletedDialogTitle,
            subText: this.state.teamBoardDeletedDialogMessage,
          }}
          modalProps={{
            isBlocking: true,
            containerClassName: 'retrospectives-board-deleted-info-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          <DialogFooter>
            <DefaultButton aria-label="Dismiss Deleted Team Board Dialog" onClick={this.hideTeamBoardDeletedInfoDialog} text="Dismiss" />
          </DialogFooter>
        </Dialog>
        <ToastContainer
          transition={Slide}
          closeButton={false}
          className="retrospective-notification-toast-container"
          toastClassName="retrospective-notification-toast"
          bodyClassName="retrospective-notification-toast-body"
          progressClassName="retrospective-notification-toast-progress-bar" />
      </div>
    );
  }
}

export default withAITracking(reactPlugin, FeedbackBoardContainer);
