﻿import { ActionButton, DefaultButton, MessageBarButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import * as React from 'react';
import * as vssClipboard from 'VSS/Utils/Clipboard';

import { ViewMode } from '../config/constants';
import { WorkflowPhase } from '../interfaces/workItem';
import WorkflowStage from './workflowStage';
import BoardDataService from '../dal/boardDataService';
import { IFeedbackBoardDocument, IFeedbackColumn } from '../interfaces/feedback';
import FeedbackBoard from '../components/feedbackBoard';
import FeedbackBoardMetadataForm from './feedbackBoardMetadataForm';
import { reflectBackendService } from '../dal/reflectBackendService';
import { BoardSummaryTable } from './boardSummaryTable';
import { azureDevOpsCoreService } from '../dal/azureDevOpsCoreService';
import { workItemService } from '../dal/azureDevOpsWorkItemService';
import { WebApiTeam } from 'TFS/Core/Contracts';
import { getBoardUrl } from '../utilities/boardUrlHelper';
import NoFeedbackBoardsView from './noFeedbackBoardsView';
import { appInsightsClient, TelemetryEvents, TelemetryEventProperties } from '../utilities/appInsightsClient';
import { userDataService } from '../dal/userDataService';
import ExtensionSettingsMenu from './extensionSettingsMenu';
import SelectorCombo, { ISelectorList } from './selectorCombo';
import FeedbackBoardPreviewEmail from './feedbackBoardPreviewEmail';
import { ToastContainer, toast, Slide } from 'react-toastify';
import { WorkItemType, WorkItemTypeReference } from 'TFS/WorkItemTracking/Contracts';
import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip';
import { isHostedAzureDevOps } from '../utilities/azureDevOpsContextHelper';
import moment = require('moment');

export interface FeedbackBoardContainerProps {
  projectId: string;
}

export interface FeedbackBoardContainerState {
  boards: IFeedbackBoardDocument[];
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
  userTeams: WebApiTeam[];
  projectTeams: WebApiTeam[];
  nonHiddenWorkItemTypes: WorkItemType[];
  allWorkItemTypes: WorkItemType[];

  isPreviewEmailDialogHidden: boolean;
  isBoardCreationDialogHidden: boolean;
  isBoardUpdateDialogHidden: boolean;
  isDeleteBoardConfirmationDialogHidden: boolean;
  isMobileBoardActionsDialogHidden: boolean;
  isMobileTeamSelectorDialogHidden: boolean;
  isTeamBoardDeletedInfoDialogHidden: boolean;
  isTeamSelectorCalloutVisible: boolean;
  teamBoardDeletedDialogMessage: string;
  teamBoardDeletedDialogTitle: string;
  isCarouselDialogHidden: boolean;
  isLiveSyncInTfsIssueMessageBarVisible: boolean;
  isDropIssueInEdgeMessageBarVisible: boolean;

  isDesktop: boolean;
  isAutoResizeEnabled: boolean;
}

export default class FeedbackBoardContainer
  extends React.Component<FeedbackBoardContainerProps, FeedbackBoardContainerState> {
  constructor(props: FeedbackBoardContainerProps) {
    super(props);
    this.state = {
      allWorkItemTypes: [],
      boards: [],
      currentBoard: undefined,
      currentTeam: undefined,
      filteredProjectTeams: [],
      filteredUserTeams: [],
      isAllTeamsLoaded: false,
      isAppInitialized: false,
      isAutoResizeEnabled: true,
      isBackendServiceConnected: false,
      isBoardCreationDialogHidden: true,
      isBoardUpdateDialogHidden: true,
      isCarouselDialogHidden: true,
      isDeleteBoardConfirmationDialogHidden: true,
      isDesktop: true,
      isDropIssueInEdgeMessageBarVisible: true,
      isLiveSyncInTfsIssueMessageBarVisible: true,
      isMobileBoardActionsDialogHidden: true,
      isMobileTeamSelectorDialogHidden: true,
      isPreviewEmailDialogHidden: true,
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
    };
  }

  public async componentDidMount() {
    window.addEventListener('resize', this.handleResolutionChange);
    this.handleResolutionChange();

    try {
      const backendConnectionResult = await reflectBackendService.startConnection();
      this.setState({ isBackendServiceConnected: backendConnectionResult });
      window.addEventListener('error', this.handleErrorEvent);

      const initalizedTeamAndBoardState = await this.initializeFeedbackBoard();
      this.setState({
        ...initalizedTeamAndBoardState,
        isTeamDataLoaded: true,
      }, this.initializeProjectTeams);

      this.setSupportedWorkItemTypesForProject();

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
      // TODO: Better error handling.
      appInsightsClient.trackException(e);
    }

    this.setState({ isAppInitialized: true });
  }

  public componentDidUpdate(prevProps: FeedbackBoardContainerProps, prevState: FeedbackBoardContainerState) {
    if (prevState.currentTeam !== this.state.currentTeam) {
      appInsightsClient.updateTeamInfo(this.state.currentTeam);
    }

    if (prevState.currentBoard !== this.state.currentBoard) {
      reflectBackendService.switchToBoard(this.state.currentBoard ? this.state.currentBoard.id : undefined);
      appInsightsClient.updateBoardInfo(this.state.currentBoard);
      if (this.state.isAppInitialized) {
        userDataService.addVisit(this.state.currentTeam.id, this.state.currentBoard ? this.state.currentBoard.id : undefined);
      }
    }
  }

  public componentWillUnmount() {
    // Remove event listeners.
    window.removeEventListener('resize', this.handleResolutionChange);
    window.removeEventListener('error', this.handleErrorEvent);
    reflectBackendService.removeOnReceiveNewBoard(this.handleNewBoardAvailable);
    reflectBackendService.removeOnReceiveDeletedBoard(this.handleBoardDeleted);
    reflectBackendService.removeOnReceiveUpdatedBoard(this.handleBoardUpdated);
  }

  private toggleAndFixResolution = () => {
    const newView = !this.state.isDesktop;
    
    this.setState({
      isAutoResizeEnabled: false,
      isDesktop: newView,
    });
  }

  private handleResolutionChange = () => {
    const isDesktop = window.innerWidth >= 1024;

    if (this.state.isAutoResizeEnabled && this.state.isDesktop != isDesktop) {
      this.setState({
        isDesktop: isDesktop,
      });
    }
  }

  private handleErrorEvent = async (errorEvent: ErrorEvent) => {
    appInsightsClient.trackException(errorEvent.error);
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
        .sort((b1, b2) => {
          return (new Date(b2.createdDate).getTime() - new Date(b1.createdDate).getTime());
        });

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
    
    const nonHiddenWorkItemTypes = allWorkItemTypes.filter(
      (workItemType) => hiddenWorkItemTypeNames.indexOf(workItemType.name) === -1
    );

    this.setState({
      nonHiddenWorkItemTypes: nonHiddenWorkItemTypes,
      allWorkItemTypes: allWorkItemTypes,
    });
  }

  private replaceBoard = (updatedBoard: IFeedbackBoardDocument) => {
    this.setState(prevState => {
      const newBoards = prevState.boards.map((board) =>
        board.id === updatedBoard.id ? updatedBoard : board);

      const newCurrentBoard = this.state.currentBoard && this.state.currentBoard.id === updatedBoard.id
        ? updatedBoard
        : this.state.currentBoard;

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
      await userDataService.addVisit(this.state.currentTeam.id, this.state.currentBoard && this.state.currentBoard.id);
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
    projectTeams: WebApiTeam[],
    filteredProjectTeams: WebApiTeam[],
    currentTeam: WebApiTeam,
    boards: IFeedbackBoardDocument[],
    currentBoard: IFeedbackBoardDocument,
    isTeamBoardDeletedInfoDialogHidden: boolean,
    teamBoardDeletedDialogTitle: string,
    teamBoardDeletedDialogMessage: string,
  }> => {
    const userTeams = await azureDevOpsCoreService.getAllTeams(this.props.projectId, true);
    if (userTeams && userTeams.length) {
      userTeams.sort((t1, t2) => {
        return t1.name.localeCompare(t2.name, [], { sensitivity: "accent" });
      });
    }

    // Default to select first user team or the project's default team.
    const defaultTeam = (userTeams && userTeams.length)
      ? userTeams[0]
      : await azureDevOpsCoreService.getDefaultTeam(this.props.projectId);

    const baseTeamState = {
      userTeams,
      filteredUserTeams: userTeams,
      projectTeams: (userTeams && userTeams.length) ? [] : [defaultTeam],
      filteredProjectTeams: (userTeams && userTeams.length) ? [] : [defaultTeam],
      currentTeam: defaultTeam,
      isTeamBoardDeletedInfoDialogHidden: true,
      teamBoardDeletedDialogTitle: '',
      teamBoardDeletedDialogMessage: '',
    };

    // Attempt to use query params to pre-select a specific team and board.
    let queryParams: URLSearchParams;
    
    try {
      queryParams = (new URL(document.referrer)).searchParams;

      if (!queryParams) {
        if (!isHostedAzureDevOps)
        {
          throw new Error("URL-related issue occurred with on-premise Azure DevOps");
        }
        else if (!document.referrer){
          throw new Error("URL-related issue occurred with this URL: (Empty URL)");
        }
        else {
          const indexVisualStudioCom = document.referrer.indexOf("visualstudio.com");
          const indexDevAzureCom = document.referrer.indexOf("dev.azure.com");

          if (indexVisualStudioCom >= 0) {
            const indexSecondSlashAfterVisualStudioCom = document.referrer.indexOf("/", indexVisualStudioCom + "visualstudio.com/".length);
            throw new Error("URL-related issue occurred with this URL: " + document.referrer.substring(indexSecondSlashAfterVisualStudioCom));
          }
          else if (indexDevAzureCom >= 0) {
            const indexSecondSlashAfterDevAzureCom = document.referrer.indexOf("/", indexDevAzureCom + "dev.azure.com/".length);
            const indexThirdSlashAfterDevAzureCom = document.referrer.indexOf("/", indexSecondSlashAfterDevAzureCom + 1);
            throw new Error("URL-related issue occurred with this URL: " + document.referrer.substring(indexThirdSlashAfterDevAzureCom));
          }
          else {
            throw new Error("URL-related issue occurred with hosted Azure DevOps but document referrer does not contain dev.azure.com or visualstudio.com");
          }
        }
      }
    }
    catch (e) {
      appInsightsClient.trackException(e);
    }

    if (!queryParams || !queryParams.has('teamId')) {
      // If the teamId query param doesn't exist, attempt to pre-select a team and board by last
      // visited user records.
      const recentVisitState = await this.loadRecentlyVisitedOrDefaultTeamAndBoardState(defaultTeam);

      return {
        ...baseTeamState,
        ...recentVisitState,
      }
    }

    // Attempt to pre-select the team based on the teamId query param.
    const teamIdQueryParam = queryParams.get('teamId');
    const matchedTeam = await azureDevOpsCoreService.getTeam(this.props.projectId, teamIdQueryParam);

    if (!matchedTeam) {
      // If the teamId query param wasn't valid attempt to pre-select a team and board by last
      // visited user records.
      const recentVisitState = await this.loadRecentlyVisitedOrDefaultTeamAndBoardState(defaultTeam);
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

    const boardsForMatchedTeam = await BoardDataService.getBoardsForTeam(matchedTeam.id);
    if (boardsForMatchedTeam && boardsForMatchedTeam.length) {
      boardsForMatchedTeam.sort((b1, b2) => {
        return (new Date(b2.createdDate).getTime() - new Date(b1.createdDate).getTime());
      });
    }

    const queryParamTeamAndDefaultBoardState = {
      ...baseTeamState,
      currentBoard: boardsForMatchedTeam.length
        ? boardsForMatchedTeam[0]
        : null,
      currentTeam: matchedTeam,
      boards: boardsForMatchedTeam,
    };

    if (!queryParams.has('boardId')) {
      // If the boardId query param doesn't exist, we fall back to using the most recently
      // created board. We don't use the last visited records in this case since it may be for
      // a different team.
      return queryParamTeamAndDefaultBoardState;
    }

    // Attempt to pre-select the board based on the boardId query param.
    const boardIdQueryParam = queryParams.get('boardId');
    const matchedBoard = boardsForMatchedTeam.find((board) => board.id === boardIdQueryParam);

    if (matchedBoard) {
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
        teamBoardDeletedDialogMessage: 'Could not find the board specified in the url.',
      };
    }
  }

  private initializeProjectTeams = async () => {
    const allTeams = await azureDevOpsCoreService.getAllTeams(this.props.projectId, false);
    allTeams.sort((t1, t2) => {
      return t1.name.localeCompare(t2.name, [], { sensitivity: "accent" });
    });

    this.setState({
      projectTeams: allTeams,
      filteredProjectTeams: allTeams,
      isAllTeamsLoaded: true,
    });
  }

  /**
   * @description Load the last team and board that this user visited, if such records exist.
   * @returns An object to update the state with recently visited or default team and board data.
   */
  private loadRecentlyVisitedOrDefaultTeamAndBoardState = async (defaultTeam: WebApiTeam): Promise<{
    boards: IFeedbackBoardDocument[],
    currentBoard: IFeedbackBoardDocument,
    currentTeam: WebApiTeam,
  }> => {
    const mostRecentUserVisit = await userDataService.getMostRecentVisit();

    if (mostRecentUserVisit) {
      const mostRecentTeam = await azureDevOpsCoreService.getTeam(this.props.projectId, mostRecentUserVisit.teamId);

      if (mostRecentTeam) {
        const boardsForTeam = await BoardDataService.getBoardsForTeam(mostRecentTeam.id);
        if (boardsForTeam && boardsForTeam.length) {
          boardsForTeam.sort((b1, b2) => {
            return (new Date(b2.createdDate).getTime() - new Date(b1.createdDate).getTime());
          });
        }

        const recentVisitState = {
          boards: boardsForTeam,
          currentBoard: (boardsForTeam && boardsForTeam.length)
            ? boardsForTeam[0]
            : null,
          currentTeam: mostRecentTeam,
        };

        if (boardsForTeam && boardsForTeam.length && mostRecentUserVisit.boardId) {
          const mostRecentBoard = boardsForTeam.find((board) => board.id === mostRecentUserVisit.boardId);
          recentVisitState.currentBoard = mostRecentBoard;
        }

        return recentVisitState;
      }
    }

    const boardsForMatchedTeam = await BoardDataService.getBoardsForTeam(defaultTeam.id);
    if (boardsForMatchedTeam && boardsForMatchedTeam.length) {
      boardsForMatchedTeam.sort((b1, b2) => {
        return (new Date(b2.createdDate).getTime() - new Date(b1.createdDate).getTime());
      });
    }

    return {
      boards: boardsForMatchedTeam,
      currentBoard: (boardsForMatchedTeam && boardsForMatchedTeam.length)
        ? boardsForMatchedTeam[0]
        : null,
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
      const boardsForTeam = await BoardDataService.getBoardsForTeam(matchedTeam.id);
      if (boardsForTeam && boardsForTeam.length) {
        boardsForTeam.sort((b1, b2) => {
          return (new Date(b2.createdDate).getTime() - new Date(b1.createdDate).getTime());
        });
      }

      // @ts-ignore TS2345
      this.setState(prevState => {
        // Ensure that we are actually changing teams to prevent needless rerenders.
        if (!prevState.currentTeam || prevState.currentTeam.id !== matchedTeam.id) {

          return {
            boards: (boardsForTeam && boardsForTeam.length)
              ? boardsForTeam
              : [],
            currentBoard: (boardsForTeam && boardsForTeam.length)
              ? boardsForTeam[0]
              : null,
            currentTeam: matchedTeam,
            isTeamDataLoaded: true,
          }
        }

        return {};
      });
    }

    // TODO: 
    // Show error message in case there's an unexpected case of a chosen team not found 
    // instead of showing the loading indefinitely.
  }

  /**
   * @description Loads all feedback boards for the current team. Defaults the selected board to
   * the most recently created board.
   */
  private reloadBoardsForCurrentTeam = async () => {
    this.setState({ isTeamDataLoaded: false });

    const boardsForTeam = await BoardDataService.getBoardsForTeam(this.state.currentTeam.id);

    if (!boardsForTeam.length) {
      this.setState({
        isTeamDataLoaded: true,
        boards: [],
        currentBoard: null
      });

      return;
    }

    boardsForTeam.sort((b1, b2) => {
      return (new Date(b2.createdDate).getTime() - new Date(b1.createdDate).getTime());
    });

    // Default to select most recently created board.
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
      appInsightsClient.trackEvent(TelemetryEvents.TeamSelectionChanged);
    }
  }

  private changeSelectedBoard = (board: IFeedbackBoardDocument) => {
    if (board) {
      this.setCurrentBoard(board);
      appInsightsClient.trackEvent(TelemetryEvents.FeedbackBoardSelectionChanged);
    }
  }

  private clickWorkflowStateCallback = (clickedElement: React.MouseEvent<HTMLElement>, newPhase: WorkflowPhase) => {
    appInsightsClient.trackEvent(TelemetryEvents.WorkflowPhaseChanged, {
      [TelemetryEventProperties.OldWorkflowPhase]: this.state.currentBoard.activePhase,
      [TelemetryEventProperties.NewWorkflowPhase]: newPhase
    });

    this.setState(prevState => {
      const updatedCurrentBoard = prevState.currentBoard;
      updatedCurrentBoard.activePhase = newPhase;

      return {
        currentBoard: updatedCurrentBoard,
      };
    });
  }

  private createBoard = async (title: string, columns: IFeedbackColumn[], isBoardAnonymous: boolean, shouldShowFeedbackAfterCollect: boolean) => {
    const createdBoard = await BoardDataService.createBoardForTeam(this.state.currentTeam.id, title, columns, isBoardAnonymous, shouldShowFeedbackAfterCollect);
    await this.reloadBoardsForCurrentTeam();
    this.hideBoardCreationDialog();
    reflectBackendService.broadcastNewBoard(this.state.currentTeam.id, createdBoard.id);
    appInsightsClient.trackEvent(TelemetryEvents.FeedbackBoardCreated);
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

  private hidePreviewEmailDialog = (): void => {
    this.setState({ isPreviewEmailDialogHidden: true });
  }

  private updateBoardMetadata = async (title: string, columns: IFeedbackColumn[]) => {
    const updatedBoard =
      await BoardDataService.updateBoardMetadata(this.state.currentTeam.id, this.state.currentBoard.id, title, columns);
    
    this.updateBoardAndBroadcast(updatedBoard);
  }

  private showBoardUpdateDialog = (): void => {
    this.setState({ isBoardUpdateDialogHidden: false });
  }

  private hideBoardUpdateDialog = (): void => {
    this.setState({ isBoardUpdateDialogHidden: true });
  }

  // Note: This is temporary, to support older boards that do not have an active phase.
  private getCurrentBoardPhase = () => {
    if (!this.state.currentBoard || !this.state.currentBoard.activePhase) {
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

  private deleteCurrentBoard = async () => {
    await BoardDataService.deleteFeedbackBoard(this.state.currentTeam.id, this.state.currentBoard.id);
    reflectBackendService.broadcastDeletedBoard(this.state.currentTeam.id, this.state.currentBoard.id);
    await this.reloadBoardsForCurrentTeam();
    this.hideDeleteBoardConfirmationDialog();
    appInsightsClient.trackEvent(TelemetryEvents.FeedbackBoardDeleted);
  }

  private copyBoardUrl = () => {
    const boardDeepLinkUrl = getBoardUrl(this.state.currentTeam.id, this.state.currentBoard.id);
    vssClipboard.copyToClipboard(boardDeepLinkUrl);
  }

  private renderBoardUpdateMetadataFormDialog = (
    isNewBoardCreation: boolean,
    hidden: boolean,
    onDismiss: () => void,
    dialogTitle: string,
    placeholderText: string,
    initialValue: string,
    onSubmit: (
        title: string, columns: IFeedbackColumn[],
        isBoardAnonymous: boolean, shouldShowFeedbackAfterCollect: boolean,
      ) => void,
    onCancel: () => void) => {
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
          currentBoard={this.state.currentBoard}
          teamId={this.state.currentTeam.id}
          placeholderText={placeholderText}
          initialValue={initialValue}
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
    appInsightsClient.trackEvent(TelemetryEvents.FeedbackBoardMetadataUpdated);
  }

  // If an action needs to be hidden on desktop or mobile view, use the item's className property
  // with .hide-mobile or .hide-desktop
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
      key: 'editBoard',
      iconProps: { iconName: 'Edit' },
      onClick: this.showBoardUpdateDialog,
      text: 'Edit retrospective',
      title: 'Edit retrospective',
    },
    {
      key: 'copyLink',
      iconProps: { iconName: 'Link' },
      onClick: () => {
        this.copyBoardUrl();
        this.showBoardUrlCopiedToast();
      },
      text: 'Copy retrospective link',
      title: 'Copy retrospective link',
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
      key: 'deleteBoard',
      iconProps: { iconName: 'Delete' },
      onClick: this.showDeleteBoardConfirmationDialog,
      text: 'Delete retrospective',
      title: 'Delete retrospective',
    },
  ];

  private showMobileBoardActionsDialog = () => {
    this.setState({
      isMobileBoardActionsDialogHidden: false,
    });
  }

  private hideMobileBoardActionsDialog = () => {
    this.setState({
      isMobileBoardActionsDialogHidden: true,
    });
  }

  private showCarouselDialog = () => {
    this.setState({ isCarouselDialogHidden: false });
    appInsightsClient.trackEvent(TelemetryEvents.FeedbackItemCarouselLaunched);
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

    return (
      <div className={this.state.isDesktop? ViewMode.Desktop : ViewMode.Mobile}>
        <div id="extension-header">
          <div className="extension-title-text" aria-label="Retrospectives">
            Retrospectives
          </div>
          <SelectorCombo<WebApiTeam>
            className="team-selector"
            currentValue={this.state.currentTeam}
            iconName="People"
            nameGetter={(team) => team.name}
            selectorList={teamSelectorList}
            selectorListItemOnClick={this.changeSelectedTeam}
            title={"Team"}
          />
          <ExtensionSettingsMenu isDesktop={this.state.isDesktop} onScreenViewModeChanged={this.toggleAndFixResolution} />
        </div>
        <div className="pivot-container">
          <Pivot>
            <PivotItem headerText="Retrospectives">
              {this.state.currentTeam && this.state.currentBoard && !this.state.isSummaryDashboardVisible &&
                <div className="pivot-content-wrapper">
                  <div className="feedback-board-container-header">
                    <div className="vertical-tab-separator hide-mobile" />
                    <div className="board-selector-group">
                      <div className="board-selector">
                        <SelectorCombo<IFeedbackBoardDocument>
                          className="board-selector"
                          currentValue={this.state.currentBoard}
                          iconName="BacklogBoard"
                          nameGetter={(feedbackBoard) => feedbackBoard.title}
                          selectorList={boardSelectorList}
                          selectorListItemOnClick={this.changeSelectedBoard}
                          title={"Retrospective Board"} />
                      </div>
                      <div className="board-actions-menu">
                        <DefaultButton
                          className="contextual-menu-button hide-mobile"
                          aria-label="Board Actions Menu"   
                          iconProps={{ iconName: 'More' }}
                          title="Board actions"
                          menuProps={{
                            items: this.boardActionContexualMenuItems,
                          }}
                        />
                        <DefaultButton
                          className="contextual-menu-button hide-desktop"
                          aria-label="Board Actions Menu"   
                          iconProps={{ iconName: 'More' }}
                          title="Board actions"
                          onClick={this.showMobileBoardActionsDialog}
                        />
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
                      <WorkflowStage
                        display="Collect "
                        value={WorkflowPhase.Collect}
                        isActive={this.getCurrentBoardPhase() === WorkflowPhase.Collect}
                        clickEventCallback={this.clickWorkflowStateCallback} />
                      <WorkflowStage
                        display=" Group "
                        value={WorkflowPhase.Group}
                        isActive={this.getCurrentBoardPhase() === WorkflowPhase.Group}
                        clickEventCallback={this.clickWorkflowStateCallback} />
                      <WorkflowStage
                        display=" Vote "
                        value={WorkflowPhase.Vote}
                        isActive={this.getCurrentBoardPhase() === WorkflowPhase.Vote}
                        clickEventCallback={this.clickWorkflowStateCallback} />
                      <WorkflowStage
                        display=" Act"
                        value={WorkflowPhase.Act}
                        isActive={this.getCurrentBoardPhase() === WorkflowPhase.Act}
                        clickEventCallback={this.clickWorkflowStateCallback} />
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
                    !isHostedAzureDevOps() && this.state.isLiveSyncInTfsIssueMessageBarVisible && !this.state.isBackendServiceConnected &&
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
                    !isHostedAzureDevOps() && this.state.isDropIssueInEdgeMessageBarVisible && !this.state.isBackendServiceConnected &&
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
                    isHostedAzureDevOps() && !this.state.isBackendServiceConnected &&
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
                            <MessageBarButton
                              className="info-message-bar-action-button"
                              onClick={this.tryReconnectToBackend}
                              disabled={this.state.isReconnectingToBackendService}
                              text="Reconnect" />}
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
                </div>
              }
            </PivotItem>
            <PivotItem headerText="History">
                <BoardSummaryTable teamId={this.state.currentTeam.id} supportedWorkItemTypes={this.state.allWorkItemTypes} />
            </PivotItem>
          </Pivot>
        </div>
        <div className="feedback-board-container-header-spacer hide-mobile" />
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
          this.state.isBoardCreationDialogHidden,
          this.hideBoardCreationDialog,
          'Create new retrospective',
          `Example: Retrospective ${moment().format('MMM Do, YYYY')}`,
          '',
          this.createBoard,
          this.hideBoardCreationDialog)}
        {this.state.currentBoard && this.renderBoardUpdateMetadataFormDialog(
          false,
          this.state.isBoardUpdateDialogHidden,
          this.hideBoardUpdateDialog,
          'Edit retrospective',
          '',
          this.state.currentBoard.title,
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