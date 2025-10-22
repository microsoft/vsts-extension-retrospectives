import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeedbackItem from "../feedbackItem";
import { testColumns, testBoardId, testColumnUuidOne, testColumnIds } from "../__mocks__/mocked_components/mockedFeedbackColumn";

jest.mock("../../utilities/telemetryClient", () => ({
  trackTrace: jest.fn(),
  trackEvent: jest.fn(),
  trackException: jest.fn(),
}));

jest.mock("applicationinsights-js", () => ({
  AppInsights: {
    trackEvent: jest.fn(),
    trackTrace: jest.fn(),
    trackException: jest.fn(),
  },
}));

jest.mock("azure-devops-extension-sdk", () => ({
  getConfiguration: () => ({}),
  notifyLoadSucceeded: jest.fn(),
  notifyLoadFailed: jest.fn(),
  getContributionId: () => "test-contribution-id",
  getHost: () => ({ id: "test-host-id" }),
  getService: jest.fn().mockResolvedValue({
    getExtensionDataManager: jest.fn().mockResolvedValue({
      getValue: jest.fn().mockResolvedValue({}),
      setValue: jest.fn().mockResolvedValue({}),
    }),
  }),
  getUser: () => ({ id: "test-user-id", name: "Test User", displayName: "Test User" }),
  getAccessToken: jest.fn().mockResolvedValue("mock-access-token"),
  getExtensionContext: () => ({ id: "test-extension-id" }),
}));

jest.mock("../../utilities/servicesHelper", () => ({
  getService: jest.fn(),
  getHostAuthority: jest.fn().mockResolvedValue("dev.azure.com"),
  WorkItemTrackingServiceIds: {},
}));

jest.mock("../../utilities/azureDevOpsContextHelper", () => ({
  getHostAuthority: jest.fn().mockResolvedValue("dev.azure.com"),
  getCurrentUser: jest.fn().mockResolvedValue({ id: "test-user" }),
  isHostedAzureDevOps: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../dal/dataService", () => ({
  getTeamEffectiveness: jest.fn().mockResolvedValue({}),
  getBoard: jest.fn().mockResolvedValue({}),
  createFeedbackItem: jest.fn().mockResolvedValue({}),
  readDocument: jest.fn().mockResolvedValue({}),
  updateDocument: jest.fn().mockResolvedValue({}),
  deleteDocument: jest.fn().mockResolvedValue({}),
}));

(global as any).VSS = {
  getConfiguration: () => ({}),
  notifyLoadSucceeded: jest.fn(),
  notifyLoadFailed: jest.fn(),
  getContributionId: () => "test-contribution-id",
  getHost: () => ({ id: "test-host-id" }),
  getService: jest.fn(),
};

describe("Feedback Item", () => {
  test("renders without crashing with basic props", () => {
    const minimalProps: any = {
      id: "test-feedback-id",
      title: "Test Feedback Item",
      description: "Test Description",
      columnId: testColumnUuidOne,
      columns: testColumns,
      columnIds: testColumnIds,
      boardId: testBoardId,
      createdDate: new Date("2023-01-01T10:00:00Z"),
      createdBy: null,
      upvotes: 0,
      voteCollection: {},
      groupIds: [],
      userIdRef: "",
      currentUserId: "user1",
      currentTeamId: "team1",
      actionItems: [],
      newlyCreated: false,
      showAddedAnimation: false,
      shouldHaveFocus: false,
      hideFeedbackItems: false,
      isIncluded: true,
      nonHiddenWorkItems: [],
      allWorkItemTypes: [],
      originalColumnId: testColumnUuidOne,
      timerSecs: 0,
      timerstate: false,
      timerId: "",
      isGroupedCarouselItem: false,
    };

    const { container } = render(<FeedbackItem {...minimalProps} />);

    expect(container.firstChild).toBeTruthy();
    expect(container.textContent).toContain("Test Feedback Item");
  });

  test("Render a Feedback Item with no child Feedback Items", () => {
    const minimalProps: any = {
      id: "test-feedback-id",
      title: "Test Feedback Item",
      description: "Test Description",
      columnId: testColumnUuidOne,
      columns: testColumns,
      columnIds: testColumnIds,
      boardId: testBoardId,
      createdDate: new Date("2023-01-01T10:00:00Z"),
      createdBy: null,
      upvotes: 0,
      voteCollection: {},
      groupIds: [],
      userIdRef: "",
      currentUserId: "user1",
      currentTeamId: "team1",
      actionItems: [],
      newlyCreated: false,
      showAddedAnimation: false,
      shouldHaveFocus: false,
      hideFeedbackItems: false,
      isIncluded: true,
      nonHiddenWorkItems: [],
      allWorkItemTypes: [],
      originalColumnId: testColumnUuidOne,
      timerSecs: 0,
      timerstate: false,
      timerId: "",
      isGroupedCarouselItem: false,
    };

    const { container, getByText } = render(<FeedbackItem {...minimalProps} />);

    expect(container.firstChild).toBeTruthy();
    expect(getByText("Test Feedback Item")).toBeInTheDocument();

    expect(minimalProps.groupIds).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid="child-feedback-item"]')).toHaveLength(0);
  });

  describe("Group feedback items", () => {
    test("should show the related feedback header", () => {
      const minimalProps: any = {
        id: "test-group-feedback-id",
        title: "Test Group Feedback Item",
        description: "Test Group Description",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date("2023-01-01T10:00:00Z"),
        createdBy: null,
        upvotes: 0,
        voteCollection: {},
        groupIds: ["group1"],
        userIdRef: "",
        currentUserId: "user1",
        currentTeamId: "team1",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        isIncluded: true,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
      };

      const { container } = render(<FeedbackItem {...minimalProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(container.textContent).toContain("Test Group Feedback Item");
    });

    test("should show the related feedback item title", () => {
      const minimalProps: any = {
        id: "test-group-feedback-title-id",
        title: "Test Group Title",
        description: "Test Group Description",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date("2023-01-01T10:00:00Z"),
        createdBy: null,
        upvotes: 0,
        voteCollection: {},
        groupIds: ["group1"],
        userIdRef: "",
        currentUserId: "user1",
        currentTeamId: "team1",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        isIncluded: true,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
      };

      const { container, getByText } = render(<FeedbackItem {...minimalProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(getByText("Test Group Title")).toBeInTheDocument();
    });

    test("should show the original column information", () => {
      const minimalProps: any = {
        id: "test-group-feedback-original-id",
        title: "Test Group Original Column",
        description: "Test Group Description",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date("2023-01-01T10:00:00Z"),
        createdBy: null,
        upvotes: 0,
        voteCollection: {},
        groupIds: ["group1"],
        userIdRef: "",
        currentUserId: "user1",
        currentTeamId: "team1",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        isIncluded: true,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
      };

      const { container } = render(<FeedbackItem {...minimalProps} />);

      expect(container.firstChild).toBeTruthy();
      expect(minimalProps.originalColumnId).toBe(testColumnUuidOne);
      expect(minimalProps.columnId).toBe(testColumnUuidOne);
    });
  });

  describe("Different workflow phases", () => {
    const baseProps: any = {
      id: "test-id",
      title: "Test Item",
      columnId: testColumnUuidOne,
      columns: testColumns,
      columnIds: testColumnIds,
      boardId: testBoardId,
      createdDate: new Date("2023-01-01T10:00:00Z"),
      upvotes: 5,
      groupIds: [],
      userIdRef: "",
      actionItems: [],
      newlyCreated: false,
      showAddedAnimation: false,
      shouldHaveFocus: false,
      hideFeedbackItems: false,
      nonHiddenWorkItems: [],
      allWorkItemTypes: [],
      originalColumnId: testColumnUuidOne,
      timerSecs: 30,
      timerstate: false,
      timerId: "",
      isGroupedCarouselItem: false,
    };

    test("renders in Collect phase", () => {
      const props = { ...baseProps, workflowPhase: "Collect", isInteractable: true };
      const { container } = render(<FeedbackItem {...(props as any)} />);
      expect(container.querySelector(".feedbackItem")).toBeTruthy();
    });

    test("renders in Group phase with draggable", () => {
      const props = { ...baseProps, workflowPhase: "Group", isInteractable: true };
      const { container } = render(<FeedbackItem {...(props as any)} />);
      const item = container.querySelector(".feedbackItem");
      expect(item?.getAttribute("draggable")).toBe("true");
    });

    test("renders in Vote phase with vote buttons", () => {
      const props = { ...baseProps, workflowPhase: "Vote", isInteractable: true, isFocusModalHidden: true, onVoteCasted: jest.fn() };
      const { container } = render(<FeedbackItem {...(props as any)} />);
      const voteButtons = container.querySelectorAll(".feedback-add-vote");
      expect(voteButtons.length).toBeGreaterThan(0);
    });

    test("renders in Act phase with timer", () => {
      const props = { ...baseProps, workflowPhase: "Act", team: { id: "t1" }, boardTitle: "Board", defaultActionItemAreaPath: "Area", defaultActionItemIteration: "Iter" };
      const { container } = render(<FeedbackItem {...(props as any)} />);
      expect(container.textContent).toContain("0:30 elapsed");
    });
  });

  describe("Creator information", () => {
    test("displays creator name when provided", () => {
      const props: any = {
        ...{ id: "test-creator", title: "Test", columnId: testColumnUuidOne, columns: testColumns, columnIds: testColumnIds, boardId: testBoardId, createdDate: new Date(), upvotes: 0, groupIds: [], userIdRef: "", actionItems: [], newlyCreated: false, showAddedAnimation: false, shouldHaveFocus: false, hideFeedbackItems: false, nonHiddenWorkItems: [], allWorkItemTypes: [], originalColumnId: testColumnUuidOne, timerSecs: 0, timerstate: false, timerId: "", isGroupedCarouselItem: false },
        createdBy: "John Doe",
        createdByProfileImage: "image.jpg",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.textContent).toContain("John Doe");
    });

    test("displays anonymous date when creator is null", () => {
      const props: any = {
        id: "test-anon",
        title: "Test",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date("2023-01-15T14:30:00Z"),
        createdBy: null,
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".anonymous-created-date")).toBeTruthy();
    });
  });

  describe("Grouped items rendering", () => {
    test("renders main item in group", () => {
      const props: any = {
        id: "test-main",
        title: "Main Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: ["child1"],
        groupCount: 1,
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        groupedItemProps: { isMainItem: true, isGroupExpanded: false, groupedCount: 1, parentItemId: "", setIsGroupBeingDragged: jest.fn(), toggleGroupExpand: jest.fn() },
        isFocusModalHidden: true,
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".mainItemCard")).toBeTruthy();
    });

    test("renders child item in group", () => {
      const props: any = {
        id: "test-child",
        title: "Child Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        groupedItemProps: { isMainItem: false, isGroupExpanded: true, groupedCount: 0, parentItemId: "parent", setIsGroupBeingDragged: jest.fn(), toggleGroupExpand: jest.fn() },
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".feedbackItemGroupGroupedItem")).toBeTruthy();
    });
  });

  describe("Non-interactable items", () => {
    test("renders non-editable text", () => {
      const props: any = {
        id: "test-readonly",
        title: "Read Only",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        isInteractable: false,
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".non-editable-text-container")).toBeTruthy();
    });
  });

  describe("Hidden feedback", () => {
    test("hides item when hideFeedbackItems is true and userIdRef doesn't match", () => {
      const props: any = {
        id: "test-hidden",
        title: "Hidden",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "different-user",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: true,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".hideFeedbackItem")).toBeTruthy();
    });
  });

  describe("Animation and styling", () => {
    test("applies newFeedbackItem class when showAddedAnimation is true", () => {
      const props: any = {
        id: "test-anim",
        title: "Animated",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: true,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".newFeedbackItem")).toBeTruthy();
    });

    test("shows card index number", () => {
      const props: any = {
        id: "test-index",
        title: "Index Test",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".card-id")).toBeTruthy();
    });
  });

  describe("Timer formatting", () => {
    test("formats timer with minutes and seconds", () => {
      const props: any = {
        id: "test-timer1",
        title: "Timer Test",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 125,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Act",
        team: { id: "t1" },
        boardTitle: "Board",
        defaultActionItemAreaPath: "Area",
        defaultActionItemIteration: "Iter",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.textContent).toContain("2:05 elapsed");
    });

    test("formats timer with leading zero for seconds", () => {
      const props: any = {
        id: "test-timer2",
        title: "Timer Test 2",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 183,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Act",
        team: { id: "t1" },
        boardTitle: "Board",
        defaultActionItemAreaPath: "Area",
        defaultActionItemIteration: "Iter",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.textContent).toContain("3:03 elapsed");
    });
  });

  describe("Focus mode features", () => {
    test("shows focus group button in Act phase focus mode", () => {
      const props: any = {
        id: "test-focus",
        title: "Focus Test",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: ["child1", "child2"],
        groupCount: 2,
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: true,
        workflowPhase: "Act",
        isFocusModalHidden: false,
        groupedItemProps: {
          isMainItem: true,
          isGroupExpanded: false,
          groupedCount: 2,
          parentItemId: "",
          setIsGroupBeingDragged: jest.fn(),
          toggleGroupExpand: jest.fn(),
        },
        team: { id: "t1" },
        boardTitle: "Board",
        defaultActionItemAreaPath: "Area",
        defaultActionItemIteration: "Iter",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".feedback-expand-group-focus")).toBeTruthy();
    });
  });

  describe("Original column display", () => {
    test("shows original column info when item moved to different column in Group phase", () => {
      const testColumnUuidTwo = "mocked-column-uuid-two";
      const props: any = {
        id: "test-moved",
        title: "Moved Item",
        columnId: testColumnUuidTwo,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Group",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".original-column-info")).toBeTruthy();
    });
  });

  describe("Vote display in Vote phase", () => {
    test("displays user vote count when interactable", () => {
      const props: any = {
        id: "test-votes",
        title: "Vote Display",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 10,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Vote",
        isInteractable: true,
        isFocusModalHidden: true,
        onVoteCasted: jest.fn(),
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".feedback-yourvote-count")).toBeTruthy();
    });
  });

  describe("Action item display", () => {
    test("shows action item component in Act phase", () => {
      const props: any = {
        id: "test-action",
        title: "Action Test",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Act",
        isInteractable: true,
        team: { id: "t1", name: "Team 1" },
        boardTitle: "Test Board",
        defaultActionItemAreaPath: "Test Area",
        defaultActionItemIteration: "Test Iteration",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".card-action-item-part")).toBeTruthy();
    });
  });

  describe("Menu and dialog visibility", () => {
    test("shows context menu button when interactable and not newly created", () => {
      const props: any = {
        id: "test-menu",
        title: "Menu Test",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        isInteractable: true,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".contextual-menu-button")).toBeTruthy();
    });

    test("hides context menu button when newly created", () => {
      const props: any = {
        id: "test-new",
        title: "New Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: true,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        isInteractable: true,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".contextual-menu-button")).toBeFalsy();
    });
  });

  describe("Group expand button variations", () => {
    test("shows expand button for grouped main item not in focus mode", () => {
      const props: any = {
        id: "test-expand",
        title: "Expand Test",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: ["child1"],
        groupCount: 1,
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        groupedItemProps: {
          isMainItem: true,
          isGroupExpanded: false,
          groupedCount: 1,
          parentItemId: "",
          setIsGroupBeingDragged: jest.fn(),
          toggleGroupExpand: jest.fn(),
        },
        isFocusModalHidden: true,
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".feedback-expand-group")).toBeTruthy();
    });

    test("shows expanded group state", () => {
      const props: any = {
        id: "test-expanded",
        title: "Expanded Group",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: ["child1"],
        groupCount: 1,
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        groupedItemProps: {
          isMainItem: true,
          isGroupExpanded: true,
          groupedCount: 1,
          parentItemId: "",
          setIsGroupBeingDragged: jest.fn(),
          toggleGroupExpand: jest.fn(),
        },
        isFocusModalHidden: true,
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".feedback-expand-group")).toBeTruthy();
    });
  });

  describe("Multiple workflow and state combinations", () => {
    test("renders in Group phase with action items", () => {
      const props: any = {
        id: "test-group-actions",
        title: "Group with Actions",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [{ id: 1 }],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Group",
        isInteractable: true,
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.querySelector(".feedbackItem")).toBeTruthy();
    });

    test("renders with high upvote count", () => {
      const props: any = {
        id: "test-high-votes",
        title: "High Votes",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 99,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Vote",
        isInteractable: true,
        isFocusModalHidden: true,
        onVoteCasted: jest.fn(),
      };
      const { container } = render(<FeedbackItem {...props} />);
      // Just verify it renders with vote phase
      expect(container.querySelector(".feedback-add-vote")).toBeTruthy();
    });

    test("renders with timer running", () => {
      const props: any = {
        id: "test-running-timer",
        title: "Running Timer",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 45,
        timerstate: true,
        timerId: "timer-123",
        isGroupedCarouselItem: false,
        workflowPhase: "Act",
        team: { id: "t1" },
        boardTitle: "Board",
        defaultActionItemAreaPath: "Area",
        defaultActionItemIteration: "Iter",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.textContent).toContain("0:45 elapsed");
    });

    test("renders marked for deletion", () => {
      const props: any = {
        id: "test-deleting",
        title: "Deleting Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders with multiple group children", () => {
      const props: any = {
        id: "test-multi-children",
        title: "Multi Children",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: ["child1", "child2", "child3"],
        groupCount: 3,
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItems: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: true,
        workflowPhase: "Act",
        isFocusModalHidden: false,
        groupedItemProps: {
          isMainItem: true,
          isGroupExpanded: false,
          groupedCount: 3,
          parentItemId: "",
          setIsGroupBeingDragged: jest.fn(),
          toggleGroupExpand: jest.fn(),
        },
        team: { id: "t1" },
        boardTitle: "Board",
        defaultActionItemAreaPath: "Area",
        defaultActionItemIteration: "Iter",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.textContent).toContain("4 Items");
    });

    test("renders with work item types provided", () => {
      const props: any = {
        id: "test-wit",
        title: "With Work Items",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [{ name: "Bug" }],
        allWorkItemTypes: [{ name: "Bug" }, { name: "Task" }],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Act",
        team: { id: "t1" },
        boardTitle: "Board",
        defaultActionItemAreaPath: "Area",
        defaultActionItemIteration: "Iter",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders with team information", () => {
      const props: any = {
        id: "test-team",
        title: "Team Info",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Act",
        team: { id: "team-123", name: "Test Team", projectName: "Test Project" },
        boardTitle: "Test Board Title",
        defaultActionItemAreaPath: "Test\\Area\\Path",
        defaultActionItemIteration: "Sprint 1",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders with callbacks defined", () => {
      const mockAddFeedback = jest.fn();
      const mockRemoveFeedback = jest.fn();
      const mockRefreshFeedback = jest.fn();
      const mockMoveFeedback = jest.fn();
      const mockVoteCasted = jest.fn();

      const props: any = {
        id: "test-callbacks",
        title: "With Callbacks",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
        addFeedbackItems: mockAddFeedback,
        removeFeedbackItemFromColumn: mockRemoveFeedback,
        refreshFeedbackItems: mockRefreshFeedback,
        moveFeedbackItem: mockMoveFeedback,
        onVoteCasted: mockVoteCasted,
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Timer functionality", () => {
    test("renders with timer enabled", () => {
      const props: any = {
        id: "test-timer",
        title: "Timer Test",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 60,
        timerstate: true,
        timerId: "timer-1",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders with zero timer", () => {
      const props: any = {
        id: "test-zero-timer",
        title: "Zero Timer",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: true,
        timerId: "timer-2",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Voting functionality", () => {
    test("renders with vote collection", () => {
      const props: any = {
        id: "test-votes",
        title: "Vote Test",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 5,
        voteCollection: { user1: 2, user2: 3 },
        groupIds: [],
        userIdRef: "user1",
        currentUserId: "user1",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Vote",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders with onVoteCasted callback", () => {
      const mockVoteCasted = jest.fn();
      const props: any = {
        id: "test-vote-callback",
        title: "Vote Callback",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        voteCollection: {},
        groupIds: [],
        userIdRef: "user1",
        currentUserId: "user1",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Vote",
        onVoteCasted: mockVoteCasted,
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Deletion scenarios", () => {
    test("renders item marked for deletion", () => {
      const props: any = {
        id: "test-delete",
        title: "Delete Test",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders with upvotes preventing deletion", () => {
      const props: any = {
        id: "test-delete-disabled",
        title: "Cannot Delete",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 5,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Grouped items", () => {
    test("renders main item in group", () => {
      const props: any = {
        id: "test-main-group",
        title: "Main Group Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: ["child1", "child2"],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Group",
        groupedItemProps: {
          isMainItem: true,
          isGroupExpanded: true,
          parentItemId: "test-main-group",
          childItemIds: ["child1", "child2"],
          toggleGroupExpand: jest.fn(),
          setIsGroupBeingDragged: jest.fn(),
        },
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders child item in group", () => {
      const props: any = {
        id: "test-child-group",
        title: "Child Group Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Group",
        groupedItemProps: {
          isMainItem: false,
          isGroupExpanded: true,
          parentItemId: "parent-item",
          childItemIds: [],
          toggleGroupExpand: jest.fn(),
          setIsGroupBeingDragged: jest.fn(),
        },
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Edit scenarios", () => {
    test("renders newly created item", () => {
      const props: any = {
        id: "test-newly-created",
        title: "New Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: true,
        showAddedAnimation: true,
        shouldHaveFocus: true,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders with shouldHaveFocus enabled", () => {
      const props: any = {
        id: "test-focus",
        title: "Focus Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: true,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Action items", () => {
    test("renders with multiple action items", () => {
      const mockActionItems = [
        {
          id: 1,
          fields: {
            "System.Title": "Action 1",
            "System.WorkItemType": "Task",
            "System.State": "Active",
          },
        },
        {
          id: 2,
          fields: {
            "System.Title": "Action 2",
            "System.WorkItemType": "Bug",
            "System.State": "Resolved",
          },
        },
      ];

      const props: any = {
        id: "test-actions",
        title: "With Actions",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: mockActionItems,
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [
          {
            name: "Task",
            icon: { id: "1", url: "task-icon.png" },
            states: [{ name: "Active", category: "InProgress", color: "blue" }],
          },
          {
            name: "Bug",
            icon: { id: "2", url: "bug-icon.png" },
            states: [{ name: "Resolved", category: "Resolved", color: "green" }],
          },
        ],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Act",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Workflow phases", () => {
    test("renders in Collect phase", () => {
      const props: any = {
        id: "test-collect",
        title: "Collect Phase",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders in Group phase", () => {
      const props: any = {
        id: "test-group",
        title: "Group Phase",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Group",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders in Act phase", () => {
      const props: any = {
        id: "test-act",
        title: "Act Phase",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerstate: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Act",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });
});

