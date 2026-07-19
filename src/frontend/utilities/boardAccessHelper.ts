export interface IBoardAccessContext {
  boardOwnerId?: string;
  currentUserId: string;
  isTeamAdmin?: boolean;
  isNewBoardCreation?: boolean;
}

export interface IBoardAccess {
  isBoardOwner: boolean;
  isTeamAdmin: boolean;
  canManageBoard: boolean;
}

export interface IUserPermissionOption {
  id: string;
  isTeamAdmin?: boolean;
}

export const isCurrentUserTeamAdmin = (currentUserId: string, permissionOptions: IUserPermissionOption[]): boolean => {
  return permissionOptions.some(option => option.id === currentUserId && option.isTeamAdmin);
};

export const getBoardAccess = (context: IBoardAccessContext): IBoardAccess => {
  const { boardOwnerId, currentUserId, isTeamAdmin = false, isNewBoardCreation = false } = context;
  const isBoardOwner = isNewBoardCreation || boardOwnerId === currentUserId;

  return {
    isBoardOwner,
    isTeamAdmin,
    canManageBoard: isBoardOwner || isTeamAdmin,
  };
};

export const canCurrentUserManageBoard = (context: IBoardAccessContext): boolean => {
  return getBoardAccess(context).canManageBoard;
};
