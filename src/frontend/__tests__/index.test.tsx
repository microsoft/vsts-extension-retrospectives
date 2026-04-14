import React from "react";

const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe("frontend index entrypoint", () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
  });

  const setupCommonMocks = (options?: { initError?: Error; hostedAzureDevOps?: boolean; projectId?: string }) => {
    const renderMock = jest.fn();
    const createRootMock = jest.fn(() => ({ render: renderMock }));
    const feedbackBoardContainerMock = jest.fn((): null => null);
    const hostedAzureDevOps = options?.hostedAzureDevOps ?? true;
    const projectId = options?.projectId ?? "project-1";

    jest.doMock("react-dom/client", () => ({
      createRoot: createRootMock,
    }));
    jest.doMock("@microsoft/applicationinsights-react-js", () => ({
      AppInsightsErrorBoundary: ({ children }: { children: React.ReactNode }) => React.createElement("mock-boundary", null, children),
    }));
    jest.doMock("../components/feedbackBoardContainer", () => ({
      __esModule: true,
      default: feedbackBoardContainerMock,
    }));
    jest.doMock("../utilities/azureDevOpsContextHelper", () => ({
      isHostedAzureDevOps: jest.fn(() => Promise.resolve(hostedAzureDevOps)),
    }));
    jest.doMock("../utilities/servicesHelper", () => ({
      getProjectId: jest.fn(() => Promise.resolve(projectId)),
    }));
    jest.doMock("../utilities/telemetryClient", () => ({
      reactPlugin: {},
    }));
    jest.doMock("azure-devops-extension-sdk", () => ({
      init: jest.fn(() => (options?.initError ? Promise.reject(options.initError) : Promise.resolve())),
    }));

    return {
      createRootMock,
      renderMock,
      feedbackBoardContainerMock,
    };
  };

  it("renders the main feedback board container for the hub contribution", async () => {
    const mocks = setupCommonMocks({ hostedAzureDevOps: false, projectId: "project-42" });

    jest.isolateModules(() => {
      require("../index");
    });
    await flushPromises();

    const renderedTree = mocks.renderMock.mock.calls[0][0];
    expect(renderedTree.props.children.type).toBe(mocks.feedbackBoardContainerMock);
    expect(renderedTree.props.children.props).toEqual({
      isHostedAzureDevOps: false,
      projectId: "project-42",
    });

    const errorFallback = renderedTree.props.onError();
    expect(errorFallback.type).toBe("h1");
    expect(errorFallback.props.children).toBe("We detected an error in the application");
  });

  it("renders the initialization fallback when SDK initialization fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    setupCommonMocks({ initError: new Error("init failed") });

    jest.isolateModules(() => {
      require("../index");
    });
    await flushPromises();

    expect(document.getElementById("root")?.textContent).toContain("Unable to load Retrospectives");
    expect(document.getElementById("root")?.textContent).toContain("The extension failed to initialize.");
    consoleErrorSpy.mockRestore();
  });

  it("does not throw when initialization fails and no root element is present", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    document.body.innerHTML = "";
    setupCommonMocks({ initError: new Error("init failed") });

    jest.isolateModules(() => {
      require("../index");
    });
    await flushPromises();

    expect(document.getElementById("root")).toBeNull();
    consoleErrorSpy.mockRestore();
  });
});