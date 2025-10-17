import { isInternalOrg, isHostedAzureDevOps } from "../azureDevOpsContextHelper";

// Mock the azure-devops-extension-sdk
jest.mock("azure-devops-extension-sdk", () => ({
  getHost: jest.fn(),
}));

// Mock the servicesHelper
jest.mock("../servicesHelper", () => ({
  getHostAuthority: jest.fn(),
}));

import { getHost } from "azure-devops-extension-sdk";
import { getHostAuthority } from "../servicesHelper";

const mockGetHost = getHost as jest.MockedFunction<typeof getHost>;
const mockGetHostAuthority = getHostAuthority as jest.MockedFunction<typeof getHostAuthority>;

describe("azureDevOpsContextHelper", () => {
  describe("isInternalOrg", () => {
    beforeEach(() => {
      mockGetHost.mockReset();
    });

    it("should return true for reflect-retrospective-hackathon org", () => {
      mockGetHost.mockReturnValue({ name: "reflect-retrospective-hackathon" } as any);
      expect(isInternalOrg()).toBe(true);
    });

    it("should return true for reflect-demo org", () => {
      mockGetHost.mockReturnValue({ name: "reflect-demo" } as any);
      expect(isInternalOrg()).toBe(true);
    });

    it("should return true for microsoft org", () => {
      mockGetHost.mockReturnValue({ name: "microsoft" } as any);
      expect(isInternalOrg()).toBe(true);
    });

    it("should return true for microsoftit org", () => {
      mockGetHost.mockReturnValue({ name: "microsoftit" } as any);
      expect(isInternalOrg()).toBe(true);
    });

    it("should return true for mseng org", () => {
      mockGetHost.mockReturnValue({ name: "mseng" } as any);
      expect(isInternalOrg()).toBe(true);
    });

    it("should return true for msazure org", () => {
      mockGetHost.mockReturnValue({ name: "msazure" } as any);
      expect(isInternalOrg()).toBe(true);
    });

    it("should return true for onebranch org", () => {
      mockGetHost.mockReturnValue({ name: "onebranch" } as any);
      expect(isInternalOrg()).toBe(true);
    });

    it("should return true for internal org with uppercase letters", () => {
      mockGetHost.mockReturnValue({ name: "Microsoft" } as any);
      expect(isInternalOrg()).toBe(true);
    });

    it("should return true for internal org with mixed case", () => {
      mockGetHost.mockReturnValue({ name: "MicroSoft" } as any);
      expect(isInternalOrg()).toBe(true);
    });

    it("should return true for internal org with whitespace", () => {
      mockGetHost.mockReturnValue({ name: "  microsoft  " } as any);
      expect(isInternalOrg()).toBe(true);
    });

    it("should return true for internal org with uppercase and whitespace", () => {
      mockGetHost.mockReturnValue({ name: "  MSENG  " } as any);
      expect(isInternalOrg()).toBe(true);
    });

    it("should return false for external org", () => {
      mockGetHost.mockReturnValue({ name: "externalOrg" } as any);
      expect(isInternalOrg()).toBe(false);
    });

    it("should return false for random org", () => {
      mockGetHost.mockReturnValue({ name: "randomcompany" } as any);
      expect(isInternalOrg()).toBe(false);
    });

    it("should return false for partial match org", () => {
      mockGetHost.mockReturnValue({ name: "microsoft-external" } as any);
      expect(isInternalOrg()).toBe(false);
    });

    it("should return false for empty org name", () => {
      mockGetHost.mockReturnValue({ name: "" } as any);
      expect(isInternalOrg()).toBe(false);
    });
  });

  describe("isHostedAzureDevOps", () => {
    beforeEach(() => {
      mockGetHostAuthority.mockReset();
    });

    it("should return true for dev.azure.com", async () => {
      mockGetHostAuthority.mockResolvedValue("dev.azure.com");
      const result = await isHostedAzureDevOps();
      expect(result).toBe(true);
    });

    it("should return true for visualstudio.com domain", async () => {
      mockGetHostAuthority.mockResolvedValue("myorg.visualstudio.com");
      const result = await isHostedAzureDevOps();
      expect(result).toBe(true);
    });

    it("should return true for any subdomain of visualstudio.com", async () => {
      mockGetHostAuthority.mockResolvedValue("contoso.visualstudio.com");
      const result = await isHostedAzureDevOps();
      expect(result).toBe(true);
    });

    it("should return true for multi-level subdomain of visualstudio.com", async () => {
      mockGetHostAuthority.mockResolvedValue("team.contoso.visualstudio.com");
      const result = await isHostedAzureDevOps();
      expect(result).toBe(true);
    });

    it("should return false for on-premise server", async () => {
      mockGetHostAuthority.mockResolvedValue("tfs.company.com");
      const result = await isHostedAzureDevOps();
      expect(result).toBe(false);
    });

    it("should return false for Azure DevOps Server", async () => {
      mockGetHostAuthority.mockResolvedValue("azuredevops.company.local");
      const result = await isHostedAzureDevOps();
      expect(result).toBe(false);
    });

    it("should return false for localhost", async () => {
      mockGetHostAuthority.mockResolvedValue("localhost");
      const result = await isHostedAzureDevOps();
      expect(result).toBe(false);
    });

    it("should return false for IP address", async () => {
      mockGetHostAuthority.mockResolvedValue("192.168.1.100");
      const result = await isHostedAzureDevOps();
      expect(result).toBe(false);
    });

    it("should return false for visualstudio.com as substring but not ending", async () => {
      mockGetHostAuthority.mockResolvedValue("visualstudio.com.fake.com");
      const result = await isHostedAzureDevOps();
      expect(result).toBe(false);
    });
  });
});
