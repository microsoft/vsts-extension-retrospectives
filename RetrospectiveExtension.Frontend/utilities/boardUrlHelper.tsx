import { getHostBaseUrl, getProjectName } from '../utilities/servicesHelper';

/**
 * Generates a URL-safe deep link for board.
 *
 * @param teamId Id of selected team
 * @param boardId Id of selected board
 *
 * @returns the URL-safe (encoded) URL
 */
export const getBoardUrl = async (teamId: string, boardId: string): Promise<string> => {
  const hostBase = await getHostBaseUrl();
  const projectName = await getProjectName();

  const queryParams = new URLSearchParams();

  queryParams.append('teamId', teamId);
  queryParams.append('boardId', boardId);

  const boardDeepLinkUrl = `${hostBase}${projectName}/_apps/hub/ms-devlabs.team-retrospectives.home?${queryParams.toString()}`;

  return encodeURI(boardDeepLinkUrl);
}
