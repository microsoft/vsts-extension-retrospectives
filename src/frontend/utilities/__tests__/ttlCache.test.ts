import { TtlCache } from "../ttlCache";

describe("TtlCache", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns undefined for a missing key", () => {
    const cache = new TtlCache<string>(5000);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("stores and retrieves a value within TTL", () => {
    const cache = new TtlCache<number>(5000);
    cache.set("a", 42);
    expect(cache.get("a")).toBe(42);
  });

  it("expires a value after TTL elapses", () => {
    const cache = new TtlCache<number>(5000);
    cache.set("a", 42);
    jest.advanceTimersByTime(5001);
    expect(cache.get("a")).toBeUndefined();
  });

  it("returns the value at exactly the TTL boundary", () => {
    const cache = new TtlCache<number>(5000);
    cache.set("a", 42);
    jest.advanceTimersByTime(5000);
    expect(cache.get("a")).toBe(42);
  });

  it("has() returns true for live entries and false for expired/missing ones", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("x", "hello");
    expect(cache.has("x")).toBe(true);
    expect(cache.has("y")).toBe(false);
    jest.advanceTimersByTime(1001);
    expect(cache.has("x")).toBe(false);
  });

  it("delete() removes an entry", () => {
    const cache = new TtlCache<string>(10000);
    cache.set("key", "value");
    cache.delete("key");
    expect(cache.get("key")).toBeUndefined();
  });

  it("clear() removes all entries", () => {
    const cache = new TtlCache<number>(10000);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
  });

  it("size prunes expired entries and returns correct count", () => {
    const cache = new TtlCache<number>(3000);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.size).toBe(2);
    jest.advanceTimersByTime(3001);
    cache.set("c", 3);
    expect(cache.size).toBe(1);
  });

  it("overwriting a key resets the TTL", () => {
    const cache = new TtlCache<number>(5000);
    cache.set("a", 1);
    jest.advanceTimersByTime(4000);
    cache.set("a", 2);
    jest.advanceTimersByTime(4000);
    expect(cache.get("a")).toBe(2);
    jest.advanceTimersByTime(1001);
    expect(cache.get("a")).toBeUndefined();
  });

  it("supports different value types", () => {
    const objCache = new TtlCache<{ name: string }>(5000);
    const obj = { name: "test" };
    objCache.set("obj", obj);
    expect(objCache.get("obj")).toBe(obj);

    const arrCache = new TtlCache<number[]>(5000);
    const arr = [1, 2, 3];
    arrCache.set("arr", arr);
    expect(arrCache.get("arr")).toBe(arr);
  });

  it("handles delete on non-existent key without error", () => {
    const cache = new TtlCache<string>(5000);
    expect(() => cache.delete("nope")).not.toThrow();
  });
});
