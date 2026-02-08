import { IdentityRef } from "azure-devops-extension-api/WebApi";
import { IUserContext, getUser } from "azure-devops-extension-sdk";
import { hashUserIdForBoard } from "./cryptoHelper";

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

/**
 * Hash user ID with board-specific salt using SHA-256.
 * This is a one-way hash - it cannot be reversed to find the original user ID.
 * Different boards produce different hashes for the same user.
 */
export const hashUserId = async (userId: string, boardId: string): Promise<string> => {
  return hashUserIdForBoard(userId, boardId);
};

/**
 * @deprecated Use hashUserId instead. This function uses weak obfuscation.
 * Kept for backward compatibility with existing data.
 */
export const obfuscateUserId = (id: string): string => {
  return id
    .split("")
    .reverse()
    .map(char => {
      return String.fromCharCode(char.charCodeAt(0) + 4);
    })
    .join("");
};

/**
 * @deprecated This function is for legacy data only.
 * New code should use hashUserId which cannot be reversed.
 */
export const deobfuscateUserId = (id: string): string => {
  return id
    .split("")
    .reverse()
    .map(char => {
      return String.fromCharCode(char.charCodeAt(0) - 4);
    })
    .join("");
};
