import { isAzureDevOpsError, isDocumentOrCollectionMissingError, AzureDevOpsError, AzureDevOpsErrorTypes } from "../azureDevOpsError";

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

    it("should have DocumentDoesNotExist constant", () => {
      expect(AzureDevOpsErrorTypes.DocumentDoesNotExist).toBe("DocumentDoesNotExistException");
    });
  });

  describe("isDocumentOrCollectionMissingError", () => {
    it.each([
      ["a missing collection type key", { serverError: { typeKey: AzureDevOpsErrorTypes.DocumentCollectionDoesNotExist } }],
      ["a missing document type key", { serverError: { typeKey: AzureDevOpsErrorTypes.DocumentDoesNotExist } }],
      ["an HTTP 404 status", { status: 404 }],
      ["an HTTP 404 statusCode", { statusCode: 404 }],
      ["the 1660002 error code", { message: "TF1660002: The document could not be found." }],
      ["a collection does not exist message", { message: "The Collection does not exist" }],
      ["a document does not exist server message", { serverError: { message: "Document does not exist" } }],
    ])("should return true for %s", (_, error) => {
      expect(isDocumentOrCollectionMissingError(error)).toBe(true);
    });

    it.each([
      ["null", null],
      ["undefined", undefined],
      ["a string", "Document does not exist"],
      ["a network failure", Object.assign(new Error("TF400893: Unable to contact the server."), { name: "NetworkException" })],
      ["an HTTP 401 status", { status: 401, message: "Unauthorized" }],
      ["an HTTP 500 status", { status: 500, serverError: { typeKey: "InternalServerErrorException" } }],
      ["a conflict", { status: 409, serverError: { typeKey: "InvalidDocumentVersionException" } }],
    ])("should return false for %s", (_, error) => {
      expect(isDocumentOrCollectionMissingError(error)).toBe(false);
    });
  });
});
