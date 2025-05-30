import { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { IUserContext, getUser } from 'azure-devops-extension-sdk';

import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IProjectPageService } from "azure-devops-extension-api";

let userIdentity: IdentityRef;

/**
 * Get the identity of current user
 */
export const getUserIdentity = (): IdentityRef => {
  if (!userIdentity){
    const currentUser: IUserContext = getUser();

    userIdentity = {
      id: currentUser.id,
      displayName: currentUser.displayName,
      uniqueName: currentUser.name,
      imageUrl: currentUser.imageUrl,
      _links: {
        avatar: {
          href: currentUser.imageUrl,
        },
      },
    } as IdentityRef;
  }

  return userIdentity;
}

export const encrypt = (id: string): string => {
  return id.split('').reverse().map(char => {
    return String.fromCharCode(char.charCodeAt(0) + 4);
  }).join('');
}

export const decrypt = (id: string): string => {
  return id.split('').reverse().map(char => {
    return String.fromCharCode(char.charCodeAt(0) - 4);
  }).join('');
}

/**
 * Type for group objects returned by Azure DevOps Graph API.
 */
interface GraphGroup {
  displayName: string;
  descriptor: string;
}

/**
 * Type for member objects returned by Azure DevOps Graph API.
 */
interface GraphMember {
  descriptor: string;
}

/**
 * Helper to call Azure DevOps REST API with the current session's token.
 */
async function callAzureDevOpsApi(url: string) {
  const token = await SDK.getAccessToken();
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error(`API call failed: ${response.statusText}`);
  return await response.json();
}

/**
 * Checks if the current user is a Project Admin.
 */
export async function isCurrentUserProjectAdmin(): Promise<boolean> {
  await SDK.ready();

  // Get project info
  const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
  const project = await projectService.getProject();
  if (!project) throw new Error("Project context not found");

  // Get org URL (by extracting up to project name)
  // Example: https://dev.azure.com/orgName/projectName/_apps/hub
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const orgUrl = `${window.location.origin}/${pathParts[0]}/${pathParts[1]}/`;

  // 1. Get project descriptor
  const descriptorUrl = `${orgUrl}_apis/graph/descriptors/${project.id}?api-version=7.1-preview.1`;
  const descriptorData = await callAzureDevOpsApi(descriptorUrl);
  const projectDescriptor = descriptorData.value;

  // 2. List groups in this project
  const groupsUrl = `${orgUrl}_apis/graph/groups?scopeDescriptor=${projectDescriptor}&api-version=7.1-preview.1`;
  const groupsData: { value: GraphGroup[] } = await callAzureDevOpsApi(groupsUrl);
  const adminGroup = groupsData.value.find((g: GraphGroup) => g.displayName === "Project Administrators");
  if (!adminGroup) return false;

  // 3. List members of the Project Administrators group
  const membersUrl = `${orgUrl}_apis/graph/memberships/${adminGroup.descriptor}/members?api-version=7.1-preview.1`;
  const membersData: { value: GraphMember[] } = await callAzureDevOpsApi(membersUrl);

  // 4. Get current user descriptor
  const user = SDK.getUser();
  const userDescriptorUrl = `${orgUrl}_apis/graph/descriptors/${user.id}?api-version=7.1-preview.1`;
  const userDescriptorData = await callAzureDevOpsApi(userDescriptorUrl);
  const userDescriptor = userDescriptorData.value;

  // 5. Check if user is a member
  return membersData.value.some((m: GraphMember) => m.descriptor === userDescriptor);
}

/**
 * Example: Log whether the current user is a project admin.
 */
export async function logProjectAdminStatus() {
  const isAdmin = await isCurrentUserProjectAdmin();
  console.log(`User is ${isAdmin ? "" : "not "}a project admin.`);
}
