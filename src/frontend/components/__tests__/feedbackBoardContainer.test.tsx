import React from "react";
import { act } from "react-dom/test-utils";
import { shallow, mount, ReactWrapper } from "enzyme";
import { mocked } from "jest-mock";
import { TeamMember } from "azure-devops-extension-api/WebApi";
import FeedbackBoardContainer, { FeedbackBoardContainerProps, FeedbackBoardContainerState, deduplicateTeamMembers } from "../feedbackBoardContainer";
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions } from "../../interfaces/feedback";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { WorkflowPhase } from "../../interfaces/workItem";
import { IdentityRef } from "azure-devops-extension-api/WebApi";

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

jest.mock("../feedbackBoardMetadataForm", () => {
  return mocked({});
});
jest.mock("azure-devops-extension-api/Work/WorkClient", () => {
  return {
    getTeamIterations: getTeamIterationsMock,
    getTeamFieldValues: getTeamFieldValuesMock,
  };
});
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const feedbackBoardContainerProps: FeedbackBoardContainerProps = {
  isHostedAzureDevOps: false,
  projectId: "1",
};

describe("Feedback Board Container ", () => {
  it("can be rendered without content.", () => {
    const wrapper = shallow(<FeedbackBoardContainer {...feedbackBoardContainerProps} />);
    expect(wrapper.children().dive().html()).toBe('<div class="ms-Spinner initialization-spinner root-41"><div class="ms-Spinner-circle ms-Spinner--large circle-42"></div><div class="ms-Spinner-label label-43">Loading...</div></div>');
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
});

describe("FeedbackBoardContainer integration", () => {
  let wrapper: ReactWrapper;
  let props: FeedbackBoardContainerProps;

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
  });

  it("renders main UI after loading", async () => {
    await act(async () => {
      wrapper = mount(<FeedbackBoardContainer {...props} />);
      wrapper.setState({
        isAppInitialized: true,
        isTeamDataLoaded: true,
        currentUserId: mockUserId,
        userTeams: [mockTeam],
        boards: [mockBoard],
        currentTeam: mockTeam,
        currentBoard: mockBoard,
        projectTeams: [mockTeam],
        filteredProjectTeams: [mockTeam],
        filteredUserTeams: [mockTeam],
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        contributors: [],
        effectivenessMeasurementSummary: [],
        effectivenessMeasurementChartData: [],
        teamEffectivenessMeasurementAverageVisibilityClassName: "",
        actionItemIds: [],
        allMembers: [],
        castedVoteCount: 0,
        boardColumns: [],
        questionIdForDiscussAndActBoardUpdate: -1,
        isBoardCreationDialogHidden: true,
        isArchiveBoardConfirmationDialogHidden: true,
        isBoardUpdateDialogHidden: true,
        isRetroSummaryDialogHidden: true,
        isPreviewEmailDialogHidden: true,
        isBoardDuplicateDialogHidden: true,
        isMobileBoardActionsDialogHidden: true,
        isMobileTeamSelectorDialogHidden: true,
        isTeamBoardDeletedInfoDialogHidden: true,
        isTeamSelectorCalloutVisible: false,
        teamBoardDeletedDialogMessage: "",
        teamBoardDeletedDialogTitle: "",
        isCarouselDialogHidden: true,
        isIncludeTeamEffectivenessMeasurementDialogHidden: true,
        isPrimeDirectiveDialogHidden: true,
        isLiveSyncInTfsIssueMessageBarVisible: false,
        isDropIssueInEdgeMessageBarVisible: false,
        isDesktop: true,
        isAutoResizeEnabled: true,
        allowCrossColumnGroups: false,
        feedbackItems: [],
        maxVotesPerUser: 5,
        hasToggledArchive: false,
        isAllTeamsLoaded: true,
        isBackendServiceConnected: true,
        isReconnectingToBackendService: false,
        isSummaryDashboardVisible: false,
      });
      wrapper.update();
    });
    expect(wrapper.state("isAppInitialized")).toBe(true);
    expect(wrapper.state("isTeamDataLoaded")).toBe(true);
    expect(wrapper.state("currentBoard")).toBeDefined();
    expect(wrapper.state("currentTeam")).toBeDefined();
  });

  it("handles workflow phase change", async () => {
    await act(async () => {
      wrapper = mount(<FeedbackBoardContainer {...props} />);
      wrapper.setState({
        isAppInitialized: true,
        isTeamDataLoaded: true,
        currentUserId: mockUserId,
        currentBoard: mockBoard,
        userTeams: [mockTeam],
        boards: [mockBoard],
        currentTeam: mockTeam,
        projectTeams: [mockTeam],
        isRetroSummaryDialogHidden: true,
        isPreviewEmailDialogHidden: true,
        isBoardCreationDialogHidden: true,
        isArchiveBoardConfirmationDialogHidden: true,
        isBoardUpdateDialogHidden: true,
        isBoardDuplicateDialogHidden: true,
        isMobileBoardActionsDialogHidden: true,
        isMobileTeamSelectorDialogHidden: true,
        isTeamBoardDeletedInfoDialogHidden: true,
        isTeamSelectorCalloutVisible: false,
        teamBoardDeletedDialogMessage: "",
        teamBoardDeletedDialogTitle: "",
        isCarouselDialogHidden: true,
        isIncludeTeamEffectivenessMeasurementDialogHidden: true,
        isPrimeDirectiveDialogHidden: true,
        isLiveSyncInTfsIssueMessageBarVisible: false,
        isDropIssueInEdgeMessageBarVisible: false,
        isDesktop: true,
        isAutoResizeEnabled: true,
        allowCrossColumnGroups: false,
        feedbackItems: [],
        maxVotesPerUser: 5,
        filteredProjectTeams: [mockTeam],
        filteredUserTeams: [mockTeam],
        hasToggledArchive: false,
        isAllTeamsLoaded: true,
        isBackendServiceConnected: true,
        isReconnectingToBackendService: false,
        isSummaryDashboardVisible: false,
      });
      wrapper.update();
    });

    await act(async () => {
      const currentBoard = wrapper.state("currentBoard") as IFeedbackBoardDocument;
      if (currentBoard) {
        wrapper.setState({ currentBoard: { ...currentBoard, activePhase: WorkflowPhase.Group } });
        wrapper.update();
      }
    });

    expect((wrapper.state("currentBoard") as IFeedbackBoardDocument).activePhase).toBe(WorkflowPhase.Group);
  });

  it("renders main board view when fully initialized", async () => {
    await act(async () => {
      wrapper = mount(<FeedbackBoardContainer {...props} />);
      wrapper.setState({
        isAppInitialized: true,
        isTeamDataLoaded: true,
        currentUserId: mockUserId,
        currentBoard: mockBoard,
        currentTeam: mockTeam,
        boards: [mockBoard],
        userTeams: [mockTeam],
        projectTeams: [mockTeam],
        feedbackItems: [],
        contributors: [],
        maxVotesPerUser: 5,
        isBackendServiceConnected: true,
        isReconnectingToBackendService: false,
        isRetroSummaryDialogHidden: true,
        isPreviewEmailDialogHidden: true,
        isBoardCreationDialogHidden: true,
        isBoardUpdateDialogHidden: true,
        isBoardDuplicateDialogHidden: true,
        isArchiveBoardConfirmationDialogHidden: true,
        isMobileBoardActionsDialogHidden: true,
        isMobileTeamSelectorDialogHidden: true,
        isTeamBoardDeletedInfoDialogHidden: true,
        isCarouselDialogHidden: true,
        isIncludeTeamEffectivenessMeasurementDialogHidden: true,
        isPrimeDirectiveDialogHidden: true,
        isLiveSyncInTfsIssueMessageBarVisible: false,
        isDropIssueInEdgeMessageBarVisible: false,
        isDesktop: true,
        isAutoResizeEnabled: true,
        allowCrossColumnGroups: false,
        hasToggledArchive: false,
        isAllTeamsLoaded: true,
        isSummaryDashboardVisible: false,
        isTeamSelectorCalloutVisible: false,
        teamBoardDeletedDialogTitle: "",
        teamBoardDeletedDialogMessage: "",
        filteredProjectTeams: [mockTeam],
        filteredUserTeams: [mockTeam],
        effectivenessMeasurementSummary: [],
        effectivenessMeasurementChartData: [],
      });
      wrapper.update();
    });
    const html = wrapper.html();
    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(0);
  });

  it("renders with different workflow phases", async () => {
    const phases = [WorkflowPhase.Collect, WorkflowPhase.Group, WorkflowPhase.Vote, WorkflowPhase.Act];

    for (const phase of phases) {
      await act(async () => {
        wrapper = mount(<FeedbackBoardContainer {...props} />);
        wrapper.setState({
          isAppInitialized: true,
          isTeamDataLoaded: true,
          currentUserId: mockUserId,
          currentBoard: { ...mockBoard, activePhase: phase },
          currentTeam: mockTeam,
          boards: [{ ...mockBoard, activePhase: phase }],
          userTeams: [mockTeam],
          projectTeams: [mockTeam],
          feedbackItems: [],
          contributors: [],
          maxVotesPerUser: 5,
        });
        wrapper.update();
      });

      expect((wrapper.state("currentBoard") as IFeedbackBoardDocument).activePhase).toBe(phase);
      const html = wrapper.html();
      expect(html).toBeDefined();
    }
  });

  it("handles component mount and unmount lifecycle", async () => {
    await act(async () => {
      wrapper = mount(<FeedbackBoardContainer {...props} />);
      wrapper.setState({
        isAppInitialized: true,
        isTeamDataLoaded: true,
        currentUserId: mockUserId,
        currentBoard: mockBoard,
        currentTeam: mockTeam,
      });
      wrapper.update();
    });

    expect(wrapper.exists()).toBe(true);

    wrapper.unmount();
    expect(wrapper.exists()).toBe(false);
  });
});
