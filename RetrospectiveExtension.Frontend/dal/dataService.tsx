import { getAccessToken, getExtensionContext, getService } from 'azure-devops-extension-sdk';
import { CommonServiceIds, IExtensionDataManager, IExtensionDataService } from 'azure-devops-extension-api';
// TODO (enpolat) : import { appInsightsClient } from '../utilities/appInsightsClient';

let extensionDataManager: IExtensionDataManager;

async function getDataService(): Promise<IExtensionDataManager> {
  if (!extensionDataManager) {
    const accessToken = await getAccessToken();
    const extensionDataService = await getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
    extensionDataManager = await extensionDataService.getExtensionDataManager(getExtensionContext().id, accessToken);
  }

  return extensionDataManager;
}

/**
 * Read user/account scoped documents.
 */
export async function readDocuments<T>(
  collectionName: string, isPrivate?: boolean, throwCollectionDoesNotExistException?: boolean): Promise<T[]> {
  const dataService: IExtensionDataManager = await getDataService();
  let data: T[];

  try {
    data = await dataService.getDocuments(collectionName, isPrivate ? { scopeType: 'User' } : undefined);
  } catch (e) {
    if (e.serverError.typeKey === 'DocumentCollectionDoesNotExistException') {
      if (throwCollectionDoesNotExistException) {
        throw e;
      }
    }

    // TODO (enpolat) : appInsightsClient.trackException(new Error(e.message));
    console.error('An exception occurred while trying to read the documents: ', e); 

    data = [];
  }

  return data;
}

/**
 * Read a specific user/account scoped document.
 */
export async function readDocument<T>(collectionName: string, id: string, isPrivate?: boolean): Promise<T> {
  const dataService: IExtensionDataManager = await getDataService();
  let data: T;
  try {
    data = await dataService.getDocument(collectionName, id, isPrivate ? { scopeType: 'User' } : undefined);
  } catch (e) {
    // TODO (enpolat) : appInsightsClient.trackException(new Error(e.message));
    console.error('An exception occurred while trying to read the document: ', e);
    data = undefined;
  }

  return data;
}

/**
 * Create user/account scoped document.
 */
export async function createDocument<T>(collectionName: string, data: T, isPrivate?: boolean): Promise<T> {
  const dataService: IExtensionDataManager = await getDataService();
  return dataService.createDocument(collectionName, data, isPrivate ? { scopeType: 'User' } : undefined);
}

/**
 * Create or Update user/account scoped document.
 */
export async function createOrUpdateDocument<T>(collectionName: string, data: T, isPrivate?: boolean): Promise<T> {
  const dataService: IExtensionDataManager = await getDataService();
  return dataService.setDocument(collectionName, data, isPrivate ? { scopeType: 'User' } : undefined);
}

/**
 * Update user/account scoped document.
 */
export async function updateDocument<T>(collectionName: string, data: T, isPrivate?: boolean): Promise<T> {
  const dataService: IExtensionDataManager = await getDataService();

  let updatedData: T;
  try {
    updatedData = await dataService.updateDocument(collectionName, data, isPrivate ? { scopeType: 'User' } : undefined);
  } catch (e) {
    // TODO (enpolat) : appInsightsClient.trackException(new Error(e.message));
    console.error('An exception occurred while trying to update the document: ', e);
    updatedData = undefined;
  }

  return updatedData;
}

/**
 * Delete user/account scoped document.
 */
export async function deleteDocument(collectionName: string, id: string, isPrivate?: boolean): Promise<void> {
  const dataService: IExtensionDataManager = await getDataService();
  return dataService.deleteDocument(collectionName, id, isPrivate ? { scopeType: 'User' } : undefined);
}

/**
 * Set user/account scoped value.
 */
export async function setValue<T>(id: string, data: T, isPrivate?: boolean): Promise<T> {
  const dataService: IExtensionDataManager = await getDataService();

  let updatedData: T;
  try {
    return dataService.setValue(id, data, isPrivate ? { scopeType: 'User' } : undefined);
  } catch (e) {
    // TODO (enpolat) : appInsightsClient.trackException(new Error(e.message));
    console.error('An exception occurred while trying to read the value: ', e);
    updatedData = undefined;
  }

  return updatedData;
}

/**
 * Get user/account scoped value.
 */
export async function getValue<T>(id: string, isPrivate?: boolean): Promise<T> {
  const dataService: IExtensionDataManager = await getDataService();

  let data: T;
  try {
    data = await dataService.getValue<T>(id, isPrivate ? { scopeType: 'User' } : undefined);
  } catch (e) {
    // TODO (enpolat) : appInsightsClient.trackException(new Error(e.message));
    console.error('An exception occurred while trying to read the value: ', e);
    data = undefined;
  }

  return data;
}