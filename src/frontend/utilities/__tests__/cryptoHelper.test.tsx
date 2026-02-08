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

import { sha256, hashUserIdForBoard, generateSecureToken } from "../cryptoHelper";

describe("CryptoHelper", () => {
  describe("sha256", () => {
    it("should produce a 64-character hex string", async () => {
      const hash = await sha256("test");
      expect(hash).toHaveLength(64);
      // Should only contain hex characters
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("should produce consistent hashes", async () => {
      const hash1 = await sha256("test-input");
      const hash2 = await sha256("test-input");
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", async () => {
      const hash1 = await sha256("input1");
      const hash2 = await sha256("input2");
      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty string", async () => {
      const hash = await sha256("");
      expect(hash).toHaveLength(64);
      // Known SHA-256 hash of empty string
      expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    });

    it("should handle special characters", async () => {
      const hash = await sha256("user@example.com:board-123!@#$%");
      expect(hash).toHaveLength(64);
    });
  });

  describe("hashUserIdForBoard", () => {
    it("should combine userId and boardId with separator", async () => {
      const hash = await hashUserIdForBoard("user-123", "board-456");
      expect(hash).toHaveLength(64);
    });

    it("should produce different hashes for same user on different boards", async () => {
      const hash1 = await hashUserIdForBoard("user-123", "board-1");
      const hash2 = await hashUserIdForBoard("user-123", "board-2");
      expect(hash1).not.toBe(hash2);
    });

    it("should produce different hashes for different users on same board", async () => {
      const hash1 = await hashUserIdForBoard("user-1", "board-123");
      const hash2 = await hashUserIdForBoard("user-2", "board-123");
      expect(hash1).not.toBe(hash2);
    });

    it("should be consistent for same user and board", async () => {
      const hash1 = await hashUserIdForBoard("user-123", "board-456");
      const hash2 = await hashUserIdForBoard("user-123", "board-456");
      expect(hash1).toBe(hash2);
    });
  });

  describe("generateSecureToken", () => {
    it("should generate a valid UUID", () => {
      const token = generateSecureToken();
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it("should generate unique tokens", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      expect(tokens.size).toBe(100);
    });
  });
});
