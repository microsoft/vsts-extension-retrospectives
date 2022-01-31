import { TeamFieldValues, TeamSettingsIteration } from 'azure-devops-extension-api/Work';
import { WorkRestClient } from 'azure-devops-extension-api/Work/WorkClient';
import { getClient } from 'azure-devops-extension-api/Common';
// TODO (enpolat) : import { appInsightsClient } from '../utilities/appInsightsClient';

import { getProjectId } from '../utilities/servicesHelper';

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
  public async getIterations(teamId: string, timeframe?: string):
    Promise<TeamSettingsIteration[]> {
    const projectId = await getProjectId();
    const teamContext = {
      project: '',
      projectId,
      team: '',
      teamId
    };

    let teamIterations: TeamSettingsIteration[] = [];

    try {
      teamIterations = await this._httpWorkClient.getTeamIterations(teamContext, timeframe);
    }
    catch (e) {
      if (e.serverError.typeKey === 'CurrentIterationDoesNotExistException') {
        // TODO: Enable once trackTrace is supported
        // appInsightsClient.trackTrace(TelemetryExceptions.CurrentTeamIterationNotFound, e);
      }
      else {
        // TODO (enpolat) : appInsightsClient.trackException(new Error(e.message));
        console.error('An exception occurred while trying to get the team iterations ', e);
      }
    }

    return teamIterations;
  }

  /**
   * Gets the team field values (default being area paths) for project and team
   */
  public async getTeamFieldValues(teamId: string):
    Promise<TeamFieldValues> {
    const projectId = await getProjectId();
    const teamContext = {
      project: '',
      projectId,
      team: '',
      teamId
    };

    let teamFieldValues: TeamFieldValues = undefined;

    try {
      teamFieldValues = await this._httpWorkClient.getTeamFieldValues(teamContext);
    }
    catch (e) {
      // TODO (enpolat) : appInsightsClient.trackException(new Error(e.message));
      console.error('An exception occurred while trying to get the team field values: ', e);
    }

    return teamFieldValues;
  }
}

export const workService = new WorkService();
