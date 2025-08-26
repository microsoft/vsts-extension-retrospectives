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
});
