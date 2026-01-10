import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking/WorkItemTrackingClient";
import { WorkItemExpand, WorkItemErrorPolicy, WorkItem, WorkItemRelation } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";

const { RelationshipType } = jest.requireActual("../../interfaces/workItem");

const mockGetClient = jest.fn();
const mockGetProjectId = jest.fn();

jest.mock("azure-devops-extension-api/Common", () => ({
  getClient: mockGetClient,
}));

jest.mock("../../utilities/servicesHelper", () => ({
  getProjectId: mockGetProjectId,
}));

jest.mock("azure-devops-extension-api/WorkItemTracking/WorkItemTracking", () => ({
  WorkItemExpand: {
    All: "All",
  },
  WorkItemErrorPolicy: {
    Omit: "Omit",
  },
  RelationshipType: {
    Related: "Related",
    ReferencedByReverse: "ReferencedByReverse",
  },
}));

describe("WorkItemService", () => {
  let mockHttpClient: jest.Mocked<WorkItemTrackingRestClient>;
  let workItemService: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => {
    jest.clearAllMocks();

    mockHttpClient = {
      getFields: jest.fn(),
      getWorkItemTypeStates: jest.fn(),
      getWorkItemTypes: jest.fn(),
      getWorkItemTypeCategory: jest.fn(),
      getWorkItems: jest.fn(),
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    mockGetClient.mockReturnValue(mockHttpClient);
    mockGetProjectId.mockResolvedValue("test-project-id");

    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { workItemService: service } = require("../azureDevOpsWorkItemService");
    workItemService = service;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (workItemService as any)._httpClient = mockHttpClient;
  });

  describe("constructor", () => {
    it("should initialize HTTP client", () => {
      expect(mockGetClient).toHaveBeenCalledWith(WorkItemTrackingRestClient);
    });
  });

  describe("getAllFields", () => {
    it("should call getFields on HTTP client", async () => {
      const mockFields = [{ name: "field1" }, { name: "field2" }];
      mockHttpClient.getFields.mockResolvedValue(mockFields as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await workItemService.getAllFields();

      expect(mockHttpClient.getFields).toHaveBeenCalled();
      expect(result).toEqual(mockFields);
    });
  });

  describe("getWorkItemStates", () => {
    it("should get work item states for given type", async () => {
      const mockStates = [{ name: "New" }, { name: "Active" }];
      mockHttpClient.getWorkItemTypeStates.mockResolvedValue(mockStates as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await workItemService.getWorkItemStates("Task");

      expect(mockGetProjectId).toHaveBeenCalled();
      expect(mockHttpClient.getWorkItemTypeStates).toHaveBeenCalledWith("test-project-id", "Task");
      expect(result).toEqual(mockStates);
    });
  });

  describe("getWorkItemTypesForCurrentProject", () => {
    it("should get work item types for current project", async () => {
      const mockTypes = [{ name: "Task" }, { name: "Bug" }];
      mockHttpClient.getWorkItemTypes.mockResolvedValue(mockTypes as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await workItemService.getWorkItemTypesForCurrentProject();

      expect(mockGetProjectId).toHaveBeenCalled();
      expect(mockHttpClient.getWorkItemTypes).toHaveBeenCalledWith("test-project-id");
      expect(result).toEqual(mockTypes);
    });
  });

  describe("getHiddenWorkItemTypes", () => {
    it("should get hidden work item types", async () => {
      const mockCategory = {
        workItemTypes: [{ name: "HiddenType1" }, { name: "HiddenType2" }],
      };
      mockHttpClient.getWorkItemTypeCategory.mockResolvedValue(mockCategory as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await workItemService.getHiddenWorkItemTypes();

      expect(mockGetProjectId).toHaveBeenCalled();
      expect(mockHttpClient.getWorkItemTypeCategory).toHaveBeenCalledWith("test-project-id", "Microsoft.HiddenCategory");
      expect(result).toEqual(mockCategory.workItemTypes);
    });
  });

  describe("getWorkItemsByIds", () => {
    it("should get work items by IDs and filter out null items", async () => {
      const mockWorkItems = [{ id: 1, title: "Item 1" }, null, { id: 3, title: "Item 3" }];
      mockHttpClient.getWorkItems.mockResolvedValue(mockWorkItems as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await workItemService.getWorkItemsByIds([1, 2, 3]);

      expect(mockGetProjectId).toHaveBeenCalled();
      expect(mockHttpClient.getWorkItems).toHaveBeenCalledWith([1, 2, 3], "test-project-id", undefined, undefined, WorkItemExpand.All, WorkItemErrorPolicy.Omit);
      expect(result).toEqual([
        { id: 1, title: "Item 1" },
        { id: 3, title: "Item 3" },
      ]);
    });
  });

  describe("getReferencedByReverseItemIds", () => {
    it("should get referenced by reverse item IDs", async () => {
      const mockWorkItem = {
        id: 1,
        relations: [
          {
            rel: RelationshipType.ReferencedByReverse,
            url: "https://api.com/workitems/123",
          } as WorkItemRelation,
          {
            rel: RelationshipType.Related,
            url: "https://api.com/workitems/456",
          } as WorkItemRelation,
          {
            rel: RelationshipType.ReferencedByReverse,
            url: "https://api.com/workitems/789",
          } as WorkItemRelation,
        ],
      } as WorkItem;
      mockHttpClient.getWorkItems.mockResolvedValue([mockWorkItem]);

      const result = await workItemService.getReferencedByReverseItemIds(1);

      expect(result).toEqual([123, 789]);
    });

    it("should handle empty relations", async () => {
      const mockWorkItem = {
        id: 1,
        relations: [] as WorkItemRelation[],
      } as WorkItem;
      mockHttpClient.getWorkItems.mockResolvedValue([mockWorkItem]);

      const result = await workItemService.getReferencedByReverseItemIds(1);

      expect(result).toEqual([]);
    });

    it("should handle invalid URLs", async () => {
      const mockWorkItem = {
        id: 1,
        relations: [
          {
            rel: RelationshipType.ReferencedByReverse,
            url: "invalid-url",
          } as WorkItemRelation,
        ],
      } as WorkItem;
      mockHttpClient.getWorkItems.mockResolvedValue([mockWorkItem]);

      const result = await workItemService.getReferencedByReverseItemIds(1);

      expect(result).toEqual([]);
    });

    it("should handle URL ending with slash (empty string fallback on line 67)", async () => {
      // This tests the || "" branch when url.split("/").pop() returns empty string
      const mockWorkItem = {
        id: 1,
        relations: [
          {
            rel: RelationshipType.ReferencedByReverse,
            url: "https://api.com/workitems/",
          } as WorkItemRelation,
        ],
      } as WorkItem;
      mockHttpClient.getWorkItems.mockResolvedValue([mockWorkItem]);

      const result = await workItemService.getReferencedByReverseItemIds(1);

      // Empty string filtered out by .filter(id => id)
      expect(result).toEqual([]);
    });
  });

  describe("getRelatedItemsForItemsIds", () => {
    it("should get related items for given item IDs", async () => {
      const mockWorkItems = [
        {
          id: 1,
          relations: [
            {
              rel: RelationshipType.Related,
              url: "https://api.com/workitems/101",
            } as WorkItemRelation,
            {
              rel: RelationshipType.Related,
              url: "https://api.com/workitems/102",
            } as WorkItemRelation,
          ],
        } as WorkItem,
        {
          id: 2,
          relations: [
            {
              rel: RelationshipType.Related,
              url: "https://api.com/workitems/103",
            } as WorkItemRelation,
          ],
        } as WorkItem,
      ];

      const mockRelatedItems = [{ id: 101, title: "Related 1" } as unknown as WorkItem, { id: 102, title: "Related 2" } as unknown as WorkItem, { id: 103, title: "Related 3" } as unknown as WorkItem];

      mockHttpClient.getWorkItems.mockResolvedValueOnce(mockWorkItems).mockResolvedValueOnce(mockRelatedItems);

      const result = await workItemService.getRelatedItemsForItemsIds([1, 2]);

      expect(mockHttpClient.getWorkItems).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.getWorkItems).toHaveBeenNthCalledWith(1, [1, 2], "test-project-id", undefined, undefined, WorkItemExpand.All, WorkItemErrorPolicy.Omit);
      expect(mockHttpClient.getWorkItems).toHaveBeenNthCalledWith(2, [101, 102, 103], "test-project-id", undefined, undefined, WorkItemExpand.All, WorkItemErrorPolicy.Omit);
      expect(result).toEqual(mockRelatedItems);
    });

    it("should return empty array when no related items found", async () => {
      const mockWorkItems = [
        {
          id: 1,
          relations: [
            {
              rel: RelationshipType.ReferencedByReverse,
              url: "https://api.com/workitems/101",
            } as WorkItemRelation,
          ],
        } as WorkItem,
      ];

      mockHttpClient.getWorkItems.mockResolvedValue(mockWorkItems);

      const result = await workItemService.getRelatedItemsForItemsIds([1]);

      expect(result).toEqual([]);
    });

    it("should handle work items without relations", async () => {
      const mockWorkItems = [
        {
          id: 1,
          relations: null as unknown as WorkItemRelation[],
        } as WorkItem,
        {
          id: 2,
          relations: undefined as unknown as WorkItemRelation[],
        } as WorkItem,
      ];

      mockHttpClient.getWorkItems.mockResolvedValue(mockWorkItems);

      const result = await workItemService.getRelatedItemsForItemsIds([1, 2]);

      expect(result).toEqual([]);
    });

    it("should handle invalid relation URLs", async () => {
      const mockWorkItems = [
        {
          id: 1,
          relations: [
            {
              rel: RelationshipType.Related,
              url: "invalid-url",
            } as WorkItemRelation,
            {
              rel: RelationshipType.Related,
              url: "https://api.com/workitems/",
            } as WorkItemRelation,
          ],
        } as WorkItem,
      ];

      mockHttpClient.getWorkItems.mockResolvedValueOnce(mockWorkItems).mockResolvedValueOnce([]);

      const result = await workItemService.getRelatedItemsForItemsIds([1]);

      expect(mockHttpClient.getWorkItems).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.getWorkItems).toHaveBeenNthCalledWith(2, [NaN], "test-project-id", undefined, undefined, "All", "Omit");
      expect(result).toEqual([]);
    });

    it("should deduplicate related item IDs", async () => {
      const mockWorkItems = [
        {
          id: 1,
          relations: [
            {
              rel: RelationshipType.Related,
              url: "https://api.com/workitems/101",
            } as WorkItemRelation,
          ],
        } as WorkItem,
        {
          id: 2,
          relations: [
            {
              rel: RelationshipType.Related,
              url: "https://api.com/workitems/101",
            } as WorkItemRelation,
          ],
        } as WorkItem,
      ];

      const mockRelatedItems = [{ id: 101, title: "Related 1" } as unknown as WorkItem];

      mockHttpClient.getWorkItems.mockResolvedValueOnce(mockWorkItems).mockResolvedValueOnce(mockRelatedItems);

      const result = await workItemService.getRelatedItemsForItemsIds([1, 2]);

      expect(mockHttpClient.getWorkItems).toHaveBeenNthCalledWith(2, [101], "test-project-id", undefined, undefined, WorkItemExpand.All, WorkItemErrorPolicy.Omit);
      expect(result).toEqual(mockRelatedItems);
    });
  });

  describe("static properties", () => {
    it("should have correct static type constants", () => {
      const WorkItemService = Object.getPrototypeOf(workItemService).constructor;
      expect(WorkItemService.retrospective_type).toBe("Retrospective");
      expect(WorkItemService.task_type).toBe("Task");
    });
  });
});
