import { isAzureDevOpsError, AzureDevOpsError, AzureDevOpsErrorTypes } from "../azureDevOpsError";

describe("azureDevOpsError", () => {
  describe("isAzureDevOpsError", () => {
    it("should return false for null", () => {
      expect(isAzureDevOpsError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isAzureDevOpsError(undefined)).toBe(false);
    });

    it("should return false for primitive types", () => {
      expect(isAzureDevOpsError("error")).toBe(false);
      expect(isAzureDevOpsError(123)).toBe(false);
      expect(isAzureDevOpsError(true)).toBe(false);
    });

    it("should return true for empty object", () => {
      expect(isAzureDevOpsError({})).toBe(true);
    });

    it("should return true for object with message", () => {
      expect(isAzureDevOpsError({ message: "Error message" })).toBe(true);
    });

    it("should return true for object with status", () => {
      expect(isAzureDevOpsError({ status: 404 })).toBe(true);
    });

    it("should return true for object with valid serverError", () => {
      const error: AzureDevOpsError = {
        serverError: {
          typeKey: AzureDevOpsErrorTypes.DocumentCollectionDoesNotExist,
          message: "Collection does not exist",
        },
      };
      expect(isAzureDevOpsError(error)).toBe(true);
    });

    it("should return false when serverError is a string instead of object", () => {
      const error = { serverError: "invalid" };
      expect(isAzureDevOpsError(error)).toBe(false);
    });

    it("should return false when serverError is null", () => {
      const error: { serverError: null } = { serverError: null };
      expect(isAzureDevOpsError(error)).toBe(false);
    });

    it("should return false when serverError is a number", () => {
      const error: { serverError: number } = { serverError: 123 };
      expect(isAzureDevOpsError(error)).toBe(false);
    });

    it("should return true when serverError is an array (arrays are objects)", () => {
      // Arrays are typeof "object" in JavaScript, so they pass the type guard
      // This is acceptable behavior as the type guard is mainly checking for primitives
      const error: { serverError: unknown[] } = { serverError: [] };
      expect(isAzureDevOpsError(error)).toBe(true);
    });

    it("should return true when serverError is undefined", () => {
      const error: { serverError: undefined; message: string } = { serverError: undefined, message: "Error" };
      expect(isAzureDevOpsError(error)).toBe(true);
    });

    it("should return true for complete Azure DevOps error structure", () => {
      const error: AzureDevOpsError = {
        serverError: {
          typeKey: AzureDevOpsErrorTypes.CurrentIterationDoesNotExist,
          message: "Current iteration not found",
        },
        message: "Error occurred",
        status: 404,
      };
      expect(isAzureDevOpsError(error)).toBe(true);
    });
  });

  describe("AzureDevOpsErrorTypes", () => {
    it("should have DocumentCollectionDoesNotExist constant", () => {
      expect(AzureDevOpsErrorTypes.DocumentCollectionDoesNotExist).toBe("DocumentCollectionDoesNotExistException");
    });

    it("should have CurrentIterationDoesNotExist constant", () => {
      expect(AzureDevOpsErrorTypes.CurrentIterationDoesNotExist).toBe("CurrentIterationDoesNotExistException");
    });
  });
});
