import { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { IUserContext, getUser } from 'azure-devops-extension-sdk';

let userIdentity: IdentityRef;

/**
 * Get the identity of current user
 */
export const getUserIdentity = (): IdentityRef => {
  if (!userIdentity){
    const currentUser: IUserContext = getUser();

    console.log(currentUser);
    console.log("=====================================");
    console.log(currentUser.id);
    console.log("=====================================");

    crypto.subtle.generateKey({
      name: 'AES-GCM',
      length: 256,
    }, true, ['encrypt', 'decrypt']).then(key => {
      const iv = window.crypto.getRandomValues(new Uint8Array(12)); // AES-GCM uses a 12-byte IV
      const encoder = new TextEncoder();

      window.crypto.subtle.encrypt(
          {
              name: 'AES-GCM',
              iv: iv,
          },
          key,
          encoder.encode(currentUser.id),
      ).then(encryptedData => {
        const buffer = new Uint8Array(encryptedData);
        const encryptedHex = Array.from(buffer).map(byte => byte.toString(16).padStart(2, '0')).join('');
        const ivHex = Array.from(iv).map(byte => byte.toString(16).padStart(2, '0')).join('');
        const encryptedId = `${ivHex}:${encryptedHex}`;

        console.log(encryptedId);
        console.log("=====================================");

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
      });
    });

  }

  return userIdentity;
}