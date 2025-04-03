import React from 'react';
import { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { SDKContext } from '../dal/azureDevOpsContextProvider';

let userIdentity: IdentityRef;

/**
 * Get the identity of current user
 */
export const getUserIdentity = (): IdentityRef => {
  if (!userIdentity){
    const { SDK } = React.useContext(SDKContext);
    const currentUser = SDK.getUser();

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
