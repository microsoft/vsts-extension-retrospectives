import { IFeedbackBoardDocument, FeedbackBoardDocumentHelper, IFeedbackBoardDocumentPermissions, IFeedbackColumn, IFeedbackItemDocument, IUserVisit, ITeamEffectivenessMeasurementVoteCollection } from "../feedback";
import { WorkflowPhase } from "../workItem";

describe("feedback interfaces and helpers", () => {
  describe("FeedbackBoardDocumentHelper", () => {
    describe("sort method", () => {
      it("should sort boards by creation date in descending order", () => {
        const board1: IFeedbackBoardDocument = {
          id: "board1",
          title: "Board 1",
          teamId: "team1",
          createdBy: { id: "user1" } as any,
          createdDate: new Date("2025-01-01"),
          columns: [],
          activePhase: WorkflowPhase.Collect,
          maxVotesPerUser: 5,
          boardVoteCollection: {},
          teamEffectivenessMeasurementVoteCollection: [],
        };

        const board2: IFeedbackBoardDocument = {
          id: "board2",
          title: "Board 2",
          teamId: "team1",
          createdBy: { id: "user1" } as any,
          createdDate: new Date("2025-01-15"),
          columns: [],
          activePhase: WorkflowPhase.Collect,
          maxVotesPerUser: 5,
          boardVoteCollection: {},
          teamEffectivenessMeasurementVoteCollection: [],
        };

        const result = FeedbackBoardDocumentHelper.sort(board1, board2);
        expect(result).toBeGreaterThan(0); // board2 is newer, so it should come first
      });

      it("should return negative value when board1 is newer than board2", () => {
        const board1: IFeedbackBoardDocument = {
          id: "board1",
          title: "Board 1",
          teamId: "team1",
          createdBy: { id: "user1" } as any,
          createdDate: new Date("2025-12-31"),
          columns: [],
          activePhase: WorkflowPhase.Collect,
          maxVotesPerUser: 5,
          boardVoteCollection: {},
          teamEffectivenessMeasurementVoteCollection: [],
        };

        const board2: IFeedbackBoardDocument = {
          id: "board2",
          title: "Board 2",
          teamId: "team1",
          createdBy: { id: "user1" } as any,
          createdDate: new Date("2025-01-01"),
          columns: [],
          activePhase: WorkflowPhase.Collect,
          maxVotesPerUser: 5,
          boardVoteCollection: {},
          teamEffectivenessMeasurementVoteCollection: [],
        };

        const result = FeedbackBoardDocumentHelper.sort(board1, board2);
        expect(result).toBeLessThan(0); // board1 is newer, so it should come first
      });

      it("should return 0 when boards have the same creation date", () => {
        const sameDate = new Date("2025-06-15");
        const board1: IFeedbackBoardDocument = {
          id: "board1",
          title: "Board 1",
          teamId: "team1",
          createdBy: { id: "user1" } as any,
          createdDate: sameDate,
          columns: [],
          activePhase: WorkflowPhase.Collect,
          maxVotesPerUser: 5,
          boardVoteCollection: {},
          teamEffectivenessMeasurementVoteCollection: [],
        };

        const board2: IFeedbackBoardDocument = {
          id: "board2",
          title: "Board 2",
          teamId: "team1",
          createdBy: { id: "user1" } as any,
          createdDate: sameDate,
          columns: [],
          activePhase: WorkflowPhase.Collect,
          maxVotesPerUser: 5,
          boardVoteCollection: {},
          teamEffectivenessMeasurementVoteCollection: [],
        };

        const result = FeedbackBoardDocumentHelper.sort(board1, board2);
        expect(result).toBe(0);
      });
    });

    describe("filter method", () => {
      const createBoard = (overrides: Partial<IFeedbackBoardDocument> = {}): IFeedbackBoardDocument => ({
        id: "board1",
        title: "Test Board",
        teamId: "team1",
        createdBy: { id: "owner-user" } as any,
        createdDate: new Date(),
        columns: [],
        activePhase: WorkflowPhase.Collect,
        maxVotesPerUser: 5,
        boardVoteCollection: {},
        teamEffectivenessMeasurementVoteCollection: [],
        ...overrides,
      });

      it("should allow access when user is board owner", () => {
        const board = createBoard({ createdBy: { id: "user123" } as any });
        const result = FeedbackBoardDocumentHelper.filter(board, [], "user123");
        expect(result).toBe(true);
      });

      it("should allow access when board is public", () => {
        const board = createBoard({ isPublic: true });
        const result = FeedbackBoardDocumentHelper.filter(board, [], "different-user");
        expect(result).toBe(true);
      });

      it("should allow access when board is public (isPublic is undefined)", () => {
        const board = createBoard({ isPublic: undefined });
        const result = FeedbackBoardDocumentHelper.filter(board, [], "different-user");
        expect(result).toBe(true);
      });

      it("should allow access when user is in permissions Members list", () => {
        const board = createBoard({
          isPublic: false,
          permissions: { Members: ["user1", "user2", "user3"], Teams: [] },
        });
        const result = FeedbackBoardDocumentHelper.filter(board, [], "user2");
        expect(result).toBe(true);
      });

      it("should allow access when user's team is in permissions Teams list", () => {
        const board = createBoard({
          isPublic: false,
          permissions: { Teams: ["team-a", "team-b"], Members: [] },
        });
        const result = FeedbackBoardDocumentHelper.filter(board, ["team-a", "team-c"], "different-user");
        expect(result).toBe(true);
      });

      it("should allow access when permissions.Members is undefined", () => {
        const board = createBoard({
          isPublic: false,
          permissions: { Members: undefined, Teams: [] },
        });
        const result = FeedbackBoardDocumentHelper.filter(board, [], "any-user");
        expect(result).toBe(true);
      });

      it("should allow access when permissions.Teams is undefined", () => {
        const board = createBoard({
          isPublic: false,
          permissions: { Teams: undefined, Members: [] },
        });
        const result = FeedbackBoardDocumentHelper.filter(board, ["team1"], "any-user");
        expect(result).toBe(true);
      });

      it("should allow access when permissions is undefined", () => {
        const board = createBoard({ permissions: undefined, isPublic: false });
        const result = FeedbackBoardDocumentHelper.filter(board, [], "any-user");
        expect(result).toBe(true);
      });

      it("should deny access when user is not owner, board is not public, and user not in permissions", () => {
        const board = createBoard({
          isPublic: false,
          createdBy: { id: "owner-user" } as any,
          permissions: { Members: ["other-user"], Teams: ["other-team"] },
        });
        const result = FeedbackBoardDocumentHelper.filter(board, ["team1"], "requesting-user");
        expect(result).toBe(false);
      });

      it("should deny access when board is archived", () => {
        const board = createBoard({
          isArchived: true,
          isPublic: true,
        });
        const result = FeedbackBoardDocumentHelper.filter(board, [], "any-user");
        expect(result).toBe(false);
      });

      it("should allow access when board is not archived (isArchived is undefined)", () => {
        const board = createBoard({
          isArchived: undefined,
          isPublic: true,
        });
        const result = FeedbackBoardDocumentHelper.filter(board, [], "any-user");
        expect(result).toBe(true);
      });

      it("should allow access when board is explicitly not archived (isArchived is false)", () => {
        const board = createBoard({
          isArchived: false,
          isPublic: true,
        });
        const result = FeedbackBoardDocumentHelper.filter(board, [], "any-user");
        expect(result).toBe(true);
      });

      it("should deny access to archived board even if user is owner", () => {
        const board = createBoard({
          isArchived: true,
          createdBy: { id: "user123" } as any,
        });
        const result = FeedbackBoardDocumentHelper.filter(board, [], "user123");
        expect(result).toBe(false);
      });

      it("should handle complex access scenarios with multiple team matches", () => {
        const board = createBoard({
          isPublic: false,
          permissions: { Teams: ["team-a", "team-b", "team-c"], Members: [] },
        });
        const result = FeedbackBoardDocumentHelper.filter(board, ["team-x", "team-b", "team-y"], "different-user");
        expect(result).toBe(true);
      });

      it("should handle empty team list when checking team permissions", () => {
        const board = createBoard({
          isPublic: false,
          permissions: { Teams: ["team-a"], Members: [] },
        });
        const result = FeedbackBoardDocumentHelper.filter(board, [], "different-user");
        expect(result).toBe(false);
      });
    });
  });

  describe("Interface type compatibility", () => {
    it("should create valid IUserVisit object", () => {
      const visit: IUserVisit = {
        teamId: "team123",
        boardId: "board456",
      };
      expect(visit.teamId).toBe("team123");
      expect(visit.boardId).toBe("board456");
    });

    it("should create valid IUserVisit object without boardId", () => {
      const visit: IUserVisit = {
        teamId: "team123",
      };
      expect(visit.teamId).toBe("team123");
      expect(visit.boardId).toBeUndefined();
    });

    it("should create valid IFeedbackColumn object", () => {
      const column: IFeedbackColumn = {
        id: "col1",
        title: "What went well?",
        iconClass: "far fa-smile",
        accentColor: "#008000",
      };
      expect(column.id).toBe("col1");
      expect(column.title).toBe("What went well?");
    });

    it("should create valid IFeedbackBoardDocumentPermissions object", () => {
      const permissions: IFeedbackBoardDocumentPermissions = {
        Teams: ["team1", "team2"],
        Members: ["user1", "user2", "user3"],
      };
      expect(permissions.Teams).toHaveLength(2);
      expect(permissions.Members).toHaveLength(3);
    });

    it("should create valid ITeamEffectivenessMeasurementVoteCollection object", () => {
      const voteCollection: ITeamEffectivenessMeasurementVoteCollection = {
        userId: "user123",
        responses: [
          { questionId: 1, selection: 5 },
          { questionId: 2, selection: 4 },
        ],
      };
      expect(voteCollection.userId).toBe("user123");
      expect(voteCollection.responses).toHaveLength(2);
    });

    it("should create valid IFeedbackItemDocument object", () => {
      const feedbackItem: IFeedbackItemDocument = {
        id: "item1",
        boardId: "board1",
        title: "Test feedback",
        columnId: "col1",
        originalColumnId: "col1",
        upvotes: 5,
        voteCollection: { user1: 1, user2: 1 },
        createdDate: new Date(),
        userIdRef: "user123",
        timerSecs: 0,
        timerstate: false,
        timerId: null,
        groupIds: [],
        isGroupedCarouselItem: false,
      };
      expect(feedbackItem.title).toBe("Test feedback");
      expect(feedbackItem.upvotes).toBe(5);
    });

    it("should create IFeedbackItemDocument with optional fields", () => {
      const feedbackItem: IFeedbackItemDocument = {
        id: "item2",
        boardId: "board1",
        title: "Another feedback",
        description: "This is a description",
        childFeedbackItemIds: ["child1", "child2"],
        parentFeedbackItemId: "parent1",
        associatedActionItemIds: [101, 102, 103],
        columnId: "col2",
        originalColumnId: "col1",
        upvotes: 10,
        voteCollection: {},
        createdBy: { id: "user456" } as any,
        createdDate: new Date(),
        modifiedDate: new Date(),
        modifiedBy: { id: "user789" } as any,
        userIdRef: "user456",
        timerSecs: 120,
        timerstate: true,
        timerId: 12345,
        groupIds: ["group1", "group2"],
        isGroupedCarouselItem: true,
      };
      expect(feedbackItem.description).toBe("This is a description");
      expect(feedbackItem.childFeedbackItemIds).toHaveLength(2);
      expect(feedbackItem.associatedActionItemIds).toHaveLength(3);
    });

    it("should create complete IFeedbackBoardDocument object", () => {
      const board: IFeedbackBoardDocument = {
        id: "board1",
        __etag: 1,
        title: "Sprint Retrospective",
        teamId: "team1",
        projectId: "project1",
        createdBy: { id: "user1" } as any,
        createdDate: new Date("2025-10-01"),
        startDate: new Date("2025-10-01"),
        endDate: new Date("2025-10-15"),
        areaPaths: ["Area1", "Area2"],
        iterations: ["Sprint 1", "Sprint 2"],
        columns: [
          { id: "col1", title: "Good", iconClass: "far fa-smile", accentColor: "#008000" },
          { id: "col2", title: "Bad", iconClass: "far fa-frown", accentColor: "#cc293d" },
        ],
        modifiedDate: new Date("2025-10-16"),
        modifiedBy: { id: "user2" } as any,
        activePhase: WorkflowPhase.Vote,
        isIncludeTeamEffectivenessMeasurement: true,
        isAnonymous: false,
        shouldShowFeedbackAfterCollect: true,
        maxVotesPerUser: 10,
        boardVoteCollection: { user1: 3, user2: 5 },
        teamEffectivenessMeasurementVoteCollection: [{ userId: "user1", responses: [{ questionId: 1, selection: 4 }] }],
        permissions: { Teams: ["team1"], Members: ["user1", "user2"] },
        isPublic: false,
        isArchived: false,
        archivedDate: undefined,
        archivedBy: undefined,
      };

      expect(board.title).toBe("Sprint Retrospective");
      expect(board.columns).toHaveLength(2);
      expect(board.activePhase).toBe(WorkflowPhase.Vote);
      expect(board.maxVotesPerUser).toBe(10);
    });
  });

  describe("Edge cases", () => {
    it("should deny access when permissions arrays are empty and user is not owner", () => {
      const board: IFeedbackBoardDocument = {
        id: "board1",
        title: "Test",
        teamId: "team1",
        createdBy: { id: "owner" } as any,
        createdDate: new Date(),
        columns: [],
        activePhase: WorkflowPhase.Collect,
        maxVotesPerUser: 5,
        boardVoteCollection: {},
        teamEffectivenessMeasurementVoteCollection: [],
        isPublic: false,
        permissions: { Teams: [], Members: [] },
      };

      const result = FeedbackBoardDocumentHelper.filter(board, [], "random-user");
      expect(result).toBe(false); // Empty arrays with non-owner should deny access
    });

    it("should sort boards with millisecond differences", () => {
      const board1: IFeedbackBoardDocument = {
        id: "board1",
        title: "Board 1",
        teamId: "team1",
        createdBy: { id: "user1" } as any,
        createdDate: new Date("2025-10-16T10:00:00.000Z"),
        columns: [],
        activePhase: WorkflowPhase.Collect,
        maxVotesPerUser: 5,
        boardVoteCollection: {},
        teamEffectivenessMeasurementVoteCollection: [],
      };

      const board2: IFeedbackBoardDocument = {
        id: "board2",
        title: "Board 2",
        teamId: "team1",
        createdBy: { id: "user1" } as any,
        createdDate: new Date("2025-10-16T10:00:00.001Z"), // 1ms later
        columns: [],
        activePhase: WorkflowPhase.Collect,
        maxVotesPerUser: 5,
        boardVoteCollection: {},
        teamEffectivenessMeasurementVoteCollection: [],
      };

      const result = FeedbackBoardDocumentHelper.sort(board1, board2);
      expect(result).toBeGreaterThan(0); // board2 is 1ms newer
    });
  });
});
