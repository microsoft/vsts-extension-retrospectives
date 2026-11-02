import * as fc from "fast-check";
import { generateUUID } from "../random";

/**
 * Fuzz tests for UUID generation using fast-check property-based testing.
 * These tests verify that the UUID generator behaves correctly across a wide range of inputs.
 */
describe("generateUUID - Fuzz Tests", () => {
  it("should always generate valid UUID v4 format", () => {
    // Property: The UUID should always match the UUID v4 format
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), () => {
        const uuid = generateUUID();

        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(uuid).toMatch(uuidRegex);
      }),
    );
  });

  it("should always generate unique UUIDs", () => {
    // Property: Multiple calls should produce unique values
    fc.assert(
      fc.property(fc.integer({ min: 10, max: 100 }), count => {
        const uuids = new Set<string>();

        for (let i = 0; i < count; i++) {
          uuids.add(generateUUID());
        }

        // All UUIDs should be unique
        expect(uuids.size).toBe(count);
      }),
    );
  });

  it("should always generate 36 character strings", () => {
    // Property: UUID length should always be 36 characters (including hyphens)
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), () => {
        const uuid = generateUUID();
        expect(uuid.length).toBe(36);
      }),
    );
  });

  it("should always have hyphens at correct positions", () => {
    // Property: Hyphens should be at positions 8, 13, 18, and 23
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), () => {
        const uuid = generateUUID();
        expect(uuid[8]).toBe("-");
        expect(uuid[13]).toBe("-");
        expect(uuid[18]).toBe("-");
        expect(uuid[23]).toBe("-");
      }),
    );
  });

  it("should always have 4 in the version position", () => {
    // Property: Character at position 14 should always be '4' (UUID v4)
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), () => {
        const uuid = generateUUID();
        expect(uuid[14]).toBe("4");
      }),
    );
  });

  it("should always have valid variant bits", () => {
    // Property: Character at position 19 should be 8, 9, a, or b (variant bits)
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), () => {
        const uuid = generateUUID();
        const variantChar = uuid[19].toLowerCase();
        expect(["8", "9", "a", "b"]).toContain(variantChar);
      }),
    );
  });
});
