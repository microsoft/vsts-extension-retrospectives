/**
 * Generates deep link for board.
 * @param teamId Id of selected team
 * @param boardId Id of selected board
 */
export const getBoardUrl = (teamId: string, boardId: string): string => {
    const url = (new URL(document.referrer));
    const queryParams = new URLSearchParams();
    queryParams.append('teamId', teamId);
    queryParams.append('boardId', boardId);
    const boardDeepLinkUrl = url.protocol + '//' + url.hostname + url.pathname + '?'
      + queryParams.toString();

    return boardDeepLinkUrl;
}
