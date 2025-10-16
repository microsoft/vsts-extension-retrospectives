import { CoreRestClient } from "azure-devops-extension-api/Core/CoreClient";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { TeamMember } from "azure-devops-extension-api/WebApi";

// Mock azure-devops-extension-api
const mockGetTeams = jest.fn();
const mockGetTeam = jest.fn();
const mockGetTeamMembersWithExtendedProperties = jest.fn();
const mockGetClient = jest.fn();

jest.mock('azure-devops-extension-api/Common', () => ({
  getClient: mockGetClient,
}));

describe("AzureDevOpsCoreService", () => {
  let azureDevOpsCoreService: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGetClient.mockReturnValue({
      getTeams: mockGetTeams,
      getTeam: mockGetTeam,
      getTeamMembersWithExtendedProperties: mockGetTeamMembersWithExtendedProperties,
    });
    
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { azureDevOpsCoreService: service } = require('../azureDevOpsCoreService');
    azureDevOpsCoreService = service;
  });

  describe("getDefaultTeam", () => {
    it("should return the first team for a project", async () => {
      const mockTeam: WebApiTeam = {
        id: "team-1",
        name: "Default Team",
        description: "The default team",
      } as any;

      mockGetTeams.mockResolvedValue([mockTeam]);

      const result = await azureDevOpsCoreService.getDefaultTeam("project-123");

      expect(result).toEqual(mockTeam);
      expect(mockGetTeams).toHaveBeenCalledWith("project-123", false, 1);
    });

    it("should handle multiple teams and return only the first one", async () => {
      const mockTeams: WebApiTeam[] = [
        { id: "team-1", name: "Team 1" } as any,
        { id: "team-2", name: "Team 2" } as any,
      ];

      mockGetTeams.mockResolvedValue(mockTeams);

      const result = await azureDevOpsCoreService.getDefaultTeam("project-456");

      expect(result).toEqual(mockTeams[0]);
      expect(result.id).toBe("team-1");
    });

    it("should handle different project ids", async () => {
      const mockTeam: WebApiTeam = {
        id: "team-xyz",
        name: "XYZ Team",
      } as any;

      mockGetTeams.mockResolvedValue([mockTeam]);

      const result = await azureDevOpsCoreService.getDefaultTeam("project-xyz");

      expect(result.id).toBe("team-xyz");
      expect(mockGetTeams).toHaveBeenCalledWith("project-xyz", false, 1);
    });
  });

  describe("getTeam", () => {
    it("should return a specific team", async () => {
      const mockTeam: WebApiTeam = {
        id: "team-123",
        name: "Test Team",
        description: "A test team",
      } as any;

      mockGetTeam.mockResolvedValue(mockTeam);

      const result = await azureDevOpsCoreService.getTeam("project-123", "team-123");

      expect(result).toEqual(mockTeam);
      expect(mockGetTeam).toHaveBeenCalledWith("project-123", "team-123");
    });

    it("should return null when team is not found", async () => {
      mockGetTeam.mockRejectedValue(new Error("Team not found"));

      const result = await azureDevOpsCoreService.getTeam("project-123", "nonexistent-team");

      expect(result).toBeNull();
      expect(mockGetTeam).toHaveBeenCalledWith("project-123", "nonexistent-team");
    });

    it("should return null on any error", async () => {
      mockGetTeam.mockRejectedValue(new Error("Network error"));

      const result = await azureDevOpsCoreService.getTeam("project-456", "team-789");

      expect(result).toBeNull();
    });

    it("should handle various team properties", async () => {
      const mockTeam: WebApiTeam = {
        id: "team-full",
        name: "Full Team",
        description: "Team with all properties",
        projectId: "project-123",
        projectName: "Test Project",
      } as any;

      mockGetTeam.mockResolvedValue(mockTeam);

      const result = await azureDevOpsCoreService.getTeam("project-123", "team-full");

      expect(result.description).toBe("Team with all properties");
      expect(result.projectName).toBe("Test Project");
    });
  });

  describe("getMembers", () => {
    it("should return team members", async () => {
      const mockMembers: TeamMember[] = [
        { identity: { displayName: "User 1", id: "user-1" } } as any,
        { identity: { displayName: "User 2", id: "user-2" } } as any,
      ];

      mockGetTeamMembersWithExtendedProperties.mockResolvedValue(mockMembers);

      const result = await azureDevOpsCoreService.getMembers("project-123", "team-123");

      expect(result).toEqual(mockMembers);
      expect(result).toHaveLength(2);
      expect(mockGetTeamMembersWithExtendedProperties).toHaveBeenCalledWith("project-123", "team-123", 100, 0);
    });

    it("should return null when members cannot be retrieved", async () => {
      mockGetTeamMembersWithExtendedProperties.mockRejectedValue(new Error("Access denied"));

      const result = await azureDevOpsCoreService.getMembers("project-123", "team-123");

      expect(result).toBeNull();
    });

    it("should return null on network error", async () => {
      mockGetTeamMembersWithExtendedProperties.mockRejectedValue(new Error("Network timeout"));

      const result = await azureDevOpsCoreService.getMembers("project-456", "team-456");

      expect(result).toBeNull();
    });

    it("should handle empty team members list", async () => {
      mockGetTeamMembersWithExtendedProperties.mockResolvedValue([]);

      const result = await azureDevOpsCoreService.getMembers("project-789", "team-789");

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should pass correct pagination parameters", async () => {
      const mockMembers: TeamMember[] = [{ identity: { displayName: "User 1" } } as any];
      mockGetTeamMembersWithExtendedProperties.mockResolvedValue(mockMembers);

      await azureDevOpsCoreService.getMembers("project-abc", "team-xyz");

      expect(mockGetTeamMembersWithExtendedProperties).toHaveBeenCalledWith("project-abc", "team-xyz", 100, 0);
    });
  });

  describe("getAllTeams", () => {
    it("should return all teams when less than 100 teams", async () => {
      const mockTeams: WebApiTeam[] = [
        { id: "team-1", name: "Team 1" } as any,
        { id: "team-2", name: "Team 2" } as any,
        { id: "team-3", name: "Team 3" } as any,
      ];

      mockGetTeams.mockResolvedValue(mockTeams);

      const result = await azureDevOpsCoreService.getAllTeams("project-123", false);

      expect(result).toEqual(mockTeams);
      expect(result).toHaveLength(3);
      expect(mockGetTeams).toHaveBeenCalledWith("project-123", false, 100, 0, true);
      expect(mockGetTeams).toHaveBeenCalledTimes(1);
    });

    it("should paginate when there are exactly 100 teams", async () => {
      const firstBatch: WebApiTeam[] = Array.from({ length: 100 }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
      })) as any;

      const secondBatch: WebApiTeam[] = [
        { id: "team-100", name: "Team 100" } as any,
        { id: "team-101", name: "Team 101" } as any,
      ];

      mockGetTeams
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce(secondBatch);

      const result = await azureDevOpsCoreService.getAllTeams("project-123", false);

      expect(result).toHaveLength(102);
      expect(mockGetTeams).toHaveBeenCalledTimes(2);
      expect(mockGetTeams).toHaveBeenNthCalledWith(1, "project-123", false, 100, 0, true);
      expect(mockGetTeams).toHaveBeenNthCalledWith(2, "project-123", false, 100, 100, true);
    });

    it("should handle multiple pagination rounds", async () => {
      const firstBatch: WebApiTeam[] = Array.from({ length: 100 }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
      })) as any;

      const secondBatch: WebApiTeam[] = Array.from({ length: 100 }, (_, i) => ({
        id: `team-${100 + i}`,
        name: `Team ${100 + i}`,
      })) as any;

      const thirdBatch: WebApiTeam[] = [
        { id: "team-200", name: "Team 200" } as any,
      ];

      mockGetTeams
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce(secondBatch)
        .mockResolvedValueOnce(thirdBatch);

      const result = await azureDevOpsCoreService.getAllTeams("project-123", false);

      expect(result).toHaveLength(201);
      expect(mockGetTeams).toHaveBeenCalledTimes(3);
      expect(mockGetTeams).toHaveBeenNthCalledWith(3, "project-123", false, 100, 200, true);
    });

    it("should respect forCurrentUserOnly parameter", async () => {
      const mockTeams: WebApiTeam[] = [{ id: "team-1", name: "Team 1" } as any];

      mockGetTeams.mockResolvedValue(mockTeams);

      await azureDevOpsCoreService.getAllTeams("project-456", true);

      expect(mockGetTeams).toHaveBeenCalledWith("project-456", true, 100, 0, true);
    });

    it("should handle empty teams list", async () => {
      mockGetTeams.mockResolvedValue([]);

      const result = await azureDevOpsCoreService.getAllTeams("project-empty", false);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockGetTeams).toHaveBeenCalledTimes(1);
    });

    it("should accumulate teams across multiple pages", async () => {
      const firstBatch: WebApiTeam[] = Array.from({ length: 100 }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
      })) as any;

      const secondBatch: WebApiTeam[] = Array.from({ length: 50 }, (_, i) => ({
        id: `team-${100 + i}`,
        name: `Team ${100 + i}`,
      })) as any;

      mockGetTeams
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce(secondBatch);

      const result = await azureDevOpsCoreService.getAllTeams("project-123", false);

      expect(result).toHaveLength(150);
      expect(result[0].id).toBe("team-0");
      expect(result[99].id).toBe("team-99");
      expect(result[100].id).toBe("team-100");
      expect(result[149].id).toBe("team-149");
    });

    it("should handle different project ids in pagination", async () => {
      const firstBatch: WebApiTeam[] = Array.from({ length: 100 }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
      })) as any;

      const secondBatch: WebApiTeam[] = [{ id: "team-100", name: "Team 100" } as any];

      mockGetTeams
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce(secondBatch);

      await azureDevOpsCoreService.getAllTeams("project-xyz", true);

      expect(mockGetTeams).toHaveBeenNthCalledWith(1, "project-xyz", true, 100, 0, true);
      expect(mockGetTeams).toHaveBeenNthCalledWith(2, "project-xyz", true, 100, 100, true);
    });
  });
});
