/**
 * Combines class names into a single string, filtering out falsy values.
 * @param classes - Array of class names or conditional class names
 * @returns Combined class name string
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
