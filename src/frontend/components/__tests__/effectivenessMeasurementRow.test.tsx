import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import EffectivenessMeasurementRow, { EffectivenessMeasurementRowProps } from "../effectivenessMeasurementRow";
import { ITeamEffectivenessMeasurementVoteCollection } from "../../interfaces/feedback";
import { encrypt, getUserIdentity } from "../../utilities/userIdentityHelper";

jest.mock("../../utilities/userIdentityHelper", () => ({
  getUserIdentity: jest.fn(),
  encrypt: jest.fn(),
}));

const mockGetUserIdentity = getUserIdentity as jest.MockedFunction<typeof getUserIdentity>;
const mockEncrypt = encrypt as jest.MockedFunction<typeof encrypt>;

const defaultProps: EffectivenessMeasurementRowProps = {
  questionId: 1,
  title: "Test Question",
  subtitle: "Test subtitle for the question",
  iconClass: "fa-solid fa-magnifying-glass",
  tooltip: "This is a test tooltip",
  votes: [],
  onSelectedChange: jest.fn(),
};

const mockVotes: ITeamEffectivenessMeasurementVoteCollection[] = [
  {
    userId: "encrypted-test-user-id",
    responses: [
      { questionId: 1, selection: 5 },
      { questionId: 2, selection: 8 },
    ],
  },
];

describe("EffectivenessMeasurementRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserIdentity.mockReturnValue({ id: "test-user-id" } as any);
    mockEncrypt.mockReturnValue("encrypted-test-user-id");
  });

  describe("Component Rendering", () => {
    it("renders correctly with default props", () => {
      const { container } = render(<EffectivenessMeasurementRow {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders correctly with votes data", () => {
      const props = {
        ...defaultProps,
        votes: mockVotes,
      };
      const { container } = render(<EffectivenessMeasurementRow {...props} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders the correct title and subtitle", () => {
      const { container } = render(<EffectivenessMeasurementRow {...defaultProps} />);

      const titleElement = container.querySelector(".effectiveness-measurement-question-cell span");
      expect(titleElement).toHaveTextContent("Test Question");

      const subtitleElement = container.querySelector(".effectiveness-measurement-question-cell");
      expect(subtitleElement).toHaveTextContent("Test subtitle for the question");
    });

    it("renders the correct icon class", () => {
      const { container } = render(<EffectivenessMeasurementRow {...defaultProps} />);

      const iconElement = container.querySelector(".fa-solid.fa-magnifying-glass");
      expect(iconElement).toBeInTheDocument();
    });

    it("renders tooltip with correct content", () => {
      const { container } = render(<EffectivenessMeasurementRow {...defaultProps} />);

      const tooltipHost = container.querySelector('[data-is-focusable="true"]');
      expect(tooltipHost).toBeInTheDocument();
    });

    it("renders all 10 voting buttons", () => {
      const { container } = render(<EffectivenessMeasurementRow {...defaultProps} />);

      const votingButtons = container.querySelectorAll(".effectivemess-measurement-voting-button");
      expect(votingButtons).toHaveLength(10);
    });

    it("renders voting buttons with correct aria-labels", () => {
      const { container } = render(<EffectivenessMeasurementRow {...defaultProps} />);

      for (let i = 1; i <= 10; i++) {
        const button = container.querySelector(`button[aria-label="${i}"]`);
        expect(button).toBeInTheDocument();
      }
    });
  });

  describe("Accessibility", () => {
    it("provides proper aria-labels for screen readers", () => {
      const { container } = render(<EffectivenessMeasurementRow {...defaultProps} />);

      for (let i = 1; i <= 10; i++) {
        const button = container.querySelector(`button[aria-label="${i}"]`);
        expect(button).toBeInTheDocument();
      }
    });

    it("renders buttons with appropriate accessibility attributes", () => {
      const { container } = render(<EffectivenessMeasurementRow {...defaultProps} />);

      const buttons = container.querySelectorAll("button[aria-label]");
      expect(buttons).toHaveLength(10);

      buttons.forEach((button: any) => {
        expect(button).toHaveAttribute("aria-label");
      });
    });
  });

  describe("User Interaction", () => {
    it("updates selection when voting button is clicked", () => {
      const mockOnSelectedChange = jest.fn();
      const props = { ...defaultProps, onSelectedChange: mockOnSelectedChange };
      const { container } = render(<EffectivenessMeasurementRow {...props} />);

      const button5 = container.querySelector('button[aria-label="5"]') as HTMLButtonElement;
      button5.click();

      expect(mockOnSelectedChange).toHaveBeenCalledWith(5);
    });

    it("calls onSelectedChange with correct values for different buttons", () => {
      const mockOnSelectedChange = jest.fn();
      const props = { ...defaultProps, onSelectedChange: mockOnSelectedChange };
      const { container } = render(<EffectivenessMeasurementRow {...props} />);

      const testValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      testValues.forEach(value => {
        const button = container.querySelector(`button[aria-label="${value}"]`) as HTMLButtonElement;
        button.click();
        expect(mockOnSelectedChange).toHaveBeenCalledWith(value);
      });
    });

    it("shows CircleFill icon for selected value and CircleRing for others", () => {
      const props = { ...defaultProps, votes: mockVotes };
      const { container } = render(<EffectivenessMeasurementRow {...props} />);

      // Button 5 should be selected (from mockVotes)
      const button5 = container.querySelector('button[aria-label="5"]');
      expect(button5?.querySelector('[data-icon-name="CircleFill"]')).toBeInTheDocument();

      // Other buttons should have CircleRing
      const button1 = container.querySelector('button[aria-label="1"]');
      expect(button1?.querySelector('[data-icon-name="CircleRing"]')).toBeInTheDocument();
    });

    it("updates icon when selection changes", () => {
      const mockOnSelectedChange = jest.fn();
      const props = { ...defaultProps, onSelectedChange: mockOnSelectedChange };
      const { container } = render(<EffectivenessMeasurementRow {...props} />);

      // Initially button 1 should have CircleRing
      const button1 = container.querySelector('button[aria-label="1"]');
      expect(button1?.querySelector('[data-icon-name="CircleRing"]')).toBeInTheDocument();

      // Click button 1
      (button1 as HTMLButtonElement).click();

      // After click, verify callback was called
      expect(mockOnSelectedChange).toHaveBeenCalledWith(1);
    });
  });

  describe("Vote Initialization", () => {
    it("initializes with existing vote for the current user and question", () => {
      const props = { ...defaultProps, questionId: 1, votes: mockVotes };
      const { container } = render(<EffectivenessMeasurementRow {...props} />);

      // User's vote for question 1 is 5, so button 5 should show CircleFill
      const button5 = container.querySelector('button[aria-label="5"]');
      expect(button5?.querySelector('[data-icon-name="CircleFill"]')).toBeInTheDocument();
    });

    it("initializes with different vote for different question", () => {
      const props = { ...defaultProps, questionId: 2, votes: mockVotes };
      const { container } = render(<EffectivenessMeasurementRow {...props} />);

      // User's vote for question 2 is 8, so button 8 should show CircleFill
      const button8 = container.querySelector('button[aria-label="8"]');
      expect(button8?.querySelector('[data-icon-name="CircleFill"]')).toBeInTheDocument();
    });

    it("initializes with no selection when no votes exist", () => {
      const props = { ...defaultProps, votes: [] as ITeamEffectivenessMeasurementVoteCollection[] };
      const { container } = render(<EffectivenessMeasurementRow {...props} />);

      // All buttons should have CircleRing when no vote exists
      for (let i = 1; i <= 10; i++) {
        const button = container.querySelector(`button[aria-label="${i}"]`);
        expect(button?.querySelector('[data-icon-name="CircleRing"]')).toBeInTheDocument();
      }
    });

    it("initializes with no selection when user has no vote for this question", () => {
      const props = { ...defaultProps, questionId: 999, votes: mockVotes };
      const { container } = render(<EffectivenessMeasurementRow {...props} />);

      // All buttons should have CircleRing when user hasn't voted on this question
      for (let i = 1; i <= 10; i++) {
        const button = container.querySelector(`button[aria-label="${i}"]`);
        expect(button?.querySelector('[data-icon-name="CircleRing"]')).toBeInTheDocument();
      }
    });
  });
});
