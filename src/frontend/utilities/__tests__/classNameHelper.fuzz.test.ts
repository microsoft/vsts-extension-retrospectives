import * as fc from "fast-check";
import { cn } from "../classNameHelper";

/**
 * Fuzz tests for className helper using fast-check property-based testing.
 * Tests the robustness of class name combination across various inputs.
 */
describe("cn (className helper) - Fuzz Tests", () => {
  it("should always return a string", () => {
    // Property: Output should always be a string regardless of input
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.string(), fc.boolean(), fc.constant(undefined), fc.constant(null))), (args: Array<string | boolean | undefined | null>) => {
        const result = cn(...args);
        expect(typeof result).toBe("string");
      }),
    );
  });

  it("should filter out all falsy values", () => {
    // Property: Result should never contain 'false', 'undefined', or 'null' as strings
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.string(), fc.boolean(), fc.constant(undefined), fc.constant(null), fc.constant(false), fc.constant(""))), (args: Array<string | boolean | undefined | null>) => {
        const result = cn(...args);

        // Should not contain string representations of falsy values
        expect(result).not.toContain("false");
        expect(result).not.toContain("undefined");
        expect(result).not.toContain("null");
      }),
    );
  });

  it("should join truthy strings with spaces", () => {
    // Property: All non-empty strings should be present in the result
    fc.assert(
      fc.property(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }), (classes: string[]) => {
        const result = cn(...classes);

        // Each class should appear in the result
        classes.forEach(cls => {
          if (cls && typeof cls === "string" && cls.trim().length > 0) {
            expect(result).toContain(cls);
          }
        });
      }),
    );
  });

  it("should handle mixed valid and invalid inputs correctly", () => {
    // Property: Only valid string values should appear in output
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.string({ minLength: 1, maxLength: 20 }), fc.boolean(), fc.constant(undefined), fc.constant(null)), { minLength: 1, maxLength: 20 }), (args: Array<string | boolean | undefined | null>) => {
        const result = cn(...args);

        // Result should be a string
        expect(typeof result).toBe("string");

        // Count valid strings (non-empty strings that are truthy)
        const validStrings = args.filter(arg => typeof arg === "string" && arg.length > 0) as string[];

        // Each valid string should appear in result
        validStrings.forEach(str => {
          expect(result).toContain(str);
        });
      }),
    );
  });

  it("should not add extra spaces or have leading/trailing spaces when combining classes", () => {
    // Property: Result should have single spaces between classes
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 10 },
        ),
        (classes: string[]) => {
          const result = cn(...classes);

          if (result.length > 0) {
            // Result should be the classes joined by spaces
            expect(result).toBe(classes.join(" "));
          }
        },
      ),
    );
  });

  it("should handle empty arrays gracefully", () => {
    // Property: Empty input should produce empty string
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle arrays with only falsy values", () => {
    // Property: Only falsy values should produce empty string
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.boolean().filter((b: boolean) => !b),
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(""),
          ),
          { minLength: 1, maxLength: 10 },
        ),
        (args: Array<boolean | undefined | null | string>) => {
          const result = cn(...args);
          expect(result).toBe("");
        },
      ),
    );
  });

  it("should preserve the order of classes", () => {
    // Property: Classes should appear in the same order they were provided
    fc.assert(
      fc.property(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 5 }), (classes: string[]) => {
        const result = cn(...classes);

        // Filter out empty and whitespace-only strings from input
        const nonEmptyClasses = classes.filter(c => c && c.length > 0);

        if (nonEmptyClasses.length === 0) {
          expect(result).toBe("");
        } else {
          // Result should contain all classes separated by spaces
          expect(result).toBe(nonEmptyClasses.join(" "));
        }
      }),
    );
  });

  it("should handle special characters in class names safely", () => {
    // Property: Special characters should be preserved in output
    fc.assert(
      fc.property(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }), (classes: string[]) => {
        const result = cn(...classes);

        // Should not throw or produce unexpected results
        expect(typeof result).toBe("string");

        // Each valid input class should be findable in result
        classes.forEach(cls => {
          if (cls && typeof cls === "string" && cls.trim().length > 0) {
            expect(result).toContain(cls);
          }
        });
      }),
    );
  });
});
