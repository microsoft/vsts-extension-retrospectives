/**
 * Interface representing errors from Azure DevOps SDK operations.
 * These errors have a specific structure with serverError containing typeKey.
 */
export interface AzureDevOpsError {
  serverError?: {
    typeKey?: string;
    message?: string;
  };
  message?: string;
  status?: number;
}

/**
 * Type guard to check if an unknown error is an Azure DevOps error.
 */
export function isAzureDevOpsError(error: unknown): error is AzureDevOpsError {
  if (error === null || typeof error !== "object") {
    return false;
  }

  const errorObj = error as Record<string, unknown>;

  // Check if it has serverError property (optional but should be an object if present)
  if ("serverError" in errorObj && errorObj.serverError !== undefined) {
    if (typeof errorObj.serverError !== "object" || errorObj.serverError === null) {
      return false;
    }
  }

  return true;
}

/**
 * Known Azure DevOps error type keys.
 */
export const AzureDevOpsErrorTypes = {
  DocumentCollectionDoesNotExist: "DocumentCollectionDoesNotExistException",
  CurrentIterationDoesNotExist: "CurrentIterationDoesNotExistException",
} as const;
