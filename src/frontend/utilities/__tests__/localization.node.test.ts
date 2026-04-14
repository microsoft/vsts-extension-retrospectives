/** @jest-environment node */

describe("localization without browser globals", () => {
  const withNavigatorValue = (value: unknown, callback: () => void) => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value,
    });

    try {
      callback();
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, "navigator", descriptor);
        return;
      }

      delete (globalThis as Record<string, unknown>).navigator;
    }
  };

  afterEach(() => {
    jest.resetModules();
  });

  it("falls back to the default locale when document and navigator are unavailable", () => {
    withNavigatorValue(undefined, () => {
      jest.isolateModules(() => {
        const localization = require("../localization") as typeof import("../localization");

        expect(localization.initializeLocale()).toBe("en-US");
        expect(localization.getCurrentLocale()).toBe("en-US");
        expect(localization.setLocale()).toBe("en-US");
        expect(localization.t("common_cancel")).toBe("Cancel");
      });
    });
  });
});