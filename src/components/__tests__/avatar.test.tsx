import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import Avatar, { getAvatarColor, getInitials } from "../avatar";

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

describe("Avatar", () => {
  it("renders a decorative profile picture with the requested class", () => {
    const { container } = render(<Avatar name="Jane Smith" imageUrl="https://example.com/jane.png" className="permission-image" />);

    expect(container.firstChild).toHaveClass("avatar", "permission-image");
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/jane.png");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector(".avatar-initials")).toBeNull();
  });

  it.each([undefined, null, ""])("shows colored initials when the image URL is %j", imageUrl => {
    const { container } = render(<Avatar name="Jane Smith" imageUrl={imageUrl} />);

    expect(container.firstChild).toHaveClass("avatar", { exact: true });
    expect(container.querySelector(".avatar-initials")).toHaveTextContent("JS");
    expect(container.querySelector(".avatar-initials")).toHaveStyle({ backgroundColor: getAvatarColor("Jane Smith") });
    expect(container.querySelector("img")).toBeNull();
  });

  it("keeps the initials fallback across rerenders after a profile picture fails", () => {
    const { container, rerender } = render(<Avatar name="Jane Smith" imageUrl="https://example.com/missing.png" />);

    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".avatar-initials")).toHaveTextContent("JS");

    rerender(<Avatar name="John Doe" imageUrl="https://example.com/missing.png" className="permission-image" />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".avatar-initials")).toHaveTextContent("JD");
    expect(container.querySelector(".avatar-initials")).toHaveStyle({ backgroundColor: getAvatarColor("John Doe") });
  });

  it("tries a new image URL after the previous picture failed", () => {
    const { container, rerender } = render(<Avatar name="Jane Smith" imageUrl="https://example.com/missing.png" />);

    fireEvent.error(container.querySelector("img")!);
    rerender(<Avatar name="Jane Smith" imageUrl="https://example.com/new.png" />);

    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/new.png");
    expect(container.querySelector(".avatar-initials")).toBeNull();
  });

  it.each([undefined, null, "", "   "])("handles a missing display name (%j) without failing", name => {
    const { container } = render(<Avatar name={name} />);

    expect(container.querySelector(".avatar-initials")).toBeEmptyDOMElement();
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("img")).toBeNull();
  });
});
