/// <reference types="vss-web-extension-sdk" />

/**
 * Generates a URL-safe deep link for board.
 *
 * @param teamId Id of selected team
 * @param boardId Id of selected board
 *
 * @returns the URL-safe (encoded) URL
 */
export const getBoardUrl = (teamId: string, boardId: string): string => {
  const ctx = VSS.getWebContext();

  const queryParams = new URLSearchParams();

  queryParams.append('teamId', teamId);
  queryParams.append('boardId', boardId);

  const boardDeepLinkUrl = `${ctx.host.uri}${ctx.project.name}/_apps/hub/ms-devlabs.team-retrospectives.home?${queryParams.toString()}`;

  return encodeURI(boardDeepLinkUrl);
}
