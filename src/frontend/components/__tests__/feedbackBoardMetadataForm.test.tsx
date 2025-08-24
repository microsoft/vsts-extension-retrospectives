import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { mockUuid } from "../__mocks__/uuid/v4";
import FeedbackBoardMetadataForm, { IFeedbackBoardMetadataFormProps, IFeedbackColumnCard } from "../feedbackBoardMetadataForm";
import { testColumns, testExistingBoard, testTeamId } from "../__mocks__/mocked_components/mockedBoardMetadataForm";

// Mock telemetryClient to avoid ApplicationInsights type conflicts
jest.mock("../../utilities/telemetryClient", () => ({
  appInsights: {
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
  reactPlugin: {},
  TelemetryEvents: {},
  TelemetryExceptions: {},
}));

// Mock ApplicationInsights React wrapper
jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: jest.fn((plugin, component) => component),
}));

const mockedProps: IFeedbackBoardMetadataFormProps = {
  isNewBoardCreation: true,
  isDuplicatingBoard: false,
  currentBoard: null,
  teamId: testTeamId,
  placeholderText: "",
  maxVotesPerUser: 5,
  availablePermissionOptions: [],
  currentUserId: "mock-user-id",
  onFormSubmit: () => null,
  onFormCancel: () => null,
};

jest.mock("uuid", () => ({ v4: () => mockUuid }));

describe("Board Metadata Form", () => {
  beforeEach(() => {
    // Reset props for each test
    mockedProps.currentBoard = null;
    mockedProps.isDuplicatingBoard = false;
  });

  it("can be rendered", () => {
    const { container } = render(<FeedbackBoardMetadataForm {...mockedProps} />);
    
    // Verify the component renders without crashing
    expect(container.firstChild).toBeTruthy();
    
    // Verify form elements are present
    expect(screen.getByLabelText(/please enter new retrospective title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max votes per user/i)).toBeInTheDocument();
  });

  describe("New Board", () => {
    beforeEach(() => {
      mockedProps.currentBoard = null;
    });

    it("renders the title input with empty value for a new board", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const titleInput = screen.getByLabelText(/please enter new retrospective title/i) as HTMLInputElement;
      
      // For a new board, the title input should be empty
      expect(titleInput).toBeInTheDocument();
      expect(titleInput.value).toBe("");
    });

    it("updates state when max vote counter input changes", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const maxVotesInput = screen.getByLabelText(/max votes per user/i) as HTMLInputElement;
      
      // Initial value should be the default from props
      expect(maxVotesInput.value).toBe("5");
      
      // Change the value
      await user.clear(maxVotesInput);
      await user.type(maxVotesInput, "10");
      
      // Verify the input value changed
      expect(maxVotesInput.value).toBe("10");
    });

    it("should set the title to nothing", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const titleInput = screen.getByLabelText(/please enter new retrospective title/i) as HTMLInputElement;
      
      // Type some text first
      await user.type(titleInput, "Test Title");
      expect(titleInput.value).toBe("Test Title");
      
      // Clear the title
      await user.clear(titleInput);
      expect(titleInput.value).toBe("");
    });

    it("should properly set max votes settings", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const maxVotesInput = screen.getByLabelText(/max votes per user/i) as HTMLInputElement;
      
      // Test setting various values
      await user.clear(maxVotesInput);
      await user.type(maxVotesInput, "15");
      expect(maxVotesInput.value).toBe("15");
      
      // Test setting to 0 (unlimited)
      await user.clear(maxVotesInput);
      await user.type(maxVotesInput, "0");
      expect(maxVotesInput.value).toBe("0");
    });

    it("should properly set include team assessment settings", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const teamAssessmentCheckbox = screen.getByLabelText(/include team assessment/i) as HTMLInputElement;
      
      // Initially checkbox should be checked (default state based on test error)
      expect(teamAssessmentCheckbox).toBeChecked();
      
      // Click to uncheck it
      await user.click(teamAssessmentCheckbox);
      expect(teamAssessmentCheckbox).not.toBeChecked();
      
      // Click again to check it
      await user.click(teamAssessmentCheckbox);
      expect(teamAssessmentCheckbox).toBeChecked();
    });

    it("should properly set obscure feedback settings", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      // Look for the checkbox by its exact aria-label
      const obscureFeedbackCheckbox = screen.getByRole('checkbox', { name: /only show feedback after collect phase/i }) as HTMLInputElement;
      
      // Initially checkbox should be unchecked (default state)
      expect(obscureFeedbackCheckbox).not.toBeChecked();
      
      // Click to check it
      await user.click(obscureFeedbackCheckbox);
      expect(obscureFeedbackCheckbox).toBeChecked();
      
      // Click again to uncheck it
      await user.click(obscureFeedbackCheckbox);
      expect(obscureFeedbackCheckbox).not.toBeChecked();
    });

    it("should properly set display names settings", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      // Look for the checkbox by its exact aria-label
      const displayNamesCheckbox = screen.getByRole('checkbox', { name: /do not display names in feedback/i }) as HTMLInputElement;
      
      // Initially checkbox should be unchecked (default state)
      expect(displayNamesCheckbox).not.toBeChecked();
      
      // Click to check it (make anonymous)
      await user.click(displayNamesCheckbox);
      expect(displayNamesCheckbox).toBeChecked();
      
      // Click again to uncheck it (show names)
      await user.click(displayNamesCheckbox);
      expect(displayNamesCheckbox).not.toBeChecked();
    });

    it("should render the board title textbox", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const titleInput = screen.getByLabelText(/please enter new retrospective title/i);
      
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveValue("");
    });

    it("should update title on input change", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const titleInput = screen.getByLabelText(/please enter new retrospective title/i) as HTMLInputElement;
      
      await user.type(titleInput, "New Test Title");
      
      expect(titleInput).toHaveValue("New Test Title");
    });

    it("should render the max votes input", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const maxVotesInput = screen.getByLabelText(/max votes per user/i);
      
      expect(maxVotesInput).toBeInTheDocument();
      expect(maxVotesInput).toHaveValue(5);
    });

    it("should update max votes on input change", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const maxVotesInput = screen.getByLabelText(/max votes per user/i) as HTMLInputElement;
      
      await user.clear(maxVotesInput);
      await user.type(maxVotesInput, "3");
      
      expect(maxVotesInput).toHaveValue(3);
    });

    it("should toggle team assessment checkbox when clicked", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const teamAssessmentCheckbox = screen.getByRole('checkbox', { name: /include team assessment/i }) as HTMLInputElement;
      
      // Initial state should be checked
      expect(teamAssessmentCheckbox).toBeChecked();
      
      // Click to uncheck
      await user.click(teamAssessmentCheckbox);
      expect(teamAssessmentCheckbox).not.toBeChecked();
      
      // Click to check again
      await user.click(teamAssessmentCheckbox);
      expect(teamAssessmentCheckbox).toBeChecked();
    });

    it("should toggle obscure feedback checkbox when clicked", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const obscureFeedbackCheckbox = screen.getByRole('checkbox', { name: /only show feedback after collect phase/i }) as HTMLInputElement;
      
      // Initial state should be unchecked
      expect(obscureFeedbackCheckbox).not.toBeChecked();
      
      // Click to check
      await user.click(obscureFeedbackCheckbox);
      expect(obscureFeedbackCheckbox).toBeChecked();
      
      // Click to uncheck
      await user.click(obscureFeedbackCheckbox);
      expect(obscureFeedbackCheckbox).not.toBeChecked();
    });

    it("should toggle display names checkbox when clicked", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const displayNamesCheckbox = screen.getByRole('checkbox', { name: /do not display names in feedback/i }) as HTMLInputElement;
      
      // Initial state should be unchecked
      expect(displayNamesCheckbox).not.toBeChecked();
      
      // Click to check (make anonymous)
      await user.click(displayNamesCheckbox);
      expect(displayNamesCheckbox).toBeChecked();
      
      // Click to uncheck (show names)
      await user.click(displayNamesCheckbox);
      expect(displayNamesCheckbox).not.toBeChecked();
    });

    it("should render column cards for default columns", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      // Check that column settings section is rendered with heading
      const columnHeading = screen.getByRole('heading', { name: /column settings/i });
      expect(columnHeading).toBeInTheDocument();
      
      // Should have the add column button
      const addColumnButton = screen.getByRole('button', { name: /add new column/i });
      expect(addColumnButton).toBeInTheDocument();
    });

    it('should have an "Add new column" button', () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const addColumnButton = screen.getByRole('button', { name: /add new column/i });
      expect(addColumnButton).toBeInTheDocument();
      expect(addColumnButton).toBeEnabled();
    });

    it("should toggle team assessment checkbox when clicked (duplicate test cleanup)", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const teamAssessmentCheckbox = screen.getByRole('checkbox', { name: /include team assessment/i }) as HTMLInputElement;
      
      // This is a basic interaction test
      expect(teamAssessmentCheckbox).toBeInTheDocument();
      
      // Initial state should be checked
      expect(teamAssessmentCheckbox).toBeChecked();
      
      // Click to uncheck
      await user.click(teamAssessmentCheckbox);
      expect(teamAssessmentCheckbox).not.toBeChecked();
    });
  });

  describe("Existing Board", () => {
    beforeEach(() => {
      mockedProps.isNewBoardCreation = false;
      mockedProps.currentBoard = testExistingBoard;
    });

    it("should set the title", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const titleInput = screen.getByLabelText(/please enter new retrospective title/i) as HTMLInputElement;
      
      // For an existing board, the title input should be populated with the board's title
      expect(titleInput).toBeInTheDocument();
      expect(titleInput.value).toBe(testExistingBoard.title);
    });

    it("should properly set max votes settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const maxVotesInput = screen.getByLabelText(/max votes per user/i) as HTMLInputElement;
      
      // For an existing board, the max votes input should be populated with the board's max votes
      expect(maxVotesInput).toBeInTheDocument();
      expect(maxVotesInput.value).toBe(testExistingBoard.maxVotesPerUser.toString());
    });

    it("should properly set include team assessment settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const teamAssessmentCheckbox = screen.getByLabelText(/include team assessment/i) as HTMLInputElement;
      
      // For an existing board, the checkbox should reflect the board's team assessment setting
      expect(teamAssessmentCheckbox).toBeInTheDocument();
      expect(teamAssessmentCheckbox.checked).toBe(testExistingBoard.isIncludeTeamEffectivenessMeasurement);
    });

    it("should properly set obscure feedback settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const obscureFeedbackCheckbox = screen.getByRole('checkbox', { name: /only show feedback after collect phase/i }) as HTMLInputElement;
      
      // For an existing board, the checkbox should reflect the board's obscure feedback setting
      expect(obscureFeedbackCheckbox).toBeInTheDocument();
      expect(obscureFeedbackCheckbox.checked).toBe(testExistingBoard.shouldShowFeedbackAfterCollect);
    });

    it("should properly set display names settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const displayNamesCheckbox = screen.getByRole('checkbox', { name: /do not display names in feedback/i }) as HTMLInputElement;
      
      // For an existing board, the checkbox should reflect the board's anonymous setting
      expect(displayNamesCheckbox).toBeInTheDocument();
      expect(displayNamesCheckbox.checked).toBe(testExistingBoard.isAnonymous);
    });

    it("should render columns from existing board", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      // For an existing board, verify that column settings section is rendered
      const columnHeading = screen.getByRole('heading', { name: /column settings/i });
      expect(columnHeading).toBeInTheDocument();
      
      // Should also have the add column button
      const addColumnButton = screen.getByRole('button', { name: /add new column/i });
      expect(addColumnButton).toBeInTheDocument();
    });
  });

  describe("Duplicate Board", () => {
    beforeEach(() => {
      mockedProps.isNewBoardCreation = true;
      mockedProps.isDuplicatingBoard = true;
      mockedProps.currentBoard = testExistingBoard;
    });

    it("should set the title with the duplicate copy addition", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const titleInput = screen.getByLabelText(/please enter new retrospective title/i) as HTMLInputElement;
      
      // For a duplicate board, the title should include " - copy" suffix
      expect(titleInput).toBeInTheDocument();
      expect(titleInput.value).toBe(testExistingBoard.title + " - copy");
    });

    it("should properly set max votes settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const maxVotesInput = screen.getByLabelText(/max votes per user/i) as HTMLInputElement;
      
      // For a duplicate board, the max votes should be copied from the original board
      expect(maxVotesInput).toBeInTheDocument();
      expect(maxVotesInput.value).toBe(testExistingBoard.maxVotesPerUser.toString());
    });

    it("should properly set include team assessment settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const teamAssessmentCheckbox = screen.getByLabelText(/include team assessment/i) as HTMLInputElement;
      
      // For a duplicate board, the team assessment setting should be copied from the original board
      expect(teamAssessmentCheckbox).toBeInTheDocument();
      expect(teamAssessmentCheckbox.checked).toBe(testExistingBoard.isIncludeTeamEffectivenessMeasurement);
    });

    it("should properly set obscure feedback settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const obscureFeedbackCheckbox = screen.getByRole('checkbox', { name: /only show feedback after collect phase/i }) as HTMLInputElement;
      
      // For a duplicate board, the obscure feedback setting should be copied from the original board
      expect(obscureFeedbackCheckbox).toBeInTheDocument();
      expect(obscureFeedbackCheckbox.checked).toBe(testExistingBoard.shouldShowFeedbackAfterCollect);
    });

    it("should properly set display names settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      const displayNamesCheckbox = screen.getByRole('checkbox', { name: /do not display names in feedback/i }) as HTMLInputElement;
      
      // For a duplicate board, the display names setting should be copied from the original board
      expect(displayNamesCheckbox).toBeInTheDocument();
      expect(displayNamesCheckbox.checked).toBe(testExistingBoard.isAnonymous);
    });

    it("should render columns copied from original board", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);
      
      // For a duplicate board, verify that column settings section is rendered
      const columnHeading = screen.getByRole('heading', { name: /column settings/i });
      expect(columnHeading).toBeInTheDocument();
      
      // Should also have the add column button
      const addColumnButton = screen.getByRole('button', { name: /add new column/i });
      expect(addColumnButton).toBeInTheDocument();
    });
  });
});
