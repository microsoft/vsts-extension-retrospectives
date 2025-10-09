import { config } from "../config";

describe("config", () => {
  it("should return the app configuration", () => {
    expect(config).toBeDefined();
  });
  it("should have the 'CollaborationStateServiceUrl' property", () => {
    expect(config.CollaborationStateServiceUrl).toBeDefined();
  });
  it("should have the 'AppInsightsInstrumentKey' property", () => {
    expect(config.AppInsightsInstrumentKey).toBeDefined();
  });
  it("should have the 'CurrentEnvironment' property", () => {
    expect(config.CurrentEnvironment).toBeDefined();
  });
});
