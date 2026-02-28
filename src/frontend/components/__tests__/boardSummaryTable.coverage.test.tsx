/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { IdentityRef } from "azure-devops-extension-api/WebApi";

import BoardSummaryTable, { IBoardSummaryTableProps } from "../boardSummaryTable";
import BoardDataService from "../../dal/boardDataService";
import { itemDataService } from "../../dal/itemDataService";
import { IFeedbackBoardDocument } from "../../interfaces/feedback";

jest.mock("../../utilities/telemetryClient", () => ({
  appInsights: {
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
  TelemetryEvents: {
    FeedbackBoardArchived: "FeedbackBoardArchived",
    FeedbackBoardRestored: "FeedbackBoardRestored",
    FeedbackBoardDeleted: "FeedbackBoardDeleted",
  },
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
  },
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: (_plugin: any, Component: any) => Component,
  useTrackMetric: () => jest.fn(),
}));

jest.mock("../../dal/boardDataService", () => ({
  __esModule: true,
  default: {
    getBoardsForTeam: jest.fn(),
    deleteFeedbackBoard: jest.fn(),
    archiveFeedbackBoard: jest.fn(),
    restoreArchivedFeedbackBoard: jest.fn(),
  },
}));

jest.mock("../../dal/itemDataService", () => ({
  itemDataService: {
    getFeedbackItemsForBoard: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../../dal/azureDevOpsWorkItemService", () => ({
  workItemService: {
    getWorkItemStates: jest.fn().mockResolvedValue([]),
    getWorkItemsByIds: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../../dal/reflectBackendService", () => ({
  reflectBackendService: {
    broadcastDeletedBoard: jest.fn(),
  },
}));

jest.mock("../boardSummaryTableBody", () => {
  const ReactLib = require("react");

  return {
    __esModule: true,
    default: ({ boardRowSummary }: { boardRowSummary: (item: { id: string }) => React.ReactNode }) => {
      const summary = boardRowSummary({ id: "missing-board-id" });
      return ReactLib.createElement(
        "tbody",
        { "data-testid": "mock-body" },
        summary || ReactLib.createElement("tr", { "data-testid": "null-summary" }),
      );
    },
  };
});

beforeAll(() => {
  if (!(window as unknown as { HTMLDialogElement?: typeof HTMLDialogElement }).HTMLDialogElement) {
    (window as unknown as { HTMLDialogElement: typeof HTMLElement }).HTMLDialogElement = class HTMLDialogElement extends HTMLElement {} as unknown as typeof HTMLDialogElement;
  }

  HTMLDialogElement.prototype.showModal = function showModal() {
    (this as unknown as { open: boolean }).open = true;
  };

  HTMLDialogElement.prototype.close = function close() {
    (this as unknown as { open: boolean }).open = false;
  };
});

const mockedIdentity: IdentityRef = {
  directoryAlias: "test.user",
  id: "user-1",
  imageUrl: "https://example.com/avatar.png",
  inactive: false,
  isAadIdentity: true,
  isContainer: false,
  isDeletedInOrigin: false,
  profileUrl: "https://example.com/profile",
  uniqueName: "test.user@example.com",
  _links: undefined,
  descriptor: "vssgp.Uy0xLTktMTY=",
  displayName: "Test User",
  url: "https://example.com/user",
};

const mockBoard: IFeedbackBoardDocument = {
  id: "board-1",
  teamId: "team-1",
  title: "Board 1",
  createdDate: new Date("2024-01-01"),
  createdBy: mockedIdentity,
  isArchived: false,
  columns: [],
  activePhase: "Collect",
  maxVotesPerUser: 5,
  boardVoteCollection: {},
  teamEffectivenessMeasurementVoteCollection: [],
};

const props: IBoardSummaryTableProps = {
  teamId: "team-1",
  currentUserId: "user-1",
  currentUserIsTeamAdmin: true,
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn(),
};

describe("BoardSummaryTable targeted coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BoardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue([mockBoard]);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);
  });

  it("executes boardRowSummary null return branch for unknown board id", async () => {
    render(<BoardSummaryTable {...props} />);

    await waitFor(() => {
      expect(screen.getByTestId("null-summary")).toBeTruthy();
    });
  });

  it("executes teamId unchanged branch in effect without loading boards", async () => {
    render(<BoardSummaryTable {...props} teamId={undefined as unknown as string} />);

    await waitFor(() => {
      expect(BoardDataService.getBoardsForTeam).not.toHaveBeenCalled();
    });
  });
});
