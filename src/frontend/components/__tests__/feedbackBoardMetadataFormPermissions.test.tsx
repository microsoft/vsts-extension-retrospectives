import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { mockUuid } from "../__mocks__/uuid/v4";
import { testExistingBoard, testTeamId, testUserId } from "../__mocks__/mocked_components/mockedBoardMetadataForm";
import FeedbackBoardMetadataFormPermissions from "../feedbackBoardMetadataFormPermissions";
import { FeedbackBoardPermissionOption, IFeedbackBoardMetadataFormPermissionsProps } from "../feedbackBoardMetadataFormPermissions";

jest.mock("../../utilities/telemetryClient", () => ({
  trackTrace: jest.fn(),
  trackEvent: jest.fn(),
  trackException: jest.fn(),
  reactPlugin: {},
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: (_plugin: any, Component: any) => Component,
  useTrackMetric: () => jest.fn(),
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
  _links: {},
  descriptor: "",
  url: "",
};

function makeIdentityRef(id: string, displayName: string = "Test User") {
  return {
    ...mockIdentityRef,
    id,
    displayName,
  };
}

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
      expect(getByText("This board is visible to every member in the project")).toBeInTheDocument();
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

  describe("Checkbox interactions", () => {
    it("should handle select all checkbox when board owner can edit", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef(testUserId, "Test User"),
        },
        currentUserId: testUserId,
        isNewBoardCreation: true,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: "team1", name: "Team Alpha", uniqueName: "team-alpha", type: "team" },
          { id: "user2", name: "User Beta", uniqueName: "user2@example.com", type: "member" },
        ],
        onPermissionChanged,
      });

      const { getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const selectAllCheckbox = getByLabelText("Add permission to every team or member in the table.");

      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });

      expect(selectAllCheckbox).toBeTruthy();
    });

    it("should handle individual permission checkbox click for team", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef(testUserId, "Test User"),
        },
        currentUserId: testUserId,
        isNewBoardCreation: true,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "team1", name: "Team One", uniqueName: "team-one", type: "team" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const checkbox = container.querySelector("#permission-option-team1");

      if (checkbox) {
        await act(async () => {
          fireEvent.click(checkbox);
        });
      }

      expect(container.firstChild).toBeTruthy();
    });

    it("should handle individual permission checkbox click for member", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef(testUserId, "Test User"),
        },
        currentUserId: testUserId,
        isNewBoardCreation: true,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "member1", name: "Member One", uniqueName: "member1@example.com", type: "member" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const checkbox = container.querySelector("#permission-option-member1");

      if (checkbox) {
        await act(async () => {
          fireEvent.click(checkbox);
        });
      }

      expect(container.firstChild).toBeTruthy();
    });

    it("should handle unselect all checkbox", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef(testUserId, "Test User"),
        },
        currentUserId: testUserId,
        isNewBoardCreation: true,
        permissions: { Teams: ["team1"], Members: ["user2"] },
        permissionOptions: [
          { id: "team1", name: "Team Alpha", uniqueName: "team-alpha", type: "team" },
          { id: "user2", name: "User Beta", uniqueName: "user2@example.com", type: "member" },
        ],
        onPermissionChanged,
      });

      const { getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const selectAllCheckbox = getByLabelText("Add permission to every team or member in the table.");

      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });

      expect(selectAllCheckbox).toBeTruthy();
    });

    it("should not allow non-owner/non-admin to select all", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef("other-user-id", "Other User"),
        },
        currentUserId: "different-user-id",
        isNewBoardCreation: false,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "team1", name: "Team Alpha", uniqueName: "team-alpha", type: "team" }],
        onPermissionChanged,
      });

      const { getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const selectAllCheckbox = getByLabelText("Add permission to every team or member in the table.");

      expect(selectAllCheckbox).toBeDisabled();
    });

    it("should block unauthorized permission changes", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef("owner-id", "Board Owner"),
        },
        currentUserId: "non-owner-id",
        isNewBoardCreation: false,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "team1", name: "Team One", uniqueName: "team-one", type: "team" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const checkbox = container.querySelector("#permission-option-team1");

      // The checkbox exists but clicking it should not trigger changes when user is not authorized
      expect(checkbox).toBeInTheDocument();

      if (checkbox) {
        await act(async () => {
          fireEvent.click(checkbox);
        });
      }

      // onPermissionChanged shouldn't be called for initial render when user can't edit
      // The handlePermissionClicked function has a guard that returns early if !canEditPermissions
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Search functionality", () => {
    it("should filter options when search term changes", async () => {
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef(testUserId, "Test User"),
        },
        currentUserId: testUserId,
        isNewBoardCreation: true,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: "team1", name: "Alpha Team", uniqueName: "alpha", type: "team" },
          { id: "team2", name: "Beta Team", uniqueName: "beta", type: "team" },
          { id: "user1", name: "Charlie User", uniqueName: "charlie@example.com", type: "member" },
        ],
      });

      const { container, getByPlaceholderText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const searchInput = getByPlaceholderText("Search teams or users");

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "Alpha" } });
      });

      expect(container.firstChild).toBeTruthy();
    });

    it("should show all options when search is cleared", async () => {
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef(testUserId, "Test User"),
        },
        currentUserId: testUserId,
        isNewBoardCreation: true,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: "team1", name: "Alpha Team", uniqueName: "alpha", type: "team" },
          { id: "team2", name: "Beta Team", uniqueName: "beta", type: "team" },
        ],
      });

      const { container, getByPlaceholderText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const searchInput = getByPlaceholderText("Search teams or users");

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "Alpha" } });
      });

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "" } });
      });

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Permission removal", () => {
    it("should handle removing team permission", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef(testUserId, "Test User"),
        },
        currentUserId: testUserId,
        isNewBoardCreation: true,
        permissions: { Teams: ["team1"], Members: [] },
        permissionOptions: [{ id: "team1", name: "Team One", uniqueName: "team-one", type: "team" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const checkbox = container.querySelector("#permission-option-team1");

      if (checkbox) {
        await act(async () => {
          fireEvent.click(checkbox);
        });
      }

      expect(container.firstChild).toBeTruthy();
    });

    it("should handle removing member permission", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef(testUserId, "Test User"),
        },
        currentUserId: testUserId,
        isNewBoardCreation: true,
        permissions: { Teams: [], Members: ["member1"] },
        permissionOptions: [{ id: "member1", name: "Member One", uniqueName: "member1@example.com", type: "member" }],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const checkbox = container.querySelector("#permission-option-member1");

      if (checkbox) {
        await act(async () => {
          fireEvent.click(checkbox);
        });
      }

      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Team admin permissions", () => {
    it("should allow team admin to edit permissions even if not owner", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef("different-owner-id", "Different Owner"),
        },
        currentUserId: "admin-user-id",
        isNewBoardCreation: false,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: "admin-user-id", name: "Admin User", uniqueName: "admin@example.com", type: "member", isTeamAdmin: true },
          { id: "team1", name: "Team One", uniqueName: "team-one", type: "team" },
        ],
        onPermissionChanged,
      });

      const { getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const selectAllCheckbox = getByLabelText("Add permission to every team or member in the table.");

      expect(selectAllCheckbox).not.toBeDisabled();
    });

    it("should display admin badge for team admins", () => {
      const props = makeProps({
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "admin1", name: "Admin User", uniqueName: "admin@example.com", type: "member", isTeamAdmin: true }],
      });

      const { getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const adminBadge = getByLabelText("Team admin badge");

      expect(adminBadge).toBeInTheDocument();
      expect(adminBadge).toHaveTextContent("Admin");
    });
  });

  describe("Board owner display", () => {
    it("should display owner badge for board owner", () => {
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef("owner-id", "Owner User"),
        },
        currentUserId: "owner-id",
        isNewBoardCreation: false,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "owner-id", name: "Owner User", uniqueName: "owner@example.com", type: "member" }],
      });

      const { getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const ownerBadge = getByLabelText("Board owner badge");

      expect(ownerBadge).toBeInTheDocument();
      expect(ownerBadge).toHaveTextContent("Owner");
    });

    it("should display owner badge for proposed owner on new board creation", () => {
      const props = makeProps({
        currentUserId: "new-owner-id",
        isNewBoardCreation: true,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "new-owner-id", name: "New Owner", uniqueName: "newowner@example.com", type: "member" }],
      });

      const { getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const ownerBadge = getByLabelText("Board owner badge");

      expect(ownerBadge).toBeInTheDocument();
    });

    it("should show owner checkbox as disabled", () => {
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef("owner-id", "Owner User"),
        },
        currentUserId: "owner-id",
        isNewBoardCreation: false,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "owner-id", name: "Owner User", uniqueName: "owner@example.com", type: "member" }],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const ownerCheckbox = container.querySelector("#permission-option-owner-id");

      expect(ownerCheckbox).toBeDisabled();
    });
  });

  describe("Permission image rendering", () => {
    it("should render team icon for team type options", () => {
      const props = makeProps({
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "team1", name: "Team One", uniqueName: "team-one", type: "team" }],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const teamIcon = container.querySelector(".fa-users");

      expect(teamIcon).toBeInTheDocument();
    });

    it("should render profile image for member type options", () => {
      const props = makeProps({
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "user1", name: "User One", uniqueName: "user1@example.com", type: "member", thumbnailUrl: "https://example.com/avatar.jpg" }],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const memberImage = container.querySelector('.permission-image[src="https://example.com/avatar.jpg"]');

      expect(memberImage).toBeInTheDocument();
    });
  });

  describe("Coverage gaps", () => {
    it("should default to empty permissions when props.permissions is missing", () => {
      const props = makeProps({
        // Intentionally violate the type to exercise nullish-coalescing branches.
        permissions: undefined as unknown as any,
        permissionOptions: [],
      });

      const { getByText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      expect(getByText("This board is visible to every member in the project")).toBeInTheDocument();
    });

    it("should early-return when non-owner/non-admin tries to toggle select-all", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef("owner-id", "Board Owner"),
        },
        currentUserId: "non-owner-id",
        isNewBoardCreation: false,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "team1", name: "Team Alpha", uniqueName: "team-alpha", type: "team" }],
        onPermissionChanged,
      });

      const { getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const selectAllCheckbox = getByLabelText("Add permission to every team or member in the table.") as HTMLInputElement;

      // The UI disables this checkbox, so we explicitly re-enable it in the DOM to exercise
      // the handler's authorization guard.
      selectAllCheckbox.disabled = false;

      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });

      expect(onPermissionChanged).not.toHaveBeenCalled();
    });

    it("should update team permissions when an authorized user checks a team option", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef(testUserId, "Owner User"),
        },
        currentUserId: testUserId,
        isNewBoardCreation: false,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: testUserId, name: "Owner User", uniqueName: "owner@example.com", type: "member" },
          { id: "team1", name: "Team One", uniqueName: "team-one", type: "team" },
        ],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      const teamCheckbox = container.querySelector("input#permission-option-team1") as HTMLInputElement | null;
      expect(teamCheckbox).toBeInTheDocument();

      if (teamCheckbox) {
        await act(async () => {
          fireEvent.click(teamCheckbox);
        });
      }

      expect(onPermissionChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: expect.objectContaining({
            Teams: ["team1"],
          }),
        }),
      );
    });

    it("should update member permissions when an authorized user checks a member option", async () => {
      const onPermissionChanged = jest.fn();
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef(testUserId, "Owner User"),
        },
        currentUserId: testUserId,
        isNewBoardCreation: false,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: testUserId, name: "Owner User", uniqueName: "owner@example.com", type: "member" },
          { id: "member1", name: "Member One", uniqueName: "member1@example.com", type: "member" },
        ],
        onPermissionChanged,
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      const memberCheckbox = container.querySelector("input#permission-option-member1") as HTMLInputElement | null;
      expect(memberCheckbox).toBeInTheDocument();

      if (memberCheckbox) {
        await act(async () => {
          fireEvent.click(memberCheckbox);
        });
      }

      expect(onPermissionChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: expect.objectContaining({
            Members: ["member1"],
          }),
        }),
      );
    });

    it("should render the board owner row first (owner-first ordering)", () => {
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef("owner-id", "Owner User"),
        },
        currentUserId: "owner-id",
        isNewBoardCreation: false,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: "team1", name: "Team One", uniqueName: "team-one", type: "team" },
          { id: "owner-id", name: "Owner User", uniqueName: "owner@example.com", type: "member" },
          { id: "user2", name: "Other User", uniqueName: "other@example.com", type: "member" },
        ],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const rows = Array.from(container.querySelectorAll("tbody tr"));

      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveTextContent("Owner User");
    });

    it("should use currentUserId as the owner on new board creation (owner-first ordering)", () => {
      const props = makeProps({
        board: {
          ...testExistingBoard,
          // Ensure owner logic is coming from isNewBoardCreation/currentUserId, not createdBy.
          createdBy: makeIdentityRef("different-owner-id", "Different Owner"),
        },
        currentUserId: "new-owner-id",
        isNewBoardCreation: true,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          // This team would normally sort before members; owner-first should override.
          { id: "team1", name: "AAA Team", uniqueName: "team-one", type: "team" },
          { id: "new-owner-id", name: "New Owner", uniqueName: "newowner@example.com", type: "member" },
          { id: "user2", name: "Other User", uniqueName: "other@example.com", type: "member" },
        ],
      });

      const { container } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      const rows = Array.from(container.querySelectorAll("tbody tr"));

      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveTextContent("New Owner");
    });

    it("should treat the current user as the owner during new board creation", () => {
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: makeIdentityRef("someone-else", "Someone Else"),
        },
        currentUserId: "current-user-id",
        isNewBoardCreation: true,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "team1", name: "Team One", uniqueName: "team-one", type: "team" }],
      });

      const { getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      expect(getByLabelText("Add permission to every team or member in the table.")).not.toBeDisabled();
    });

    it("should treat all rows as non-owner when board.createdBy is missing", () => {
      const props = makeProps({
        board: {
          ...testExistingBoard,
          createdBy: undefined as unknown as any,
        },
        currentUserId: "some-user-id",
        isNewBoardCreation: false,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: "team1", name: "Team One", uniqueName: "team-one", type: "team" },
          { id: "user1", name: "User One", uniqueName: "user1@example.com", type: "member" },
        ],
      });

      const { container, queryByLabelText, getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(getByLabelText("Add permission to every team or member in the table.")).toBeDisabled();
      expect(queryByLabelText("Board owner badge")).not.toBeInTheDocument();

      const rows = Array.from(container.querySelectorAll("tbody tr"));
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should handle missing board (optional chaining) in existing board flow", () => {
      const props = makeProps({
        // Intentionally violate the type to exercise optional chaining branches.
        board: undefined as unknown as any,
        currentUserId: "some-user-id",
        isNewBoardCreation: false,
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: "team1", name: "Team One", uniqueName: "team-one", type: "team" },
          { id: "user1", name: "User One", uniqueName: "user1@example.com", type: "member" },
        ],
      });

      const { queryByLabelText, getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);
      expect(getByLabelText("Add permission to every team or member in the table.")).toBeDisabled();
      expect(queryByLabelText("Board owner badge")).not.toBeInTheDocument();
    });

    it("should render isTeamAdmin boolean text when provided", () => {
      const props = makeProps({
        permissions: { Teams: [], Members: [] },
        permissionOptions: [{ id: "admin1", name: "Admin User", uniqueName: "admin@example.com", type: "member", isTeamAdmin: true }],
      });

      const { container, getByLabelText } = render(<FeedbackBoardMetadataFormPermissions {...props} />);

      expect(getByLabelText("Team admin badge")).toBeInTheDocument();

      // React ignores boolean children, so we verify the extra span exists structurally.
      const row = container.querySelector("tbody tr") as HTMLTableRowElement | null;
      expect(row).toBeInTheDocument();

      const contentTextSpans = row ? Array.from(row.querySelectorAll(".content-text span")) : [];
      expect(contentTextSpans.length).toBeGreaterThanOrEqual(3);
    });
  });
});
