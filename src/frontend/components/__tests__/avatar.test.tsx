import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import Avatar, { AvatarActivity, getAvatarBackgroundColor, getAvatarInitials } from "../avatar";

describe("Avatar", () => {
  test("renders image when imageUrl is available", () => {
    render(<Avatar imageUrl="https://example.com/avatar.png" name="Jane Doe" size={24} />);

    expect(screen.getByRole("img", { name: "Jane Doe avatar" })).toBeInTheDocument();
    expect(screen.getByAltText("")).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  test("falls back to initials when the image fails to load", () => {
    render(<Avatar imageUrl="https://example.com/avatar.png" name="Jane Doe" size={24} />);

    fireEvent.error(screen.getByAltText(""));

    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.queryByAltText("")).not.toBeInTheDocument();
  });

  test("builds initials from a single word name", () => {
    expect(getAvatarInitials("Jane")).toBe("J");
  });

  test("builds initials from first and last words", () => {
    expect(getAvatarInitials("Jane Emily Doe")).toBe("JD");
  });

  test("keeps the first character for a single-token name with a leading symbol", () => {
    expect(getAvatarInitials("$Hanson")).toBe("$");
  });

  test("keeps the first character for a single-token name with a leading number", () => {
    expect(getAvatarInitials("1Hanson")).toBe("1");
  });

  test("ignores a leading symbol in a multi-token name", () => {
    expect(getAvatarInitials("$ Hanson")).toBe("H");
  });

  test("ignores a leading number in a multi-token name", () => {
    expect(getAvatarInitials("1 Hanson")).toBe("H");
  });

  test("matches Coin fallback color hashing", () => {
    expect(getAvatarBackgroundColor("Jane Doe")).toBe("rgb(194, 57, 179)");
  });

  test("renders default blue fallback when name and image are missing", () => {
    const { container } = render(<Avatar />);

    const fallback = container.querySelector(".avatar-fallback") as HTMLElement;
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveStyle({ backgroundColor: "rgb(79, 107, 237)" });
    expect(container.querySelector(".avatar-initials")?.textContent).toBe("");
  });

  test("renders default blue fallback when image fails and name is missing", () => {
    const { container } = render(<Avatar imageUrl="https://example.com/avatar.png" />);

    fireEvent.error(screen.getByAltText(""));

    const fallback = container.querySelector(".avatar-fallback") as HTMLElement;
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveStyle({ backgroundColor: "rgb(79, 107, 237)" });
    expect(container.querySelector(".avatar-initials")?.textContent).toBe("");
  });

  test("renders symbol-only name with the first character and hashed fallback color", () => {
    const name = "$%";
    const { container } = render(<Avatar name={name} />);

    const fallback = container.querySelector(".avatar-fallback") as HTMLElement;
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveStyle({ backgroundColor: getAvatarBackgroundColor(name) });
    expect(container.querySelector(".avatar-initials")?.textContent).toBe("$");
  });

  test("renders large avatar activity for summary owner", () => {
    render(<AvatarActivity activity="August 11, 2026" avatarSize="large" imageUrl="https://example.com/avatar.png" name="John Smith" />);

    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("August 11, 2026")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "John Smith avatar" })).toHaveStyle({ width: "36px", height: "36px" });
  });

  test("renders small avatar activity when requested", () => {
    render(<AvatarActivity activity="August 11, 2026" avatarSize="small" name="Jane Doe" />);

    expect(screen.getByRole("img", { name: "Jane Doe avatar" })).toHaveStyle({ width: "24px", height: "24px" });
  });

  test("renders medium avatar activity when requested", () => {
    render(<AvatarActivity activity="August 11, 2026" avatarSize="medium" name="John Smith" />);

    expect(screen.getByRole("img", { name: "John Smith avatar" })).toHaveStyle({ width: "30px", height: "30px" });
  });
});