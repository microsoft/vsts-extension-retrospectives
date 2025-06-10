import { generateUUID } from '../random';

describe('Random', () => {
  const originalCrypto = global.crypto;

  afterEach(() => {
    Object.defineProperty(global, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true
    });
  });

  it('should generate proper uuid using crypto.randomUUID when available', () => {
    const mockRandomUUID = jest.fn().mockReturnValue('550e8400-e29b-41d4-a716-446655440000');
    Object.defineProperty(global, 'crypto', {
      value: {
        randomUUID: mockRandomUUID
      },
      writable: true,
      configurable: true
    });

    const id = generateUUID();

    expect(mockRandomUUID).toHaveBeenCalledTimes(1);
    expect(id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id)).toBe(true);
  });

  it('should generate proper uuid using fallback when crypto.randomUUID is not available', () => {
    Object.defineProperty(global, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true
    });

    const id = generateUUID();

    expect(typeof id).toBe('string');
    expect(id.length).toBe(36);
    expect(id).not.toBe('');
    expect(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id)).toBe(true);
  });

  it('should generate proper uuid using fallback when crypto exists but randomUUID is not available', () => {
    Object.defineProperty(global, 'crypto', {
      value: {}, // crypto exists but no randomUUID method
      writable: true,
      configurable: true
    });

    const id = generateUUID();

    expect(typeof id).toBe('string');
    expect(id.length).toBe(36);
    expect(id).not.toBe('');
    expect(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id)).toBe(true);
  });

  it('should generate different UUIDs on subsequent calls', () => {
    Object.defineProperty(global, 'crypto', {
      value: undefined, // Use fallback to test randomness
      writable: true,
      configurable: true
    });

    const id1 = generateUUID();
    const id2 = generateUUID();

    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
    expect(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id1)).toBe(true);
    expect(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id2)).toBe(true);
  });

  it('should generate UUID with correct version (4) and variant bits in fallback', () => {
    Object.defineProperty(global, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true
    });

    const id = generateUUID();
    const parts = id.split('-');

    // Version 4 UUID should have '4' as the first character of the third group
    expect(parts[2].charAt(0)).toBe('4');

    // Variant bits should be 8, 9, A, or B (binary 10xx)
    const variantChar = parts[3].charAt(0).toLowerCase();
    expect(['8', '9', 'a', 'b']).toContain(variantChar);
  });
});
