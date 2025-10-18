import { TeamFieldValues, TeamSettingsIteration } from "azure-devops-extension-api/Work";
import { WorkRestClient } from "azure-devops-extension-api/Work/WorkClient";

// Mock azure-devops-extension-api
const mockGetTeamIterations = jest.fn();
const mockGetTeamFieldValues = jest.fn();
const mockGetClient = jest.fn();

jest.mock("azure-devops-extension-api/Common", () => ({
  getClient: mockGetClient,
}));

jest.mock("azure-devops-extension-api/Work/WorkClient", () => ({
  WorkRestClient: jest.fn(),
}));

// Mock utilities
const mockGetProjectId = jest.fn();
const mockTrackException = jest.fn();
const mockTrackTrace = jest.fn();

jest.mock("../../utilities/servicesHelper", () => ({
  getProjectId: mockGetProjectId,
}));

jest.mock("../../utilities/telemetryClient", () => ({
  appInsights: {
    trackException: mockTrackException,
    trackTrace: mockTrackTrace,
  },
  TelemetryExceptions: {
    CurrentTeamIterationNotFound: "CurrentTeamIterationNotFound",
  },
}));

describe("WorkService", () => {
  let workService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetClient.mockReturnValue({
      getTeamIterations: mockGetTeamIterations,
      getTeamFieldValues: mockGetTeamFieldValues,
    });

    mockGetProjectId.mockResolvedValue("project-123");

    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { workService: service } = require("../azureDevOpsWorkService");
    workService = service;
  });

  describe("getIterations", () => {
    it("should return team iterations successfully", async () => {
      const mockIterations: TeamSettingsIteration[] = [
        {
          id: "iteration-1",
          name: "Sprint 1",
          path: "Project\\Sprint 1",
        } as any,
        {
          id: "iteration-2",
          name: "Sprint 2",
          path: "Project\\Sprint 2",
        } as any,
      ];

      mockGetTeamIterations.mockResolvedValue(mockIterations);

      const result = await workService.getIterations("team-123");

      expect(result).toEqual(mockIterations);
      expect(result).toHaveLength(2);
      expect(mockGetTeamIterations).toHaveBeenCalledWith(
        {
          project: "",
          projectId: "project-123",
          team: "",
          teamId: "team-123",
        },
        undefined,
      );
    });

    it("should return iterations with timeframe parameter", async () => {
      const mockIterations: TeamSettingsIteration[] = [
        {
          id: "iteration-current",
          name: "Current Sprint",
          path: "Project\\Current Sprint",
        } as any,
      ];

      mockGetTeamIterations.mockResolvedValue(mockIterations);

      const result = await workService.getIterations("team-456", "current");

      expect(result).toEqual(mockIterations);
      expect(mockGetTeamIterations).toHaveBeenCalledWith(
        {
          project: "",
          projectId: "project-123",
          team: "",
          teamId: "team-456",
        },
        "current",
      );
    });

    it("should return empty array when iterations call fails", async () => {
      mockGetTeamIterations.mockRejectedValue(new Error("Network error"));

      const result = await workService.getIterations("team-789");

      expect(result).toEqual([]);
      expect(mockTrackException).toHaveBeenCalledWith({
        exception: expect.any(Error),
        properties: { teamId: "team-789" },
      });
    });

    it("should track specific exception for CurrentIterationDoesNotExistException", async () => {
      const error = {
        serverError: {
          typeKey: "CurrentIterationDoesNotExistException",
        },
        message: "Current iteration does not exist",
      };

      mockGetTeamIterations.mockRejectedValue(error);

      const result = await workService.getIterations("team-no-iteration");

      expect(result).toEqual([]);
      expect(mockTrackException).toHaveBeenCalledWith({
        exception: error,
        properties: { teamId: "team-no-iteration" },
      });
      expect(mockTrackTrace).toHaveBeenCalledWith({
        message: "CurrentTeamIterationNotFound",
        properties: { teamId: "team-no-iteration", e: error },
      });
    });

    it("should handle different project ids", async () => {
      mockGetProjectId.mockResolvedValue("project-xyz");
      const mockIterations: TeamSettingsIteration[] = [
        {
          id: "iteration-1",
          name: "Sprint 1",
        } as any,
      ];

      mockGetTeamIterations.mockResolvedValue(mockIterations);

      await workService.getIterations("team-abc");

      expect(mockGetTeamIterations).toHaveBeenCalledWith(
        {
          project: "",
          projectId: "project-xyz",
          team: "",
          teamId: "team-abc",
        },
        undefined,
      );
    });

    it("should handle empty iterations list", async () => {
      mockGetTeamIterations.mockResolvedValue([]);

      const result = await workService.getIterations("team-empty");

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should handle different timeframe values", async () => {
      const mockIterations: TeamSettingsIteration[] = [
        {
          id: "iteration-past",
          name: "Past Sprint",
        } as any,
      ];

      mockGetTeamIterations.mockResolvedValue(mockIterations);

      await workService.getIterations("team-123", "past");

      expect(mockGetTeamIterations).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: "team-123",
        }),
        "past",
      );
    });
  });

  describe("getTeamFieldValues", () => {
    it("should return team field values successfully", async () => {
      const mockFieldValues: TeamFieldValues = {
        field: {
          referenceName: "System.AreaPath",
          name: "Area Path",
        },
        values: [
          {
            value: "Project\\Area1",
            includeChildren: true,
          },
          {
            value: "Project\\Area2",
            includeChildren: false,
          },
        ],
      } as any;

      mockGetTeamFieldValues.mockResolvedValue(mockFieldValues);

      const result = await workService.getTeamFieldValues("team-123");

      expect(result).toEqual(mockFieldValues);
      expect(result.values).toHaveLength(2);
      expect(mockGetTeamFieldValues).toHaveBeenCalledWith({
        project: "",
        projectId: "project-123",
        team: "",
        teamId: "team-123",
      });
    });

    it("should return undefined when field values call fails", async () => {
      mockGetTeamFieldValues.mockRejectedValue(new Error("Access denied"));

      const result = await workService.getTeamFieldValues("team-456");

      expect(result).toBeUndefined();
      expect(mockTrackException).toHaveBeenCalledWith(expect.any(Error), { teamId: "team-456" });
    });

    it("should handle different project ids", async () => {
      mockGetProjectId.mockResolvedValue("project-abc");
      const mockFieldValues: TeamFieldValues = {
        field: {
          referenceName: "System.AreaPath",
          name: "Area Path",
        },
        values: [],
      } as any;

      mockGetTeamFieldValues.mockResolvedValue(mockFieldValues);

      await workService.getTeamFieldValues("team-xyz");

      expect(mockGetTeamFieldValues).toHaveBeenCalledWith({
        project: "",
        projectId: "project-abc",
        team: "",
        teamId: "team-xyz",
      });
    });

    it("should handle network errors", async () => {
      mockGetTeamFieldValues.mockRejectedValue(new Error("Network timeout"));

      const result = await workService.getTeamFieldValues("team-network-error");

      expect(result).toBeUndefined();
      expect(mockTrackException).toHaveBeenCalledWith(expect.any(Error), { teamId: "team-network-error" });
    });

    it("should handle empty field values", async () => {
      const mockFieldValues: TeamFieldValues = {
        field: {
          referenceName: "System.AreaPath",
          name: "Area Path",
        },
        values: [],
      } as any;

      mockGetTeamFieldValues.mockResolvedValue(mockFieldValues);

      const result = await workService.getTeamFieldValues("team-empty");

      expect(result).toEqual(mockFieldValues);
      expect(result.values).toHaveLength(0);
    });

    it("should track exceptions with correct team id", async () => {
      const error = new Error("Permission denied");
      mockGetTeamFieldValues.mockRejectedValue(error);

      await workService.getTeamFieldValues("team-permission-error");

      expect(mockTrackException).toHaveBeenCalledWith(error, { teamId: "team-permission-error" });
    });
  });
});
