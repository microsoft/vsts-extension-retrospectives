import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { availableIcons, getIconElement } from "../icons";

describe("icons", () => {
  it("has exactly 28 selectable icons", () => {
    const selectableIcons = availableIcons.filter(icon => icon.selectable);
    expect(selectableIcons).toHaveLength(28);
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

    it("returns PropellerIcon for propeller-icon ID", () => {
      const icon = getIconElement("propeller-icon");
      const { container } = render(icon);
      expect(container.querySelector(".icon-propeller")).toBeTruthy();
    });

    it("returns DangerousIcon for dangerous-icon ID", () => {
      const icon = getIconElement("dangerous-icon");
      const { container } = render(icon);
      expect(container.querySelector(".icon-dangerous")).toBeTruthy();
    });

    it("returns RepeatIcon for repeat ID", () => {
      const icon = getIconElement("repeat");
      const { container } = render(icon);
      expect(container.querySelector(".icon-repeat")).toBeTruthy();
    });

    it("returns FocusIcon for focus ID", () => {
      const icon = getIconElement("focus");
      const { container } = render(icon);
      expect(container.querySelector(".icon-focus")).toBeTruthy();
    });

    it("returns BirthdayCakeIcon for birthday-cake id", () => {
      const icon = getIconElement("birthday-cake");
      const { container } = render(icon);
      expect(container.querySelector(".icon-birthday-cake")).toBeTruthy();
    });

    it("returns ComputerIcon for computer id", () => {
      const icon = getIconElement("computer");
      const { container } = render(icon);
      expect(container.querySelector(".icon-computer")).toBeTruthy();
    });

    it("returns ElectricBoltIcon for electric-bolt id", () => {
      const icon = getIconElement("electric-bolt");
      const { container } = render(icon);
      expect(container.querySelector(".icon-electric-bolt")).toBeTruthy();
    });

    it("returns PsychologicalSafetyIcon for psychological-safety id", () => {
      const icon = getIconElement("psychological-safety");
      const { container } = render(icon);
      expect(container.querySelector(".icon-psychological-safety")).toBeTruthy();
    });

    it("resolves legacy font awesome class strings", () => {
      const icon = getIconElement("fa-solid fa-magnifying-glass");
      const { container } = render(icon);
      expect(container.querySelector(".icon-search")).toBeTruthy();
    });
  });
});
