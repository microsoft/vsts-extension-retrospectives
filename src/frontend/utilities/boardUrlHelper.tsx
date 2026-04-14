import { getExtensionContext } from "azure-devops-extension-sdk";

import { getHostBaseUrl, getProjectName } from "../utilities/servicesHelper";
import { WorkflowPhase } from "../interfaces/workItem";

const getHubContributionId = (): string => {
  const extensionContext = getExtensionContext();

  if (extensionContext.publisherId && extensionContext.extensionId) {
    return `${extensionContext.publisherId}.${extensionContext.extensionId}.home`;
  }

  return `${extensionContext.id}.home`;
};

/**
 * Generates a URL-safe deep link for board.
 *
 * @param teamId Id of selected team
 * @param boardId Id of selected board
 * @param workflowPhase Selected workflow phase
 *
 * @returns the URL-safe (encoded) URL
 */
export const getBoardUrl = async (teamId: string, boardId: string, workflowPhase: WorkflowPhase): Promise<string> => {
  const hostBase = await getHostBaseUrl();
  const projectName = await getProjectName();

  const boardDeepLinkUrl = `${hostBase}${projectName}/_apps/hub/${getHubContributionId()}#teamId=${teamId}&boardId=${boardId}&phase=${workflowPhase}`;

  return encodeURI(boardDeepLinkUrl);
};
