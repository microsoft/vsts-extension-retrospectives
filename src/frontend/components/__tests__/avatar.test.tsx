import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import Avatar, { AvatarActivity, getAvatarBackgroundColor, getAvatarInitials } from "../avatar";

describe("Avatar", () => {
  test("renders image when imageUrl is available", () => {
    render(<Avatar imageUrl="https://example.com/avatar.png" name="Dana Hanson" size={24} />);

    expect(screen.getByRole("img", { name: "Dana Hanson avatar" })).toBeInTheDocument();
    expect(screen.getByAltText("")).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  test("falls back to initials when the image fails to load", () => {
    render(<Avatar imageUrl="https://example.com/avatar.png" name="Dana Hanson" size={24} />);

    fireEvent.error(screen.getByAltText(""));

    expect(screen.getByText("DH")).toBeInTheDocument();
    expect(screen.queryByAltText("")).not.toBeInTheDocument();
  });

  test("builds initials from a single word name", () => {
    expect(getAvatarInitials("Dana")).toBe("D");
  });

  test("builds initials from first and last words", () => {
    expect(getAvatarInitials("Dana Lynn Hanson")).toBe("DH");
  });

  test("skips symbol-leading words and uses next valid initial", () => {
    expect(getAvatarInitials("#david Hanson")).toBe("H");
  });

  test("accepts number-leading words as initials", () => {
    expect(getAvatarInitials("1st David")).toBe("1D");
  });

  test("returns empty initials for all-symbol names", () => {
    expect(getAvatarInitials("&*+@ #%$-")).toBe("");
  });

  test("matches Coin fallback color hashing", () => {
    expect(getAvatarBackgroundColor("Dana Hanson")).toBe("rgb(164, 38, 44)");
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

  test("renders symbol-only name with empty initials and hashed fallback color", () => {
    const name = "&*+@ #%$-";
    const { container } = render(<Avatar name={name} />);

    const fallback = container.querySelector(".avatar-fallback") as HTMLElement;
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveStyle({ backgroundColor: getAvatarBackgroundColor(name) });
    expect(container.querySelector(".avatar-initials")?.textContent).toBe("");
  });

  test("renders large avatar activity for summary owner", () => {
    render(<AvatarActivity activity="August 11, 2026" avatarSize="large" imageUrl="https://example.com/avatar.png" name="Dana Hanson" />);

    expect(screen.getByText("Dana Hanson")).toBeInTheDocument();
    expect(screen.getByText("August 11, 2026")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Dana Hanson avatar" })).toHaveStyle({ width: "36px", height: "36px" });
  });

  test("renders small avatar activity when requested", () => {
    render(<AvatarActivity activity="August 11, 2026" avatarSize="small" name="Dana Hanson" />);

    expect(screen.getByRole("img", { name: "Dana Hanson avatar" })).toHaveStyle({ width: "24px", height: "24px" });
  });

  test("renders medium avatar activity when requested", () => {
    render(<AvatarActivity activity="August 11, 2026" avatarSize="medium" name="Dana Hanson" />);

    expect(screen.getByRole("img", { name: "Dana Hanson avatar" })).toHaveStyle({ width: "30px", height: "30px" });
  });
});