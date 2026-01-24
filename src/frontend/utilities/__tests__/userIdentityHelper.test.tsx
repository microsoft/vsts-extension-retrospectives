import { TextEncoder } from "util";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodeCrypto = require("crypto");

// Polyfill TextEncoder and crypto for Node.js test environment
beforeAll(() => {
  if (typeof globalThis.TextEncoder === "undefined") {
    globalThis.TextEncoder = TextEncoder;
  }
  
  // Use Node.js crypto module for tests
  Object.defineProperty(globalThis, "crypto", {
    value: {
      subtle: nodeCrypto.webcrypto?.subtle,
      randomUUID: () => nodeCrypto.randomUUID(),
    },
    writable: true,
  });
});

import { getUserIdentity, obfuscateUserId, deobfuscateUserId, hashUserId } from "../userIdentityHelper";

describe("UserIdentity", () => {
  it("should have the correct id property", () => {
    const user = getUserIdentity();

    expect(user).not.toBeNull();
    expect(user).toHaveProperty("id");
    expect(user.id).not.toBeNull();
    expect(user.id).not.toBe("");
    expect(user.id).toBe("01234567-8910-1112-1314-151617181920");

    const obfuscatedUserId = obfuscateUserId(user.id);
    expect(obfuscatedUserId).toBe("46=5<5;5:5951857516555145=<1;:987654");

    const deobfuscatedUserId = deobfuscateUserId(obfuscatedUserId);
    expect(deobfuscatedUserId).toBe(user.id);
  });

  it("should hash user ID with SHA-256", async () => {
    const user = getUserIdentity();
    const boardId = "test-board-123";

    const hashedUserId = await hashUserId(user.id, boardId);

    // SHA-256 produces a 64-character hex string
    expect(hashedUserId).toHaveLength(64);
    // Hash should be consistent
    const hashedAgain = await hashUserId(user.id, boardId);
    expect(hashedUserId).toBe(hashedAgain);
    // Different board should produce different hash
    const differentBoardHash = await hashUserId(user.id, "different-board");
    expect(hashedUserId).not.toBe(differentBoardHash);
  });

  it("should not be reversible (hash should not equal original)", async () => {
    const user = getUserIdentity();
    const boardId = "test-board-123";

    const hashedUserId = await hashUserId(user.id, boardId);

    // Hash should not contain the original user ID
    expect(hashedUserId).not.toContain(user.id);
    expect(hashedUserId).not.toContain(boardId);
  });
});
