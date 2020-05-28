import CoreClient = require('TFS/Core/RestClient');
import VssService = require('VSS/Service');
import Core_Contracts = require('TFS/Core/Contracts');

class AzureDevOpsCoreService {
  private _httpCoreClient: CoreClient.CoreHttpClient4_1;
  private readonly maxTeamsPerRequest = 100;

  constructor() {
    if (!this._httpCoreClient) {
      this._httpCoreClient = VssService.getCollectionClient(CoreClient.CoreHttpClient4_1);
    }
  }

  public async getDefaultTeam(projectId: string): Promise<Core_Contracts.WebApiTeam> {
    return (await this._httpCoreClient.getTeams(projectId, false, 1))[0];
  }

  /**
   * Gets the teams for the current project id.
   * @param projectId The project id.
   * @param teamId The team id.
   */
  public async getTeam(projectId: string, teamId: string): Promise<Core_Contracts.WebApiTeam> {
    try {
      return await this._httpCoreClient.getTeam(projectId, teamId);
    }
    catch {
      return null;
    }
  }

  /**
   * Gets all the teams for the current project id.
   * @param projectId The project id.
   * @param forCurrentUserOnly If true, return teams the requesting user is a member of. If false, return teams the user can see in this project.
   */
  public async getAllTeams(projectId: string, forCurrentUserOnly: boolean):
    Promise<Core_Contracts.WebApiTeam[]> {
    const allTeams: Core_Contracts.WebApiTeam[] = [];
    
    const getTeamBatch = async (skip: number) => {
      const teamBatch: Core_Contracts.WebApiTeam[] =
        await this._httpCoreClient.getTeams(projectId, forCurrentUserOnly, this.maxTeamsPerRequest, skip);
      
      if (teamBatch.length > 0) {
        allTeams.push(...teamBatch);
      }

      if (teamBatch.length === this.maxTeamsPerRequest) {
          await getTeamBatch(skip + this.maxTeamsPerRequest);
      }
      return;
    };

    await getTeamBatch(0);
    return allTeams;
  }
}

export const azureDevOpsCoreService = new AzureDevOpsCoreService();
