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

  const setupCommonMocks = (options?: { contributionId?: string; initError?: Error; hostedAzureDevOps?: boolean; projectId?: string }) => {
    const renderMock = jest.fn();
    const createRootMock = jest.fn(() => ({ render: renderMock }));
    const feedbackBoardContainerMock = jest.fn((): null => null);
    const sprintRetrospectivePanelMock = jest.fn((): null => null);
    const contributionId = options?.contributionId ?? "ms-devlabs.team-retrospectives.home";
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
    jest.doMock("../components/sprintRetrospectivePanel", () => ({
      __esModule: true,
      default: sprintRetrospectivePanelMock,
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
      getContributionId: jest.fn(() => contributionId),
    }));

    return {
      createRootMock,
      renderMock,
      feedbackBoardContainerMock,
      sprintRetrospectivePanelMock,
    };
  };

  it("renders the sprint retrospective panel for the backlog pane contribution", async () => {
    const mocks = setupCommonMocks({ contributionId: "ms-devlabs.team-retrospectives.iteration-backlog-pane" });

    jest.isolateModules(() => {
      require("../index");
    });
    await flushPromises();

    expect(mocks.createRootMock).toHaveBeenCalledWith(document.getElementById("root"));
    const renderedTree = mocks.renderMock.mock.calls[0][0];
    expect(renderedTree.props.children.type).toBe(mocks.sprintRetrospectivePanelMock);
    expect(renderedTree.props.onError().props.children).toBe("We detected an error in the application");
  });

  it("renders the main feedback board container for the hub contribution", async () => {
    const mocks = setupCommonMocks({ contributionId: "ms-devlabs.team-retrospectives.home", hostedAzureDevOps: false, projectId: "project-42" });

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