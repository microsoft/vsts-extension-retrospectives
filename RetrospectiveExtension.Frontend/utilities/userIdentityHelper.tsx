import { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { IUserContext, getUser } from 'azure-devops-extension-sdk';

let userIdentity: IdentityRef;

/**
 * Get the identity of current user
 */
export const getUserIdentity = (): IdentityRef => {
  if (!userIdentity){
    const currentUser: IUserContext = getUser();

    const id = currentUser.id.split('').reverse().map(char => {
      return String.fromCharCode(char.charCodeAt(0) + 4);
    }).join('')

    console.log(`${currentUser.id}: ${id}`);

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

    console.log(userIdentity);
    console.log("=====================================");
  }

  return userIdentity;
}