import Work_Contracts = require('TFS/Work/Contracts');
import WorkClient = require('TFS/Work/RestClient');
import { appInsightsClient } from '../utilities/appInsightsClient';

class WorkService {
  private _httpWorkClient: WorkClient.WorkHttpClient2_3;

  constructor() {
    if (!this._httpWorkClient) {
      this._httpWorkClient = WorkClient.getClient();
    }
  }

  /**
   * Gets the iterations for the current project and a given team
   */
  public async getIterations(teamId: string, timeframe?: string):
    Promise<Work_Contracts.TeamSettingsIteration[]> {
    const teamContext = {
      project: '',
      projectId: VSS.getWebContext().project.id,
      team: '',
      teamId
    };

    let teamIterations: Work_Contracts.TeamSettingsIteration[] = [];

    try {
      teamIterations = await this._httpWorkClient.getTeamIterations(teamContext, timeframe);
    }
    catch (e) {
      if (e.serverError.typeKey === 'CurrentIterationDoesNotExistException') {
        // TODO: Enable once trackTrace is supported
        // appInsightsClient.trackTrace(TelemetryExceptions.CurrentTeamIterationNotFound, e);
      }
      else {
        appInsightsClient.trackException(new Error(e.message));
        console.error('An exception occurred while trying to get the team iterations ', e);  
      }
    }

    return teamIterations;
  }

  /**
   * Gets the team field values (default being area paths) for project and team
   */
  public async getTeamFieldValues(teamId: string):
    Promise<Work_Contracts.TeamFieldValues> {
    const teamContext = {
      project: '',
      projectId: VSS.getWebContext().project.id,
      team: '',
      teamId
    };

    let teamFieldValues: Work_Contracts.TeamFieldValues = undefined;

    try {
      teamFieldValues = await this._httpWorkClient.getTeamFieldValues(teamContext);
    }
    catch (e) {
      appInsightsClient.trackException(new Error(e.message));
      console.error('An exception occurred while trying to get the team field values: ', e);
    }

    return teamFieldValues;
  }
}

export const workService = new WorkService();
