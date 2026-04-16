/**
 * Performs a shallow equality comparison between two objects.
 * Returns true if both objects have the same keys with the same values (by reference).
 * Used to skip unnecessary React re-renders when state hasn't actually changed.
 */
export function shallowEqual<T extends Record<string, unknown>>(objA: T, objB: Partial<T>): boolean {
  const keysB = Object.keys(objB) as (keyof T)[];
  if (keysB.length === 0) {
    return true;
  }
  for (const key of keysB) {
    if (objA[key] !== objB[key]) {
      return false;
    }
  }
  return true;
}
