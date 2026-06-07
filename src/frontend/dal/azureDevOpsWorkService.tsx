import { TeamFieldValues, TeamSettingsIteration } from "azure-devops-extension-api/Work";
import { WorkRestClient } from "azure-devops-extension-api/Work/WorkClient";
import { getClient } from "azure-devops-extension-api/Common";
import { TeamContext } from "azure-devops-extension-api/Core";

import { getProjectId } from "../utilities/servicesHelper";
import { appInsights, TelemetryExceptions } from "../utilities/telemetryClient";
import { isAzureDevOpsError, AzureDevOpsErrorTypes } from "../interfaces/azureDevOpsError";

class WorkService {
  private static readonly requirementCategoryReferenceName = "Microsoft.RequirementCategory";

  private _httpWorkClient: WorkRestClient;

  constructor() {
    this._httpWorkClient = getClient(WorkRestClient);
  }

  private async getTeamContext(teamId: string): Promise<TeamContext> {
    const projectId = await getProjectId();

    return {
      project: "",
      projectId,
      team: "",
      teamId,
    };
  }

  /**
   * Gets the iterations for the current project and a given team
   */
  public async getIterations(teamId: string, timeframe?: string): Promise<TeamSettingsIteration[]> {
    const teamContext = await this.getTeamContext(teamId);

    let teamIterations: TeamSettingsIteration[] = [];

    try {
      teamIterations = await this._httpWorkClient.getTeamIterations(teamContext, timeframe);
    } catch (e: unknown) {
      appInsights.trackException({ exception: e instanceof Error ? e : new Error(String(e)), properties: { teamId } });
      if (isAzureDevOpsError(e) && e.serverError?.typeKey === AzureDevOpsErrorTypes.CurrentIterationDoesNotExist) {
        appInsights.trackTrace({ message: TelemetryExceptions.CurrentTeamIterationNotFound, properties: { teamId, e } });
      }
    }

    return teamIterations;
  }

  /**
   * Gets the team field values (default being area paths) for project and team
   */
  public async getTeamFieldValues(teamId: string): Promise<TeamFieldValues> {
    const teamContext = await this.getTeamContext(teamId);

    let teamFieldValues: TeamFieldValues = undefined;

    try {
      teamFieldValues = await this._httpWorkClient.getTeamFieldValues(teamContext);
    } catch (e) {
      appInsights.trackException(e, { teamId });
    }

    return teamFieldValues;
  }

  /**
   * Gets requirement-backlog work item type names for the given team.
   */
  public async getRequirementBacklogWorkItemTypeNames(teamId: string): Promise<string[]> {
    const teamContext = await this.getTeamContext(teamId);

    try {
      const backlogConfiguration = await this._httpWorkClient.getBacklogConfigurations(teamContext);
      return backlogConfiguration.requirementBacklog?.workItemTypes?.map(type => type.name).filter(Boolean) ?? [];
    } catch (e) {
      appInsights.trackException(e, { teamId, categoryReferenceName: WorkService.requirementCategoryReferenceName });
      return [];
    }
  }
}

export const workService = new WorkService();
