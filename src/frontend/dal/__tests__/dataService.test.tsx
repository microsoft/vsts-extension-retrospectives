import { IExtensionDataManager, IExtensionDataService } from "azure-devops-extension-api";
import { appInsights } from "../../utilities/telemetryClient";
import { readDocuments, readDocument, createDocument, createOrUpdateDocument, updateDocument, deleteDocument, setValue, getValue } from "../dataService";

const mockGetAccessToken = jest.fn();
const mockGetService = jest.fn();
const mockGetExtensionContext = jest.fn();

jest.mock("azure-devops-extension-sdk", () => ({
  getAccessToken: () => mockGetAccessToken(),
  getService: (serviceId: string) => mockGetService(serviceId),
  getExtensionContext: () => mockGetExtensionContext(),
}));

jest.mock("../../utilities/telemetryClient");

const mockDataManager: jest.Mocked<IExtensionDataManager> = {
  getDocuments: jest.fn(),
  getDocument: jest.fn(),
  createDocument: jest.fn(),
  setDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  setValue: jest.fn(),
  getValue: jest.fn(),
  queryCollections: jest.fn(),
  queryCollectionsByName: jest.fn(),
};

const mockExtensionDataService: jest.Mocked<IExtensionDataService> = {
  getExtensionDataManager: jest.fn(),
};

describe("dataService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessToken.mockResolvedValue("test-token");
    mockGetExtensionContext.mockReturnValue({ id: "test-extension-id" } as any);
    mockGetService.mockResolvedValue(mockExtensionDataService as any);
    mockExtensionDataService.getExtensionDataManager.mockResolvedValue(mockDataManager);
  });

  describe("readDocuments", () => {
    it("should read documents successfully with default scope", async () => {
      const mockData = [
        { id: "1", name: "Test" },
        { id: "2", name: "Test2" },
      ];
      mockDataManager.getDocuments.mockResolvedValue(mockData);

      const result = await readDocuments("testCollection");

      expect(result).toEqual(mockData);
      expect(mockDataManager.getDocuments).toHaveBeenCalledWith("testCollection", undefined);
    });

    it("should read documents with private scope", async () => {
      const mockData = [{ id: "1", name: "Test" }];
      mockDataManager.getDocuments.mockResolvedValue(mockData);

      const result = await readDocuments("testCollection", true);

      expect(result).toEqual(mockData);
      expect(mockDataManager.getDocuments).toHaveBeenCalledWith("testCollection", { scopeType: "User" });
    });

    it("should return empty array when DocumentCollectionDoesNotExistException is thrown and throwCollectionDoesNotExistException is false", async () => {
      const error = {
        serverError: { typeKey: "DocumentCollectionDoesNotExistException" },
      };
      mockDataManager.getDocuments.mockRejectedValue(error);

      const result = await readDocuments("testCollection", false, false);

      expect(result).toEqual([]);
      expect(appInsights.trackTrace).toHaveBeenCalledWith({
        message: "Collection testCollection is missing or empty.",
        properties: { collectionName: "testCollection" },
      });
    });

    it("should throw error when DocumentCollectionDoesNotExistException is thrown and throwCollectionDoesNotExistException is true", async () => {
      const error = {
        serverError: { typeKey: "DocumentCollectionDoesNotExistException" },
      };
      mockDataManager.getDocuments.mockRejectedValue(error);

      await expect(readDocuments("testCollection", false, true)).rejects.toEqual(error);
    });

    it("should return empty array and track exception for non-DocumentCollectionDoesNotExistException errors", async () => {
      const error = new Error("Network error");
      mockDataManager.getDocuments.mockRejectedValue(error);

      const result = await readDocuments("testCollection");

      expect(result).toEqual([]);
      expect(appInsights.trackException).toHaveBeenCalledWith(error);
    });
  });

  describe("readDocument", () => {
    it("should read document successfully with default scope", async () => {
      const mockData = { id: "1", name: "Test" };
      mockDataManager.getDocument.mockResolvedValue(mockData);

      const result = await readDocument("testCollection", "1");

      expect(result).toEqual(mockData);
      expect(mockDataManager.getDocument).toHaveBeenCalledWith("testCollection", "1", undefined);
    });

    it("should read document with private scope", async () => {
      const mockData = { id: "1", name: "Test" };
      mockDataManager.getDocument.mockResolvedValue(mockData);

      const result = await readDocument("testCollection", "1", true);

      expect(result).toEqual(mockData);
      expect(mockDataManager.getDocument).toHaveBeenCalledWith("testCollection", "1", { scopeType: "User" });
    });

    it("should return undefined for emptyFeedbackItem id", async () => {
      const result = await readDocument("testCollection", "emptyFeedbackItem");

      expect(result).toBeUndefined();
      expect(mockDataManager.getDocument).not.toHaveBeenCalled();
    });

    it("should return undefined and track exception on error", async () => {
      const error = new Error("Read error");
      mockDataManager.getDocument.mockRejectedValue(error);

      const result = await readDocument("testCollection", "1");

      expect(result).toBeUndefined();
      expect(appInsights.trackException).toHaveBeenCalledWith(error, { collectionName: "testCollection", id: "1" });
    });
  });

  describe("createDocument", () => {
    it("should create document successfully with default scope", async () => {
      const mockData = { id: "1", name: "Test" };
      mockDataManager.createDocument.mockResolvedValue(mockData);

      const result = await createDocument("testCollection", mockData);

      expect(result).toEqual(mockData);
      expect(mockDataManager.createDocument).toHaveBeenCalledWith("testCollection", mockData, undefined);
    });

    it("should create document with private scope", async () => {
      const mockData = { id: "1", name: "Test" };
      mockDataManager.createDocument.mockResolvedValue(mockData);

      const result = await createDocument("testCollection", mockData, true);

      expect(result).toEqual(mockData);
      expect(mockDataManager.createDocument).toHaveBeenCalledWith("testCollection", mockData, { scopeType: "User" });
    });
  });

  describe("createOrUpdateDocument", () => {
    it("should create or update document successfully with default scope", async () => {
      const mockData = { id: "1", name: "Test" };
      mockDataManager.setDocument.mockResolvedValue(mockData);

      const result = await createOrUpdateDocument("testCollection", mockData);

      expect(result).toEqual(mockData);
      expect(mockDataManager.setDocument).toHaveBeenCalledWith("testCollection", mockData, undefined);
    });

    it("should create or update document with private scope", async () => {
      const mockData = { id: "1", name: "Test" };
      mockDataManager.setDocument.mockResolvedValue(mockData);

      const result = await createOrUpdateDocument("testCollection", mockData, true);

      expect(result).toEqual(mockData);
      expect(mockDataManager.setDocument).toHaveBeenCalledWith("testCollection", mockData, { scopeType: "User" });
    });
  });

  describe("updateDocument", () => {
    it("should update document successfully with default scope", async () => {
      const mockData = { id: "1", name: "Updated" };
      mockDataManager.updateDocument.mockResolvedValue(mockData);

      const result = await updateDocument("testCollection", mockData);

      expect(result).toEqual(mockData);
      expect(mockDataManager.updateDocument).toHaveBeenCalledWith("testCollection", mockData, undefined);
    });

    it("should update document with private scope", async () => {
      const mockData = { id: "1", name: "Updated" };
      mockDataManager.updateDocument.mockResolvedValue(mockData);

      const result = await updateDocument("testCollection", mockData, true);

      expect(result).toEqual(mockData);
      expect(mockDataManager.updateDocument).toHaveBeenCalledWith("testCollection", mockData, { scopeType: "User" });
    });

    it("should return undefined and track exception on error", async () => {
      const mockData = { id: "1", name: "Updated" };
      const error = new Error("Update error");
      mockDataManager.updateDocument.mockRejectedValue(error);

      const result = await updateDocument("testCollection", mockData);

      expect(result).toBeUndefined();
      expect(appInsights.trackException).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteDocument", () => {
    it("should delete document successfully with default scope", async () => {
      mockDataManager.deleteDocument.mockResolvedValue(undefined);

      await deleteDocument("testCollection", "1");

      expect(mockDataManager.deleteDocument).toHaveBeenCalledWith("testCollection", "1", undefined);
    });

    it("should delete document with private scope", async () => {
      mockDataManager.deleteDocument.mockResolvedValue(undefined);

      await deleteDocument("testCollection", "1", true);

      expect(mockDataManager.deleteDocument).toHaveBeenCalledWith("testCollection", "1", { scopeType: "User" });
    });
  });

  describe("setValue", () => {
    it("should set value successfully with default scope", async () => {
      const mockData = { value: "test" };
      mockDataManager.setValue.mockResolvedValue(mockData);

      const result = await setValue("key1", mockData);

      expect(result).toEqual(mockData);
      expect(mockDataManager.setValue).toHaveBeenCalledWith("key1", mockData, undefined);
    });

    it("should set value with private scope", async () => {
      const mockData = { value: "test" };
      mockDataManager.setValue.mockResolvedValue(mockData);

      const result = await setValue("key1", mockData, true);

      expect(result).toEqual(mockData);
      expect(mockDataManager.setValue).toHaveBeenCalledWith("key1", mockData, { scopeType: "User" });
    });

    it("should set value and throw error on failure", async () => {
      const mockData = { value: "test" };
      const error = new Error("Set error");
      mockDataManager.setValue.mockRejectedValue(error);

      await expect(setValue("key1", mockData)).rejects.toThrow("Set error");
    });
  });

  describe("getValue", () => {
    it("should get value successfully with default scope", async () => {
      const mockData = { value: "test" };
      mockDataManager.getValue.mockResolvedValue(mockData);

      const result = await getValue("key1");

      expect(result).toEqual(mockData);
      expect(mockDataManager.getValue).toHaveBeenCalledWith("key1", undefined);
    });

    it("should get value with private scope", async () => {
      const mockData = { value: "test" };
      mockDataManager.getValue.mockResolvedValue(mockData);

      const result = await getValue("key1", true);

      expect(result).toEqual(mockData);
      expect(mockDataManager.getValue).toHaveBeenCalledWith("key1", { scopeType: "User" });
    });

    it("should return undefined and track exception on error", async () => {
      const error = new Error("Get error");
      mockDataManager.getValue.mockRejectedValue(error);

      const result = await getValue("key1");

      expect(result).toBeUndefined();
      expect(appInsights.trackException).toHaveBeenCalledWith(error);
    });
  });
});
