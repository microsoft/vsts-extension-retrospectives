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

    it("returns ForwardCircleIcon for adjust id", () => {
      const icon = getIconElement("adjust");
      const { container } = render(icon);
      expect(container.querySelector(".icon-forward-circle")).toBeTruthy();
    });

    it("returns AdjustIcon for focus id", () => {
      const icon = getIconElement("focus");
      const { container } = render(icon);
      expect(container.querySelector(".icon-adjust")).toBeTruthy();
    });
  });
});
