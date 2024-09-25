import { generateUUID } from '../random';

describe('Random', () => {
  it('should generate proper uuid', () => {
    const id = generateUUID();

    expect(id).not.toBeNull();
    expect(id).not.toBe('');
    expect(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id)).toBe(true);
  });

  it('should generate proper uuid', () => {
    global.crypto = undefined;

    const id = generateUUID();

    expect(id).not.toBeNull();
    expect(id).not.toBe('');
    expect(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id)).toBe(true);
  });
});
