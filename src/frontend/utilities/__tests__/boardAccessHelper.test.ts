import { canCurrentUserManageBoard, getBoardAccess, isCurrentUserTeamAdmin } from "../boardAccessHelper";

describe("boardAccessHelper", () => {
  describe("isCurrentUserTeamAdmin", () => {
    it("returns true when current user is marked as team admin", () => {
      const result = isCurrentUserTeamAdmin("user-1", [
        { id: "user-1", isTeamAdmin: true },
        { id: "user-2", isTeamAdmin: false },
      ]);

      expect(result).toBe(true);
    });

    it("returns false when current user is not a team admin", () => {
      const result = isCurrentUserTeamAdmin("user-1", [
        { id: "user-1", isTeamAdmin: false },
        { id: "user-2", isTeamAdmin: true },
      ]);

      expect(result).toBe(false);
    });
  });

  describe("getBoardAccess", () => {
    it("marks board owner correctly", () => {
      const result = getBoardAccess({
        boardOwnerId: "owner-1",
        currentUserId: "owner-1",
      });

      expect(result).toEqual({
        isBoardOwner: true,
        isTeamAdmin: false,
        canManageBoard: true,
      });
    });

    it("allows team admin to manage board even when not owner", () => {
      const result = getBoardAccess({
        boardOwnerId: "owner-1",
        currentUserId: "admin-1",
        isTeamAdmin: true,
      });

      expect(result).toEqual({
        isBoardOwner: false,
        isTeamAdmin: true,
        canManageBoard: true,
      });
    });

    it("treats new board creation as owner context", () => {
      const result = getBoardAccess({
        boardOwnerId: undefined,
        currentUserId: "user-1",
        isNewBoardCreation: true,
      });

      expect(result).toEqual({
        isBoardOwner: true,
        isTeamAdmin: false,
        canManageBoard: true,
      });
    });
  });

  describe("canCurrentUserManageBoard", () => {
    it("returns true for board owner", () => {
      const result = canCurrentUserManageBoard({
        boardOwnerId: "owner-1",
        currentUserId: "owner-1",
      });

      expect(result).toBe(true);
    });

    it("returns true for team admin", () => {
      const result = canCurrentUserManageBoard({
        boardOwnerId: "owner-1",
        currentUserId: "admin-1",
        isTeamAdmin: true,
      });

      expect(result).toBe(true);
    });

    it("returns false when user is neither owner nor team admin", () => {
      const result = canCurrentUserManageBoard({
        boardOwnerId: "owner-1",
        currentUserId: "member-1",
      });

      expect(result).toBe(false);
    });
  });
});
