import * as fc from "fast-check";
import { getBoardUrl } from "../boardUrlHelper";
import { WorkflowPhase } from "../../interfaces/workItem";
import * as servicesHelper from "../servicesHelper";

/**
 * Fuzz tests for board URL generation using fast-check property-based testing.
 * These tests verify that URL generation handles various inputs safely.
 */

// Mock the services helper
jest.mock("../servicesHelper");

describe("getBoardUrl - Fuzz Tests", () => {
  const mockHostBase = "https://dev.azure.com/";
  const mockProjectName = "TestProject";

  beforeEach(() => {
    (servicesHelper.getHostBaseUrl as jest.Mock).mockResolvedValue(mockHostBase);
    (servicesHelper.getProjectName as jest.Mock).mockResolvedValue(mockProjectName);
  });

  it("should always generate valid URLs with various input strings", async () => {
    // Property: URL should always be valid regardless of input format
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }), // teamId
        fc.uuid(), // boardId (using UUID for realistic board IDs)
        fc.constantFrom(WorkflowPhase.Act, WorkflowPhase.Collect, WorkflowPhase.Group, WorkflowPhase.Vote), // workflowPhase
        async (teamId: string, boardId: string, workflowPhase: WorkflowPhase) => {
          const url = await getBoardUrl(teamId, boardId, workflowPhase);

          // Should be a string
          expect(typeof url).toBe("string");

          // Should not be empty
          expect(url.length).toBeGreaterThan(0);

          // Should be a valid URL
          expect(() => new URL(url)).not.toThrow();
        },
      ),
    );
  });

  it("should properly encode special characters in team and board IDs", async () => {
    // Property: Special characters should be properly URL encoded
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // teamId with potential special chars
        fc.string({ minLength: 1, maxLength: 50 }), // boardId with potential special chars
        fc.constantFrom(WorkflowPhase.Act, WorkflowPhase.Collect, WorkflowPhase.Group, WorkflowPhase.Vote),
        async (teamId: string, boardId: string, workflowPhase: WorkflowPhase) => {
          const url = await getBoardUrl(teamId, boardId, workflowPhase);

          // URL should contain the encoded parameters
          expect(url).toContain("teamId=");
          expect(url).toContain("boardId=");
          expect(url).toContain("phase=");

          // URL should be properly encoded
          const decodedUrl = decodeURI(url);
          expect(decodedUrl).toContain(mockHostBase);
          expect(decodedUrl).toContain(mockProjectName);
        },
      ),
    );
  });

  it("should handle GUIDs and alphanumeric IDs consistently", async () => {
    // Property: Different ID formats should all produce valid URLs
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.uuid(), // GUID format
          fc.string({ minLength: 8, maxLength: 32 }), // Random string ID
          fc.string({ minLength: 1, maxLength: 64 }), // Regular string
        ),
        fc.oneof(fc.uuid(), fc.string({ minLength: 8, maxLength: 32 }), fc.string({ minLength: 1, maxLength: 64 })),
        fc.constantFrom(WorkflowPhase.Act, WorkflowPhase.Collect, WorkflowPhase.Group, WorkflowPhase.Vote),
        async (teamId: string, boardId: string, workflowPhase: WorkflowPhase) => {
          const url = await getBoardUrl(teamId, boardId, workflowPhase);

          // Should produce a valid URL structure
          expect(url).toMatch(/^https?:\/\/.+/);

          // Should contain all required parameters
          const urlObj = new URL(url);
          expect(urlObj.href).toContain("teamId=");
          expect(urlObj.href).toContain("boardId=");
          expect(urlObj.href).toContain("phase=");
        },
      ),
    );
  });

  it("should maintain consistent URL structure across all workflow phases", async () => {
    // Property: URL structure should be consistent regardless of phase
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.uuid(), fc.constantFrom(WorkflowPhase.Act, WorkflowPhase.Collect, WorkflowPhase.Group, WorkflowPhase.Vote), async (teamId: string, boardId: string, workflowPhase: WorkflowPhase) => {
        const url = await getBoardUrl(teamId, boardId, workflowPhase);

        // Should follow the expected pattern
        expect(url).toContain("/_apps/hub/ms-devlabs.team-retrospectives.home#");
        expect(url).toContain(`teamId=${teamId}`);
        expect(url).toContain(`boardId=${boardId}`);
        expect(url).toContain(`phase=${workflowPhase}`);
      }),
    );
  });

  it("should never produce URLs with consecutive special characters that break parsing", async () => {
    // Property: URL should not have malformed query parameters
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), fc.string({ minLength: 1, maxLength: 100 }), fc.constantFrom(WorkflowPhase.Act, WorkflowPhase.Collect, WorkflowPhase.Group, WorkflowPhase.Vote), async (teamId: string, boardId: string, workflowPhase: WorkflowPhase) => {
        const url = await getBoardUrl(teamId, boardId, workflowPhase);

        // URL should be valid (may contain encoded special chars)
        expect(typeof url).toBe("string");
        expect(url.length).toBeGreaterThan(0);

        // Should not have trailing ? or &
        expect(url).not.toMatch(/[?&]$/);
      }),
    );
  });
});
