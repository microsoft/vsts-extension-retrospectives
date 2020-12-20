import { IdentityRef } from 'VSS/WebApi/Contracts';

let userIdentity: IdentityRef;

/**
 * Get the identity of current user
 */
export const getUserIdentity = (): IdentityRef => {
  if (!userIdentity){
    const currentUser: UserContext = VSS.getWebContext().user;
    const avatarUrl: string = buildAvatarUrl(currentUser.id);

    userIdentity = {
      id: currentUser.id,
      displayName: currentUser.name,
      uniqueName: currentUser.uniqueName || currentUser.email,
      imageUrl: avatarUrl,
      _links: {
        avatar: {
          href: avatarUrl,
        },
      },
    } as IdentityRef;
  }

  return userIdentity;
} 