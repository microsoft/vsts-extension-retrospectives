import { IdentityRef } from "azure-devops-extension-api/WebApi";
import { IUserContext, getUser } from "azure-devops-extension-sdk";

let userIdentity: IdentityRef;

export const getUserIdentity = (): IdentityRef => {
  if (!userIdentity) {
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
};

export const obfuscateUserId = (id: string): string => {
  return id
    .split("")
    .reverse()
    .map(char => {
      return String.fromCharCode(char.charCodeAt(0) + 4);
    })
    .join("");
};

export const deobfuscateUserId = (id: string): string => {
  return id
    .split("")
    .reverse()
    .map(char => {
      return String.fromCharCode(char.charCodeAt(0) - 4);
    })
    .join("");
};
