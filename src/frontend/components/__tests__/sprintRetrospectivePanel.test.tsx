import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SprintRetrospectivePanel from "../sprintRetrospectivePanel";
import BoardDataService from "../../dal/boardDataService";
import { workService } from "../../dal/azureDevOpsWorkService";
import { getBoardUrl } from "../../utilities/boardUrlHelper";
import { appInsights } from "../../utilities/telemetryClient";
import {
  createOrGetSprintRetrospectiveBoard,
  findSprintRetrospectiveBoard,
  getCurrentIteration,
  resolveIterationFromConfiguration,
  sortIterationsForRetrospectives,
} from "../../utilities/sprintRetrospectiveHelper";
import { WorkflowPhase } from "../../interfaces/workItem";
import { MockSDK, MockSDKControls } from "../__mocks__/azure-devops-extension-sdk/sdk";

jest.mock("../../dal/boardDataService");
jest.mock("../../dal/azureDevOpsWorkService", () => ({
  workService: {
    getIterations: jest.fn(),
  },
}));
jest.mock("../../utilities/boardUrlHelper", () => ({
  getBoardUrl: jest.fn(),
}));
jest.mock("../../utilities/telemetryClient", () => ({
  appInsights: {
    trackException: jest.fn(),
  },
}));
jest.mock("../../utilities/sprintRetrospectiveHelper", () => ({
  createOrGetSprintRetrospectiveBoard: jest.fn(),
  findSprintRetrospectiveBoard: jest.fn(),
  getCurrentIteration: jest.fn(),
  resolveIterationFromConfiguration: jest.fn(),
  sortIterationsForRetrospectives: jest.fn(),
}));

describe("SprintRetrospectivePanel", () => {
  const iteration = {
    id: "iteration-1",
    name: "Sprint 12",
    path: "Project\\Sprint 12",
    attributes: {
      startDate: new Date("2024-02-05T00:00:00.000Z"),
      finishDate: new Date("2024-02-18T00:00:00.000Z"),
      timeFrame: 1,
    },
  } as any;

  const existingBoard = {
    id: "board-1",
    title: "Sprint 12 Retrospective",
    teamId: "team-1",
  } as any;

  const boardDataServiceMock = BoardDataService as jest.Mocked<typeof BoardDataService>;
  const getIterationsMock = workService.getIterations as jest.MockedFunction<typeof workService.getIterations>;
  const getBoardUrlMock = getBoardUrl as jest.MockedFunction<typeof getBoardUrl>;
  const trackExceptionMock = appInsights.trackException as jest.MockedFunction<typeof appInsights.trackException>;
  const createOrGetMock = createOrGetSprintRetrospectiveBoard as jest.MockedFunction<typeof createOrGetSprintRetrospectiveBoard>;
  const findBoardMock = findSprintRetrospectiveBoard as jest.MockedFunction<typeof findSprintRetrospectiveBoard>;
  const getCurrentIterationMock = getCurrentIteration as jest.MockedFunction<typeof getCurrentIteration>;
  const resolveIterationMock = resolveIterationFromConfiguration as jest.MockedFunction<typeof resolveIterationFromConfiguration>;
  const sortIterationsMock = sortIterationsForRetrospectives as jest.MockedFunction<typeof sortIterationsForRetrospectives>;

  beforeEach(() => {
    jest.clearAllMocks();
    MockSDKControls.reset();
    MockSDKControls.setConfiguration({ team: { id: "team-1", name: "Team Alpha" } });

    getIterationsMock.mockResolvedValue([iteration]);
    sortIterationsMock.mockImplementation(iterations => iterations);
    resolveIterationMock.mockReturnValue(iteration);
    getCurrentIterationMock.mockReturnValue(iteration);
    boardDataServiceMock.getBoardsForTeam?.mockResolvedValue([]);
    findBoardMock.mockReturnValue(undefined);
    getBoardUrlMock.mockResolvedValue("https://example.com/board");
  });

  it("loads sprint information and shows the open button when a matching board already exists", async () => {
    const registerSpy = jest.spyOn(MockSDK, "register");
    const unregisterSpy = jest.spyOn(MockSDK, "unregister");
    const resizeSpy = jest.spyOn(MockSDK, "resize");
    boardDataServiceMock.getBoardsForTeam?.mockResolvedValue([existingBoard]);
    findBoardMock.mockReturnValue(existingBoard);

    const { unmount } = render(<SprintRetrospectivePanel />);

    expect(await screen.findByText("Sprint retrospective")).toBeInTheDocument();
    expect(screen.getByText("Existing retrospective: Sprint 12 Retrospective")).toBeInTheDocument();
    expect(screen.getByText("Team Alpha")).toBeInTheDocument();
    expect(screen.getByText("Sprint 12")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open retrospective board" })).toHaveAttribute("href", "https://example.com/board");
    expect(screen.queryByRole("button", { name: "Create retrospective board" })).not.toBeInTheDocument();
    expect(registerSpy).toHaveBeenCalledWith("sprintRetrospectivePanelObject", expect.any(Object));
    expect(resizeSpy).toHaveBeenCalled();

    unmount();
    expect(unregisterSpy).toHaveBeenCalledWith("sprintRetrospectivePanelObject");
  });

  it("falls back to the current iteration when the host configuration does not resolve one", async () => {
    resolveIterationMock.mockReturnValue(undefined);
    render(<SprintRetrospectivePanel />);

    expect(await screen.findByRole("button", { name: "Create retrospective board" })).toBeInTheDocument();
    expect(getCurrentIterationMock).toHaveBeenCalledWith([iteration]);
  });

  it("creates a retrospective board from the panel when one does not already exist", async () => {
    createOrGetMock.mockResolvedValue({ board: existingBoard, wasCreated: true });

    render(<SprintRetrospectivePanel />);

    fireEvent.click(await screen.findByRole("button", { name: "Create retrospective board" }));

    await waitFor(() => {
      expect(createOrGetMock).toHaveBeenCalledWith({ teamId: "team-1", iteration });
    });
    expect(await screen.findByRole("link", { name: "Open retrospective board" })).toHaveAttribute("href", "https://example.com/board");
    expect(screen.getByText("Opened retrospective Sprint 12 Retrospective for sprint Sprint 12.")).toBeInTheDocument();
    expect(getBoardUrlMock).toHaveBeenLastCalledWith("team-1", "board-1", WorkflowPhase.Collect);
  });

  it("shows an error when sprint context cannot be resolved", async () => {
    MockSDKControls.setConfiguration({});

    render(<SprintRetrospectivePanel />);

    expect(await screen.findByText("We could not load sprint context for this page.")).toBeInTheDocument();
    expect(trackExceptionMock).toHaveBeenCalledWith(expect.any(Error), { action: "loadSprintRetrospectivePanel" });
  });

  it("shows an error when creating the retrospective board fails", async () => {
    createOrGetMock.mockRejectedValue(new Error("create failed"));

    render(<SprintRetrospectivePanel />);

    fireEvent.click(await screen.findByRole("button", { name: "Create retrospective board" }));

    expect(await screen.findByText("We could not create a retrospective for sprint Sprint 12.")).toBeInTheDocument();
    expect(trackExceptionMock).toHaveBeenCalledWith(expect.any(Error), { action: "createSprintRetrospectiveFromPanel", teamId: "team-1", iterationId: "iteration-1" });
  });

  it("renders the missing-dates fallback text when sprint dates are unavailable", async () => {
    const noDateIteration = {
      ...iteration,
      attributes: {
        startDate: undefined,
        finishDate: undefined,
        timeFrame: 1,
      },
    };
    resolveIterationMock.mockReturnValue(noDateIteration);
    getCurrentIterationMock.mockReturnValue(noDateIteration);

    render(<SprintRetrospectivePanel />);

    expect(await screen.findByText("Sprint dates are not configured.")).toBeInTheDocument();
  });
});