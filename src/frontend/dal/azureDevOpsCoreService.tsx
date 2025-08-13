import { CoreRestClient } from "azure-devops-extension-api/Core/CoreClient";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { TeamMember } from "azure-devops-extension-api/WebApi";
import { getClient } from "azure-devops-extension-api/Common";

class AzureDevOpsCoreService {
  private _httpCoreClient: CoreRestClient;

  constructor() {
    if (!this._httpCoreClient) {
      this._httpCoreClient = getClient(CoreRestClient);
    }
  }

  public async getDefaultTeam(projectId: string): Promise<WebApiTeam> {
    return (await this._httpCoreClient.getTeams(projectId, false, 1))[0];
  }

  /**
   * Gets the teams for the current project id.
   * @param projectId The project id.
   * @param teamId The team id.
   */
  public async getTeam(projectId: string, teamId: string): Promise<WebApiTeam> {
    try {
      return await this._httpCoreClient.getTeam(projectId, teamId);
    } catch {
      return null;
    }
  }

  /**
   * Gets the members of teams for the current project id.
   * @param projectId The project id.
   * @param teamId The team id.
   */
  public async getMembers(projectId: string, teamId: string): Promise<TeamMember[]> {
    try {
      return await this._httpCoreClient.getTeamMembersWithExtendedProperties(projectId, teamId, 100, 0);
    } catch {
      return null;
    }
  }

  /**
   * Gets all the teams for the current project id.
   * @param projectId The project id.
   * @param forCurrentUserOnly If true, return teams the requesting user is a member of. If false, return teams the user can see in this project.
   */
  public async getAllTeams(projectId: string, forCurrentUserOnly: boolean): Promise<WebApiTeam[]> {
    const allTeams: WebApiTeam[] = [];

    const _httpCoreClient: CoreRestClient = getClient(CoreRestClient);

    const getTeamBatch = async (skip: number) => {
      const teamBatch: WebApiTeam[] = await _httpCoreClient.getTeams(projectId, forCurrentUserOnly, 100, skip, true);

      if (teamBatch.length > 0) {
        allTeams.push(...teamBatch);
      }

      if (teamBatch.length === 100) {
        await getTeamBatch(skip + 100);
      }
      return;
    };

    await getTeamBatch(0);

    return allTeams;
  }
}

export const azureDevOpsCoreService = new AzureDevOpsCoreService();
