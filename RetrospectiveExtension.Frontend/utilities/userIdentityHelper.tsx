import { IdentityRef } from 'VSS/WebApi/Contracts';

let userIdentity: IdentityRef;

/**
 * Get the identity of current user
 */
export const getUserIdentity = (): IdentityRef => {
  if (!userIdentity){
    const context = VSS.getWebContext();
    const currentUser: UserContext = context.user;
    const hostUri = context.host.uri;
    const avatarUrl: string = (!(currentUser.id == null || currentUser.id.trim() === '')) ? `${hostUri}/_api/_common/IdentityImage?id=${currentUser.id}` : "";

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