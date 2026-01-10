import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeedbackItemTimer, { formatTimer, IFeedbackItemTimerProps } from "../feedbackItemTimer";

// Mock the icons module
jest.mock("../icons", () => {
  const React = require("react");
  return {
    __esModule: true,
    getIconElement: jest.fn((name: string) => React.createElement("span", { "data-testid": `icon-${name}` }, name)),
  };
});

describe("FeedbackItemTimer", () => {
  const defaultProps: IFeedbackItemTimerProps = {
    feedbackItemId: "test-item-id",
    timerSecs: 0,
    timerState: false,
    onTimerToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("formatTimer utility", () => {
    it("should format 0 seconds as 0:00", () => {
      expect(formatTimer(0)).toBe("0:00");
    });

    it("should format 5 seconds as 0:05", () => {
      expect(formatTimer(5)).toBe("0:05");
    });

    it("should format 10 seconds as 0:10", () => {
      expect(formatTimer(10)).toBe("0:10");
    });

    it("should format 59 seconds as 0:59", () => {
      expect(formatTimer(59)).toBe("0:59");
    });

    it("should format 60 seconds as 1:00", () => {
      expect(formatTimer(60)).toBe("1:00");
    });

    it("should format 61 seconds as 1:01", () => {
      expect(formatTimer(61)).toBe("1:01");
    });

    it("should format 125 seconds as 2:05", () => {
      expect(formatTimer(125)).toBe("2:05");
    });

    it("should format 3661 seconds as 61:01", () => {
      expect(formatTimer(3661)).toBe("61:01");
    });

    it("should format 599 seconds as 9:59", () => {
      expect(formatTimer(599)).toBe("9:59");
    });

    it("should format 600 seconds as 10:00", () => {
      expect(formatTimer(600)).toBe("10:00");
    });
  });

  describe("Component rendering", () => {
    it("should render with appropriate timer state when stopped", () => {
      render(<FeedbackItemTimer {...defaultProps} />);

      const button = screen.getByRole("button");
      // Timer is stopped - aria-label indicates start action
      expect(button).toHaveAttribute("aria-label", "Start timer");
      // Button should be in the document
      expect(button).toBeInTheDocument();
    });

    it("should render with appropriate timer state when running", () => {
      render(<FeedbackItemTimer {...defaultProps} timerState={true} />);

      const button = screen.getByRole("button");
      // Timer is running - aria-label indicates stop action
      expect(button).toHaveAttribute("aria-label", "Stop timer");
      // Button should be in the document
      expect(button).toBeInTheDocument();
    });

    it("should display formatted time", () => {
      render(<FeedbackItemTimer {...defaultProps} timerSecs={125} />);

      expect(screen.getByText("2:05 elapsed")).toBeInTheDocument();
    });

    it("should have correct aria-label when stopped", () => {
      render(<FeedbackItemTimer {...defaultProps} timerState={false} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Start timer");
    });

    it("should have correct aria-label when running", () => {
      render(<FeedbackItemTimer {...defaultProps} timerState={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Stop timer");
    });

    it("should have correct title attribute", () => {
      render(<FeedbackItemTimer {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Timer");
    });

    it("should have tabIndex -1", () => {
      render(<FeedbackItemTimer {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("tabIndex", "-1");
    });

    it("should have data-card-control attribute", () => {
      render(<FeedbackItemTimer {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-card-control", "true");
    });

    it("should have correct class names", () => {
      render(<FeedbackItemTimer {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("feedback-action-button");
    });
  });

  describe("Interactions", () => {
    it("should call onTimerToggle with feedbackItemId when clicked", () => {
      const onTimerToggle = jest.fn();
      render(<FeedbackItemTimer {...defaultProps} onTimerToggle={onTimerToggle} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onTimerToggle).toHaveBeenCalledTimes(1);
      expect(onTimerToggle).toHaveBeenCalledWith("test-item-id");
    });

    it("should prevent default and stop propagation on click", () => {
      const onTimerToggle = jest.fn();
      render(<FeedbackItemTimer {...defaultProps} onTimerToggle={onTimerToggle} />);

      const button = screen.getByRole("button");
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };

      // Create a custom click event
      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.assign(clickEvent, { preventDefault: event.preventDefault, stopPropagation: event.stopPropagation });

      fireEvent(button, clickEvent);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it("should call onTimerToggle with correct id when clicked multiple times", () => {
      const onTimerToggle = jest.fn();
      render(<FeedbackItemTimer {...defaultProps} feedbackItemId="item-123" onTimerToggle={onTimerToggle} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onTimerToggle).toHaveBeenCalledTimes(3);
      expect(onTimerToggle).toHaveBeenNthCalledWith(1, "item-123");
      expect(onTimerToggle).toHaveBeenNthCalledWith(2, "item-123");
      expect(onTimerToggle).toHaveBeenNthCalledWith(3, "item-123");
    });
  });

  describe("Timer display updates", () => {
    it("should update display when timerSecs prop changes", () => {
      const { rerender } = render(<FeedbackItemTimer {...defaultProps} timerSecs={0} />);
      expect(screen.getByText("0:00 elapsed")).toBeInTheDocument();

      rerender(<FeedbackItemTimer {...defaultProps} timerSecs={60} />);
      expect(screen.getByText("1:00 elapsed")).toBeInTheDocument();

      rerender(<FeedbackItemTimer {...defaultProps} timerSecs={125} />);
      expect(screen.getByText("2:05 elapsed")).toBeInTheDocument();
    });

    it("should update aria-label when timerState prop changes", () => {
      const { rerender } = render(<FeedbackItemTimer {...defaultProps} timerState={false} />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Start timer");

      rerender(<FeedbackItemTimer {...defaultProps} timerState={true} />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Stop timer");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-live polite for screen readers", () => {
      render(<FeedbackItemTimer {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-live", "polite");
    });

    it("should announce timer state change to screen readers", () => {
      const { rerender } = render(<FeedbackItemTimer {...defaultProps} timerState={false} />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Start timer");

      rerender(<FeedbackItemTimer {...defaultProps} timerState={true} />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Stop timer");
    });
  });

  describe("Edge cases", () => {
    it("should handle very large timer values", () => {
      render(<FeedbackItemTimer {...defaultProps} timerSecs={36000} />);
      expect(screen.getByText("600:00 elapsed")).toBeInTheDocument();
    });

    it("should handle boundary value at 9 seconds (single digit)", () => {
      render(<FeedbackItemTimer {...defaultProps} timerSecs={9} />);
      expect(screen.getByText("0:09 elapsed")).toBeInTheDocument();
    });

    it("should handle boundary value at 10 seconds (double digit)", () => {
      render(<FeedbackItemTimer {...defaultProps} timerSecs={10} />);
      expect(screen.getByText("0:10 elapsed")).toBeInTheDocument();
    });
  });
});
