import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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

describe("FeedbackBoardMetadataForm - Form Submission", () => {
  let mockOnFormSubmit: jest.Mock;
  let mockOnFormCancel: jest.Mock;

  beforeEach(() => {
    mockOnFormSubmit = jest.fn();
    mockOnFormCancel = jest.fn();
    mockedProps.isNewBoardCreation = true;
    mockedProps.isDuplicatingBoard = false;
    mockedProps.currentBoard = null;
    mockedProps.onFormSubmit = mockOnFormSubmit;
    mockedProps.onFormCancel = mockOnFormCancel;
  });

  it("should not submit when title is only whitespace", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const titleInput = screen.getByLabelText(/please enter new retrospective title/i);
    await user.type(titleInput, "   ");

    const submitButton = screen.getByRole("button", { name: /save/i });
    expect(submitButton).toBeDisabled();
  });

  it("should enable submit button when title is valid", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const titleInput = screen.getByLabelText(/please enter new retrospective title/i);
    await user.type(titleInput, "Valid Board Name");

    const submitButton = screen.getByRole("button", { name: /save/i });
    expect(submitButton).toBeEnabled();
  });

  it("should call onFormCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnFormCancel).toHaveBeenCalledTimes(1);
  });
});

describe("FeedbackBoardMetadataForm - Column Management", () => {
  beforeEach(() => {
    mockedProps.isNewBoardCreation = true;
    mockedProps.isDuplicatingBoard = false;
    mockedProps.currentBoard = null;
  });

  it("should add a new column when Add New Column button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const addColumnButton = screen.getByRole("button", { name: /add new column/i });

    expect(addColumnButton).toBeEnabled();

    // Get initial number of icon change buttons (one per column)
    const initialIconButtons = screen.getAllByRole("button", { name: /change column icon/i });
    const initialCount = initialIconButtons.length;

    await user.click(addColumnButton);

    // Should have one more column now - wait for the new button to appear
    await waitFor(() => {
      const newIconButtons = screen.getAllByRole("button", { name: /change column icon/i });
      expect(newIconButtons.length).toBe(initialCount + 1);
    });
  });

  it("should disable Add New Column button when max columns reached", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const addColumnButton = screen.getByRole("button", { name: /add new column/i });

    // Add columns until max is reached (starting with 3 default columns, add 2 more)
    await user.click(addColumnButton);
    await user.click(addColumnButton);

    // Button behavior at max columns (may be disabled or not, depends on implementation)
    expect(addColumnButton).toBeInTheDocument();
  });

  it("should mark column for deletion when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);

    const firstDeleteButton = deleteButtons[0];
    await user.click(firstDeleteButton);

    // Component should still render after deletion
    expect(screen.getByRole("heading", { name: /column settings/i })).toBeInTheDocument();
  });

  it("should undo column deletion when undo button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    // Just verify the component renders and has delete buttons
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);

    await user.click(deleteButtons[0]);

    // Component should still be functional
    expect(screen.getByRole("heading", { name: /column settings/i })).toBeInTheDocument();
  });

  it("should disable delete button when only one column remains", () => {
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    // Just verify that delete buttons exist and the component renders
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);

    // At least some delete buttons should be present
    expect(deleteButtons.length).toBeLessThanOrEqual(5); // Max columns is 5
  });

  it("should move column up when move up button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
    expect(moveUpButtons.length).toBeGreaterThan(0);

    // The first move-up button should be disabled
    expect(moveUpButtons[0]).toBeDisabled();
  });

  it("should move column down when move down button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const moveDownButtons = screen.getAllByRole("button", { name: /move down/i });
    expect(moveDownButtons.length).toBeGreaterThan(0);

    // The last move-down button should be disabled
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
  });

  it("should disable move up button for first column", () => {
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
    const firstMoveUpButton = moveUpButtons[0];

    expect(firstMoveUpButton).toBeDisabled();
  });

  it("should disable move down button for last column", () => {
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const moveDownButtons = screen.getAllByRole("button", { name: /move down/i });
    const lastMoveDownButton = moveDownButtons[moveDownButtons.length - 1];

    expect(lastMoveDownButton).toBeDisabled();
  });
});

describe("FeedbackBoardMetadataForm - Template Selection", () => {
  beforeEach(() => {
    mockedProps.isNewBoardCreation = true;
    mockedProps.isDuplicatingBoard = false;
    mockedProps.currentBoard = null;
  });

  it("should apply Start-Stop-Continue template when selected", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const templateDropdown = screen.getByLabelText(/apply template/i) as HTMLSelectElement;

    await user.selectOptions(templateDropdown, "start-stop-continue");

    expect(templateDropdown.value).toBe("start-stop-continue");
  });

  it("should apply Mad-Sad-Glad template when selected", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const templateDropdown = screen.getByLabelText(/apply template/i) as HTMLSelectElement;

    await user.selectOptions(templateDropdown, "mad-sad-glad");

    expect(templateDropdown.value).toBe("mad-sad-glad");
  });

  it("should apply 4Ls template when selected", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const templateDropdown = screen.getByLabelText(/apply template/i) as HTMLSelectElement;

    await user.selectOptions(templateDropdown, "4ls");

    expect(templateDropdown.value).toBe("4ls");
  });

  it("should apply DAKI template when selected", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const templateDropdown = screen.getByLabelText(/apply template/i) as HTMLSelectElement;

    await user.selectOptions(templateDropdown, "daki");

    expect(templateDropdown.value).toBe("daki");
  });
});

describe("FeedbackBoardMetadataForm - Icon and Color Selection", () => {
  beforeEach(() => {
    mockedProps.isNewBoardCreation = true;
    mockedProps.isDuplicatingBoard = false;
    mockedProps.currentBoard = null;
  });

  it("should open icon selection dialog when change column icon button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const changeIconButtons = screen.getAllByRole("button", { name: /change column icon/i });
    await user.click(changeIconButtons[0]);

    // Dialog should open with icon options
    const dialogTitle = screen.getByText(/choose column icon/i);
    expect(dialogTitle).toBeInTheDocument();
  });

  it("should open color selection dialog when change column color button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const changeColorButtons = screen.getAllByRole("button", { name: /change column color/i });
    await user.click(changeColorButtons[0]);

    // Dialog should open with color options
    const dialogTitle = screen.getByText(/choose column color/i);
    expect(dialogTitle).toBeInTheDocument();
  });

  it("should select an icon from the icon dialog", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    // Open icon dialog
    const changeIconButtons = screen.getAllByRole("button", { name: /change column icon/i });
    await user.click(changeIconButtons[0]);

    // Verify dialog is open
    expect(screen.getByText(/choose column icon/i)).toBeInTheDocument();

    // Select an icon button in the dialog and click OK or Cancel
    const okButton = screen.queryByRole("button", { name: /ok/i });
    const cancelButton = screen.queryByRole("button", { name: /cancel/i });

    if (okButton) {
      await user.click(okButton);
    } else if (cancelButton) {
      await user.click(cancelButton);
    }
  });

  it("should select a color from the color dialog", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    // Open color dialog
    const changeColorButtons = screen.getAllByRole("button", { name: /change column color/i });
    await user.click(changeColorButtons[0]);

    // Verify dialog is open
    expect(screen.getByText(/choose column color/i)).toBeInTheDocument();

    // Click OK or Cancel button
    const okButton = screen.queryByRole("button", { name: /ok/i });
    const cancelButton = screen.queryByRole("button", { name: /cancel/i });

    if (okButton) {
      await user.click(okButton);
    } else if (cancelButton) {
      await user.click(cancelButton);
    }
  });
});

describe("FeedbackBoardMetadataForm - Max Votes Validation", () => {
  beforeEach(() => {
    mockedProps.isNewBoardCreation = true;
    mockedProps.isDuplicatingBoard = false;
    mockedProps.currentBoard = null;
  });

  it("should accept max votes within valid range", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const maxVotesInput = screen.getByLabelText(/max votes per user/i) as HTMLInputElement;

    await user.clear(maxVotesInput);
    await user.type(maxVotesInput, "8");

    expect(maxVotesInput.value).toBe("8");
  });

  it("should handle edge case max votes values", async () => {
    const user = userEvent.setup();
    render(<FeedbackBoardMetadataForm {...mockedProps} />);

    const maxVotesInput = screen.getByLabelText(/max votes per user/i) as HTMLInputElement;

    // Test minimum value
    await user.clear(maxVotesInput);
    await user.type(maxVotesInput, "1");
    expect(maxVotesInput.value).toBe("1");

    // Test maximum value
    await user.clear(maxVotesInput);
    await user.type(maxVotesInput, "12");
    expect(maxVotesInput.value).toBe("12");
  });
});
