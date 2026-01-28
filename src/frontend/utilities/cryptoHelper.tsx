/**
 * Cryptographic helper functions for secure user ID hashing.
 *
 * These functions replace the previous simple obfuscation (Caesar cipher)
 * with proper SHA-256 hashing to ensure user anonymity cannot be reversed.
 */

/**
 * Compute SHA-256 hash of a string.
 * Returns a hex-encoded hash string.
 */
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Hash a user ID with a board-specific salt.
 * This ensures the same user gets different hashes on different boards,
 * preventing cross-board correlation of user activity.
 */
export async function hashUserIdForBoard(userId: string, boardId: string): Promise<string> {
  return sha256(`${userId}:${boardId}`);
}

/**
 * Generate a secure random token.
 */
export function generateSecureToken(): string {
  return crypto.randomUUID();
}
