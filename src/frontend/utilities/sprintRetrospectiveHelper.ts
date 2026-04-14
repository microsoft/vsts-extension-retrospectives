import { TeamSettingsIteration, TimeFrame } from "azure-devops-extension-api/Work";

import BoardDataService from "../dal/boardDataService";
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions } from "../interfaces/feedback";
import { getColumnsByTemplateId } from "./boardColumnsHelper";
import { t } from "./localization";

const DEFAULT_MAX_VOTES_PER_USER = 5;
const DEFAULT_BOARD_TEMPLATE_ID = "";

type SprintRetrospectiveDefaults = {
  maxVotesPerUser: number;
  isIncludeTeamEffectivenessMeasurement: boolean;
  shouldShowFeedbackAfterCollect: boolean;
  isAnonymous: boolean;
};

export type SprintRetrospectiveResult = {
  board: IFeedbackBoardDocument;
  wasCreated: boolean;
};

type CreateOrGetSprintRetrospectiveOptions = {
  teamId: string;
  iteration: TeamSettingsIteration;
  existingBoards?: IFeedbackBoardDocument[];
  permissions?: IFeedbackBoardDocumentPermissions;
};

const normalizeDateKey = (value?: Date | string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate.toISOString().slice(0, 10);
};

const normalizeDate = (value?: Date | string): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate;
};

const normalizeTitle = (value: string): string => value.replace(/\s+/g, " ").trim().toLocaleLowerCase();

const getTimeFrameSortOrder = (iteration: TeamSettingsIteration): number => {
  switch (iteration.attributes?.timeFrame) {
    case TimeFrame.Current:
      return 0;
    case TimeFrame.Future:
      return 1;
    case TimeFrame.Past:
      return 2;
    default:
      return 3;
  }
};

const getIterationTimestamp = (iteration: TeamSettingsIteration): number => {
  const startDate = normalizeDate(iteration.attributes?.startDate);
  return startDate?.getTime() ?? 0;
};

const matchIterationCandidate = (candidate: unknown, iterations: TeamSettingsIteration[]): TeamSettingsIteration | undefined => {
  if (typeof candidate === "string") {
    return iterations.find(iteration => iteration.id === candidate || iteration.path === candidate || iteration.name === candidate);
  }

  if (!candidate || typeof candidate !== "object") {
    return undefined;
  }

  const candidateRecord = candidate as Record<string, unknown>;
  const candidateValues = [candidateRecord.id, candidateRecord.path, candidateRecord.name, candidateRecord.iterationId, candidateRecord.iterationPath, candidateRecord.iterationName].filter(
    (value): value is string => typeof value === "string",
  );

  return iterations.find(iteration => candidateValues.some(value => iteration.id === value || iteration.path === value || iteration.name === value));
};

const resolveIterationFromCandidate = (candidate: unknown, iterations: TeamSettingsIteration[]): TeamSettingsIteration | undefined => {
  const directMatch = matchIterationCandidate(candidate, iterations);
  if (directMatch) {
    return directMatch;
  }

  if (!candidate || typeof candidate !== "object") {
    return undefined;
  }

  const candidateRecord = candidate as Record<string, unknown>;
  for (const [key, nestedCandidate] of Object.entries(candidateRecord)) {
    const lowerKey = key.toLocaleLowerCase();
    if (!["id", "path", "name", "iterationid", "iterationpath", "iterationname"].includes(lowerKey) && !lowerKey.includes("iteration")) {
      continue;
    }

    const nestedMatch = resolveIterationFromCandidate(nestedCandidate, iterations);
    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return undefined;
};

const loadSprintRetrospectiveDefaults = async (): Promise<SprintRetrospectiveDefaults> => {
  const [lastVotes, lastTeamEffectiveness, lastShowFeedback, lastAnonymous] = await Promise.all([
    BoardDataService.getSetting<number>("lastVotes"),
    BoardDataService.getSetting<boolean>("lastTeamEffectiveness"),
    BoardDataService.getSetting<boolean>("lastShowFeedback"),
    BoardDataService.getSetting<boolean>("lastAnonymous"),
  ]);

  return {
    maxVotesPerUser: typeof lastVotes === "number" && lastVotes > 0 ? lastVotes : DEFAULT_MAX_VOTES_PER_USER,
    isIncludeTeamEffectivenessMeasurement: typeof lastTeamEffectiveness === "boolean" ? lastTeamEffectiveness : false,
    shouldShowFeedbackAfterCollect: typeof lastShowFeedback === "boolean" ? lastShowFeedback : false,
    isAnonymous: typeof lastAnonymous === "boolean" ? lastAnonymous : false,
  };
};

export const buildSprintRetrospectiveTitle = (iteration: TeamSettingsIteration): string => {
  return t("sprint_retro_board_title", { iteration: iteration.name });
};

export const sortIterationsForRetrospectives = (iterations: TeamSettingsIteration[]): TeamSettingsIteration[] => {
  return [...iterations].sort((leftIteration, rightIteration) => {
    const timeFrameDifference = getTimeFrameSortOrder(leftIteration) - getTimeFrameSortOrder(rightIteration);
    if (timeFrameDifference !== 0) {
      return timeFrameDifference;
    }

    const timestampDifference = getIterationTimestamp(rightIteration) - getIterationTimestamp(leftIteration);
    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return leftIteration.name.localeCompare(rightIteration.name);
  });
};

export const getCurrentIteration = (iterations: TeamSettingsIteration[]): TeamSettingsIteration | undefined => {
  return iterations.find(iteration => iteration.attributes?.timeFrame === TimeFrame.Current);
};

export const resolveIterationFromConfiguration = (configuration: Record<string, unknown>, iterations: TeamSettingsIteration[]): TeamSettingsIteration | undefined => {
  const candidateKeys = ["iteration", "selectedIteration", "backlogIteration", "teamIteration", "currentIteration", "iterationContext", "iterationInfo"];
  const candidates: unknown[] = [];

  candidateKeys.forEach(candidateKey => {
    if (candidateKey in configuration) {
      candidates.push(configuration[candidateKey]);
    }
  });

  Object.entries(configuration).forEach(([key, value]) => {
    if (key.toLocaleLowerCase().includes("iteration")) {
      candidates.push(value);
    }
  });

  for (const candidate of candidates) {
    const matchedIteration = resolveIterationFromCandidate(candidate, iterations);
    if (matchedIteration) {
      return matchedIteration;
    }
  }

  return undefined;
};

export const findSprintRetrospectiveBoard = (boards: IFeedbackBoardDocument[], teamId: string, iteration: TeamSettingsIteration): IFeedbackBoardDocument | undefined => {
  const expectedTitle = normalizeTitle(buildSprintRetrospectiveTitle(iteration));
  const expectedStartDate = normalizeDateKey(iteration.attributes?.startDate);
  const expectedEndDate = normalizeDateKey(iteration.attributes?.finishDate);

  return boards.find(board => {
    if (board.teamId !== teamId || board.isArchived) {
      return false;
    }

    const boardTitleMatches = normalizeTitle(board.title) === expectedTitle;
    const boardStartDate = normalizeDateKey(board.startDate);
    const boardEndDate = normalizeDateKey(board.endDate);
    const boardDatesMatch = Boolean(boardStartDate && boardEndDate && expectedStartDate && expectedEndDate && boardStartDate === expectedStartDate && boardEndDate === expectedEndDate);

    return boardTitleMatches || boardDatesMatch;
  });
};

export const createOrGetSprintRetrospectiveBoard = async ({ teamId, iteration, existingBoards, permissions }: CreateOrGetSprintRetrospectiveOptions): Promise<SprintRetrospectiveResult> => {
  const boards = existingBoards ?? (await BoardDataService.getBoardsForTeam(teamId));
  const existingBoard = findSprintRetrospectiveBoard(boards, teamId, iteration);
  if (existingBoard) {
    return { board: existingBoard, wasCreated: false };
  }

  const defaults = await loadSprintRetrospectiveDefaults();
  const createdBoard = await BoardDataService.createBoardForTeam(
    teamId,
    buildSprintRetrospectiveTitle(iteration),
    defaults.maxVotesPerUser,
    getColumnsByTemplateId(DEFAULT_BOARD_TEMPLATE_ID),
    defaults.isIncludeTeamEffectivenessMeasurement,
    defaults.shouldShowFeedbackAfterCollect,
    defaults.isAnonymous,
    normalizeDate(iteration.attributes?.startDate),
    normalizeDate(iteration.attributes?.finishDate),
    permissions,
  );

  return { board: createdBoard, wasCreated: true };
};