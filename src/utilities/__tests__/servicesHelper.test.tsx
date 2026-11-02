import { getProjectId, getProjectName, getHostBaseUrl, getHostAuthority } from "../servicesHelper";

// Mock the azure-devops-extension-sdk
jest.mock("azure-devops-extension-sdk", () => ({
  getService: jest.fn(),
}));

// Mock the azure-devops-extension-api
jest.mock("azure-devops-extension-api/Core", () => ({
  CoreRestClient: {
    RESOURCE_AREA_ID: "mock-resource-area-id",
  },
}));

import { getService } from "azure-devops-extension-sdk";

const mockGetService = getService as jest.MockedFunction<typeof getService>;

describe("servicesHelper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProjectId", () => {
    it("should return the project id", async () => {
      const mockProject = { id: "project-123", name: "Test Project" };
      const mockProjectPageService = {
        getProject: jest.fn().mockResolvedValue(mockProject),
      };

      mockGetService.mockResolvedValue(mockProjectPageService as any);

      const projectId = await getProjectId();

      expect(projectId).toBe("project-123");
      expect(mockGetService).toHaveBeenCalled();
      expect(mockProjectPageService.getProject).toHaveBeenCalled();
    });

    it("should handle different project ids", async () => {
      const mockProject = { id: "different-project-456", name: "Another Project" };
      const mockProjectPageService = {
        getProject: jest.fn().mockResolvedValue(mockProject),
      };

      mockGetService.mockResolvedValue(mockProjectPageService as any);

      const projectId = await getProjectId();

      expect(projectId).toBe("different-project-456");
    });
  });

  describe("getProjectName", () => {
    it("should return the project name", async () => {
      const mockProject = { id: "project-789", name: "My Awesome Project" };
      const mockProjectPageService = {
        getProject: jest.fn().mockResolvedValue(mockProject),
      };

      mockGetService.mockResolvedValue(mockProjectPageService as any);

      const projectName = await getProjectName();

      expect(projectName).toBe("My Awesome Project");
      expect(mockGetService).toHaveBeenCalled();
      expect(mockProjectPageService.getProject).toHaveBeenCalled();
    });

    it("should handle project names with special characters", async () => {
      const mockProject = { id: "project-999", name: "Test & Demo Project (2025)" };
      const mockProjectPageService = {
        getProject: jest.fn().mockResolvedValue(mockProject),
      };

      mockGetService.mockResolvedValue(mockProjectPageService as any);

      const projectName = await getProjectName();

      expect(projectName).toBe("Test & Demo Project (2025)");
    });
  });

  describe("getHostBaseUrl", () => {
    it("should return the host base URL", async () => {
      const mockLocationService = {
        getResourceAreaLocation: jest.fn().mockResolvedValue("https://dev.azure.com/myorg"),
      };

      mockGetService.mockResolvedValue(mockLocationService as any);

      const hostBaseUrl = await getHostBaseUrl();

      expect(hostBaseUrl).toBe("https://dev.azure.com/myorg");
      expect(mockGetService).toHaveBeenCalled();
      expect(mockLocationService.getResourceAreaLocation).toHaveBeenCalledWith("mock-resource-area-id");
    });

    it("should handle visualstudio.com URLs", async () => {
      const mockLocationService = {
        getResourceAreaLocation: jest.fn().mockResolvedValue("https://myorg.visualstudio.com"),
      };

      mockGetService.mockResolvedValue(mockLocationService as any);

      const hostBaseUrl = await getHostBaseUrl();

      expect(hostBaseUrl).toBe("https://myorg.visualstudio.com");
    });

    it("should handle on-premise URLs", async () => {
      const mockLocationService = {
        getResourceAreaLocation: jest.fn().mockResolvedValue("https://tfs.company.com/DefaultCollection"),
      };

      mockGetService.mockResolvedValue(mockLocationService as any);

      const hostBaseUrl = await getHostBaseUrl();

      expect(hostBaseUrl).toBe("https://tfs.company.com/DefaultCollection");
    });
  });

  describe("getHostAuthority", () => {
    it("should return the hostname from dev.azure.com", async () => {
      const mockLocationService = {
        getResourceAreaLocation: jest.fn().mockResolvedValue("https://dev.azure.com/myorg"),
      };

      mockGetService.mockResolvedValue(mockLocationService as any);

      const hostAuthority = await getHostAuthority();

      expect(hostAuthority).toBe("dev.azure.com");
    });

    it("should return the hostname from visualstudio.com", async () => {
      const mockLocationService = {
        getResourceAreaLocation: jest.fn().mockResolvedValue("https://contoso.visualstudio.com"),
      };

      mockGetService.mockResolvedValue(mockLocationService as any);

      const hostAuthority = await getHostAuthority();

      expect(hostAuthority).toBe("contoso.visualstudio.com");
    });

    it("should return the hostname from on-premise server", async () => {
      const mockLocationService = {
        getResourceAreaLocation: jest.fn().mockResolvedValue("https://tfs.company.com/DefaultCollection"),
      };

      mockGetService.mockResolvedValue(mockLocationService as any);

      const hostAuthority = await getHostAuthority();

      expect(hostAuthority).toBe("tfs.company.com");
    });

    it("should extract hostname from URL with port", async () => {
      const mockLocationService = {
        getResourceAreaLocation: jest.fn().mockResolvedValue("https://azuredevops.local:8080/DefaultCollection"),
      };

      mockGetService.mockResolvedValue(mockLocationService as any);

      const hostAuthority = await getHostAuthority();

      expect(hostAuthority).toBe("azuredevops.local");
    });

    it("should handle localhost URLs", async () => {
      const mockLocationService = {
        getResourceAreaLocation: jest.fn().mockResolvedValue("http://localhost:3000"),
      };

      mockGetService.mockResolvedValue(mockLocationService as any);

      const hostAuthority = await getHostAuthority();

      expect(hostAuthority).toBe("localhost");
    });
  });

  describe("Error handling", () => {
    it("should propagate error from getProject", async () => {
      const mockProjectPageService = {
        getProject: jest.fn().mockRejectedValue(new Error("Project not found")),
      };

      mockGetService.mockResolvedValue(mockProjectPageService as any);

      await expect(getProjectId()).rejects.toThrow("Project not found");
    });

    it("should propagate error from getResourceAreaLocation", async () => {
      const mockLocationService = {
        getResourceAreaLocation: jest.fn().mockRejectedValue(new Error("Resource area not found")),
      };

      mockGetService.mockResolvedValue(mockLocationService as any);

      await expect(getHostBaseUrl()).rejects.toThrow("Resource area not found");
    });
  });

  describe("Integration scenarios", () => {
    it("should work with all functions called in sequence", async () => {
      const mockProject = { id: "integration-test-id", name: "Integration Test Project" };
      const mockProjectPageService = {
        getProject: jest.fn().mockResolvedValue(mockProject),
      };
      const mockLocationService = {
        getResourceAreaLocation: jest.fn().mockResolvedValue("https://dev.azure.com/testorg"),
      };

      mockGetService
        .mockResolvedValueOnce(mockProjectPageService as any) // First call for getProjectId
        .mockResolvedValueOnce(mockProjectPageService as any) // Second call for getProjectName
        .mockResolvedValueOnce(mockLocationService as any); // Third call for getHostAuthority

      const projectId = await getProjectId();
      const projectName = await getProjectName();
      const hostAuthority = await getHostAuthority();

      expect(projectId).toBe("integration-test-id");
      expect(projectName).toBe("Integration Test Project");
      expect(hostAuthority).toBe("dev.azure.com");
    });
  });
});
