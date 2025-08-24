import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { mockUuid } from "../__mocks__/uuid/v4";
import FeedbackBoardMetadataForm, { IFeedbackBoardMetadataFormProps } from "../feedbackBoardMetadataForm";
import { testExistingBoard, testTeamId } from "../__mocks__/mocked_components/mockedBoardMetadataForm";

jest.mock("../../utilities/telemetryClient", () => ({
  appInsights: {
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
  reactPlugin: {},
  TelemetryEvents: {},
  TelemetryExceptions: {},
}));

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
    mockedProps.currentBoard = null;
    mockedProps.isDuplicatingBoard = false;
  });

  it("can be rendered", () => {
    const { container } = render(<FeedbackBoardMetadataForm {...mockedProps} />);

    expect(container.firstChild).toBeTruthy();

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

      expect(titleInput).toBeInTheDocument();
      expect(titleInput.value).toBe("");
    });

    it("updates state when max vote counter input changes", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const maxVotesInput = screen.getByLabelText(/max votes per user/i) as HTMLInputElement;

      expect(maxVotesInput.value).toBe("5");

      await user.clear(maxVotesInput);
      await user.type(maxVotesInput, "10");

      expect(maxVotesInput.value).toBe("10");
    });

    it("should set the title to nothing", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const titleInput = screen.getByLabelText(/please enter new retrospective title/i) as HTMLInputElement;

      await user.type(titleInput, "Test Title");
      expect(titleInput.value).toBe("Test Title");

      await user.clear(titleInput);
      expect(titleInput.value).toBe("");
    });

    it("should properly set max votes settings", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const maxVotesInput = screen.getByLabelText(/max votes per user/i) as HTMLInputElement;

      await user.clear(maxVotesInput);
      await user.type(maxVotesInput, "15");
      expect(maxVotesInput.value).toBe("15");

      await user.clear(maxVotesInput);
      await user.type(maxVotesInput, "0");
      expect(maxVotesInput.value).toBe("0");
    });

    it("should properly set include team assessment settings", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const teamAssessmentCheckbox = screen.getByLabelText(/include team assessment/i) as HTMLInputElement;

      expect(teamAssessmentCheckbox).toBeChecked();

      await user.click(teamAssessmentCheckbox);
      expect(teamAssessmentCheckbox).not.toBeChecked();

      await user.click(teamAssessmentCheckbox);
      expect(teamAssessmentCheckbox).toBeChecked();
    });

    it("should properly set obscure feedback settings", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const obscureFeedbackCheckbox = screen.getByRole("checkbox", { name: /only show feedback after collect phase/i }) as HTMLInputElement;

      expect(obscureFeedbackCheckbox).not.toBeChecked();

      await user.click(obscureFeedbackCheckbox);
      expect(obscureFeedbackCheckbox).toBeChecked();

      await user.click(obscureFeedbackCheckbox);
      expect(obscureFeedbackCheckbox).not.toBeChecked();
    });

    it("should properly set display names settings", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const displayNamesCheckbox = screen.getByRole("checkbox", { name: /do not display names in feedback/i }) as HTMLInputElement;

      expect(displayNamesCheckbox).not.toBeChecked();

      await user.click(displayNamesCheckbox);
      expect(displayNamesCheckbox).toBeChecked();

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

      const teamAssessmentCheckbox = screen.getByRole("checkbox", { name: /include team assessment/i }) as HTMLInputElement;

      expect(teamAssessmentCheckbox).toBeChecked();

      await user.click(teamAssessmentCheckbox);
      expect(teamAssessmentCheckbox).not.toBeChecked();

      await user.click(teamAssessmentCheckbox);
      expect(teamAssessmentCheckbox).toBeChecked();
    });

    it("should toggle obscure feedback checkbox when clicked", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const obscureFeedbackCheckbox = screen.getByRole("checkbox", { name: /only show feedback after collect phase/i }) as HTMLInputElement;

      expect(obscureFeedbackCheckbox).not.toBeChecked();

      await user.click(obscureFeedbackCheckbox);
      expect(obscureFeedbackCheckbox).toBeChecked();

      await user.click(obscureFeedbackCheckbox);
      expect(obscureFeedbackCheckbox).not.toBeChecked();
    });

    it("should toggle display names checkbox when clicked", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const displayNamesCheckbox = screen.getByRole("checkbox", { name: /do not display names in feedback/i }) as HTMLInputElement;

      expect(displayNamesCheckbox).not.toBeChecked();

      await user.click(displayNamesCheckbox);
      expect(displayNamesCheckbox).toBeChecked();

      await user.click(displayNamesCheckbox);
      expect(displayNamesCheckbox).not.toBeChecked();
    });

    it("should render column cards for default columns", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const columnHeading = screen.getByRole("heading", { name: /column settings/i });
      expect(columnHeading).toBeInTheDocument();

      const addColumnButton = screen.getByRole("button", { name: /add new column/i });
      expect(addColumnButton).toBeInTheDocument();
    });

    it('should have an "Add new column" button', () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const addColumnButton = screen.getByRole("button", { name: /add new column/i });
      expect(addColumnButton).toBeInTheDocument();
      expect(addColumnButton).toBeEnabled();
    });

    it("should toggle team assessment checkbox when clicked (duplicate test cleanup)", async () => {
      const user = userEvent.setup();
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const teamAssessmentCheckbox = screen.getByRole("checkbox", { name: /include team assessment/i }) as HTMLInputElement;

      expect(teamAssessmentCheckbox).toBeInTheDocument();

      expect(teamAssessmentCheckbox).toBeChecked();

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

      expect(titleInput).toBeInTheDocument();
      expect(titleInput.value).toBe(testExistingBoard.title);
    });

    it("should properly set max votes settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const maxVotesInput = screen.getByLabelText(/max votes per user/i) as HTMLInputElement;

      expect(maxVotesInput).toBeInTheDocument();
      expect(maxVotesInput.value).toBe(testExistingBoard.maxVotesPerUser.toString());
    });

    it("should properly set include team assessment settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const teamAssessmentCheckbox = screen.getByLabelText(/include team assessment/i) as HTMLInputElement;

      expect(teamAssessmentCheckbox).toBeInTheDocument();
      expect(teamAssessmentCheckbox.checked).toBe(testExistingBoard.isIncludeTeamEffectivenessMeasurement);
    });

    it("should properly set obscure feedback settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const obscureFeedbackCheckbox = screen.getByRole("checkbox", { name: /only show feedback after collect phase/i }) as HTMLInputElement;

      expect(obscureFeedbackCheckbox).toBeInTheDocument();
      expect(obscureFeedbackCheckbox.checked).toBe(testExistingBoard.shouldShowFeedbackAfterCollect);
    });

    it("should properly set display names settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const displayNamesCheckbox = screen.getByRole("checkbox", { name: /do not display names in feedback/i }) as HTMLInputElement;

      expect(displayNamesCheckbox).toBeInTheDocument();
      expect(displayNamesCheckbox.checked).toBe(testExistingBoard.isAnonymous);
    });

    it("should render columns from existing board", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const columnHeading = screen.getByRole("heading", { name: /column settings/i });
      expect(columnHeading).toBeInTheDocument();

      const addColumnButton = screen.getByRole("button", { name: /add new column/i });
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

      expect(titleInput).toBeInTheDocument();
      expect(titleInput.value).toBe(testExistingBoard.title + " - copy");
    });

    it("should properly set max votes settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const maxVotesInput = screen.getByLabelText(/max votes per user/i) as HTMLInputElement;

      expect(maxVotesInput).toBeInTheDocument();
      expect(maxVotesInput.value).toBe(testExistingBoard.maxVotesPerUser.toString());
    });

    it("should properly set include team assessment settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const teamAssessmentCheckbox = screen.getByLabelText(/include team assessment/i) as HTMLInputElement;

      expect(teamAssessmentCheckbox).toBeInTheDocument();
      expect(teamAssessmentCheckbox.checked).toBe(testExistingBoard.isIncludeTeamEffectivenessMeasurement);
    });

    it("should properly set obscure feedback settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const obscureFeedbackCheckbox = screen.getByRole("checkbox", { name: /only show feedback after collect phase/i }) as HTMLInputElement;

      expect(obscureFeedbackCheckbox).toBeInTheDocument();
      expect(obscureFeedbackCheckbox.checked).toBe(testExistingBoard.shouldShowFeedbackAfterCollect);
    });

    it("should properly set display names settings", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const displayNamesCheckbox = screen.getByRole("checkbox", { name: /do not display names in feedback/i }) as HTMLInputElement;

      expect(displayNamesCheckbox).toBeInTheDocument();
      expect(displayNamesCheckbox.checked).toBe(testExistingBoard.isAnonymous);
    });

    it("should render columns copied from original board", () => {
      render(<FeedbackBoardMetadataForm {...mockedProps} />);

      const columnHeading = screen.getByRole("heading", { name: /column settings/i });
      expect(columnHeading).toBeInTheDocument();

      const addColumnButton = screen.getByRole("button", { name: /add new column/i });
      expect(addColumnButton).toBeInTheDocument();
    });
  });
});
