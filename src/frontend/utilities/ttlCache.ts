/**
 * A simple in-memory TTL (time-to-live) cache.
 * Used to avoid redundant network requests for data that changes infrequently
 * (e.g. team iterations, team field values).
 */
export class TtlCache<V> {
  private readonly _entries = new Map<string, { value: V; expiresAt: number }>();
  private readonly _ttlMs: number;

  constructor(ttlMs: number) {
    this._ttlMs = ttlMs;
  }

  get(key: string): V | undefined {
    const entry = this._entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this._entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    this._entries.set(key, { value, expiresAt: Date.now() + this._ttlMs });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this._entries.delete(key);
  }

  clear(): void {
    this._entries.clear();
  }

  get size(): number {
    // Prune expired and count remaining
    let count = 0;
    const now = Date.now();
    for (const [key, entry] of this._entries) {
      if (now > entry.expiresAt) {
        this._entries.delete(key);
      } else {
        count++;
      }
    }
    return count;
  }
}
