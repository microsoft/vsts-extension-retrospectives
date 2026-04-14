import type { TeamSettingsIteration } from "azure-devops-extension-api/Work";

const TimeFrame = {
  Past: 0,
  Current: 1,
  Future: 2,
} as const;

jest.mock("azure-devops-extension-api/Work", () => ({
  TimeFrame,
}));

const mockCreateBoardForTeam = jest.fn();
const mockGetBoardsForTeam = jest.fn();
const mockGetSetting = jest.fn();

jest.mock("../../dal/boardDataService", () => ({
  __esModule: true,
  default: {
    createBoardForTeam: (...args: unknown[]) => mockCreateBoardForTeam(...args),
    getBoardsForTeam: (...args: unknown[]) => mockGetBoardsForTeam(...args),
    getSetting: (...args: unknown[]) => mockGetSetting(...args),
  },
}));

import {
  buildSprintRetrospectiveTitle,
  createOrGetSprintRetrospectiveBoard,
  findSprintRetrospectiveBoard,
  getCurrentIteration,
  resolveIterationFromConfiguration,
  sortIterationsForRetrospectives,
} from "../sprintRetrospectiveHelper";

describe("sprintRetrospectiveHelper", () => {
  const createIteration = (overrides: Partial<TeamSettingsIteration> = {}): TeamSettingsIteration => {
    return {
      id: "iteration-1",
      name: "Sprint 12",
      path: "Project\\Sprint 12",
      attributes: {
        finishDate: new Date("2024-02-18T00:00:00.000Z"),
        startDate: new Date("2024-02-05T00:00:00.000Z"),
        timeFrame: TimeFrame.Current,
      },
      ...overrides,
    } as TeamSettingsIteration;
  };

  const iteration = createIteration();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds the sprint retrospective title from the iteration name", () => {
    expect(buildSprintRetrospectiveTitle(iteration)).toBe("Sprint 12 Retrospective");
  });

  it("sorts current, future, past, and unknown iterations in that order", () => {
    const iterations = [
      createIteration({ id: "unknown", name: "Unknown", attributes: { startDate: undefined, finishDate: undefined, timeFrame: 99 as never } as never }),
      createIteration({ id: "past", name: "Past", attributes: { startDate: new Date("2024-01-01T00:00:00.000Z"), finishDate: new Date("2024-01-14T00:00:00.000Z"), timeFrame: TimeFrame.Past } }),
      createIteration({ id: "future-b", name: "Sprint 14", attributes: { startDate: new Date("2024-03-04T00:00:00.000Z"), finishDate: new Date("2024-03-17T00:00:00.000Z"), timeFrame: TimeFrame.Future } }),
      createIteration({ id: "future-a", name: "Sprint 13", attributes: { startDate: new Date("2024-02-19T00:00:00.000Z"), finishDate: new Date("2024-03-03T00:00:00.000Z"), timeFrame: TimeFrame.Future } }),
      iteration,
    ];

    expect(sortIterationsForRetrospectives(iterations).map(currentIteration => currentIteration.id)).toEqual(["iteration-1", "future-b", "future-a", "past", "unknown"]);
  });

  it("falls back to alphabetical ordering when timeframe and timestamps are identical", () => {
    const alphaIteration = createIteration({ id: "alpha", name: "Alpha", attributes: { startDate: new Date("2024-02-19T00:00:00.000Z"), finishDate: new Date("2024-03-03T00:00:00.000Z"), timeFrame: TimeFrame.Future } });
    const betaIteration = createIteration({ id: "beta", name: "Beta", attributes: { startDate: new Date("2024-02-19T00:00:00.000Z"), finishDate: new Date("2024-03-03T00:00:00.000Z"), timeFrame: TimeFrame.Future } });

    expect(sortIterationsForRetrospectives([betaIteration, alphaIteration]).map(currentIteration => currentIteration.id)).toEqual(["alpha", "beta"]);
  });

  it("treats iterations without attributes as unknown and sorts them by name when timestamps are unavailable", () => {
    const noAttributesAlpha = createIteration({ id: "alpha-no-attributes", name: "Alpha", attributes: undefined as never });
    const noAttributesBeta = createIteration({ id: "beta-no-attributes", name: "Beta", attributes: undefined as never });

    expect(sortIterationsForRetrospectives([noAttributesBeta, noAttributesAlpha]).map(currentIteration => currentIteration.id)).toEqual([
      "alpha-no-attributes",
      "beta-no-attributes",
    ]);
  });

  it("returns the current iteration when present", () => {
    const futureIteration = createIteration({ id: "future", attributes: { startDate: new Date("2024-02-19T00:00:00.000Z"), finishDate: new Date("2024-03-03T00:00:00.000Z"), timeFrame: TimeFrame.Future } });

    expect(getCurrentIteration([futureIteration, iteration])?.id).toBe("iteration-1");
  });

  it("returns undefined when no current iteration exists", () => {
    const futureIteration = createIteration({ id: "future", attributes: { startDate: new Date("2024-02-19T00:00:00.000Z"), finishDate: new Date("2024-03-03T00:00:00.000Z"), timeFrame: TimeFrame.Future } });

    expect(getCurrentIteration([futureIteration])).toBeUndefined();
  });

  it("ignores iterations without attributes when searching for the current sprint", () => {
    const unknownIteration = createIteration({ id: "unknown", attributes: undefined as never });

    expect(getCurrentIteration([unknownIteration, iteration])?.id).toBe("iteration-1");
  });

  it("returns an existing board when sprint dates already match", async () => {
    const existingBoard = {
      id: "board-1",
      title: "Legacy retrospective title",
      teamId: "team-1",
      startDate: new Date("2024-02-05T00:00:00.000Z"),
      endDate: new Date("2024-02-18T00:00:00.000Z"),
      isArchived: false,
    } as any;

    mockGetBoardsForTeam.mockResolvedValue([existingBoard]);

    const result = await createOrGetSprintRetrospectiveBoard({
      teamId: "team-1",
      iteration,
    });

    expect(result).toEqual({ board: existingBoard, wasCreated: false });
    expect(mockCreateBoardForTeam).not.toHaveBeenCalled();
  });

  it("matches boards by normalized retrospective title", () => {
    const titleMatchedBoard = {
      id: "board-title",
      title: "  sprint 12 retrospective  ",
      teamId: "team-1",
      isArchived: false,
    } as any;

    expect(findSprintRetrospectiveBoard([titleMatchedBoard], "team-1", iteration)?.id).toBe("board-title");
  });

  it("matches boards by title when the iteration omits attributes entirely", () => {
    const titleMatchedBoard = {
      id: "board-title-no-attributes",
      title: "Sprint 12 Retrospective",
      teamId: "team-1",
      isArchived: false,
    } as any;
    const noAttributesIteration = createIteration({ attributes: undefined as never });

    expect(findSprintRetrospectiveBoard([titleMatchedBoard], "team-1", noAttributesIteration)?.id).toBe("board-title-no-attributes");
  });

  it("ignores archived boards and boards for other teams", () => {
    const boards = [
      {
        id: "archived",
        title: "Sprint 12 Retrospective",
        teamId: "team-1",
        isArchived: true,
      },
      {
        id: "other-team",
        title: "Sprint 12 Retrospective",
        teamId: "team-2",
        isArchived: false,
      },
    ] as any[];

    expect(findSprintRetrospectiveBoard(boards as any, "team-1", iteration)).toBeUndefined();
  });

  it("creates a new board using persisted quick-create defaults when no matching board exists", async () => {
    const createdBoard = {
      id: "board-2",
      title: "Sprint 12 Retrospective",
      teamId: "team-1",
    } as any;

    mockGetBoardsForTeam.mockResolvedValue([]);
    mockGetSetting.mockImplementation((key: string) => {
      switch (key) {
        case "lastVotes":
          return Promise.resolve(8);
        case "lastTeamEffectiveness":
          return Promise.resolve(true);
        case "lastShowFeedback":
          return Promise.resolve(true);
        case "lastAnonymous":
          return Promise.resolve(false);
        default:
          return Promise.resolve(undefined);
      }
    });
    mockCreateBoardForTeam.mockResolvedValue(createdBoard);

    const result = await createOrGetSprintRetrospectiveBoard({
      teamId: "team-1",
      iteration,
    });

    expect(result).toEqual({ board: createdBoard, wasCreated: true });
    expect(mockCreateBoardForTeam).toHaveBeenCalledTimes(1);

    const [teamId, title, maxVotesPerUser, columns, includeTeamAssessment, showFeedbackAfterCollect, isAnonymous, startDate, endDate] = mockCreateBoardForTeam.mock.calls[0];
    expect(teamId).toBe("team-1");
    expect(title).toBe("Sprint 12 Retrospective");
    expect(maxVotesPerUser).toBe(8);
    expect(columns).toHaveLength(2);
    expect(includeTeamAssessment).toBe(true);
    expect(showFeedbackAfterCollect).toBe(true);
    expect(isAnonymous).toBe(false);
    expect(startDate).toEqual(new Date("2024-02-05T00:00:00.000Z"));
    expect(endDate).toEqual(new Date("2024-02-18T00:00:00.000Z"));
  });

  it("uses passed existing boards and default fallback settings when persisted settings are invalid", async () => {
    const createdBoard = {
      id: "board-3",
      title: "Sprint 99 Retrospective",
      teamId: "team-9",
    } as any;
    const invalidDateIteration = createIteration({
      id: "iteration-invalid",
      name: "Sprint 99",
      attributes: {
        startDate: "not-a-date" as unknown as Date,
        finishDate: "not-a-date" as unknown as Date,
        timeFrame: 99 as never,
      },
    });
    const permissions = { Members: ["user-1"], Teams: ["team-9"] };

    mockGetSetting.mockResolvedValueOnce(-2).mockResolvedValueOnce("yes").mockResolvedValueOnce(undefined).mockResolvedValueOnce(null);
    mockCreateBoardForTeam.mockResolvedValue(createdBoard);

    const result = await createOrGetSprintRetrospectiveBoard({
      teamId: "team-9",
      iteration: invalidDateIteration,
      existingBoards: [],
      permissions,
    });

    expect(result).toEqual({ board: createdBoard, wasCreated: true });
    expect(mockGetBoardsForTeam).not.toHaveBeenCalled();
    expect(mockCreateBoardForTeam).toHaveBeenCalledWith(
      "team-9",
      "Sprint 99 Retrospective",
      5,
      expect.any(Array),
      false,
      false,
      false,
      undefined,
      undefined,
      permissions,
    );
  });

  it("passes undefined sprint dates through when the iteration omits them entirely", async () => {
    const createdBoard = { id: "board-4", title: "Sprint 100 Retrospective", teamId: "team-10" } as any;
    const noDateIteration = createIteration({
      id: "iteration-no-date",
      name: "Sprint 100",
      attributes: {
        startDate: undefined,
        finishDate: undefined,
        timeFrame: TimeFrame.Future,
      },
    });

    mockGetSetting.mockResolvedValue(undefined);
    mockCreateBoardForTeam.mockResolvedValue(createdBoard);

    await createOrGetSprintRetrospectiveBoard({
      teamId: "team-10",
      iteration: noDateIteration,
      existingBoards: [],
    });

    expect(mockCreateBoardForTeam).toHaveBeenCalledWith(
      "team-10",
      "Sprint 100 Retrospective",
      5,
      expect.any(Array),
      false,
      false,
      false,
      undefined,
      undefined,
      undefined,
    );
  });

  it("passes undefined sprint dates through when the iteration has no attributes object", async () => {
    const createdBoard = { id: "board-5", title: "Sprint 101 Retrospective", teamId: "team-10" } as any;
    const noAttributesIteration = createIteration({
      id: "iteration-no-attributes",
      name: "Sprint 101",
      attributes: undefined as never,
    });

    mockGetSetting.mockResolvedValue(undefined);
    mockCreateBoardForTeam.mockResolvedValue(createdBoard);

    await createOrGetSprintRetrospectiveBoard({
      teamId: "team-10",
      iteration: noAttributesIteration,
      existingBoards: [],
    });

    expect(mockCreateBoardForTeam).toHaveBeenCalledWith(
      "team-10",
      "Sprint 101 Retrospective",
      5,
      expect.any(Array),
      false,
      false,
      false,
      undefined,
      undefined,
      undefined,
    );
  });

  it("resolves an iteration from backlog configuration payloads", () => {
    const iterations = [
      iteration,
      createIteration({
        id: "iteration-2",
        name: "Sprint 13",
        path: "Project\\Sprint 13",
        attributes: {
          finishDate: new Date("2024-03-03T00:00:00.000Z"),
          startDate: new Date("2024-02-19T00:00:00.000Z"),
          timeFrame: TimeFrame.Future,
        },
      }),
    ];

    const matchedIteration = resolveIterationFromConfiguration(
      {
        backlogIteration: {
          path: "Project\\Sprint 13",
        },
      },
      iterations,
    );

    expect(matchedIteration?.id).toBe("iteration-2");
  });

  it("recursively resolves nested iteration payloads and skips unrelated keys", () => {
    const futureIteration = createIteration({ id: "iteration-2", name: "Sprint 13", path: "Project\\Sprint 13", attributes: { startDate: new Date("2024-02-19T00:00:00.000Z"), finishDate: new Date("2024-03-03T00:00:00.000Z"), timeFrame: TimeFrame.Future } });

    const matchedIteration = resolveIterationFromConfiguration(
      {
        iterationContext: {
          metadata: {
            ignored: true,
          },
          nestedIteration: {
            iterationPath: "Project\\Sprint 13",
          },
        },
      },
      [iteration, futureIteration],
    );

    expect(matchedIteration?.id).toBe("iteration-2");
  });

  it("resolves an iteration from string configuration values", () => {
    const futureIteration = createIteration({ id: "iteration-2", name: "Sprint 13", path: "Project\\Sprint 13", attributes: { startDate: new Date("2024-02-19T00:00:00.000Z"), finishDate: new Date("2024-03-03T00:00:00.000Z"), timeFrame: TimeFrame.Future } });

    expect(resolveIterationFromConfiguration({ selectedIteration: "iteration-2" }, [iteration, futureIteration])?.id).toBe("iteration-2");
  });

  it("resolves an iteration from any configuration key containing iteration", () => {
    const futureIteration = createIteration({ id: "iteration-2", name: "Sprint 13", path: "Project\\Sprint 13", attributes: { startDate: new Date("2024-02-19T00:00:00.000Z"), finishDate: new Date("2024-03-03T00:00:00.000Z"), timeFrame: TimeFrame.Future } });

    expect(resolveIterationFromConfiguration({ customIterationReference: "Project\\Sprint 13" }, [iteration, futureIteration])?.id).toBe("iteration-2");
  });

  it("returns undefined when configuration does not contain a matching iteration", () => {
    expect(resolveIterationFromConfiguration({ selectedIteration: 5 as unknown as string }, [iteration])).toBeUndefined();
    expect(resolveIterationFromConfiguration({ selectedIteration: { iterationName: "No Match" } }, [iteration])).toBeUndefined();
    expect(resolveIterationFromConfiguration({}, [iteration])).toBeUndefined();
  });
});