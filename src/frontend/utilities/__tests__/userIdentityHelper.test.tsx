import { getUserIdentity, encrypt, decrypt } from '../userIdentityHelper';

describe('UserIdentity', () => {
  it('should have the correct id property', () => {
    const user = getUserIdentity();

    expect(user).not.toBeNull();
    expect(user).toHaveProperty('id');
    expect(user.id).not.toBeNull();
    expect(user.id).not.toBe('');
    expect(user.id).toBe('01234567-8910-1112-1314-151617181920');

    const encryptedUserId = encrypt(user.id);
    expect(encryptedUserId).toBe('46=5<5;5:5951857516555145=<1;:987654');

    const decryptedUserId = decrypt(encryptedUserId);
    expect(decryptedUserId).toBe(user.id);
  });
});
