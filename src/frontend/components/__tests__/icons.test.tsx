import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { availableIcons, fluentUiIcons, getIconElement } from "../icons";

describe("icons", () => {
  it("renders every available icon", () => {
    for (const [index, iconDefinition] of availableIcons.entries()) {
      const { container, unmount } = render(React.cloneElement(iconDefinition.icon, { key: `${iconDefinition.id}-${index}` }));

      expect(container.querySelector(`.icon-${iconDefinition.id}`)).toBeTruthy();
      unmount();
    }
  });

  it("renders every Fluent UI icon replacement", () => {
    for (const [iconName, icon] of Object.entries(fluentUiIcons)) {
      const { container, unmount } = render(React.cloneElement(icon, { "aria-label": iconName }));

      expect(container.querySelector("svg")).toBeTruthy();
      unmount();
    }
  });

  describe("getIconElement", () => {
    it("returns PlumbingIcon for plumbing id", () => {
      const icon = getIconElement("plumbing");
      const { container } = render(icon);
      expect(container.querySelector(".icon-plumbing")).toBeTruthy();
    });

    it("returns TableChartIcon for table-chart id", () => {
      const icon = getIconElement("table-chart");
      const { container } = render(icon);
      expect(container.querySelector(".icon-table-chart")).toBeTruthy();
    });

    it("returns icons by legacy tag", () => {
      const icon = getIconElement("fas fa-coffee");
      const { container } = render(icon);

      expect(container.querySelector(".icon-coffee")).toBeTruthy();
    });

    it("falls back to PlayCircleIcon for an unknown id", () => {
      const icon = getIconElement("unknown-icon");
      const { container } = render(icon);

      expect(container.querySelector(".icon-play-circle")).toBeTruthy();
    });
  });
});
