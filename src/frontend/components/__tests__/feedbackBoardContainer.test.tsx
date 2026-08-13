import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { mocked } from "jest-mock";
import { TeamMember } from "azure-devops-extension-api/WebApi";
import type { WebApiTeam } from "azure-devops-extension-api/Core";
import { FeedbackBoardContainer, deduplicateTeamMembers } from "../feedbackBoardContainer";
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions, IFeedbackItemDocument } from "../../interfaces/feedback";
import { WorkflowPhase } from "../../interfaces/workItem";
import { IdentityRef } from "azure-devops-extension-api/WebApi";
import { userDataService } from "../../dal/userDataService";
import { itemDataService } from "../../dal/itemDataService";
import BoardDataService from "../../dal/boardDataService";
import { azureDevOpsCoreService } from "../../dal/azureDevOpsCoreService";
import { workItemService } from "../../dal/azureDevOpsWorkItemService";
import { getConfiguration, getService } from "azure-devops-extension-sdk";
import { getBoardUrl } from "../../utilities/boardUrlHelper";
import { shareBoardHelper } from "../../utilities/shareBoardHelper";
import { copyToClipboard } from "../../utilities/clipboardHelper";
import { setLocale } from "../../utilities/localization";
import { reflectBackendService } from "../../dal/reflectBackendService";
import { workService } from "../../dal/azureDevOpsWorkService";
import { teamSettingsService } from "../../dal/teamSettingsService";

const mockUserIdentity = {
  id: "mock-user-id",
  displayName: "Mock User",
  uniqueName: "mock-user@example.com",
  imageUrl: "mock-image-url",
  _links: {
    avatar: {
      href: "mock-image-url",
    },
  },
};

jest.mock("../../utilities/userIdentityHelper", () => ({
  getUserIdentity: () => mockUserIdentity,
  obfuscateUserId: () => "encrypted-data",
  deobfuscateUserId: (id: string) => id,
  encrypt: () => "encrypted-data",
}));

// Mock Web Audio API globally
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  type: "sine" as OscillatorType,
  frequency: { value: 0 },
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
};

const createMockOscillator = jest.fn(() => mockOscillator);
const createMockGain = jest.fn(() => mockGainNode);

const mockAudioContext = {
  createOscillator: createMockOscillator,
  createGain: createMockGain,
  currentTime: 0,
  destination: {},
};

(global as any).AudioContext = jest.fn(() => ({
  createOscillator: createMockOscillator,
  createGain: createMockGain,
  currentTime: 0,
  destination: {},
}));
(global as any).webkitAudioContext = jest.fn(() => ({
  createOscillator: createMockOscillator,
  createGain: createMockGain,
  currentTime: 0,
  destination: {},
}));
(window as any).AudioContext = (global as any).AudioContext;
(window as any).webkitAudioContext = (global as any).webkitAudioContext;

jest.mock("../../utilities/telemetryClient", () => ({
  appInsights: {
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
  reactPlugin: {},
  TelemetryEvents: {
    TeamSelectionChanged: "TeamSelectionChanged",
    FeedbackBoardSelectionChanged: "FeedbackBoardSelectionChanged",
    TeamAssessmentHistoryViewed: "TeamAssessmentHistoryViewed",
    WorkflowPhaseBroadcast: "WorkflowPhaseBroadcast",
  },
  TelemetryExceptions: {},
}));

jest.mock("../../dal/boardDataService");
jest.mock("../../dal/reflectBackendService");
jest.mock("../../dal/azureDevOpsCoreService");
jest.mock("../../dal/azureDevOpsWorkItemService");
jest.mock("../../dal/userDataService");
jest.mock("../../dal/itemDataService");
jest.mock("../../dal/teamSettingsService", () => ({
  teamSettingsService: {
    getAllowedActionItemWorkItemTypeNames: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock("../../dal/azureDevOpsWorkService", () => ({
  workService: {
    getIterations: jest.fn(),
    getRequirementBacklogWorkItemTypeNames: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock("../../utilities/sprintRetrospectiveHelper", () => ({
  buildSprintRetrospectiveTitle: jest.fn((iteration: { name: string }) => `${iteration.name} Retrospective`),
  getCurrentIteration: jest.fn(),
}));
jest.mock("../boardSummaryTable", () => () => <div data-testid="board-summary-table" />);
jest.mock("../effectivenessMeasurementRow", () => ({ questionId }: { questionId: number }) => <div data-testid={`effectiveness-row-${questionId}`} />);
jest.mock("../../utilities/boardUrlHelper", () => ({
  getBoardUrl: jest.fn(() => Promise.resolve("https://example.com/board")),
}));
jest.mock("../../utilities/shareBoardHelper", () => ({
  shareBoardHelper: {
    generateEmailText: jest.fn(() => Promise.resolve("mock email body")),
  },
}));

jest.mock("../feedbackBoard", () => {
  const MockFeedbackBoard = () => <div data-testid="feedback-board" />;
  MockFeedbackBoard.displayName = "MockFeedbackBoard";
  return MockFeedbackBoard;
});

jest.mock("../../utilities/servicesHelper", () => ({
  getLocationService: jest.fn(() => ({
    getResourceAreaLocation: jest.fn(() => Promise.resolve("mock-location")),
  })),
  getCoreService: jest.fn(() => ({
    getTeams: jest.fn(() => Promise.resolve([])),
  })),
  getHostAuthority: jest.fn(() => Promise.resolve("mock-host")),
  getAccessToken: jest.fn(() => Promise.resolve("mock-token")),
  getProjectId: jest.fn(() => Promise.resolve("project-1")),
  getHostUrl: jest.fn(() => Promise.resolve("https://mock-host")),
}));

jest.mock("../../utilities/azureDevOpsContextHelper", () => ({
  getHostUrl: jest.fn(() => Promise.resolve("https://mock-host")),
  getCurrentUser: jest.fn(() => Promise.resolve({ id: "mock-user" })),
  isHostedAzureDevOps: jest.fn(() => Promise.resolve(true)),
  getProjectId: jest.fn(() => Promise.resolve("mock-project-id")),
}));

jest.mock("azure-devops-extension-sdk", () => ({
  getService: jest.fn(),
  getConfiguration: jest.fn(() => ({})),
  init: jest.fn(),
  ready: jest.fn(),
  getUser: jest.fn(() => ({
    id: "mock-user-id",
    displayName: "Mock User",
    name: "mock-user@example.com",
    imageUrl: "mock-image-url",
  })),
}));

jest.mock("../../utilities/clipboardHelper", () => ({
  copyToClipboard: jest.fn(),
}));

// Mock audioHelper module
const mockPlayStartChime = jest.fn().mockReturnValue(true);
const mockPlayStopChime = jest.fn().mockReturnValue(true);
jest.mock("../../utilities/audioHelper", () => ({
  playStartChime: (...args: unknown[]) => mockPlayStartChime(...args),
  playStopChime: (...args: unknown[]) => mockPlayStopChime(...args),
  isAudioSupported: jest.fn().mockReturnValue(true),
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: jest.fn((plugin, component) => component),
  useTrackMetric: () => jest.fn(),
}));

const getTeamIterationsMock = () => {
  return [
    mocked({
      attributes: mocked({
        finishDate: new Date(),
        startDate: new Date(),
        timeFrame: 1,
      }),
      id: "iterationId",
      name: "iteration name",
      path: "default path",
      _links: [],
      url: "https://teamfieldvaluesurl",
    }),
  ];
};

const getTeamFieldValuesMock = () => {
  return [
    mocked({
      defaultValue: "default field value",
      field: mocked({
        referenceName: "default reference name",
        url: "https://fieldurl",
      }),
      values: [
        mocked({
          includeChildren: false,
          value: "default team field value",
        }),
      ],
      links: [],
      url: "https://teamfieldvaluesurl",
    }),
  ];
};

jest.mock("../feedbackBoardMetadataForm", () => () => <div data-testid="metadata-form" />);
jest.mock("azure-devops-extension-api/Work/WorkClient", () => {
  return {
    getTeamIterations: getTeamIterationsMock,
    getTeamFieldValues: getTeamFieldValuesMock,
  };
});

type FeedbackBoardContainerTestProps = React.ComponentProps<typeof FeedbackBoardContainer>;

const baseContainerProps: FeedbackBoardContainerTestProps = {
  isHostedAzureDevOps: false,
  projectId: "1",
};

describe("Feedback Board Container ", () => {
  it("can be rendered without content.", () => {
    render(<FeedbackBoardContainer {...baseContainerProps} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});

const baseIdentity = {
  directoryAlias: "",
  inactive: false,
  isAadIdentity: false,
  isContainer: false,
  isDeletedInOrigin: false,
  isMru: false,
  mail: "",
  mailNickname: "",
  originDirectory: "",
  originId: "",
  subjectDescriptor: "",
  id: "",
  displayName: "",
  uniqueName: "",
  imageUrl: "",
  profileUrl: "",
  _links: {},
  descriptor: "",
  url: "",
};

describe("deduplicateTeamMembers", () => {
  it("deduplicates users and favors admin status per user", () => {
    const team1Members: TeamMember[] = [
      {
        identity: { ...baseIdentity, id: "user-1", displayName: "User 1", uniqueName: "user1", imageUrl: "" },
        isTeamAdmin: true,
      },
      {
        identity: { ...baseIdentity, id: "user-2", displayName: "User 2", uniqueName: "user2", imageUrl: "" },
        isTeamAdmin: false,
      },
    ];
    const team2Members: TeamMember[] = [
      {
        identity: { ...baseIdentity, id: "user-1", displayName: "User 1", uniqueName: "user1", imageUrl: "" },
        isTeamAdmin: false,
      },
      {
        identity: { ...baseIdentity, id: "user-2", displayName: "User 2", uniqueName: "user2", imageUrl: "" },
        isTeamAdmin: true,
      },
    ];

    const deduped = deduplicateTeamMembers([...team1Members, ...team2Members]);
    expect(deduped).toHaveLength(2);

    const user1 = deduped.find((m: TeamMember) => m.identity.id === "user-1");
    expect(user1?.isTeamAdmin).toBe(true);

    const user2 = deduped.find((m: TeamMember) => m.identity.id === "user-2");
    expect(user2?.isTeamAdmin).toBe(true);
  });

  it("returns first member when none are admins", () => {
    const members: TeamMember[] = [
      {
        identity: { ...baseIdentity, id: "user-1", displayName: "User 1", uniqueName: "user1", imageUrl: "" },
        isTeamAdmin: false,
      },
      {
        identity: { ...baseIdentity, id: "user-1", displayName: "User 1 Duplicate", uniqueName: "user1", imageUrl: "" },
        isTeamAdmin: false,
      },
    ];

    const deduped = deduplicateTeamMembers(members);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].isTeamAdmin).toBe(false);
  });

  it("handles empty array", () => {
    const deduped = deduplicateTeamMembers([]);
    expect(deduped).toHaveLength(0);
  });
});

describe("FeedbackBoardContainer integration", () => {
  let props: FeedbackBoardContainerTestProps;

  const mockUserId = "user-1";
  const mockTeam = { id: "t1", name: "Team 1", projectName: "P", description: "", url: "" };
  const mockIdentity: IdentityRef = {
    ...baseIdentity,
    id: mockUserId,
    displayName: "User",
    uniqueName: "user1",
    imageUrl: "",
  };
  const mockPermissions: IFeedbackBoardDocumentPermissions = {
    Teams: [],
    Members: [],
  };
  const mockBoard: IFeedbackBoardDocument = {
    id: "b1",
    title: "Board 1",
    createdDate: new Date(),
    createdBy: mockIdentity,
    boardVoteCollection: {},
    isIncludeTeamEffectivenessMeasurement: false,
    shouldShowFeedbackAfterCollect: false,
    isAnonymous: false,
    permissions: mockPermissions,
    activePhase: WorkflowPhase.Collect,
    teamId: "t1",
    maxVotesPerUser: 5,
    teamEffectivenessMeasurementVoteCollection: [],
    columns: [],
  };

  beforeEach(() => {
    props = { isHostedAzureDevOps: false, projectId: "1" };
    mocked(getConfiguration).mockReturnValue({});
    mocked(workService.getRequirementBacklogWorkItemTypeNames).mockResolvedValue([]);
    mocked(teamSettingsService.getAllowedActionItemWorkItemTypeNames).mockResolvedValue([]);
  });

  it("renders main UI after loading", () => {
    const { container } = render(<FeedbackBoardContainer {...props} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("handles workflow phase change", () => {
    const { container } = render(<FeedbackBoardContainer {...props} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders main board view when fully initialized", () => {
    const { container } = render(<FeedbackBoardContainer {...props} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders with different workflow phases", () => {
    const { container } = render(<FeedbackBoardContainer {...props} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("handles component mount and unmount lifecycle", () => {
    const { container, unmount } = render(<FeedbackBoardContainer {...props} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    unmount();
    expect(container.firstChild).toBeNull();
  });

  it("initializes with correct default state", () => {
    const { container } = render(<FeedbackBoardContainer {...props} />);
    expect(container).toBeTruthy();
  });

  it("renders loading spinner when not initialized", () => {
    render(<FeedbackBoardContainer {...props} />);
    const spinner = screen.getByText("Loading...");
    expect(spinner).toBeInTheDocument();
  });

  it("supports keyboard navigation for view tabs and Board Actions", async () => {
    const user = userEvent.setup();

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([mockTeam as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(mockTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([mockBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(mockBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();

    const boardTab = screen.getByRole("tab", { name: "Board" });
    const historyTab = screen.getByRole("tab", { name: "History" });
    const boardSelector = screen.getByRole("combobox", { name: "Retrospective Board" });
    const boardActions = screen.getByLabelText("Board Actions Menu");

    boardTab.focus();
    await user.tab();
    expect(historyTab).toHaveFocus();
    await user.tab();
    expect(boardSelector).toHaveFocus();
    await user.tab();
    expect(boardActions).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(boardActions.closest("details")).toHaveAttribute("open");

    historyTab.focus();
    await user.keyboard("{Enter}");
    expect(historyTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("board-summary-table")).toBeInTheDocument();

    boardTab.focus();
    await user.keyboard(" ");
    expect(boardTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("feedback-board")).toBeInTheDocument();
  });

  it("lets the board owner move everyone to the selected phase", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    const ownerBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      createdBy: { ...mockIdentity, id: mockUserIdentity.id },
    };
    const groupBoard = { ...ownerBoard, activePhase: WorkflowPhase.Group };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(reflectBackendService.startConnection).mockResolvedValue(true);
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([mockTeam as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(mockTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([ownerBoard]);
    mocked(BoardDataService.updateActivePhase).mockResolvedValue(groupBoard);
    mocked(itemDataService.getBoardItem).mockResolvedValue(ownerBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Group" }));

    const moveEveryoneButton = screen.getByRole("button", { name: "Move everyone to Group" });
    expect(moveEveryoneButton).toBeEnabled();
    fireEvent.click(moveEveryoneButton);

    await waitFor(() => expect(BoardDataService.updateActivePhase).toHaveBeenCalledWith("t1", "b1", WorkflowPhase.Group));
    expect(reflectBackendService.broadcastUpdatedBoard).toHaveBeenCalledWith("t1", "b1");
    expect(await screen.findByText("Everyone was moved to Group.")).toBeInTheDocument();
  });

  it("searches feedback in all boards from the Board Actions menu", async () => {
    const firstBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      columns: [{ id: "good", title: "Good", accentColor: "#107c10" }],
    };
    const secondBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "b2",
      title: "Board 2",
      columns: [{ id: "risk", title: "Risks", accentColor: "#d83b01" }],
    };
    const archivedBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "b3",
      title: "Archived Board",
      isArchived: true,
    };
    const firstBoardFeedback: IFeedbackItemDocument = {
      id: "f1",
      boardId: "b1",
      title: "Keep the release calm",
      columnId: "good",
      originalColumnId: "good",
      upvotes: 0,
      voteCollection: {},
      createdDate: new Date("2024-01-01T00:00:00Z"),
      userIdRef: mockUserId,
      timerSecs: 0,
      timerState: false,
      timerId: null,
      groupIds: [],
      isGroupedCarouselItem: false,
    };
    const secondBoardFeedback: IFeedbackItemDocument = {
      ...firstBoardFeedback,
      id: "f2",
      boardId: "b2",
      title: "Fix release risk",
      columnId: "risk",
      originalColumnId: "risk",
    };
    const archivedBoardFeedback: IFeedbackItemDocument = {
      ...firstBoardFeedback,
      id: "f3",
      boardId: "b3",
      title: "Archived release insight",
    };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([mockTeam as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(mockTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([firstBoard, secondBoard, archivedBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(firstBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockImplementation(async boardId => {
      if (boardId === "b2") {
        return [secondBoardFeedback];
      }
      if (boardId === "b3") {
        return [archivedBoardFeedback];
      }
      return [firstBoardFeedback];
    });
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Board Actions Menu"));
    fireEvent.click(screen.getByText("Search all boards"));
    fireEvent.change(screen.getByPlaceholderText("Enter words to search"), { target: { value: "risk" } });

    const searchResultLink = await screen.findByRole("link", { name: /Fix release risk/ });
    expect(searchResultLink).toHaveAttribute("href", "#teamId=t1&boardId=b2&phase=Collect");
    expect(screen.getByText("Fix release risk")).toBeInTheDocument();
    expect(screen.getByText("Board 2 - Risks - Jan 1, 2024")).toBeInTheDocument();
    expect(screen.queryByText("Keep the release calm")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter words to search"), { target: { value: "archived" } });
    expect(await screen.findByText("No feedback found.")).toBeInTheDocument();
    expect(screen.queryByText("Archived release insight")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /include archived boards/i }));

    expect(await screen.findByText("Archived release insight")).toBeInTheDocument();
  });

  it("copies generated email summary content from the preview dialog", async () => {
    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(getBoardUrl).mockResolvedValue("https://example.com/board");
    mocked(shareBoardHelper.generateEmailText).mockResolvedValue("mock email body");
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([mockTeam as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(mockTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([mockBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(mockBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Board Actions Menu"));
    fireEvent.click(screen.getByText("Create email summary"));

    expect(await screen.findByLabelText("Email summary for retrospective")).toHaveValue("mock email body");

    fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));

    await waitFor(() => expect(copyToClipboard).toHaveBeenCalledWith("mock email body"));
  });

  it("shows all project teams in the team selector when enabled from settings", async () => {
    const otherTeam = { ...mockTeam, id: "t2", name: "Other Team" };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(azureDevOpsCoreService.getAllTeams).mockImplementation(async (_projectId, forCurrentUserOnly) =>
      forCurrentUserOnly ? [mockTeam as WebApiTeam] : [mockTeam as WebApiTeam, otherTeam as WebApiTeam],
    );
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(mockTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([mockBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(mockBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    const teamSelector = screen.getByRole("combobox", { name: "Team" });
    const teamSelectorTooltipId = teamSelector.getAttribute("aria-describedby");
    const teamSelectorTooltip = document.getElementById(teamSelectorTooltipId!)!;

    expect(teamSelectorTooltipId).toBe("team-selector-tooltip");
    expect(teamSelector).toHaveAttribute("interestFor", teamSelectorTooltipId);
    expect(teamSelector).toHaveAttribute("aria-describedby", teamSelectorTooltipId);
    expect(teamSelectorTooltip).toHaveAttribute("popover", "hint");
    expect(teamSelectorTooltip).toHaveClass("tooltip");
    expect(teamSelectorTooltip).toHaveTextContent("By default, you see only the teams you're in. You can enable all teams from the settings menu.");

    let isTooltipOpen = false;
    const showPopover = jest.fn(() => {
      isTooltipOpen = true;
    });
    const hidePopover = jest.fn(() => {
      isTooltipOpen = false;
    });
    const matchesSpy = jest.spyOn(teamSelectorTooltip, "matches").mockImplementation(selector => (selector === ":popover-open" ? isTooltipOpen : false));
    (teamSelectorTooltip as any).showPopover = showPopover;
    (teamSelectorTooltip as any).hidePopover = hidePopover;

    jest.useFakeTimers();
    try {
      fireEvent.pointerEnter(teamSelector);
      expect(showPopover).not.toHaveBeenCalled();

      jest.advanceTimersByTime(499);
      expect(showPopover).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(showPopover).toHaveBeenCalledWith({ source: teamSelector });

      fireEvent.pointerDown(teamSelector);
      expect(hidePopover).toHaveBeenCalledTimes(1);

      fireEvent.focus(teamSelector);
      fireEvent.click(teamSelector);
      jest.advanceTimersByTime(500);
      expect(showPopover).toHaveBeenCalledTimes(1);

      fireEvent.pointerEnter(teamSelector);
      jest.advanceTimersByTime(500);
      expect(showPopover).toHaveBeenCalledTimes(2);

      fireEvent.keyDown(teamSelector, { key: "ArrowDown" });
      expect(hidePopover).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
      matchesSpy.mockRestore();
    }

    expect(azureDevOpsCoreService.getAllTeams).toHaveBeenCalledWith("1", true);
    expect(azureDevOpsCoreService.getAllTeams).not.toHaveBeenCalledWith("1", false);
    expect(screen.getByRole("option", { name: "Team 1" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Other Team" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "User/Admin Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Show all teams" }));

    expect(azureDevOpsCoreService.getAllTeams).toHaveBeenCalledWith("1", false);
    expect(await screen.findByRole("option", { name: "Other Team" })).toBeInTheDocument();
  });

  it("keeps the selected team and board when switching to My Teams while on a member team", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    const defaultTeam = { ...mockTeam, id: "z-default", name: "Zebra Team" };
    const memberTeam = { ...mockTeam, id: "a-member", name: "Alpha Team" };
    const outsideTeam = { ...mockTeam, id: "outside-team", name: "Outside Team" };
    const defaultBoard = { ...mockBoard, id: "default-board", title: "Default Board", teamId: defaultTeam.id };
    const memberBoard = { ...mockBoard, id: "member-board", title: "Member Board", teamId: memberTeam.id };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(azureDevOpsCoreService.getAllTeams).mockImplementation(async (_projectId, forCurrentUserOnly) =>
      forCurrentUserOnly ? [memberTeam as WebApiTeam, defaultTeam as WebApiTeam] : [memberTeam as WebApiTeam, outsideTeam as WebApiTeam, defaultTeam as WebApiTeam],
    );
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(defaultTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockImplementation(async teamId =>
      teamId === defaultTeam.id ? [defaultBoard] : teamId === memberTeam.id ? [memberBoard] : [],
    );
    mocked(itemDataService.getBoardItem).mockResolvedValue(memberBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByText("Default Board")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "User/Admin Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Show all teams" }));
    expect(await screen.findByRole("option", { name: "Outside Team" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Team" }), { target: { value: memberTeam.id } });
    expect(await screen.findByText("Member Board")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "User/Admin Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Show my teams" }));

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Team" })).toHaveValue(memberTeam.id));
    expect(screen.getByText("Member Board")).toBeInTheDocument();
  });

  it("keeps the selected non-member team and board available when switching to My Teams", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    const defaultTeam = { ...mockTeam, id: "z-default", name: "Zebra Team" };
    const firstMemberTeam = { ...mockTeam, id: "a-member", name: "Alpha Team" };
    const outsideTeam = { ...mockTeam, id: "outside-team", name: "Outside Team" };
    const defaultBoard = { ...mockBoard, id: "default-board", title: "Default Board", teamId: defaultTeam.id };
    const firstMemberBoard = { ...mockBoard, id: "member-board", title: "Member Board", teamId: firstMemberTeam.id };
    const outsideBoard = { ...mockBoard, id: "outside-board", title: "Outside Board", teamId: outsideTeam.id };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(azureDevOpsCoreService.getAllTeams).mockImplementation(async (_projectId, forCurrentUserOnly) =>
      forCurrentUserOnly ? [firstMemberTeam as WebApiTeam, defaultTeam as WebApiTeam] : [firstMemberTeam as WebApiTeam, outsideTeam as WebApiTeam, defaultTeam as WebApiTeam],
    );
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(defaultTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockImplementation(async teamId =>
      teamId === defaultTeam.id ? [defaultBoard] : teamId === firstMemberTeam.id ? [firstMemberBoard] : [outsideBoard],
    );
    mocked(itemDataService.getBoardItem).mockResolvedValue(defaultBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByText("Default Board")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "User/Admin Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Show all teams" }));
    expect(await screen.findByRole("option", { name: "Outside Team" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Team" }), { target: { value: outsideTeam.id } });
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Team" })).toHaveValue(outsideTeam.id));
  expect(screen.getByText("Outside Board")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "User/Admin Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Show my teams" }));

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Team" })).toHaveValue(outsideTeam.id));
    expect(screen.getByRole("option", { name: "Outside Team" })).toBeInTheDocument();
    expect(screen.getByText("Outside Board")).toBeInTheDocument();
  });

  it("configures a custom tooltip for Team Assessment", async () => {
    const assessmentBoard = { ...mockBoard, isIncludeTeamEffectivenessMeasurement: true };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([mockTeam as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(mockTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([assessmentBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(assessmentBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    setLocale("es-ES");
    const { unmount } = render(<FeedbackBoardContainer {...props} />);

    try {
      const teamAssessmentButton = await screen.findByRole("button", { name: "Evaluacion del equipo" });
      const tooltipId = teamAssessmentButton.getAttribute("aria-describedby");
      const tooltip = document.getElementById(tooltipId!)!;

      expect(tooltipId).toBe("team-assessment-tooltip");
      expect(teamAssessmentButton).toHaveAttribute("interestFor", tooltipId);
      expect(tooltip).toHaveAttribute("popover", "hint");
      expect(tooltip).toHaveClass("tooltip");
      expect(tooltip).toHaveTextContent("Evaluacion del equipo");
    } finally {
      unmount();
      setLocale("en-US");
    }
  });

  it("configures a custom tooltip for Focus Mode", async () => {
    const actBoard = { ...mockBoard, activePhase: WorkflowPhase.Act };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([mockTeam as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(mockTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([actBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(actBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    setLocale("es-ES");
    const { unmount } = render(<FeedbackBoardContainer {...props} />);

    try {
      const focusModeButton = await screen.findByRole("button", { name: "Modo de enfoque" });
      const tooltipId = focusModeButton.getAttribute("aria-describedby");
      const tooltip = document.getElementById(tooltipId!)!;

      expect(focusModeButton).toHaveTextContent("Modo de enfoque");
      expect(focusModeButton).not.toHaveAttribute("title");
      expect(tooltipId).toBe("focus-mode-tooltip");
      expect(focusModeButton).toHaveAttribute("interestFor", tooltipId);
      expect(tooltip).toHaveAttribute("popover", "hint");
      expect(tooltip).toHaveClass("tooltip");
      expect(tooltip).toHaveTextContent("El modo de enfoque permite que tu equipo se centre en un elemento de feedback a la vez. Pruebalo!");

      fireEvent.click(focusModeButton);

      expect(await screen.findByRole("dialog", { name: "Modo de enfoque" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Modo de enfoque" })).toBeInTheDocument();
    } finally {
      unmount();
      setLocale("en-US");
    }
  });

  it("falls back to the default team when current user team lookup fails", async () => {
    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(azureDevOpsCoreService.getAllTeams).mockRejectedValueOnce(new Error("Cannot load current user teams"));
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(mockTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([mockBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(mockBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Team 1" })).toBeInTheDocument();
    expect(screen.queryByText("We are unable to retrieve the list of teams for this project. Try reloading the page.")).not.toBeInTheDocument();
  });

  it("loads a board from the URL team when team list lookups fail", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue("#teamId=t1&boardId=b1&phase=Collect"), setHash: jest.fn() } as any);
    mocked(azureDevOpsCoreService.getAllTeams).mockRejectedValue(new Error("Cannot load teams"));
    mocked(azureDevOpsCoreService.getDefaultTeam).mockRejectedValue(new Error("Cannot load default team"));
    mocked(azureDevOpsCoreService.getTeam).mockResolvedValue(mockTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([mockBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(mockBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    expect(azureDevOpsCoreService.getAllTeams).toHaveBeenCalledWith("1", true);
    expect(azureDevOpsCoreService.getTeam).toHaveBeenCalledWith("1", "t1");
    expect(screen.queryByText("We are unable to retrieve the list of teams for this project. Try reloading the page.")).not.toBeInTheDocument();
  });

  it("loads a board from the URL team when browser local-network restrictions block team REST lookups", async () => {
    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue("#teamId=t1&boardId=b1&phase=Collect"), setHash: jest.fn() } as any);
    mocked(azureDevOpsCoreService.getAllTeams).mockRejectedValue(new Error("Permission was denied for this request to access the local address space"));
    mocked(azureDevOpsCoreService.getDefaultTeam).mockRejectedValue(new Error("Permission was denied for this request to access the local address space"));
    mocked(azureDevOpsCoreService.getTeam).mockResolvedValue(null);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([mockBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(mockBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    expect(azureDevOpsCoreService.getAllTeams).not.toHaveBeenCalled();
    expect(azureDevOpsCoreService.getDefaultTeam).not.toHaveBeenCalled();
    expect(azureDevOpsCoreService.getTeam).not.toHaveBeenCalled();
    expect(BoardDataService.getBoardsForTeam).toHaveBeenCalledWith("t1");
    expect(screen.getByRole("option", { name: "Selected team" })).toBeInTheDocument();
    expect(screen.queryByText("We are unable to retrieve the list of teams for this project. Try reloading the page.")).not.toBeInTheDocument();
  });

  it("loads a board from the configured team when browser local-network restrictions block team REST lookups", async () => {
    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(getConfiguration).mockReturnValue({ team: mockTeam });
    mocked(azureDevOpsCoreService.getAllTeams).mockRejectedValue(new Error("Permission was denied for this request to access the local address space"));
    mocked(azureDevOpsCoreService.getDefaultTeam).mockRejectedValue(new Error("Permission was denied for this request to access the local address space"));
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([mockBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(mockBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    expect(azureDevOpsCoreService.getAllTeams).not.toHaveBeenCalled();
    expect(azureDevOpsCoreService.getDefaultTeam).not.toHaveBeenCalled();
    expect(azureDevOpsCoreService.getTeam).not.toHaveBeenCalled();
    expect(BoardDataService.getBoardsForTeam).toHaveBeenCalledWith("t1");
    expect(screen.getByRole("option", { name: "Team 1" })).toBeInTheDocument();
    expect(screen.queryByText("We are unable to retrieve the list of teams for this project. Try reloading the page.")).not.toBeInTheDocument();
  });

  it("prefers the default team on first direct navigation when the user belongs to it", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    const defaultTeam = { id: "default-team", name: "Default Team", projectName: "P", description: "", url: "" };
    const altTeam = { id: "team-alt", name: "Alternate Team", projectName: "P", description: "", url: "" };
    const defaultBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-default",
      title: "Default Board",
      teamId: "default-team",
      createdDate: new Date("2024-02-01T00:00:00Z"),
    };
    const olderDefaultBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-default-old",
      title: "Older Default Board",
      teamId: "default-team",
      createdDate: new Date("2024-01-01T00:00:00Z"),
    };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(getConfiguration).mockReturnValue({});
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([defaultTeam as WebApiTeam, altTeam as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(defaultTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockImplementation(async teamId =>
      teamId === "default-team" ? [defaultBoard, olderDefaultBoard] : [mockBoard],
    );
    mocked(itemDataService.getBoardItem).mockResolvedValue(defaultBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
  expect(azureDevOpsCoreService.getDefaultTeam).toHaveBeenCalledWith("1");
    expect(screen.getByRole("combobox", { name: "Team" })).toHaveValue("default-team");
    expect(screen.getByText("Default Board")).toBeInTheDocument();
    expect(BoardDataService.getBoardsForTeam).toHaveBeenCalledWith("default-team");
  });

  it("falls back to the first alphabetical team on first direct navigation when the user is not in the default team", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    const defaultTeam = { id: "z-default", name: "Zebra Team", projectName: "P", description: "", url: "" };
    const firstUserTeam = { id: "a-team", name: "Alpha Team", projectName: "P", description: "", url: "" };
    const secondUserTeam = { id: "b-team", name: "Bravo Team", projectName: "P", description: "", url: "" };
    const alphaBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-alpha",
      title: "Alpha Board",
      teamId: "a-team",
      createdDate: new Date("2024-02-01T00:00:00Z"),
    };
    const betaBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-beta",
      title: "Bravo Board",
      teamId: "b-team",
      createdDate: new Date("2024-01-01T00:00:00Z"),
    };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(getConfiguration).mockReturnValue({ team: defaultTeam });
    mocked(azureDevOpsCoreService.getAllTeams).mockImplementation(async (_projectId, forCurrentUserOnly) =>
      forCurrentUserOnly ? [firstUserTeam as WebApiTeam, secondUserTeam as WebApiTeam] : [firstUserTeam as WebApiTeam, secondUserTeam as WebApiTeam, defaultTeam as WebApiTeam],
    );
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(defaultTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockImplementation(async teamId =>
      teamId === "a-team" ? [alphaBoard] : teamId === "b-team" ? [betaBoard] : [mockBoard],
    );
    mocked(itemDataService.getBoardItem).mockResolvedValue(alphaBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Team" })).toHaveValue("a-team");
    expect(screen.getByText("Alpha Board")).toBeInTheDocument();
    expect(screen.queryByText("Zebra Team")).not.toBeInTheDocument();
  });

  it("falls back to the default member team when the recent visit belongs to a non-member team", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    const firstUserTeam = { id: "a-team", name: "Alpha Team", projectName: "P", description: "", url: "" };
    const defaultTeam = { id: "z-default", name: "Zebra Team", projectName: "P", description: "", url: "" };
    const defaultBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-default",
      title: "Default Board",
      teamId: "z-default",
      createdDate: new Date("2024-02-01T00:00:00Z"),
    };
    const alphaBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-alpha",
      title: "Alpha Board",
      teamId: "a-team",
      createdDate: new Date("2024-01-01T00:00:00Z"),
    };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(getConfiguration).mockReturnValue({});
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([firstUserTeam as WebApiTeam, defaultTeam as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(defaultTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue({ teamId: "outside-team", boardId: "outside-board" } as any);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockImplementation(async teamId =>
      teamId === "z-default" ? [defaultBoard] : [alphaBoard],
    );
    mocked(itemDataService.getBoardItem).mockResolvedValue(defaultBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Team" })).toHaveValue("z-default");
    expect(screen.getByText("Default Board")).toBeInTheDocument();
    expect(BoardDataService.getBoardsForTeam).toHaveBeenCalledWith("z-default");
  });

  it("ignores a recent visit whose board is not associated with the restored team", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    const defaultTeam = { id: "z-default", name: "Zebra Team", projectName: "P", description: "", url: "" };
    const firstUserTeam = { id: "a-team", name: "Alpha Team", projectName: "P", description: "", url: "" };
    const secondUserTeam = { id: "b-team", name: "Bravo Team", projectName: "P", description: "", url: "" };
    const goodToDoneBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-good-to-done",
      title: "Good-to-Done",
      teamId: "z-default",
      createdDate: new Date("2024-03-01T00:00:00Z"),
    };
    const alphaBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-alpha",
      title: "Alpha Board",
      teamId: "a-team",
      createdDate: new Date("2024-02-01T00:00:00Z"),
    };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(getConfiguration).mockReturnValue({ team: defaultTeam });
    mocked(azureDevOpsCoreService.getAllTeams).mockImplementation(async (_projectId, forCurrentUserOnly) =>
      forCurrentUserOnly ? [firstUserTeam as WebApiTeam, secondUserTeam as WebApiTeam, defaultTeam as WebApiTeam] : [firstUserTeam as WebApiTeam, secondUserTeam as WebApiTeam, defaultTeam as WebApiTeam],
    );
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(defaultTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue({ teamId: "z-default", boardId: "board-alpha" } as any);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockImplementation(async teamId =>
      teamId === "z-default" ? [goodToDoneBoard, alphaBoard] : teamId === "a-team" ? [alphaBoard] : [mockBoard],
    );
    mocked(itemDataService.getBoardItem).mockImplementation(async (_teamId, boardId) =>
      boardId === "board-alpha" ? alphaBoard : goodToDoneBoard,
    );
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Team" })).toHaveValue("z-default");
    expect(screen.getByRole("combobox", { name: "Retrospective Board" })).toHaveValue("board-good-to-done");
  });

  it("uses the last visited team when it is still valid for the user", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    const teamA = { id: "alpha-team", name: "Alpha Team", projectName: "P", description: "", url: "" };
    const teamB = { id: "beta-team", name: "Beta Team", projectName: "P", description: "", url: "" };
    const lastVisitedBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-last-visited",
      title: "Last Visited Board",
      teamId: "beta-team",
      createdDate: new Date("2024-03-01T00:00:00Z"),
    };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([teamA as WebApiTeam, teamB as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(teamA as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue({ teamId: "beta-team", boardId: "board-last-visited" } as any);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockImplementation(async teamId =>
      teamId === "beta-team" ? [lastVisitedBoard] : [mockBoard],
    );
    mocked(itemDataService.getBoardItem).mockResolvedValue(lastVisitedBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Team" })).toHaveValue("beta-team");
    expect(screen.getByText("Last Visited Board")).toBeInTheDocument();
  });

  it("lets the most recent visit win over a different host-selected team under the simplified precedence rules", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    const teamA = { id: "t1", name: "Team A", projectName: "P", description: "", url: "" };
    const teamB = { id: "t2", name: "Team B", projectName: "P", description: "", url: "" };
    const teamABoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-team-a",
      title: "Board A",
      teamId: "t1",
      createdDate: new Date("2024-01-01T00:00:00Z"),
    };
    const teamBBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-team-b",
      title: "Board B",
      teamId: "t2",
      createdDate: new Date("2024-02-01T00:00:00Z"),
    };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue(""), setHash: jest.fn() } as any);
    mocked(getConfiguration).mockReturnValue({ team: teamB });
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([teamA as WebApiTeam, teamB as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(teamA as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue({ teamId: "t1", boardId: "board-team-a" } as any);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockImplementation(async teamId => (teamId === "t1" ? [teamABoard] : [teamBBoard]));
    mocked(itemDataService.getBoardItem).mockImplementation(async (_teamId, boardId) => (boardId === "board-team-a" ? teamABoard : teamBBoard));
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    expect(BoardDataService.getBoardsForTeam).toHaveBeenCalledWith("t1");
    expect(screen.getByRole("option", { name: "Team A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Team B" })).toBeInTheDocument();
    expect(screen.getByText("Board A")).toBeInTheDocument();
  });

  it("keeps a deep-linked non-member team and board selectable instead of restoring the recent visit", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    const defaultTeam = { id: "default-team", name: "Default Team", projectName: "P", description: "", url: "" };
    const alternateTeam = { id: "alternate-team", name: "Alternate Team", projectName: "P", description: "", url: "" };
    const alternateBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-alternate",
      title: "Alternate Board",
      teamId: "alternate-team",
      createdDate: new Date("2024-01-01T00:00:00Z"),
    };

    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue("#teamId=alternate-team&boardId=board-alternate"), setHash: jest.fn() } as any);
    mocked(getConfiguration).mockReturnValue({ team: defaultTeam });
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([defaultTeam as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(defaultTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getTeam).mockImplementation(async (_p, teamId) => teamId === "alternate-team" ? alternateTeam as WebApiTeam : null);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue({ teamId: "default-team", boardId: "board-default" } as any);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockImplementation(async teamId => teamId === "alternate-team" ? [alternateBoard] : [mockBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(alternateBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Team" })).toHaveValue("alternate-team");
    expect(screen.getByText("Alternate Board")).toBeInTheDocument();
    const teamSelector = screen.getByRole("group", { name: "Team selector" });
    expect(within(teamSelector).getByRole("option", { name: "Alternate Team" })).toBeInTheDocument();
    expect(within(teamSelector).getByRole("option", { name: "Default Team" })).toBeInTheDocument();
    expect(BoardDataService.getBoardsForTeam).toHaveBeenCalledWith("alternate-team");
  });

  it("keeps the deep-linked default team selectable when the user belongs to a different team", async () => {
    props = { isHostedAzureDevOps: true, projectId: "1" };
    const defaultTeam = { id: "default-team", name: "Default Team", projectName: "P", description: "", url: "" };
    const alternateTeam = { id: "alternate-team", name: "Alternate Team", projectName: "P", description: "", url: "" };
    const defaultBoard: IFeedbackBoardDocument = {
      ...mockBoard,
      id: "board-default",
      title: "Default Board",
      teamId: "default-team",
      createdDate: new Date("2024-01-01T00:00:00Z"),
    };

    // Actual scenario: the user is a member of the alternate team, but the deep link points to the project default team.
    // In the filtered "My teams" experience, the linked default team remains selectable and the current selection matches the URL.
    mocked(getService).mockResolvedValue({ getHash: jest.fn().mockResolvedValue("#teamId=default-team&boardId=board-default"), setHash: jest.fn() } as any);
    mocked(getConfiguration).mockReturnValue({ team: defaultTeam });
    mocked(azureDevOpsCoreService.getAllTeams).mockImplementation(async (_projectId, forCurrentUserOnly) =>
      forCurrentUserOnly ? [alternateTeam as WebApiTeam] : [alternateTeam as WebApiTeam, defaultTeam as WebApiTeam],
    );
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(defaultTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getTeam).mockImplementation(async (_p, teamId) => (teamId === "default-team" ? defaultTeam : teamId === "alternate-team" ? alternateTeam : null) as WebApiTeam | null);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockImplementation(async teamId => teamId === "default-team" ? [defaultBoard] : [mockBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(defaultBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();

    const teamSelector = screen.getByRole("group", { name: "Team selector" });
    expect(within(teamSelector).getByRole("option", { name: "Default Team" })).toBeInTheDocument();
    expect(within(teamSelector).getByRole("option", { name: "Alternate Team" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Team" })).toHaveValue("default-team");
    expect(BoardDataService.getBoardsForTeam).toHaveBeenCalledWith("default-team");
  });

  it("falls back to default team selection when board URL parsing fails", async () => {
    mocked(getService).mockRejectedValue(new Error("Host navigation unavailable"));
    mocked(azureDevOpsCoreService.getAllTeams).mockResolvedValue([mockTeam as WebApiTeam]);
    mocked(azureDevOpsCoreService.getDefaultTeam).mockResolvedValue(mockTeam as WebApiTeam);
    mocked(azureDevOpsCoreService.getMembers).mockResolvedValue([]);
    mocked(userDataService.getMostRecentVisit).mockResolvedValue(null);
    mocked(userDataService.addVisit).mockResolvedValue(undefined);
    mocked(BoardDataService.getBoardsForTeam).mockResolvedValue([mockBoard]);
    mocked(itemDataService.getBoardItem).mockResolvedValue(mockBoard);
    mocked(itemDataService.getFeedbackItemsForBoard).mockResolvedValue([]);
    mocked(workItemService.getWorkItemTypesForCurrentProject).mockResolvedValue([]);
    mocked(workItemService.getHiddenWorkItemTypes).mockResolvedValue([]);

    render(<FeedbackBoardContainer {...props} />);

    expect(await screen.findByRole("heading", { name: "Retrospectives" })).toBeInTheDocument();
    expect(screen.queryByText("We are unable to retrieve the list of teams for this project. Try reloading the page.")).not.toBeInTheDocument();
  });
});
