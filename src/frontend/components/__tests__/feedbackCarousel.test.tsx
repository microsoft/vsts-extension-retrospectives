import React from "react";
import { render } from "@testing-library/react";
import FeedbackCarousel from "../../components/feedbackCarousel";
import FeedbackItem from "../../components/feedbackItem";
import { testGroupColumnProps, testColumnProps, testGroupFeedbackItemTwo } from "../__mocks__/mocked_components/mockedFeedbackColumn";
import { mockUuid } from "../__mocks__/uuid/v4";

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
  },
}));

const mockedProps = {
  feedbackColumnPropsList: [testColumnProps],
  isFeedbackAnonymous: true,
  isFocusModalHidden: false,
};

const mockedGroupProps = {
  feedbackColumnPropsList: [testGroupColumnProps],
  isFeedbackAnonymous: true,
  isFocusModalHidden: false,
};

jest.mock("uuid", () => ({ v4: () => mockUuid }));

describe("Feedback Carousel ", () => {
  it("can be rendered", () => {
    const { container } = render(<FeedbackCarousel {...mockedProps} />);
    const carouselPivot = container.querySelector(".feedback-carousel-pivot");
    expect(carouselPivot).toBeTruthy();

    expect(container.textContent).toContain(testColumnProps.columnName);
  });

  test("that groupIds are empty when there are no children", () => {
    const { container } = render(<FeedbackCarousel {...mockedProps} />);

    const carouselItems = container.querySelectorAll(".feedback-carousel-item");
    expect(carouselItems.length).toBeGreaterThanOrEqual(0);
  });

  test("that groupIds are populate when there are children", () => {
    const { container } = render(<FeedbackCarousel {...mockedGroupProps} />);

    const carouselItems = container.querySelectorAll(".feedback-carousel-item");
    expect(carouselItems.length).toBeGreaterThanOrEqual(0);
  });

  describe("'All' column", () => {
    it("should be set by default in the first position", () => {
      const { container } = render(<FeedbackCarousel {...mockedProps} />);

      expect(container.textContent).toContain("All");
    });

    it("should not exist when there are no feedback columns", () => {
      const { container } = render(<FeedbackCarousel feedbackColumnPropsList={[]} isFeedbackAnonymous={true} isFocusModalHidden={false} />);

      expect(container.textContent).not.toContain("All");
    });
  });
});
