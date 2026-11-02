/**
 * @jest-environment jsdom
 */

describe("telemetryClient", () => {
  const mockLoadAppInsights = jest.fn();
  const mockTrackPageView = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("does not load AppInsights when no instrumentation key is provided", async () => {
    jest.doMock("../../config/config", () => ({
      config: {
        AppInsightsInstrumentKey: "",
      },
    }));

    jest.doMock("@microsoft/applicationinsights-web", () => ({
      ApplicationInsights: jest.fn().mockImplementation(() => ({
        loadAppInsights: mockLoadAppInsights,
        trackPageView: mockTrackPageView,
      })),
    }));

    jest.doMock("@microsoft/applicationinsights-react-js", () => ({
      ReactPlugin: jest.fn().mockImplementation(() => ({
        identifier: "ReactPlugin",
      })),
    }));

    const { appInsights } = await import("../telemetryClient");

    expect(appInsights).toBeDefined();
    expect(mockLoadAppInsights).not.toHaveBeenCalled();
    expect(mockTrackPageView).not.toHaveBeenCalled();
  });

  it("loads AppInsights when a valid instrumentation key is provided", async () => {
    jest.doMock("../../config/config", () => ({
      config: {
        AppInsightsInstrumentKey: "valid-instrumentation-key",
      },
    }));

    jest.doMock("@microsoft/applicationinsights-web", () => ({
      ApplicationInsights: jest.fn().mockImplementation(() => ({
        loadAppInsights: mockLoadAppInsights,
        trackPageView: mockTrackPageView,
      })),
    }));

    jest.doMock("@microsoft/applicationinsights-react-js", () => ({
      ReactPlugin: jest.fn().mockImplementation(() => ({
        identifier: "ReactPlugin",
      })),
    }));

    const { appInsights } = await import("../telemetryClient");

    expect(appInsights).toBeDefined();
    expect(mockLoadAppInsights).toHaveBeenCalled();
    expect(mockTrackPageView).toHaveBeenCalled();
  });

  it("exports TelemetryExceptions with expected values", async () => {
    jest.doMock("../../config/config", () => ({
      config: {
        AppInsightsInstrumentKey: "",
      },
    }));

    jest.doMock("@microsoft/applicationinsights-web", () => ({
      ApplicationInsights: jest.fn().mockImplementation(() => ({
        loadAppInsights: mockLoadAppInsights,
        trackPageView: mockTrackPageView,
      })),
    }));

    jest.doMock("@microsoft/applicationinsights-react-js", () => ({
      ReactPlugin: jest.fn().mockImplementation(() => ({
        identifier: "ReactPlugin",
      })),
    }));

    const { TelemetryExceptions } = await import("../telemetryClient");

    expect(TelemetryExceptions.BoardsNotFoundForTeam).toBe("Feedback boards not found for team");
    expect(TelemetryExceptions.CurrentTeamIterationNotFound).toBe("Current iteration does not exist");
    expect(TelemetryExceptions.FeedbackItemsNotFoundForBoard).toBe("Feedback items not found for board");
  });

  it("exports TelemetryEvents with expected values", async () => {
    jest.doMock("../../config/config", () => ({
      config: {
        AppInsightsInstrumentKey: "",
      },
    }));

    jest.doMock("@microsoft/applicationinsights-web", () => ({
      ApplicationInsights: jest.fn().mockImplementation(() => ({
        loadAppInsights: mockLoadAppInsights,
        trackPageView: mockTrackPageView,
      })),
    }));

    jest.doMock("@microsoft/applicationinsights-react-js", () => ({
      ReactPlugin: jest.fn().mockImplementation(() => ({
        identifier: "ReactPlugin",
      })),
    }));

    const { TelemetryEvents } = await import("../telemetryClient");

    expect(TelemetryEvents.WorkItemCreated).toBe("Work item created");
    expect(TelemetryEvents.FeedbackBoardCreated).toBe("Feedback board created");
    expect(TelemetryEvents.ExtensionLaunched).toBe("Extension launched");
  });

  it("exports reactPlugin", async () => {
    jest.doMock("../../config/config", () => ({
      config: {
        AppInsightsInstrumentKey: "",
      },
    }));

    jest.doMock("@microsoft/applicationinsights-web", () => ({
      ApplicationInsights: jest.fn().mockImplementation(() => ({
        loadAppInsights: mockLoadAppInsights,
        trackPageView: mockTrackPageView,
      })),
    }));

    jest.doMock("@microsoft/applicationinsights-react-js", () => ({
      ReactPlugin: jest.fn().mockImplementation(() => ({
        identifier: "ReactPlugin",
      })),
    }));

    const { reactPlugin } = await import("../telemetryClient");

    expect(reactPlugin).toBeDefined();
    expect(reactPlugin.identifier).toBe("ReactPlugin");
  });
});
