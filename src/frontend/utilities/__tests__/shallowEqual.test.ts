import { shallowEqual } from "../shallowEqual";

describe("shallowEqual", () => {
  it("returns true when the partial object is empty", () => {
    expect(shallowEqual({ a: 1, b: 2 }, {})).toBe(true);
  });

  it("returns true when all keys in partial match the source by value", () => {
    expect(shallowEqual({ a: 1, b: "hello" }, { a: 1, b: "hello" })).toBe(true);
  });

  it("returns false when a primitive value differs", () => {
    expect(shallowEqual({ a: 1, b: 2 }, { b: 3 })).toBe(false);
  });

  it("compares by reference for objects", () => {
    const arr = [1, 2, 3];
    expect(shallowEqual({ items: arr }, { items: arr })).toBe(true);
    expect(shallowEqual({ items: arr }, { items: [1, 2, 3] })).toBe(false);
  });

  it("returns false when a key is undefined in source but defined in partial", () => {
    const source: Record<string, unknown> = { a: 1 };
    expect(shallowEqual(source, { b: 2 })).toBe(false);
  });

  it("returns true for identical references", () => {
    const obj = { a: 1, b: "x" };
    expect(shallowEqual(obj, obj)).toBe(true);
  });

  it("handles null and undefined values correctly", () => {
    expect(shallowEqual({ a: null, b: undefined }, { a: null, b: undefined })).toBe(true);
    expect(shallowEqual({ a: null }, { a: undefined })).toBe(false);
  });

  it("handles boolean values", () => {
    expect(shallowEqual({ flag: true }, { flag: true })).toBe(true);
    expect(shallowEqual({ flag: true }, { flag: false })).toBe(false);
  });

  it("handles zero vs falsy edge cases", () => {
    expect(shallowEqual({ count: 0 }, { count: 0 })).toBe(true);
    expect(shallowEqual({ count: 0 } as Record<string, unknown>, { count: false } as Record<string, unknown>)).toBe(false);
    expect(shallowEqual({ val: "" }, { val: "" })).toBe(true);
  });
});
