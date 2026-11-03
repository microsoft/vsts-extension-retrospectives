import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import FeedbackCardActivity from "../feedbackCardActivity";
import { getAvatarColor } from "../avatar";

describe("FeedbackCardActivity", () => {
  const renderActivity = (profileImageSrc?: string) => render(<FeedbackCardActivity name="Jane Smith" activity="Created Jan 1, 2025" profileImageSrc={profileImageSrc} />);

  const getAvatar = (container: HTMLElement) => container.querySelector(".feedback-card-activity-avatar") as HTMLElement;

  it("shows who created the item and when", () => {
    renderActivity("https://example.com/jane.png");

    expect(screen.getByText("Jane Smith")).toBeVisible();
    expect(screen.getByText("Created Jan 1, 2025")).toBeVisible();
  });

  it("shows the profile picture and hides the decorative avatar from assistive technology", () => {
    const { container } = renderActivity("https://example.com/jane.png");

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", "https://example.com/jane.png");
    expect(image).toHaveAttribute("alt", "");
    expect(getAvatar(container)).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".avatar-initials")).toBeNull();
  });

  it("shows colored initials when there is no profile picture", () => {
    const { container } = renderActivity();

    const initials = container.querySelector(".avatar-initials");
    expect(initials).toHaveTextContent("JS");
    expect(initials).toHaveStyle({ backgroundColor: getAvatarColor("Jane Smith") });
    expect(container.querySelector("img")).toBeNull();
  });

  it("falls back to the initials when the profile picture cannot be loaded", () => {
    const { container } = renderActivity("https://example.com/missing.png");

    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".avatar-initials")).toHaveTextContent("JS");
  });

  it("tries a new profile picture after the previous one failed", () => {
    const { container, rerender } = renderActivity("https://example.com/missing.png");

    fireEvent.error(container.querySelector("img")!);
    rerender(<FeedbackCardActivity name="Jane Smith" activity="Created Jan 1, 2025" profileImageSrc="https://example.com/new.png" />);

    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/new.png");
    expect(container.querySelector(".avatar-initials")).toBeNull();
  });
});
