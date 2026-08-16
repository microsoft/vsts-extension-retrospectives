import { CoreRestClient } from "azure-devops-extension-api/Core/CoreClient";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { TeamMember } from "azure-devops-extension-api/WebApi";

// Mock azure-devops-extension-api
const mockGetTeams = jest.fn();
const mockGetProject = jest.fn();
const mockGetTeam = jest.fn();
const mockGetTeamMembersWithExtendedProperties = jest.fn();
const mockGetClient = jest.fn();

jest.mock("azure-devops-extension-api/Common", () => ({
  getClient: mockGetClient,
}));

describe("AzureDevOpsCoreService", () => {
  const MEMBERS_PAGE_SIZE = 100;
  const TEAMS_PAGE_SIZE = 100;
  let azureDevOpsCoreService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetClient.mockReturnValue({
      getTeams: mockGetTeams,
      getProject: mockGetProject,
      getTeam: mockGetTeam,
      getTeamMembersWithExtendedProperties: mockGetTeamMembersWithExtendedProperties,
    });

    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { azureDevOpsCoreService: service } = require("../azureDevOpsCoreService");
    azureDevOpsCoreService = service;
  });

  describe("getDefaultTeam", () => {
    it("should return the project default team", async () => {
      const defaultTeam = { id: "team-1", name: "Default Team", url: "https://example.com/team-1" };

      mockGetProject.mockResolvedValue({
        id: "project-123",
        name: "Test Project",
        defaultTeam,
      });

      const result = await azureDevOpsCoreService.getDefaultTeam("project-123");

      expect(result).toEqual({
        ...defaultTeam,
        projectId: "project-123",
        projectName: "Test Project",
      });
      expect(mockGetProject).toHaveBeenCalledWith("project-123");
      expect(mockGetTeams).not.toHaveBeenCalled();
    });

    it("should return null when the project has no default team", async () => {
      mockGetProject.mockResolvedValue({
        id: "project-456",
        name: "Project without teams",
      });

      const result = await azureDevOpsCoreService.getDefaultTeam("project-456");

      expect(result).toBeNull();
    });

    it("should return null when getProject returns null", async () => {
      mockGetProject.mockResolvedValue(null);

      const result = await azureDevOpsCoreService.getDefaultTeam("project-456");

      expect(result).toBeNull();
      expect(mockGetProject).toHaveBeenCalledWith("project-456");
    });

    it("should fall back to the requested project id when project.id is missing", async () => {
      const defaultTeam = { id: "team-1", name: "Default Team", url: "https://example.com/team-1" };

      mockGetProject.mockResolvedValue({
        name: "Test Project",
        defaultTeam,
      });

      const result = await azureDevOpsCoreService.getDefaultTeam("project-fallback");

      expect(result).toEqual({
        ...defaultTeam,
        projectId: "project-fallback",
        projectName: "Test Project",
      });
    });

    it("should handle different project ids", async () => {
      mockGetProject.mockResolvedValue({
        id: "project-xyz",
        name: "XYZ Project",
        defaultTeam: {
          id: "team-xyz",
          name: "XYZ Team",
        },
      });

      const result = await azureDevOpsCoreService.getDefaultTeam("project-xyz");

      expect(result.id).toBe("team-xyz");
      expect(result.projectName).toBe("XYZ Project");
      expect(mockGetProject).toHaveBeenCalledWith("project-xyz");
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
      const mockMembers: TeamMember[] = [{ identity: { displayName: "User 1", id: "user-1" } } as any, { identity: { displayName: "User 2", id: "user-2" } } as any];

      mockGetTeamMembersWithExtendedProperties.mockResolvedValue(mockMembers);

      const result = await azureDevOpsCoreService.getMembers("project-123", "team-123");

      expect(result).toEqual(mockMembers);
      expect(result).toHaveLength(2);
      expect(mockGetTeamMembersWithExtendedProperties).toHaveBeenCalledWith("project-123", "team-123", MEMBERS_PAGE_SIZE, 0);
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

      expect(mockGetTeamMembersWithExtendedProperties).toHaveBeenCalledWith("project-abc", "team-xyz", MEMBERS_PAGE_SIZE, 0);
    });

    it("should fetch additional pages when the first page is full", async () => {
      const firstPage: TeamMember[] = Array.from({ length: MEMBERS_PAGE_SIZE }, (_, index) => ({ identity: { displayName: `User ${index + 1}` } } as any));
      const secondPage: TeamMember[] = [{ identity: { displayName: `User ${MEMBERS_PAGE_SIZE + 1}` } } as any];
      mockGetTeamMembersWithExtendedProperties
        .mockResolvedValueOnce(firstPage)
        .mockResolvedValueOnce(secondPage);

      const result = await azureDevOpsCoreService.getMembers("project-abc", "team-xyz");

      expect(result).toHaveLength(MEMBERS_PAGE_SIZE + 1);
      expect(mockGetTeamMembersWithExtendedProperties).toHaveBeenNthCalledWith(1, "project-abc", "team-xyz", MEMBERS_PAGE_SIZE, 0);
      expect(mockGetTeamMembersWithExtendedProperties).toHaveBeenNthCalledWith(2, "project-abc", "team-xyz", MEMBERS_PAGE_SIZE, MEMBERS_PAGE_SIZE);
    });
  });

  describe("getAllTeams", () => {
    it("should return all teams when less than a full page", async () => {
      const mockTeams: WebApiTeam[] = [{ id: "team-1", name: "Team 1" } as any, { id: "team-2", name: "Team 2" } as any, { id: "team-3", name: "Team 3" } as any];

      mockGetTeams.mockResolvedValue(mockTeams);

      const result = await azureDevOpsCoreService.getAllTeams("project-123", false);

      expect(result).toEqual(mockTeams);
      expect(result).toHaveLength(3);
      expect(mockGetTeams).toHaveBeenCalledWith("project-123", false, TEAMS_PAGE_SIZE, 0);
      expect(mockGetTeams).toHaveBeenCalledTimes(1);
    });

    it("should paginate when there are exactly TEAMS_PAGE_SIZE teams", async () => {
      const firstBatch: WebApiTeam[] = Array.from({ length: TEAMS_PAGE_SIZE }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
      })) as any;

      const secondBatch: WebApiTeam[] = [
        { id: `team-${TEAMS_PAGE_SIZE}`, name: `Team ${TEAMS_PAGE_SIZE}` } as any,
        { id: `team-${TEAMS_PAGE_SIZE + 1}`, name: `Team ${TEAMS_PAGE_SIZE + 1}` } as any,
      ];

      mockGetTeams.mockResolvedValueOnce(firstBatch).mockResolvedValueOnce(secondBatch);

      const result = await azureDevOpsCoreService.getAllTeams("project-123", false);

      expect(result).toHaveLength(TEAMS_PAGE_SIZE + 2);
      expect(mockGetTeams).toHaveBeenCalledTimes(2);
      expect(mockGetTeams).toHaveBeenNthCalledWith(1, "project-123", false, TEAMS_PAGE_SIZE, 0);
      expect(mockGetTeams).toHaveBeenNthCalledWith(2, "project-123", false, TEAMS_PAGE_SIZE, TEAMS_PAGE_SIZE);
    });

    it("should handle multiple pagination rounds", async () => {
      const firstBatch: WebApiTeam[] = Array.from({ length: TEAMS_PAGE_SIZE }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
      })) as any;

      const secondBatch: WebApiTeam[] = Array.from({ length: TEAMS_PAGE_SIZE }, (_, i) => ({
        id: `team-${TEAMS_PAGE_SIZE + i}`,
        name: `Team ${TEAMS_PAGE_SIZE + i}`,
      })) as any;

      const thirdBatch: WebApiTeam[] = [{ id: `team-${TEAMS_PAGE_SIZE * 2}`, name: `Team ${TEAMS_PAGE_SIZE * 2}` } as any];

      mockGetTeams.mockResolvedValueOnce(firstBatch).mockResolvedValueOnce(secondBatch).mockResolvedValueOnce(thirdBatch);

      const result = await azureDevOpsCoreService.getAllTeams("project-123", false);

      expect(result).toHaveLength(TEAMS_PAGE_SIZE * 2 + 1);
      expect(mockGetTeams).toHaveBeenCalledTimes(3);
      expect(mockGetTeams).toHaveBeenNthCalledWith(3, "project-123", false, TEAMS_PAGE_SIZE, TEAMS_PAGE_SIZE * 2);
    });

    it("should respect forCurrentUserOnly parameter", async () => {
      const mockTeams: WebApiTeam[] = [{ id: "team-1", name: "Team 1" } as any];

      mockGetTeams.mockResolvedValue(mockTeams);

      await azureDevOpsCoreService.getAllTeams("project-456", true);

      expect(mockGetTeams).toHaveBeenCalledWith("project-456", true, TEAMS_PAGE_SIZE, 0);
    });

    it("should handle empty teams list", async () => {
      mockGetTeams.mockResolvedValue([]);

      const result = await azureDevOpsCoreService.getAllTeams("project-empty", false);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockGetTeams).toHaveBeenCalledTimes(1);
    });

    it("should accumulate teams across multiple pages", async () => {
      const firstBatch: WebApiTeam[] = Array.from({ length: TEAMS_PAGE_SIZE }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
      })) as any;

      const secondBatch: WebApiTeam[] = Array.from({ length: 3 }, (_, i) => ({
        id: `team-${TEAMS_PAGE_SIZE + i}`,
        name: `Team ${TEAMS_PAGE_SIZE + i}`,
      })) as any;

      mockGetTeams.mockResolvedValueOnce(firstBatch).mockResolvedValueOnce(secondBatch);

      const result = await azureDevOpsCoreService.getAllTeams("project-123", false);

      expect(result).toHaveLength(TEAMS_PAGE_SIZE + 3);
      expect(result[0].id).toBe("team-0");
      expect(result[TEAMS_PAGE_SIZE - 1].id).toBe(`team-${TEAMS_PAGE_SIZE - 1}`);
      expect(result[TEAMS_PAGE_SIZE].id).toBe(`team-${TEAMS_PAGE_SIZE}`);
      expect(result[TEAMS_PAGE_SIZE + 2].id).toBe(`team-${TEAMS_PAGE_SIZE + 2}`);
    });

    it("should handle different project ids in pagination", async () => {
      const firstBatch: WebApiTeam[] = Array.from({ length: TEAMS_PAGE_SIZE }, (_, i) => ({
        id: `team-${i}`,
        name: `Team ${i}`,
      })) as any;

      const secondBatch: WebApiTeam[] = [{ id: `team-${TEAMS_PAGE_SIZE}`, name: `Team ${TEAMS_PAGE_SIZE}` } as any];

      mockGetTeams.mockResolvedValueOnce(firstBatch).mockResolvedValueOnce(secondBatch);

      await azureDevOpsCoreService.getAllTeams("project-xyz", true);

      expect(mockGetTeams).toHaveBeenNthCalledWith(1, "project-xyz", true, TEAMS_PAGE_SIZE, 0);
      expect(mockGetTeams).toHaveBeenNthCalledWith(2, "project-xyz", true, TEAMS_PAGE_SIZE, TEAMS_PAGE_SIZE);
    });
  });
});
