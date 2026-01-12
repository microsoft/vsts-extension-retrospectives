import { TeamFieldValues, TeamSettingsIteration } from "azure-devops-extension-api/Work";
import { WorkRestClient } from "azure-devops-extension-api/Work/WorkClient";
import { getClient } from "azure-devops-extension-api/Common";

import { getProjectId } from "../utilities/servicesHelper";
import { appInsights, TelemetryExceptions } from "../utilities/telemetryClient";
import { isAzureDevOpsError, AzureDevOpsErrorTypes } from "../interfaces/azureDevOpsError";

class WorkService {
  private _httpWorkClient: WorkRestClient;

  constructor() {
    this._httpWorkClient = getClient(WorkRestClient);
  }

  /**
   * Gets the iterations for the current project and a given team
   */
  public async getIterations(teamId: string, timeframe?: string): Promise<TeamSettingsIteration[]> {
    const projectId = await getProjectId();
    const teamContext = {
      project: "",
      projectId,
      team: "",
      teamId,
    };

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
    const projectId = await getProjectId();
    const teamContext = {
      project: "",
      projectId,
      team: "",
      teamId,
    };

    let teamFieldValues: TeamFieldValues = undefined;

    try {
      teamFieldValues = await this._httpWorkClient.getTeamFieldValues(teamContext);
    } catch (e) {
      appInsights.trackException(e, { teamId });
    }

    return teamFieldValues;
  }
}

export const workService = new WorkService();
