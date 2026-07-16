import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { getIconElement, iconDefinitions, legacyIconMappings, selectionTrayIcons } from "../icons";

describe("icons", () => {
  it("renders every available icon", () => {
    for (const [index, iconDefinition] of selectionTrayIcons.entries()) {
      const { container, unmount } = render(React.cloneElement(iconDefinition.icon, { key: `${iconDefinition.id}-${index}` }));

      expect(container.querySelector(`.icon-${iconDefinition.id}`)).toBeTruthy();
      unmount();
    }
  });

  it("does not allow duplicate non-zero trayOrder values", () => {
    const nonZeroTrayOrders = iconDefinitions.map(iconDefinition => iconDefinition.trayOrder).filter(trayOrder => trayOrder > 0);
    const uniqueTrayOrders = new Set(nonZeroTrayOrders);

    expect(uniqueTrayOrders.size).toBe(nonZeroTrayOrders.length);
  });

  it("keeps legacy icon aliases separate from the tray list", () => {
    for (const legacyMapping of legacyIconMappings) {
      const { container: legacyContainer, unmount: unmountLegacy } = render(getIconElement(legacyMapping.legacyId));
      const { container: canonicalContainer, unmount: unmountCanonical } = render(getIconElement(legacyMapping.iconId));

      expect(legacyContainer.innerHTML).toEqual(canonicalContainer.innerHTML);
      unmountLegacy();
      unmountCanonical();
    }
  });

  describe("getIconElement", () => {
    it("returns specific non-tray icon components by ID", () => {
      const iconExpectations = [
        ["assessment", ".icon-assessment"],
        ["new-releases", ".icon-new-releases"],
        ["pause-circle", ".icon-pause-circle"],
        ["person", ".icon-person"],
        ["square-rounded", ".icon-square-rounded"],
        ["insights", ".icon-insights"],
      ] as const;

      for (const [iconId, selector] of iconExpectations) {
        const icon = getIconElement(iconId);
        const { container, unmount } = render(icon);

        expect(container.querySelector(selector)).toBeTruthy();
        unmount();
      }
    });

    it("returns ToolsIcon for construction alias", () => {
      const icon = getIconElement("construction");
      const { container } = render(icon);
      expect(container.querySelector(".icon-plumbing")).toBeTruthy();
    });

    it("returns TableChartIcon for table-chart ID", () => {
      const icon = getIconElement("table-chart");
      const { container } = render(icon);
      expect(container.querySelector(".icon-table-chart")).toBeTruthy();
    });

    it("returns icons by legacy tag", () => {
      const icon = getIconElement("fa-play-circle");
      const { container } = render(icon);

      expect(container.querySelector(".icon-play-circle")).toBeTruthy();
    });

    it("returns FanIcon for fan legacy tags", () => {
      const icon = getIconElement("fas fa-fan");
      const { container } = render(icon);

      expect(container.querySelector(".icon-fan")).toBeTruthy();
    });

    it("falls back to CommentsIcon for an unknown ID", () => {
      const icon = getIconElement("unknown-icon");
      const { container } = render(icon);

      expect(container.querySelector(".icon-comments")).toBeTruthy();
    });
  });
});
