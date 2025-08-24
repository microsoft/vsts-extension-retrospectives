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
});
