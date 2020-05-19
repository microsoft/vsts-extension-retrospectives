// TODO: Switch back to using telemetryclient-team-services-extension package once
// Daniel's changes are checked in. https://github.com/ALM-Rangers/telemetryclient-vsts-extension/pull/5  
import { TelemetryClient, TelemetryClientSettings } from './external/telemetryclient';
import Environment from '../config/environment';
import { WebApiTeam } from 'TFS/Core/Contracts';
import { IFeedbackBoardDocument } from '../interfaces/feedback';
import { isInternalOrg } from './azureDevOpsContextHelper';
import { SHA256 } from 'crypto-js';

const appInsightsSettings: TelemetryClientSettings = {
  key: Environment.AppInsightsInstrumentKey,
  // Extract extension ID from window.location.pathname for extensioncontext.
  // E.g. We want 'retrospective-vsts-extension-dapaulin2' from
  // '/extensions/reflectteam/retrospective-vsts-extension-dapaulin2/0.1.159/1540935253907/src/sample-hub.html'
  extensioncontext: window.location.pathname.split('/')[3],
  disableTelemetry: 'false',
  disableAjaxTracking: 'true',
  enableDebug: 'false'
};

export const TelemetryEvents = {
  WorkItemCreated: 'Work item created',
  ExistingWorkItemLinked: 'Existing work item linked',
  FeedbackBoardCreated: 'Feedback board created',
  FeedbackBoardMetadataUpdated: 'Feedback board metadata updated',
  TeamSelectionChanged: 'Team changed',
  FeedbackBoardSelectionChanged: 'Feedback board changed',
  WorkflowPhaseChanged: 'Workflow phase changed',
  FeedbackBoardDeleted: 'Feedback board deleted',
  SummaryDashboardOpened: 'Summary dashboard opened',
  SummaryDashboardClosed: 'Summary dashboard closed',
  FeedbackBoardShared: 'Feedback board shared',
  FeedbackItemCreated: 'Feedback item created',
  FeedbackItemGrouped: 'Feedback items grouped',
  FeedbackItemUngrouped: 'Feedback items ungrouped',
  FeedbackItemDeleted: 'Feedback item deleted',
  FeedbackItemTitleEdited: 'Feedback item title edited',
  FeedbackItemUpvoted: 'Feedback item upvoted',
  ExtensionLaunched: 'Extension launched',
  FeedbackItemCarouselLaunched: 'Feedback item carousel launched',
}

export const TelemetryExceptions = {
  BoardsNotFoundForTeam: 'Boards not found for team',
  CurrentTeamIterationNotFound: 'Current team iteration not found',
  ItemsNotFoundForBoard: 'Items not found for board'
}

export const TelemetryEventProperties = {
  OldWorkflowPhase: 'Old phase',
  NewWorkflowPhase: 'New phase',
  WorkItemType: 'Work item type',
  TeamId: 'Team ID',
  TeamName: 'Team Name',
  IsTeamDataHashed: 'Is team data hashed?',
  BoardId: 'Board ID',
  BoardName: 'Board name',
  IsBoardDataHashed: 'Is board data hashed?',
  ProjectId: 'Project ID',
  ProjectName: 'Project name',
  IsProjectDataHashed: 'Is project data hashed?',
  OrgId: 'Org ID',
  OrgName: 'Org name',
  IsOrgDataHashed: 'Is org data hashed?',
}

class AppInsightsClient {
  private client = TelemetryClient.getClient(appInsightsSettings);
  private teamId: string = '';
  private teamName: string = '';
  private isTeamDataHashed: boolean = false;
  private boardId: string = '';
  private boardName: string = '';
  private isBoardDataHashed: boolean = false;
  private webContext: WebContext = VSS.getWebContext();
  private isInternal: boolean = isInternalOrg();

  private orgId = this.webContext.host ? this.webContext.host.id : '';
  private orgName = this.webContext.host ? this.webContext.host.name : '';
  private isOrgDataHashed: boolean = !this.isInternal;

  private projectId = this.webContext.project
    ? this.webContext.project.id
    : '';
  private projectName = this.webContext.project
    ? this.webContext.project.name
    : '';
  private isProjectDataHashed: boolean = !this.isInternal;

  private addStandardPrefixAndHash = (originalData: string) => {
    // Add standard prefix to the data before hashing to improve the obfuscation.
    const prefixedData = "Retrospectives-" + originalData;
    return SHA256(prefixedData).toString();
  }

  private transformData = (originalData: string, prefixes: string[]) => {
    if (!originalData) {
      return originalData;
    }

    // Prepend with the upper-level hierarchy detail.
    // For example, a team id should contain org id and project id as a prefix to allow us to split data by team
    // since Application Insights only allows splitting data by a single variable.
    const prefixedData = !prefixes || prefixes.length === 0 
      ? originalData
      : prefixes.join("|") + "|" + originalData;

    return this.isInternal
        ? prefixedData 
        : this.addStandardPrefixAndHash(prefixedData);
  }

  // We store unhashed org/project/team/board names and ids for recognized internal orgs only.
  private createWebContextInfo = (properties?: any) => {
    const webContextInfo = { ...properties };

    webContextInfo[TelemetryEventProperties.OrgId] = this.transformData(this.orgId, []);
    webContextInfo[TelemetryEventProperties.OrgName] = this.transformData(this.orgName, []);
    webContextInfo[TelemetryEventProperties.IsOrgDataHashed] = this.isOrgDataHashed.toString();

    webContextInfo[TelemetryEventProperties.ProjectId] = this.transformData(this.projectId, [this.orgId]);
    webContextInfo[TelemetryEventProperties.ProjectName] = this.transformData(this.projectName, [this.orgName]);
    webContextInfo[TelemetryEventProperties.IsProjectDataHashed] = this.isProjectDataHashed.toString();

    webContextInfo[TelemetryEventProperties.TeamId] = this.transformData(this.teamId, [this.orgId, this.projectId]);
    webContextInfo[TelemetryEventProperties.TeamName] = this.transformData(this.teamName, [this.orgName, this.projectName]);
    webContextInfo[TelemetryEventProperties.IsTeamDataHashed] = this.isTeamDataHashed.toString();

    webContextInfo[TelemetryEventProperties.BoardId] = this.transformData(this.boardId, [this.orgId, this.projectId, this.teamId]);
    webContextInfo[TelemetryEventProperties.BoardName] = this.transformData(this.boardName, [this.orgName, this.projectName, this.teamName]);
    webContextInfo[TelemetryEventProperties.IsBoardDataHashed] = this.isBoardDataHashed.toString();

    return webContextInfo;
  }

  public updateTeamInfo = (team: WebApiTeam) => {
    this.teamId = team
      ? team.id
      : '';

    this.teamName = team
      ? team.name
      : '';

    this.isTeamDataHashed = !this.isInternal;
  }

  public updateBoardInfo = (board: IFeedbackBoardDocument) => {
    this.boardId = board
      ? board.id
      : '';

    this.boardName = board
      ? board.title
      : '';

    this.isBoardDataHashed = !this.isInternal;
  }

  public trackEvent = (name: string, properties?: { [name: string]: string; }) => {
    const expandedProperties = this.createWebContextInfo(properties);
    this.client.trackEvent(name, expandedProperties);
  }

  public trackException = (exception: Error) => {
    const expandedProperties = this.createWebContextInfo(exception);
    this.client.trackErrorException(exception, expandedProperties);
  }

  public trackTrace(message: string, properties?: { [name: string]: string }, securityLevel?: AI.SeverityLevel) {
    const expandedProperties = this.createWebContextInfo(properties);
    this.client.trackTrace(message, expandedProperties, securityLevel);
  }
}

export const appInsightsClient = new AppInsightsClient();
