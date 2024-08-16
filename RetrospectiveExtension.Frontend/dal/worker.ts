import { getClient } from "azure-devops-extension-api/Common";
import { CoreRestClient, WebApiTeam } from "azure-devops-extension-api/Core";

self.onmessage = async function (e: { data: { projectId: string; forCurrentUserOnly: boolean } }) {
  const responses = await getAllTeams(e.data.projectId, e.data.forCurrentUserOnly);
  self.postMessage(responses);
};

async function getAllTeams(projectId: string, forCurrentUserOnly: boolean): Promise<WebApiTeam[]> {
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

export {};
