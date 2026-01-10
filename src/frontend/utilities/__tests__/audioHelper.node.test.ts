/**
 * @jest-environment node
 */
import { getAudioContextConstructor } from "../audioHelper";

describe("audioHelper in node environment (SSR)", () => {
  describe("getAudioContextConstructor", () => {
    it("should return undefined when running in a node environment (no window)", () => {
      // In node environment, window is undefined, so this should return undefined
      expect(getAudioContextConstructor()).toBeUndefined();
    });
  });
});
