import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import FeedbackCardActivity, { getAvatarColor, getInitials } from "../feedbackCardActivity";

describe("getInitials", () => {
  it.each([
    ["Jane Smith", "JS"],
    ["jane smith", "JS"],
    ["Jane", "J"],
    ["Mary Jane Watson", "MW"],
    ["Mary Jane Watson Parker", "MP"],
    ["  Jane   Smith  ", "JS"],
    ["Smith, Jane", "SJ"],
    ["Doe-Smith Jane", "DJ"],
    ["山田 太郎", "山太"],
    ["𝒜da Lovelace", "𝒜L"],
  ])("returns the initials of %j", (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });

  it.each([
    ["Jane Smith (Contoso)", "JS"],
    ["Jane (Contoso) Smith", "JS"],
    ["Smith, Jane [IT]", "SJ"],
    ["Jane Smith {external}", "JS"],
    ["Jane <jane@contoso.com>", "J"],
    ["Jane Smith 🚀", "JS"],
    ["🚀 Jane", "J"],
    ["Jane Smith (Contoso", "JC"],
    ["Jane (Contoso (EMEA)) Smith", "JS"],
    ["Jane (Contoso] Smith", "JS"],
    ["Jane) Smith (Contoso)", "JS"],
    ["Jane (IT) Smith (Contoso) Doe", "JD"],
    ["<<script>script>alert(1)</script>", "S"],
  ])("ignores enclosed text and symbols in %j", (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });

  it.each(["", "   ", "(Contoso)", "🚀"])("returns nothing for %j", name => {
    expect(getInitials(name)).toBe("");
  });
});

describe("getAvatarColor", () => {
  it("is stable for the same name", () => {
    expect(getAvatarColor("Jane Smith")).toBe(getAvatarColor("Jane Smith"));
  });

  it("keeps the same colors for known names so avatars do not change between releases", () => {
    expect(getAvatarColor("")).toBe("hsl(0, 50%, 30%)");
    expect(getAvatarColor("A")).toBe("hsl(65, 50%, 30%)");
    expect(getAvatarColor("AB")).toBe("hsl(281, 50%, 30%)");
  });

  it("gives different people different colors", () => {
    expect(getAvatarColor("Jane Smith")).not.toBe(getAvatarColor("John Doe"));
  });

  it("always stays on a hue between 0 and 359 with fixed saturation and lightness", () => {
    const names = ["Jane Smith", "John Doe", "Zoë Ångström", "山田 太郎", "🚀", "A very long display name that keeps going and going and going"];

    for (const name of names) {
      const [, hue] = /^hsl\((\d+), 50%, 30%\)$/.exec(getAvatarColor(name))!;

      expect(Number(hue)).toBeGreaterThanOrEqual(0);
      expect(Number(hue)).toBeLessThan(360);
    }
  });
});

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
    expect(container.querySelector(".feedback-card-activity-initials")).toBeNull();
  });

  it("shows colored initials when there is no profile picture", () => {
    const { container } = renderActivity();

    const initials = container.querySelector(".feedback-card-activity-initials");
    expect(initials).toHaveTextContent("JS");
    expect(initials).toHaveStyle({ backgroundColor: getAvatarColor("Jane Smith") });
    expect(container.querySelector("img")).toBeNull();
  });

  it("falls back to the initials when the profile picture cannot be loaded", () => {
    const { container } = renderActivity("https://example.com/missing.png");

    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".feedback-card-activity-initials")).toHaveTextContent("JS");
  });

  it("tries a new profile picture after the previous one failed", () => {
    const { container, rerender } = renderActivity("https://example.com/missing.png");

    fireEvent.error(container.querySelector("img")!);
    rerender(<FeedbackCardActivity name="Jane Smith" activity="Created Jan 1, 2025" profileImageSrc="https://example.com/new.png" />);

    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/new.png");
    expect(container.querySelector(".feedback-card-activity-initials")).toBeNull();
  });
});
