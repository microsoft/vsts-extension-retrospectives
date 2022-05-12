import { getHost } from 'azure-devops-extension-sdk';
import { getHostAuthority } from '../utilities/servicesHelper';

const internalOrgNames = [
  'reflect-retrospective-hackathon',
  'reflect-demo',
  'microsoft',
  'microsoftit',
  'mseng',
  'msazure',
  'onebranch',
];

/**
 * Returns whether the current org in VSTS context is a recognized internal org.
 */
export const isInternalOrg = () => {
  const host = getHost();
  const isInternal = internalOrgNames.indexOf(host.name.toLowerCase().trim()) !== -1;

  return isInternal;
};

/**
 * Returns whether the extension is run in a hosted environment (as opposed to an on-premise environment).
 * In Azure DevOps terms, hosted environment is also known as "Azure DevOps Services" and on-premise environment is known as
 * "Team Foundation Server" or "Azure DevOps Server".
 */
export const isHostedAzureDevOps = async () => {
  const hostAuthority = await getHostAuthority();
  const isHosted = hostAuthority === 'dev.azure.com'
    || hostAuthority.endsWith('.visualstudio.com');

  return isHosted;
};
