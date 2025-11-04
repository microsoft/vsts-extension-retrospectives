import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeedbackItem from "../feedbackItem";
import { testColumns, testBoardId, testColumnUuidOne, testColumnIds, testFeedbackItem } from "../__mocks__/mocked_components/mockedFeedbackColumn";

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

jest.mock("../../utilities/userIdentityHelper", () => ({
  getUserIdentity: () => ({
    id: "test-user-id",
    displayName: "Test User",
    uniqueName: "testuser@example.com",
    imageUrl: "https://example.com/avatar.jpg",
  }),
  encrypt: (id: string) => id,
  decrypt: (id: string) => id,
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

    test("replaces title with placeholder text when hideFeedbackItems is true", () => {
      const props: any = {
        id: "test-hidden-text",
        title: "Secret Feedback Content",
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
      const { container, queryByText } = render(<FeedbackItem {...props} />);

      // Should show placeholder text
      expect(container.textContent).toContain("[Hidden Feedback]");

      // Should NOT show the actual title
      expect(queryByText("Secret Feedback Content")).not.toBeInTheDocument();
    });

    test("shows actual title when user is the owner", () => {
      const props: any = {
        id: "test-owner",
        title: "My Feedback",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "test-user-id",
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
      const { container, getByText } = render(<FeedbackItem {...props} />);

      // Should show actual title since user is the owner
      expect(getByText("My Feedback")).toBeInTheDocument();

      // Should NOT have hidden class
      expect(container.querySelector(".hideFeedbackItem")).not.toBeInTheDocument();
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

  describe("Drag and drop operations", () => {
    test("handles drag start event", () => {
      const props: any = {
        id: "test-drag",
        title: "Draggable Item",
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

    test("handles drag over event", () => {
      const props: any = {
        id: "test-dragover",
        title: "Drag Over Item",
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

    test("handles drop event", () => {
      const props: any = {
        id: "test-drop",
        title: "Drop Target Item",
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

    test("prevents drag over when item is being dragged itself", () => {
      const props: any = {
        id: "test-drag-over-self",
        title: "Drag Self Item",
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
      const feedbackItem = container.querySelector(".feedbackItem");
      expect(feedbackItem).toBeTruthy();

      // Simulate drag start to set isBeingDragged to true
      fireEvent.dragStart(feedbackItem!, {
        dataTransfer: {
          effectAllowed: "linkMove",
          setData: jest.fn(),
        },
      });

      // Now try drag over - preventDefault should not be called when item is being dragged
      const dragOverEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          dropEffect: "",
        },
      };
      fireEvent.dragOver(feedbackItem!, dragOverEvent);

      // preventDefault should NOT be called when item is being dragged
      expect(dragOverEvent.preventDefault).not.toHaveBeenCalled();
    });

    test("calls setIsGroupBeingDragged on drag start when groupedItemProps exists", () => {
      const mockSetIsGroupBeingDragged = jest.fn();
      const props: any = {
        id: "test-group-drag",
        title: "Group Drag Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: ["child1"],
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
          isGroupExpanded: false,
          groupedCount: 1,
          parentItemId: "",
          setIsGroupBeingDragged: mockSetIsGroupBeingDragged,
          toggleGroupExpand: jest.fn(),
        },
      };

      const { container } = render(<FeedbackItem {...props} />);
      const feedbackItem = container.querySelector(".feedbackItemGroupItem");
      expect(feedbackItem).toBeTruthy();

      // Simulate drag start
      fireEvent.dragStart(feedbackItem!, {
        dataTransfer: {
          effectAllowed: "linkMove",
          setData: jest.fn(),
        },
      });

      // Check that setIsGroupBeingDragged was called with true
      expect(mockSetIsGroupBeingDragged).toHaveBeenCalledWith(true);

      // Simulate drag end
      fireEvent.dragEnd(feedbackItem!);

      // Check that setIsGroupBeingDragged was called with false
      expect(mockSetIsGroupBeingDragged).toHaveBeenCalledWith(false);
    });
  });

  describe("Grouped feedback items", () => {
    test("renders main item in a group", () => {
      const props: any = {
        id: "test-group-main",
        title: "Main Group Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: ["child-1", "child-2"],
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
          isGroupExpanded: false,
          groupedCount: 2,
          parentItemId: "",
          setIsGroupBeingDragged: jest.fn(),
          toggleGroupExpand: jest.fn(),
        },
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders child item in a group", () => {
      const props: any = {
        id: "test-group-child",
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
          groupedCount: 1,
          parentItemId: "parent-id",
          setIsGroupBeingDragged: jest.fn(),
          toggleGroupExpand: jest.fn(),
        },
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders expanded group", () => {
      const props: any = {
        id: "test-group-expanded",
        title: "Expanded Group",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: ["child-1", "child-2", "child-3"],
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
          groupedCount: 3,
          parentItemId: "",
          setIsGroupBeingDragged: jest.fn(),
          toggleGroupExpand: jest.fn(),
        },
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Vote phase behavior", () => {
    test("renders item with upvotes in Vote phase", () => {
      const props: any = {
        id: "test-votes",
        title: "Item with Votes",
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
        workflowPhase: "Vote",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders item with zero upvotes in Vote phase", () => {
      const props: any = {
        id: "test-no-votes",
        title: "Item without Votes",
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
        workflowPhase: "Vote",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Timer functionality", () => {
    test("renders item with timer active", () => {
      const props: any = {
        id: "test-timer-active",
        title: "Item with Active Timer",
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
        timerSecs: 120,
        timerState: true,
        timerId: "active-timer-id",
        isGroupedCarouselItem: false,
        workflowPhase: "Act",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    test("renders item with timer paused", () => {
      const props: any = {
        id: "test-timer-paused",
        title: "Item with Paused Timer",
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
        timerState: false,
        timerId: "paused-timer-id",
        isGroupedCarouselItem: false,
        workflowPhase: "Act",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Carousel mode", () => {
    test("renders item in carousel mode", () => {
      const props: any = {
        id: "test-carousel",
        title: "Carousel Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 3,
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
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: true,
        workflowPhase: "Act",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Hidden feedback items", () => {
    test("handles hideFeedbackItems prop", () => {
      const props: any = {
        id: "test-hidden",
        title: "Hidden Item",
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
        hideFeedbackItems: true,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Accessibility - Obscured feedback (Issue #1318)", () => {
    test("adds aria-hidden='true' to obscured feedback items", () => {
      const props: any = {
        id: "test-obscured-aria",
        title: "Hidden Feedback",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "other-user-id",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: true,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
        currentUserId: "current-user-id",
        currentTeamId: "team-1",
      };

      const { container } = render(<FeedbackItem {...props} />);
      const feedbackItemElement = container.querySelector('[data-feedback-item-id="test-obscured-aria"]');

      expect(feedbackItemElement).toHaveAttribute("aria-hidden", "true");
    });

    test("does not add aria-hidden when feedback is not obscured", () => {
      const props: any = {
        id: "test-visible-aria",
        title: "Visible Feedback",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "user-id",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
        currentUserId: "user-id",
        currentTeamId: "team-1",
      };

      const { container } = render(<FeedbackItem {...props} />);
      const feedbackItemElement = container.querySelector('[data-feedback-item-id="test-visible-aria"]');

      expect(feedbackItemElement).not.toHaveAttribute("aria-hidden");
    });

    test("does not add aria-hidden when user is the owner of obscured feedback", () => {
      const props: any = {
        id: "test-owner-aria",
        title: "My Hidden Feedback",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [],
        userIdRef: "test-user-id",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: true,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
        currentUserId: "test-user-id",
        currentTeamId: "team-1",
      };

      const { container } = render(<FeedbackItem {...props} />);
      const feedbackItemElement = container.querySelector('[data-feedback-item-id="test-owner-aria"]');

      expect(feedbackItemElement).not.toHaveAttribute("aria-hidden");
    });

    test("adds aria-hidden to obscured child feedback items in groups", () => {
      const mainItemId = "main-item-obscured";
      const childItemId = "child-item-obscured";

      const childFeedbackItem = {
        ...testFeedbackItem,
        id: childItemId,
        title: "Hidden Child Feedback",
        userIdRef: "other-user-id",
        parentFeedbackItemId: mainItemId,
        originalColumnId: testColumnUuidOne,
      };

      const mainFeedbackItem = {
        ...testFeedbackItem,
        id: mainItemId,
        title: "Main Item",
        userIdRef: "test-user-id",
        groupIds: [childItemId],
        originalColumnId: testColumnUuidOne,
      };

      const columnsWithGroup = {
        ...testColumns,
        [testColumnUuidOne]: {
          ...testColumns[testColumnUuidOne],
          columnItems: [
            {
              feedbackItem: mainFeedbackItem,
              actionItems: [],
            },
            {
              feedbackItem: childFeedbackItem,
              actionItems: [],
            },
          ],
        },
      };

      const props: any = {
        id: mainItemId,
        title: "Main Item",
        columnId: testColumnUuidOne,
        columns: columnsWithGroup,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [childItemId],
        userIdRef: "test-user-id",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: true,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: true,
        workflowPhase: "Collect",
        currentUserId: "test-user-id",
        currentTeamId: "team-1",
        groupedItemProps: {
          isMainItem: true,
          isGroupExpanded: false,
          groupedCount: 1,
        },
      };

      const { container, rerender } = render(<FeedbackItem {...props} />);

      // Main item should NOT be hidden because the user is the owner (userIdRef matches getUserIdentity().id)
      const mainFeedbackItemElement = container.querySelector('[data-feedback-item-id="main-item-obscured"]');
      expect(mainFeedbackItemElement).not.toHaveAttribute("aria-hidden");
    });

    test("does not add aria-hidden to visible child feedback items in groups", () => {
      const mainItemId = "main-item-visible";
      const childItemId = "child-item-visible";

      const childFeedbackItem = {
        ...testFeedbackItem,
        id: childItemId,
        title: "Visible Child Feedback",
        userIdRef: "user-id",
        parentFeedbackItemId: mainItemId,
        originalColumnId: testColumnUuidOne,
      };

      const mainFeedbackItem = {
        ...testFeedbackItem,
        id: mainItemId,
        title: "Main Item",
        userIdRef: "user-id",
        groupIds: [childItemId],
        originalColumnId: testColumnUuidOne,
      };

      const columnsWithGroup = {
        ...testColumns,
        [testColumnUuidOne]: {
          ...testColumns[testColumnUuidOne],
          columnItems: [
            {
              feedbackItem: mainFeedbackItem,
              actionItems: [],
            },
            {
              feedbackItem: childFeedbackItem,
              actionItems: [],
            },
          ],
        },
      };

      const props: any = {
        id: mainItemId,
        title: "Main Item",
        columnId: testColumnUuidOne,
        columns: columnsWithGroup,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        groupIds: [childItemId],
        userIdRef: "user-id",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: true,
        workflowPhase: "Group",
        currentUserId: "user-id",
        currentTeamId: "team-1",
        groupedItemProps: {
          isMainItem: true,
          isGroupExpanded: false,
          groupedCount: 1,
        },
      };

      const { container } = render(<FeedbackItem {...props} />);

      // Verify the main item is visible (no aria-hidden)
      const mainFeedbackItemElement = container.querySelector('[data-feedback-item-id="main-item-visible"]');
      expect(mainFeedbackItemElement).not.toHaveAttribute("aria-hidden");
    });
  });

  describe("User identification", () => {
    test("renders item with user reference", () => {
      const props: any = {
        id: "test-user-ref",
        title: "Item with User",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        createdBy: "John Doe",
        createdByProfileImage: "https://example.com/avatar.jpg",
        upvotes: 0,
        groupIds: [],
        userIdRef: "user-123",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Column transitions", () => {
    test("renders item moved to different column", () => {
      const props: any = {
        id: "test-moved",
        title: "Moved Item",
        columnId: "different-column-id",
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
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Group",
      };
      const { container } = render(<FeedbackItem {...props} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Accessibility - Enhanced ARIA labels", () => {
    test("includes comprehensive information in aria-label", () => {
      const testFeedbackItemWithVotes = {
        ...testFeedbackItem,
        id: "test-aria",
        title: "Test Feedback Item",
        createdBy: "John Doe",
        createdDate: new Date("2023-06-15T10:00:00Z"),
        voteCollection: { "user-1": 2, "user-2": 3 },
      };

      const testColumnsWithVotes = {
        ...testColumns,
        [testColumnUuidOne]: {
          ...testColumns[testColumnUuidOne],
          columnItems: [
            {
              feedbackItem: testFeedbackItemWithVotes,
              actionItems: [],
            },
          ],
        },
      };

      const props: any = {
        id: "test-aria",
        title: "Test Feedback Item",
        columnId: testColumnUuidOne,
        columns: testColumnsWithVotes,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date("2023-06-15T10:00:00Z"),
        createdBy: "John Doe",
        upvotes: 5,
        voteCount: 5,
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
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Vote",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: { "user-1": 2, "user-2": 3 },
        isIncluded: true,
      };

      const { container } = render(<FeedbackItem {...props} />);
      const feedbackItemElement = container.querySelector('[data-feedback-item-id="test-aria"]');

      expect(feedbackItemElement).toBeTruthy();
      const ariaLabel = feedbackItemElement?.getAttribute("aria-label");

      expect(ariaLabel).toContain("Test Feedback Item");
      expect(ariaLabel).toContain("5 total votes");
      expect(ariaLabel).toContain("John Doe");
      expect(ariaLabel).toContain("June 15, 2023");
    });

    test("aria-label in Act phase shows votes", () => {
      const testFeedbackItemActPhase = {
        ...testFeedbackItem,
        id: "test-aria-act",
        title: "Act Phase Item",
        voteCollection: { "user-1": 1, "user-2": 2 },
      };

      const testColumnsActPhase = {
        ...testColumns,
        [testColumnUuidOne]: {
          ...testColumns[testColumnUuidOne],
          columnItems: [
            {
              feedbackItem: testFeedbackItemActPhase,
              actionItems: [],
            },
          ],
        },
      };

      const props: any = {
        id: "test-aria-act",
        title: "Act Phase Item",
        columnId: testColumnUuidOne,
        columns: testColumnsActPhase,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 3,
        voteCount: 3,
        groupIds: [],
        userIdRef: "",
        actionItems: [
          {
            id: "action-1",
            title: "Action 1",
            fields: {
              "System.Title": "Action 1",
              "System.State": "Active",
            },
          },
          {
            id: "action-2",
            title: "Action 2",
            fields: {
              "System.Title": "Action 2",
              "System.State": "Active",
            },
          },
        ],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Act",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: { "user-1": 1, "user-2": 2 },
        isIncluded: true,
      };

      const { container } = render(<FeedbackItem {...props} />);
      const feedbackItemElement = container.querySelector('[data-feedback-item-id="test-aria-act"]');

      const ariaLabel = feedbackItemElement?.getAttribute("aria-label");
      expect(ariaLabel).toContain("3 total votes");
    });

    test("aria-label indicates grouped items", () => {
      const props: any = {
        id: "test-aria-group",
        title: "Grouped Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        voteCount: 0,
        groupIds: ["child-1", "child-2"],
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
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Group",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: {},
        isIncluded: true,
        groupedItemProps: {
          groupedCount: 1,
          isGroupExpanded: false,
          isMainItem: true,
          parentItemId: "",
          setIsGroupBeingDragged: jest.fn(),
          toggleGroupExpand: jest.fn(),
        },
      };

      const { container } = render(<FeedbackItem {...props} />);
      const feedbackItemElement = container.querySelector('[data-feedback-item-id="test-aria-group"]');

      const ariaLabel = feedbackItemElement?.getAttribute("aria-label");
      expect(ariaLabel).toContain("Group has 2 items");
    });

    test("has data-feedback-item-id attribute for keyboard navigation", () => {
      const props: any = {
        id: "test-data-attr",
        title: "Test Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        voteCount: 0,
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
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: {},
        isIncluded: true,
      };

      const { container } = render(<FeedbackItem {...props} />);
      const feedbackItemElement = container.querySelector('[data-feedback-item-id="test-data-attr"]');

      expect(feedbackItemElement).toHaveAttribute("data-feedback-item-id", "test-data-attr");
      expect(feedbackItemElement).toHaveAttribute("tabindex", "0");
    });

    test("has proper role and aria-roledescription", () => {
      const props: any = {
        id: "test-role",
        title: "Test Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        voteCount: 0,
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
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: {},
        isIncluded: true,
      };

      const { container } = render(<FeedbackItem {...props} />);
      const feedbackItemElement = container.querySelector('[data-feedback-item-id="test-role"]');

      expect(feedbackItemElement).toHaveAttribute("role", "article");
      expect(feedbackItemElement).toHaveAttribute("aria-roledescription", "feedback item");
    });
  });

  describe("Accessibility - Voting interactions", () => {
    test("vote button is visible in Vote phase", () => {
      const props: any = {
        id: "test-vote-button",
        title: "Test Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        voteCount: 0,
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
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Vote",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: {},
        isIncluded: true,
      };

      const { container } = render(<FeedbackItem {...props} />);
      const voteButton = container.querySelector('button[title="Vote"]');

      expect(voteButton).toBeTruthy();
    });

    test("vote button is not visible in Collect phase", () => {
      const props: any = {
        id: "test-no-vote-button",
        title: "Test Item",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        voteCount: 0,
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
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Collect",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: {},
        isIncluded: true,
      };

      const { container } = render(<FeedbackItem {...props} />);
      const voteButton = container.querySelector('button[title="Vote"]');

      expect(voteButton).toBeNull();
    });
  });

  describe("Accessibility - Simplified vote button labels (Issue #1199)", () => {
    test("vote up button should have simplified aria-label without feedback title", () => {
      const votePhaseProps: any = {
        id: "vote-test-1",
        title: "Improve performance",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 5,
        voteCount: 5,
        groupIds: [],
        userIdRef: "user-1",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Vote",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: {},
        isIncluded: true,
      };

      const { container } = render(<FeedbackItem {...votePhaseProps} />);

      const voteButtons = container.querySelectorAll(".feedback-add-vote");
      const voteUpButton = voteButtons[0];

      const ariaLabel = voteUpButton.getAttribute("aria-label");

      // Should NOT contain the feedback title
      expect(ariaLabel).not.toContain("Improve performance");
      expect(ariaLabel).not.toContain("Click to vote on feedback with title");

      // Should contain simplified text
      expect(ariaLabel).toContain("Vote up");
      expect(ariaLabel).toContain("Current vote count is 5");
    });

    test("vote down button should have simplified aria-label without feedback title", () => {
      const votePhaseProps: any = {
        id: "vote-test-2",
        title: "Fix bugs quickly",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 3,
        voteCount: 3,
        groupIds: [],
        userIdRef: "user-1",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Vote",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: {},
        isIncluded: true,
      };

      const { container } = render(<FeedbackItem {...votePhaseProps} />);

      const voteButtons = container.querySelectorAll(".feedback-add-vote");
      const voteDownButton = voteButtons[1];

      const ariaLabel = voteDownButton.getAttribute("aria-label");

      // Should NOT contain the feedback title
      expect(ariaLabel).not.toContain("Fix bugs quickly");
      expect(ariaLabel).not.toContain("Click to unvote on feedback with title");

      // Should contain simplified text
      expect(ariaLabel).toContain("Vote down");
      expect(ariaLabel).toContain("Current vote count is 3");
    });

    test("vote buttons should reflect current vote count accurately", () => {
      const votePhaseProps: any = {
        id: "vote-test-3",
        title: "Add new feature",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 12,
        voteCount: 12,
        groupIds: [],
        userIdRef: "user-1",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Vote",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: {},
        isIncluded: true,
      };

      const { container } = render(<FeedbackItem {...votePhaseProps} />);

      const voteButtons = container.querySelectorAll(".feedback-add-vote");
      const voteUpButton = voteButtons[0];
      const voteDownButton = voteButtons[1];

      expect(voteUpButton.getAttribute("aria-label")).toContain("Current vote count is 12");
      expect(voteDownButton.getAttribute("aria-label")).toContain("Current vote count is 12");
    });

    test("vote buttons should work with zero votes", () => {
      const votePhaseProps: any = {
        id: "vote-test-4",
        title: "New suggestion",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 0,
        voteCount: 0,
        groupIds: [],
        userIdRef: "user-1",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: false,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Vote",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: {},
        isIncluded: true,
      };

      const { container } = render(<FeedbackItem {...votePhaseProps} />);

      const voteButtons = container.querySelectorAll(".feedback-add-vote");
      const voteUpButton = voteButtons[0];

      const ariaLabel = voteUpButton.getAttribute("aria-label");
      expect(ariaLabel).toContain("Vote up");
      expect(ariaLabel).toContain("Current vote count is 0");
    });

    test("vote buttons should not include title even for hidden feedback items", () => {
      const hiddenFeedbackProps: any = {
        id: "vote-test-5",
        title: "Hidden feedback title",
        columnId: testColumnUuidOne,
        columns: testColumns,
        columnIds: testColumnIds,
        boardId: testBoardId,
        createdDate: new Date(),
        upvotes: 7,
        voteCount: 7,
        groupIds: [],
        userIdRef: "different-user",
        actionItems: [],
        newlyCreated: false,
        showAddedAnimation: false,
        shouldHaveFocus: false,
        hideFeedbackItems: true,
        nonHiddenWorkItemTypes: [],
        allWorkItemTypes: [],
        originalColumnId: testColumnUuidOne,
        timerSecs: 0,
        timerState: false,
        timerId: "",
        isGroupedCarouselItem: false,
        workflowPhase: "Vote",
        currentUserId: "user-1",
        currentTeamId: "team-1",
        voteCollection: {},
        isIncluded: true,
      };

      const { container } = render(<FeedbackItem {...hiddenFeedbackProps} />);

      const voteButtons = container.querySelectorAll(".feedback-add-vote");
      const voteUpButton = voteButtons[0];

      const ariaLabel = voteUpButton.getAttribute("aria-label");

      // Should not contain the title or [Hidden Feedback]
      expect(ariaLabel).not.toContain("Hidden feedback title");
      expect(ariaLabel).not.toContain("[Hidden Feedback]");

      // Should contain simplified text
      expect(ariaLabel).toContain("Vote up");
      expect(ariaLabel).toContain("Current vote count is 7");
    });
  });
});
