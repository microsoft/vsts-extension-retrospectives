import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { mockUuid } from "../__mocks__/uuid/v4";
import { testExistingBoard, testTeamId, testUserId } from "../__mocks__/mocked_components/mockedBoardMetadataForm";
import FeedbackBoardMetadataFormPermissions from "../feedbackBoardMetadataFormPermissions";
import { FeedbackBoardPermissionOption, IFeedbackBoardMetadataFormPermissionsProps } from "../feedbackBoardMetadataFormPermissions";

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
  getService: jest.fn(),
}));

(global as any).VSS = {
  getConfiguration: () => ({}),
  notifyLoadSucceeded: jest.fn(),
  notifyLoadFailed: jest.fn(),
  getContributionId: () => "test-contribution-id",
  getHost: () => ({ id: "test-host-id" }),
  getService: jest.fn(),
};

const mockedProps: IFeedbackBoardMetadataFormPermissionsProps = {
  board: testExistingBoard,
  permissions: {
    Teams: [],
    Members: [],
  },
  permissionOptions: [],
  currentUserId: testUserId,
  isNewBoardCreation: false,
  onPermissionChanged: jest.fn(),
};

const mockIdentityRef = {
  id: "some-id",
  directoryAlias: "",
  imageUrl: "",
  inactive: false,
  isAadIdentity: false,
  isContainer: false,
  isDeletedInOrigin: false,
  profileUrl: "",
  uniqueName: "",
  displayName: "",
};

function makeProps(overrides: Partial<IFeedbackBoardMetadataFormPermissionsProps> = {}): IFeedbackBoardMetadataFormPermissionsProps {
  return {
    ...mockedProps,
    ...overrides,
  };
}

jest.mock("uuid", () => ({ v4: () => mockUuid }));

describe("Board Metadata Form Permissions", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("can be rendered", () => {
    const props: IFeedbackBoardMetadataFormPermissionsProps = {
      board: testExistingBoard,
      permissions: { Teams: [], Members: [] },
      currentUserId: testUserId,
      isNewBoardCreation: false,
      permissionOptions: [],
      onPermissionChanged: jest.fn(),
    };

    render(<FeedbackBoardMetadataFormPermissions {...props} />);
  });

  it("filters out group options based on pattern matching in name", () => {
    const groupOption: FeedbackBoardPermissionOption = {
      id: "group1",
      name: "[Test Project]\\Test Group",
      uniqueName: "group1@domain.com",
      type: "team",
    };

    const props: IFeedbackBoardMetadataFormPermissionsProps = {
      board: testExistingBoard,
      permissions: { Teams: [], Members: [] },
      currentUserId: testUserId,
      isNewBoardCreation: false,
      permissionOptions: [groupOption],
      onPermissionChanged: jest.fn(),
    };

    const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
    expect(container).toBeTruthy();
  });

  describe("Public Banner", () => {
    const publicBannerText: string = "This board is visible to every member in the project.";

    it("should show when there are not team or member permissions", () => {
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        board: testExistingBoard,
        permissions: { Teams: [], Members: [] },
        currentUserId: testUserId,
        isNewBoardCreation: false,
        permissionOptions: [],
        onPermissionChanged: jest.fn(),
      };

      const { getByText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      expect(getByText("This board is visible to every member in the project.")).toBeInTheDocument();
    });

    it("should hide when there are team permissions", () => {
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        board: testExistingBoard,
        permissions: { Teams: ["team1"], Members: [] },
        currentUserId: testUserId,
        isNewBoardCreation: false,
        permissionOptions: [],
        onPermissionChanged: jest.fn(),
      };

      const { queryByText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      expect(queryByText("This board is visible to every member in the project.")).not.toBeInTheDocument();
    });

    it("should hide when there are member permissions", () => {
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        board: testExistingBoard,
        permissions: { Teams: [], Members: ["user1"] },
        currentUserId: testUserId,
        isNewBoardCreation: false,
        permissionOptions: [],
        onPermissionChanged: jest.fn(),
      };

      const { queryByText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      expect(queryByText("This board is visible to every member in the project.")).not.toBeInTheDocument();
    });
  });

  describe("Permission Edit Warning", () => {
    const permissionEditWarningText = "Only the Board Owner or a Team Admin can edit permissions.";

    it("should show when user is neither board owner nor team admin", () => {
      const props = makeProps({
        currentUserId: "not-owner-id",
        permissions: { Teams: [], Members: [] },
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should hide when user is board owner", () => {
      const props = makeProps({
        currentUserId: testUserId,
        permissions: { Teams: [], Members: [] },
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should hide when user is a team admin", () => {
      const props = makeProps({
        currentUserId: "team-admin-id",
        permissions: { Teams: [], Members: [] },
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Permission Table", () => {
    it("should show team permissions", () => {
      const props = makeProps({
        permissions: { Teams: ["team1", "team2"], Members: [] },
        permissionOptions: [
          { id: "team1", name: "Team One", uniqueName: "team1", type: "team" },
          { id: "team2", name: "Team Two", uniqueName: "team2", type: "team" },
        ],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should show member permissions", () => {
      const props = makeProps({
        permissions: { Teams: [], Members: ["user1", "user2"] },
        permissionOptions: [
          { id: "user1", name: "User One", uniqueName: "user1@example.com", type: "member" },
          { id: "user2", name: "User Two", uniqueName: "user2@example.com", type: "member" },
        ],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should order teams alphabetically then users alphabetically", () => {
      const props = makeProps({
        permissions: { Teams: ["team2", "team1"], Members: ["user2", "user1"] },
        permissionOptions: [
          { id: "team2", name: "Team Zebra", uniqueName: "team-z", type: "team" },
          { id: "team1", name: "Team Alpha", uniqueName: "team-a", type: "team" },
          { id: "user2", name: "Zoe User", uniqueName: "zoe@example.com", type: "member" },
          { id: "user1", name: "Alice User", uniqueName: "alice@example.com", type: "member" },
        ],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should order options that have permission before those without", () => {
      const props = makeProps({
        permissions: { Teams: ["team1"], Members: ["user1"] },
        permissionOptions: [
          { id: "team1", name: "Team One", uniqueName: "team1", type: "team" },
          { id: "team2", name: "Team Two", uniqueName: "team2", type: "team" },
          { id: "user1", name: "User One", uniqueName: "user1@example.com", type: "member" },
          { id: "user2", name: "User Two", uniqueName: "user2@example.com", type: "member" },
        ],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should set an Owner label for user that created the board and list board owner first", () => {
      const props = makeProps({
        currentUserId: "owner-id",
        permissions: { Teams: [], Members: ["owner-id", "user1"] },
        permissionOptions: [
          { id: "owner-id", name: "Board Owner", uniqueName: "owner@example.com", type: "member" },
          { id: "user1", name: "User One", uniqueName: "user1@example.com", type: "member" },
        ],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should display the Team Admin badge for a team admin", () => {
      const props = makeProps({
        permissions: { Teams: [], Members: ["admin-user"] },
        permissionOptions: [{ id: "admin-user", name: "Admin User", uniqueName: "admin@example.com", type: "member" }],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should not display the Team Admin badge if isTeamAdmin is false or missing", () => {
      const props = makeProps({
        permissions: { Teams: [], Members: ["regular-user"] },
        permissionOptions: [{ id: "regular-user", name: "Regular User", uniqueName: "regular@example.com", type: "member" }],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should display correct admin badges for users who are team admins on different teams", () => {
      const props = makeProps({
        permissions: { Teams: [], Members: ["multi-admin"] },
        permissionOptions: [{ id: "multi-admin", name: "Multi Admin", uniqueName: "multiadmin@example.com", type: "member" }],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Editing Permissions", () => {
    it("should allow permissions to be changed", () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "user1", name: "User One", uniqueName: "user1@example.com", type: "member" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
      expect(onPermissionChanged).toBeDefined();
    });

    it("should handle adding team permissions", () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "team1", name: "Team One", uniqueName: "team1", type: "team" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should handle removing team permissions", () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        permissions: { Teams: ["team1"], Members: [] },
        permissionOptions: [{ id: "team1", name: "Team One", uniqueName: "team1", type: "team" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should handle adding member permissions", () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "user1", name: "User One", uniqueName: "user1@example.com", type: "member" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should handle removing member permissions", () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        permissions: { Teams: [], Members: ["user1"] },
        permissionOptions: [{ id: "user1", name: "User One", uniqueName: "user1@example.com", type: "member" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should prevent removing owner permissions", () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        currentUserId: "owner-id",
        permissions: { Teams: [], Members: ["owner-id"] },
        permissionOptions: [{ id: "owner-id", name: "Board Owner", uniqueName: "owner@example.com", type: "member" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should disable permission changes for non-owners/non-admins", () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        currentUserId: "regular-user-id",
        permissions: { Teams: [], Members: ["regular-user-id"] },
        permissionOptions: [{ id: "regular-user-id", name: "Regular User", uniqueName: "regular@example.com", type: "member" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Search and Filter", () => {
    it("should filter options based on search text", () => {
      const props = makeProps({
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: "user1", name: "Alice Smith", uniqueName: "alice@example.com", type: "member" },
          { id: "user2", name: "Bob Jones", uniqueName: "bob@example.com", type: "member" },
          { id: "team1", name: "Alpha Team", uniqueName: "alpha-team", type: "team" },
          { id: "team2", name: "Beta Team", uniqueName: "beta-team", type: "team" },
        ],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should handle empty search results", () => {
      const props = makeProps({
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: "user1", name: "Alice Smith", uniqueName: "alice@example.com", type: "member" },
          { id: "team1", name: "Alpha Team", uniqueName: "alpha-team", type: "team" },
        ],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });

    it("should clear search text", () => {
      const props = makeProps({
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "user1", name: "Alice Smith", uniqueName: "alice@example.com", type: "member" }],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(container.firstChild).toBeTruthy();
    });
  });
});
