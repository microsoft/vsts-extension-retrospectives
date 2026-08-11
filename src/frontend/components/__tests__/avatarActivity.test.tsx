import React from "react";
import { render, screen } from "@testing-library/react";

import AvatarActivity from "../avatarActivity";

describe("AvatarActivity", () => {
  it("renders fallback text when no people are provided", () => {
    render(React.createElement(AvatarActivity, { activity: "Created on June 1", fallbackText: "Anonymous", size: "small" }));

    expect(screen.getByText("Anonymous")).toBeTruthy();
  });

  it("renders the shared activity wrapper with the requested size class", () => {
    render(React.createElement(AvatarActivity, { activity: "Created on June 1", people: [{ name: "Ada Lovelace", profileImageSrc: "/avatar.png" }], size: "large" }));

    expect(document.querySelector(".avatar-activity.avatar-size-large")).not.toBeNull();
  });
});
