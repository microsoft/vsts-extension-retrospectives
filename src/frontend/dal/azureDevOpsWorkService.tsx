import { TeamFieldValues, TeamSettingsIteration } from "azure-devops-extension-api/Work";
import { WorkRestClient } from "azure-devops-extension-api/Work/WorkClient";
import { getClient } from "azure-devops-extension-api/Common";

import { getProjectId } from "../utilities/servicesHelper";
import { appInsights, TelemetryExceptions } from "../utilities/telemetryClient";

class WorkService {
  private _httpWorkClient: WorkRestClient;

  constructor() {
    if (!this._httpWorkClient) {
      this._httpWorkClient = getClient(WorkRestClient);
    }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      appInsights.trackException({ exception: e, properties: { teamId } });
      if (e.serverError?.typeKey === "CurrentIterationDoesNotExistException") {
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
