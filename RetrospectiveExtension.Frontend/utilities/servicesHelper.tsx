import { getService } from 'azure-devops-extension-sdk';
import { CommonServiceIds, IProjectPageService, IProjectInfo, ILocationService } from 'azure-devops-extension-api';
import { CoreRestClient } from 'azure-devops-extension-api/Core';

/**
 * Get the project info
 */
const getProjectInfo = async (): Promise<IProjectInfo> => {
  const projectPageService = await getService<IProjectPageService>(CommonServiceIds.ProjectPageService);

  return projectPageService.getProject();
}

/**
 * Get the project id
 */
export const getProjectId = async (): Promise<string> => {
  const projectInfo = await getProjectInfo();

  return projectInfo.id;
}

/**
 * Get the project name
 */
 export const getProjectName = async (): Promise<string> => {
  const projectInfo = await getProjectInfo();

  return projectInfo.name;
}

/**
 * Get the host base URL
 */
 export const getHostBaseUrl = async (): Promise<string> => {
  const locationService = await getService<ILocationService>(CommonServiceIds.LocationService);
  const hostBaseUrl = await locationService.getResourceAreaLocation(
    CoreRestClient.RESOURCE_AREA_ID
  );

  return hostBaseUrl;
}

/**
 * Get the host authority
 */
 export const getHostAuthority = async (): Promise<string> => {
  const hostBaseUrl = await getHostBaseUrl();
  const { hostname } = new URL(hostBaseUrl);

  return hostname;
}
