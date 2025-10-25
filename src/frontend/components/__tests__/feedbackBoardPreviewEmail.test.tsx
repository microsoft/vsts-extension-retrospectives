import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import FeedbackBoardPreviewEmail from "../feedbackBoardPreviewEmail";
import { IFeedbackBoardDocument } from "../../interfaces/feedback";
import { getBoardUrl } from "../../utilities/boardUrlHelper";
import { shareBoardHelper } from "../../utilities/shareBoardHelper";
import { copyToClipboard } from "../../utilities/clipboardHelper";
import { IdentityRef } from "azure-devops-extension-api/WebApi";
import { WorkflowPhase } from "../../interfaces/workItem";

// Mock dependencies
jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
  },
  appInsights: {
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
  TelemetryEvents: {},
}));

jest.mock("../../utilities/boardUrlHelper", () => ({
  getBoardUrl: jest.fn(),
}));

jest.mock("../../utilities/shareBoardHelper", () => ({
  shareBoardHelper: {
    generateEmailText: jest.fn(),
  },
}));

jest.mock("../../utilities/clipboardHelper", () => ({
  copyToClipboard: jest.fn(),
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: jest.fn((plugin, component) => component),
}));

const mockGetBoardUrl = getBoardUrl as jest.MockedFunction<typeof getBoardUrl>;
const mockGenerateEmailText = shareBoardHelper.generateEmailText as jest.MockedFunction<typeof shareBoardHelper.generateEmailText>;
const mockCopyToClipboard = copyToClipboard as jest.MockedFunction<typeof copyToClipboard>;

describe("FeedbackBoardPreviewEmail", () => {
  const mockedIdentity: IdentityRef = {
    id: "user-1",
    directoryAlias: "",
    imageUrl: "",
    inactive: false,
    isAadIdentity: false,
    isContainer: false,
    isDeletedInOrigin: false,
    profileUrl: "",
    uniqueName: "",
    _links: undefined,
    descriptor: "",
    displayName: "Test User",
    url: "",
  };

  const mockBoard: IFeedbackBoardDocument = {
    id: "board-123",
    title: "Test Retrospective Board",
    teamId: "team-456",
    maxVotesPerUser: 5,
    columns: [
      {
        id: "col-1",
        title: "What went well",
        iconClass: "emoji-thumbs-up",
        accentColor: "#00ff00",
      },
      {
        id: "col-2",
        title: "What needs improvement",
        iconClass: "emoji-thumbs-down",
        accentColor: "#ff0000",
      },
    ],
    createdBy: mockedIdentity,
    createdDate: new Date("2024-01-01"),
    modifiedDate: new Date("2024-01-01"),
    isIncludeTeamEffectivenessMeasurement: false,
    shouldShowFeedbackAfterCollect: false,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-02"),
    activePhase: "Collect",
    isAnonymous: false,
    boardVoteCollection: {},
    teamEffectivenessMeasurementVoteCollection: [],
    permissions: {
      Teams: [],
      Members: [],
    },
  };

  const mockOnCopy = jest.fn();
  const defaultProps = {
    board: mockBoard,
    teamId: "team-456",
    onCopy: mockOnCopy,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBoardUrl.mockResolvedValue("https://dev.azure.com/test/board/123");
    mockGenerateEmailText.mockResolvedValue("Mock email content for retrospective");
    mockCopyToClipboard.mockResolvedValue(true);
  });

  describe("Loading State", () => {
    it("should render loading spinner when email content is not yet loaded", () => {
      mockGenerateEmailText.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      const spinner = document.querySelector(".preview-email-spinner");
      expect(spinner).toBeInTheDocument();
    });

    it("should have correct spinner class and label", () => {
      mockGenerateEmailText.mockImplementation(() => new Promise(() => {}));

      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      const spinner = document.querySelector(".preview-email-spinner");
      expect(spinner).toHaveClass("preview-email-spinner");
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Component Mount and Data Loading", () => {
    it("should call getBoardUrl with correct parameters on mount", async () => {
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetBoardUrl).toHaveBeenCalledWith("team-456", "board-123", WorkflowPhase.Collect);
      });
    });

    it("should call generateEmailText with board, url, and false flag", async () => {
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        expect(mockGenerateEmailText).toHaveBeenCalledWith(mockBoard, "https://dev.azure.com/test/board/123", false);
      });
    });

    it("should update state with email content after loading", async () => {
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Mock email content for retrospective")).toBeInTheDocument();
      });
    });
  });

  describe("Rendered Content", () => {
    it("should render copy button after content loads", async () => {
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
      });
    });

    it("should render copy button with correct icon", async () => {
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        const button = screen.getByText("Copy to clipboard").closest("button");
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass("copy-email-button");
      });
    });

    it("should render text field with email content", async () => {
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        const textField = screen.getByRole("textbox");
        expect(textField).toHaveValue("Mock email content for retrospective");
      });
    });

    it("should render text field as read-only", async () => {
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        const textField = screen.getByRole("textbox");
        expect(textField).toHaveAttribute("readonly");
      });
    });

    it("should render text field with correct attributes", async () => {
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        const textField = screen.getByRole("textbox");
        const container = document.querySelector(".preview-email-field");
        expect(container).toBeInTheDocument();
        expect(textField).toHaveAttribute("aria-label", "Email summary for retrospective");
        expect(textField).toHaveAttribute("rows", "20");
      });
    });
  });

  describe("Copy Button Interaction", () => {
    it("should call copyToClipboard when copy button is clicked", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
      });

      const copyButton = screen.getByText("Copy to clipboard");
      await user.click(copyButton);

      expect(mockCopyToClipboard).toHaveBeenCalledWith("Mock email content for retrospective");
    });

    it("should call onCopy callback when copy button is clicked", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
      });

      const copyButton = screen.getByText("Copy to clipboard");
      await user.click(copyButton);

      expect(mockOnCopy).toHaveBeenCalledTimes(1);
    });

    it("should call both copyToClipboard and onCopy in correct order", async () => {
      const user = userEvent.setup();
      const callOrder: string[] = [];

      mockCopyToClipboard.mockImplementation(async () => {
        callOrder.push("copyToClipboard");
        return true;
      });

      mockOnCopy.mockImplementation(() => {
        callOrder.push("onCopy");
      });

      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
      });

      const copyButton = screen.getByText("Copy to clipboard");
      await user.click(copyButton);

      expect(callOrder).toEqual(["copyToClipboard", "onCopy"]);
    });
  });

  describe("Text Field Interaction", () => {
    it("should call select on text field when clicked", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      const textField = screen.getByRole("textbox") as HTMLTextAreaElement;
      const selectSpy = jest.spyOn(textField, "select");

      await user.click(textField);

      expect(selectSpy).toHaveBeenCalled();
    });

    it("should stop propagation when text field is clicked", async () => {
      const user = userEvent.setup();
      const handleOuterClick = jest.fn();

      const { container } = render(
        <div onClick={handleOuterClick}>
          <FeedbackBoardPreviewEmail {...defaultProps} />
        </div>,
      );

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      const textField = screen.getByRole("textbox");
      await user.click(textField);

      // stopPropagation should prevent outer click handler from being called
      expect(handleOuterClick).not.toHaveBeenCalled();
    });
  });

  describe("Different Board Content", () => {
    it("should handle different board titles", async () => {
      const customBoard = { ...mockBoard, title: "Sprint 42 Retrospective" };
      const customEmailContent = "Sprint 42 Retrospective email content";

      mockGenerateEmailText.mockResolvedValue(customEmailContent);

      render(<FeedbackBoardPreviewEmail {...defaultProps} board={customBoard} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue(customEmailContent)).toBeInTheDocument();
      });
    });

    it("should handle different team IDs", async () => {
      render(<FeedbackBoardPreviewEmail {...defaultProps} teamId="different-team-789" />);

      await waitFor(() => {
        expect(mockGetBoardUrl).toHaveBeenCalledWith("different-team-789", "board-123", WorkflowPhase.Collect);
      });
    });

    it("should handle empty email content", async () => {
      mockGenerateEmailText.mockResolvedValue("");

      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      // With empty string, component still shows loading spinner initially but never renders content
      // The component checks for falsy emailContent, and empty string is falsy in the render check
      await waitFor(() => {
        // Empty string is still treated as "no content" so spinner stays
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });
    });

    it("should handle multiline email content", async () => {
      const multilineContent = "Line 1\nLine 2\nLine 3\nLine 4";
      mockGenerateEmailText.mockResolvedValue(multilineContent);

      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        const textField = screen.getByRole("textbox");
        expect(textField).toHaveValue(multilineContent);
      });
    });
  });

  describe("Component Ref", () => {
    it("should not throw error when text field ref is not yet set", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardPreviewEmail {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      // This should not throw even if ref is not fully initialized
      const textField = screen.getByRole("textbox");
      await user.click(textField);

      expect(textField).toBeInTheDocument();
    });
  });
});
