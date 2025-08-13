import React from "react";
import { shallow } from "enzyme";
import toJson from "enzyme-to-json";
import { DefaultButton } from "office-ui-fabric-react/lib/Button";
import { TooltipHost } from "office-ui-fabric-react/lib/Tooltip";
import { IdentityRef } from "azure-devops-extension-api/WebApi";
import EffectivenessMeasurementRow, { EffectivenessMeasurementRowProps } from "../effectivenessMeasurementRow";
import { ITeamEffectivenessMeasurementVoteCollection } from "../../interfaces/feedback";
import { encrypt, getUserIdentity } from "../../utilities/userIdentityHelper";

jest.mock("../../utilities/userIdentityHelper", () => ({
  getUserIdentity: jest.fn(() => ({ id: "test-user-id" })),
  encrypt: jest.fn((id: string) => `encrypted-${id}`),
}));

const mockGetUserIdentity = getUserIdentity as jest.MockedFunction<typeof getUserIdentity>;
const mockEncrypt = encrypt as jest.MockedFunction<typeof encrypt>;

const defaultProps: EffectivenessMeasurementRowProps = {
  title: "Test Question",
  subtitle: "Test subtitle for the question",
  iconClass: "fa-solid fa-magnifying-glass",
  tooltip: "This is a test tooltip",
  questionId: 1,
  votes: [],
  selected: 0,
  onSelectedChange: jest.fn(),
};

const mockVotes: ITeamEffectivenessMeasurementVoteCollection[] = [
  {
    userId: "encrypted-test-user-id",
    responses: [
      { questionId: 1, selection: 5 },
      { questionId: 2, selection: 3 },
    ],
  },
  {
    userId: "encrypted-other-user-id",
    responses: [
      { questionId: 1, selection: 7 },
      { questionId: 2, selection: 8 },
    ],
  },
];

describe("EffectivenessMeasurementRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserIdentity.mockReturnValue({ id: "test-user-id" } as IdentityRef);
    mockEncrypt.mockReturnValue("encrypted-test-user-id");
  });

  describe("Component Rendering", () => {
    it("renders correctly with default props", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);
      expect(toJson(wrapper)).toMatchSnapshot();
    });

    it("renders correctly with votes data", () => {
      const props = {
        ...defaultProps,
        votes: mockVotes,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      expect(toJson(wrapper)).toMatchSnapshot();
    });

    it("renders the correct title and subtitle", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      const titleElement = wrapper.find(".effectiveness-measurement-question-cell span");
      expect(titleElement.text()).toBe("Test Question");

      const subtitleElement = wrapper.find(".effectiveness-measurement-question-cell");
      expect(subtitleElement.text()).toContain("Test subtitle for the question");
    });

    it("renders the correct icon class", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      const iconElement = wrapper.find(".fa-solid.fa-magnifying-glass");
      expect(iconElement).toHaveLength(1);
    });

    it("renders tooltip with correct content", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      const tooltipHost = wrapper.find(TooltipHost);
      expect(tooltipHost).toHaveLength(1);
      expect(tooltipHost.prop("content")).toEqual(<div dangerouslySetInnerHTML={{ __html: "This is a test tooltip" }} />);
    });

    it("renders all 10 voting buttons", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      const votingButtons = wrapper.find(".effectivemess-measurement-voting-button");
      expect(votingButtons).toHaveLength(10);
    });

    it("renders voting buttons with correct aria-labels", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      for (let i = 1; i <= 10; i++) {
        const buttons = wrapper.find(DefaultButton).filterWhere(button => button.prop("aria-label") === i.toString());
        expect(buttons).toHaveLength(1);
      }
    });
  });

  describe("State Management", () => {
    it("initializes state with selected value 0 when no votes exist", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      expect(instance.state.selected).toBe(0);
    });

    it("initializes state with user previous vote when votes exist", () => {
      const props = {
        ...defaultProps,
        votes: mockVotes,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      expect(instance.state.selected).toBe(5);
    });

    it("initializes state with 0 when user has no vote for the question", () => {
      const votesWithoutUserResponse: ITeamEffectivenessMeasurementVoteCollection[] = [
        {
          userId: "encrypted-test-user-id",
          responses: [{ questionId: 2, selection: 3 }],
        },
      ];

      const props = {
        ...defaultProps,
        questionId: 1,
        votes: votesWithoutUserResponse,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      expect(instance.state.selected).toBe(0);
    });
  });

  describe("User Interactions", () => {
    it("calls onSelectedChange when a voting button is clicked", () => {
      const mockOnSelectedChange = jest.fn();
      const props = {
        ...defaultProps,
        onSelectedChange: mockOnSelectedChange,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);

      const button3 = wrapper
        .find(DefaultButton)
        .filterWhere(button => button.prop("aria-label") === "3")
        .first();
      const onClick = button3.prop("onClick") as () => void;
      onClick();

      expect(mockOnSelectedChange).toHaveBeenCalledWith(3);
    });

    it("updates internal state when voting button is clicked", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      const button7 = wrapper
        .find(DefaultButton)
        .filterWhere(button => button.prop("aria-label") === "7")
        .first();
      const onClick = button7.prop("onClick") as () => void;
      onClick();

      expect(instance.state.selected).toBe(7);
    });

    it("handles multiple button clicks correctly", () => {
      const mockOnSelectedChange = jest.fn();
      const props = {
        ...defaultProps,
        onSelectedChange: mockOnSelectedChange,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);

      const button2 = wrapper
        .find(DefaultButton)
        .filterWhere(button => button.prop("aria-label") === "2")
        .first();
      const onClick2 = button2.prop("onClick") as () => void;
      onClick2();

      const button8 = wrapper
        .find(DefaultButton)
        .filterWhere(button => button.prop("aria-label") === "8")
        .first();
      const onClick8 = button8.prop("onClick") as () => void;
      onClick8();

      expect(mockOnSelectedChange).toHaveBeenCalledTimes(2);
      expect(mockOnSelectedChange).toHaveBeenNthCalledWith(1, 2);
      expect(mockOnSelectedChange).toHaveBeenNthCalledWith(2, 8);
    });
  });

  describe("Icon States", () => {
    it("shows CircleFill for selected button and CircleRing for others", () => {
      const props = {
        ...defaultProps,
        votes: mockVotes,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);

      const button5 = wrapper
        .find(DefaultButton)
        .filterWhere(button => button.prop("aria-label") === "5")
        .first();
      expect(button5.prop("iconProps")).toEqual({ iconName: "CircleFill" });

      for (let i = 1; i <= 10; i++) {
        if (i !== 5) {
          const button = wrapper
            .find(DefaultButton)
            .filterWhere(button => button.prop("aria-label") === i.toString())
            .first();
          expect(button.prop("iconProps")).toEqual({ iconName: "CircleRing" });
        }
      }
    });

    it("shows all CircleRing icons when no selection is made", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      for (let i = 1; i <= 10; i++) {
        const button = wrapper
          .find(DefaultButton)
          .filterWhere(button => button.prop("aria-label") === i.toString())
          .first();
        expect(button.prop("iconProps")).toEqual({ iconName: "CircleRing" });
      }
    });
  });

  describe("CSS Classes and Structure", () => {
    it("renders with correct table row structure", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      expect(wrapper.type()).toBe("tr");
      expect(wrapper.hasClass("effectiveness-measurement-row")).toBe(true);
    });

    it("renders correct CSS classes for cells", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      const questionCell = wrapper.find(".effectiveness-measurement-question-cell");
      expect(questionCell).toHaveLength(1);

      const tooltipCell = wrapper.find(".effectiveness-measurement-tooltip-cell");
      expect(tooltipCell).toHaveLength(1);
    });

    it("applies hide-mobile class to buttons", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      const allButtons = wrapper.find(DefaultButton);
      allButtons.forEach(button => {
        expect(button.prop("className")).toContain("hide-mobile");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty votes array", () => {
      const props = {
        ...defaultProps,
        votes: [] as ITeamEffectivenessMeasurementVoteCollection[],
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      expect(instance.state.selected).toBe(0);
    });

    it("handles user not found in votes", () => {
      mockEncrypt.mockReturnValue("encrypted-different-user-id");

      const props = {
        ...defaultProps,
        votes: mockVotes,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      expect(instance.state.selected).toBe(0);
    });

    it("handles user with empty responses array", () => {
      const votesWithEmptyResponses: ITeamEffectivenessMeasurementVoteCollection[] = [
        {
          userId: "encrypted-test-user-id",
          responses: [],
        },
      ];

      const props = {
        ...defaultProps,
        votes: votesWithEmptyResponses,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      expect(instance.state.selected).toBe(0);
    });
  });

  describe("Integration with UserIdentityHelper", () => {
    it("calls getUserIdentity and encrypt functions", () => {
      shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      expect(mockGetUserIdentity).toHaveBeenCalled();
      expect(mockEncrypt).toHaveBeenCalledWith("test-user-id");
    });

    it("handles getUserIdentity returning different user", () => {
      mockGetUserIdentity.mockReturnValue({ id: "different-user-id" } as IdentityRef);
      mockEncrypt.mockReturnValue("encrypted-different-user-id");

      const props = {
        ...defaultProps,
        votes: mockVotes,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      expect(instance.state.selected).toBe(0);
    });
  });

  describe("Method Testing", () => {
    it("updateSelected method updates state and calls callback", () => {
      const mockOnSelectedChange = jest.fn();
      const props = {
        ...defaultProps,
        onSelectedChange: mockOnSelectedChange,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      instance.updateSelected(6);

      expect(instance.state.selected).toBe(6);
      expect(mockOnSelectedChange).toHaveBeenCalledWith(6);
    });

    it("updateSelected method can be called multiple times", () => {
      const mockOnSelectedChange = jest.fn();
      const props = {
        ...defaultProps,
        onSelectedChange: mockOnSelectedChange,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      instance.updateSelected(3);
      instance.updateSelected(9);
      instance.updateSelected(1);

      expect(instance.state.selected).toBe(1);
      expect(mockOnSelectedChange).toHaveBeenCalledTimes(3);
      expect(mockOnSelectedChange).toHaveBeenNthCalledWith(1, 3);
      expect(mockOnSelectedChange).toHaveBeenNthCalledWith(2, 9);
      expect(mockOnSelectedChange).toHaveBeenNthCalledWith(3, 1);
    });
  });

  describe("Constructor and Initial State", () => {
    it("correctly filters votes by questionId", () => {
      const mixedVotes: ITeamEffectivenessMeasurementVoteCollection[] = [
        {
          userId: "encrypted-test-user-id",
          responses: [
            { questionId: 1, selection: 3 },
            { questionId: 2, selection: 7 },
            { questionId: 1, selection: 5 },
          ],
        },
      ];

      const props = {
        ...defaultProps,
        questionId: 1,
        votes: mixedVotes,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      expect(instance.state.selected).toBe(3);
    });
  });

  describe("All Voting Button Coverage", () => {
    it("tests all 10 voting buttons individually", () => {
      const mockOnSelectedChange = jest.fn();
      const props = {
        ...defaultProps,
        onSelectedChange: mockOnSelectedChange,
      };
      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);

      for (let i = 1; i <= 10; i++) {
        mockOnSelectedChange.mockClear();

        const button = wrapper
          .find(DefaultButton)
          .filterWhere(btn => btn.prop("aria-label") === i.toString())
          .first();

        const onClick = button.prop("onClick") as () => void;
        onClick();

        expect(mockOnSelectedChange).toHaveBeenCalledWith(i);
      }
    });

    it("verifies all buttons have correct CSS classes", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      for (let i = 1; i <= 10; i++) {
        const button = wrapper
          .find(DefaultButton)
          .filterWhere(btn => btn.prop("aria-label") === i.toString())
          .first();

        expect(button.prop("className")).toContain("contextual-menu-button");
        expect(button.prop("className")).toContain("hide-mobile");
        expect(button.prop("className")).toContain("effectivemess-measurement-voting-button");
      }
    });
  });

  describe("Component Lifecycle and Props", () => {
    it("properly initializes with all props provided", () => {
      const allProps: EffectivenessMeasurementRowProps = {
        title: "Full Test Question",
        subtitle: "Full test subtitle",
        iconClass: "fa-solid fa-magnifying-glass",
        tooltip: "Full test tooltip content",
        questionId: 5,
        votes: mockVotes,
        selected: 3,
        onSelectedChange: jest.fn(),
      };

      const wrapper = shallow(<EffectivenessMeasurementRow {...allProps} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      expect(instance.state.selected).toBe(0);
    });

    it("handles complex vote scenarios", () => {
      const complexVotes: ITeamEffectivenessMeasurementVoteCollection[] = [
        {
          userId: "encrypted-test-user-id",
          responses: [
            { questionId: 1, selection: 10 },
            { questionId: 2, selection: 1 },
            { questionId: 3, selection: 5 },
          ],
        },
        {
          userId: "encrypted-another-user-id",
          responses: [{ questionId: 1, selection: 2 }],
        },
      ];

      const props = {
        ...defaultProps,
        questionId: 1,
        votes: complexVotes,
      };

      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      const instance = wrapper.instance() as EffectivenessMeasurementRow;

      expect(instance.state.selected).toBe(10);
    });
  });

  describe("Tooltip Button Coverage", () => {
    it("renders tooltip button with correct properties", () => {
      const wrapper = shallow(<EffectivenessMeasurementRow {...defaultProps} />);

      const tooltipButton = wrapper.find(DefaultButton).filterWhere(button => button.prop("iconProps")?.iconName === "Error");

      expect(tooltipButton).toHaveLength(1);
      expect(tooltipButton.prop("className")).toContain("contextual-menu-button");
      expect(tooltipButton.prop("className")).toContain("hide-mobile");
    });

    it("renders tooltip with complex HTML content", () => {
      const complexTooltip = "<div><strong>Bold text</strong><br /><em>Italic text</em></div>";
      const props = {
        ...defaultProps,
        tooltip: complexTooltip,
      };

      const wrapper = shallow(<EffectivenessMeasurementRow {...props} />);
      const tooltipHost = wrapper.find(TooltipHost);

      expect(tooltipHost.prop("content")).toEqual(<div dangerouslySetInnerHTML={{ __html: complexTooltip }} />);
    });
  });
});
