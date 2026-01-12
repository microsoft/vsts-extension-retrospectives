import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { getIconElement } from "../icons";

describe("icons", () => {
  describe("getIconElement", () => {
    it("returns PlumbingIcon for plumbing id", () => {
      const icon = getIconElement("plumbing");
      const { container } = render(icon);
      expect(container.querySelector(".icon-plumbing")).toBeTruthy();
    });
  });
});
