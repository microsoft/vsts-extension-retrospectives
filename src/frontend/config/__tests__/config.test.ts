import { config } from "../config";

describe("config", () => {
  it("should return the app configuration", () => {
    expect(config).toBeDefined();
  });
  it("should have the 'AppInsightsInstrumentKey' property", () => {
    expect(config.AppInsightsInstrumentKey).toBeDefined();
  });
  it("should have the 'CurrentEnvironment' property", () => {
    expect(config.CurrentEnvironment).toBeDefined();
  });

  describe("getConfiguration warnings", () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      // Restore original env vars
      jest.resetModules();
    });

    it("should warn when APP_INSIGHTS_INSTRUMENTATION_KEY is missing", () => {
      // Save original value
      const originalKey = process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY;

      // Remove the env var
      delete process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY;

      // Force re-import to trigger getConfiguration again
      jest.resetModules();
      require("../config");

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("missing Application Insights Instrumentation key"));

      // Restore
      if (originalKey) {
        process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY = originalKey;
      }
    });

    it("does not warn when required env vars are set", () => {
      const originalKey = process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY;

      process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY = "ai-key";

      jest.resetModules();
      const freshConfig = require("../config");

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(freshConfig.config.AppInsightsInstrumentKey).toBe("ai-key");

      if (originalKey) {
        process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY = originalKey;
      } else {
        delete process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY;
      }
    });
  });
});
