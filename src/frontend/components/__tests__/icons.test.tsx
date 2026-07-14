import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { fluentUiIcons, getIconElement, iconDefinitions, legacyIconMappings, selectionTrayIcons } from "../icons";

describe("icons", () => {
  it("renders every available icon", () => {
    for (const [index, iconDefinition] of selectionTrayIcons.entries()) {
      const { container, unmount } = render(React.cloneElement(iconDefinition.icon, { key: `${iconDefinition.id}-${index}` }));

      expect(container.querySelector(`.icon-${iconDefinition.id}`)).toBeTruthy();
      unmount();
    }
  });

  it("keeps non-tray icons out of the selection tray", () => {
    expect(selectionTrayIcons.some(iconDefinition => iconDefinition.id === "add")).toBe(false);
    expect(selectionTrayIcons.some(iconDefinition => iconDefinition.id === "edit")).toBe(false);
    expect(selectionTrayIcons.some(iconDefinition => iconDefinition.id === "close")).toBe(false);
    expect(selectionTrayIcons.some(iconDefinition => iconDefinition.id === "gear-with-stars")).toBe(false);
    expect(selectionTrayIcons.some(iconDefinition => iconDefinition.id === "psychological-safety")).toBe(false);
    expect(selectionTrayIcons.some(iconDefinition => iconDefinition.id === "angry-face")).toBe(false);
    expect(selectionTrayIcons.some(iconDefinition => iconDefinition.id === "thumb-up-down")).toBe(false);
    expect(selectionTrayIcons.some(iconDefinition => iconDefinition.id === "explore")).toBe(false);
    expect(selectionTrayIcons.some(iconDefinition => iconDefinition.id === "delete")).toBe(false);
    expect(selectionTrayIcons.some(iconDefinition => iconDefinition.id === "list-all")).toBe(false);
    expect(selectionTrayIcons.some(iconDefinition => iconDefinition.id === "view-column")).toBe(false);
  });

  it("does not allow duplicate non-zero trayOrder values", () => {
    const nonZeroTrayOrders = iconDefinitions.map(iconDefinition => iconDefinition.trayOrder).filter(trayOrder => trayOrder > 0);
    const uniqueTrayOrders = new Set(nonZeroTrayOrders);

    expect(uniqueTrayOrders.size).toBe(nonZeroTrayOrders.length);
  });

  it("keeps legacy icon aliases separate from the tray list", () => {
    for (const legacyMapping of legacyIconMappings) {
      const { container, unmount } = render(getIconElement(legacyMapping.legacyId));

      expect(container.querySelector(`.icon-${legacyMapping.iconId}`)).toBeTruthy();
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
