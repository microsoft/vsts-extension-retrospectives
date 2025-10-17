import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { PRIME_DIRECTIVE_CONTENT, RETRO_HELP_CONTENT, VOLUNTEER_CONTENT, renderContent } from "../extensionSettingsMenuDialogContent";

describe("extensionSettingsMenuDialogContent", () => {
  describe("renderContent", () => {
    it("should render normal text without any styling", () => {
      const content = [{ content: "This is normal text" }];
      const { container } = render(<>{renderContent(content)}</>);

      const div = container.querySelector("div");
      expect(div).toBeInTheDocument();
      expect(div).toHaveTextContent("This is normal text");
      expect(div?.querySelector("b")).not.toBeInTheDocument();
      expect(div?.querySelector("i")).not.toBeInTheDocument();
    });

    it("should render bold text when style is bold", () => {
      const content = [{ content: "This is bold text", style: "bold" as const }];
      const { container } = render(<>{renderContent(content)}</>);

      const boldElement = container.querySelector("b");
      expect(boldElement).toBeInTheDocument();
      expect(boldElement).toHaveTextContent("This is bold text");
    });

    it("should render italic text when style is italic", () => {
      const content = [{ content: "This is italic text", style: "italic" as const }];
      const { container } = render(<>{renderContent(content)}</>);

      const italicElement = container.querySelector("i");
      expect(italicElement).toBeInTheDocument();
      expect(italicElement).toHaveTextContent("This is italic text");
    });

    it("should not add top margin to first element", () => {
      const content = [{ content: "First paragraph" }];
      const { container } = render(<>{renderContent(content)}</>);

      const div = container.querySelector("div");
      expect(div).toHaveStyle({ marginTop: undefined });
    });

    it("should add top margin to non-first elements", () => {
      const content = [{ content: "First paragraph" }, { content: "Second paragraph" }];
      const { container } = render(<>{renderContent(content)}</>);

      const divs = container.querySelectorAll("div");
      expect(divs[1]).toHaveStyle({ marginTop: "1rem" });
    });

    it("should not add bottom margin to last element", () => {
      const content = [{ content: "Only paragraph" }];
      const { container } = render(<>{renderContent(content)}</>);

      const div = container.querySelector("div");
      expect(div).toHaveStyle({ marginBottom: undefined });
    });

    it("should add bottom margin to non-last elements", () => {
      const content = [{ content: "First paragraph" }, { content: "Second paragraph" }];
      const { container } = render(<>{renderContent(content)}</>);

      const divs = container.querySelectorAll("div");
      expect(divs[0]).toHaveStyle({ marginBottom: "1rem" });
    });

    it("should render multiple content items with correct styling", () => {
      const content = [{ content: "Normal text" }, { content: "Bold text", style: "bold" as const }, { content: "Italic text", style: "italic" as const }];
      const { container } = render(<>{renderContent(content)}</>);

      const divs = container.querySelectorAll("div");
      expect(divs).toHaveLength(3);

      // First item - normal, no top margin, has bottom margin
      expect(divs[0]).toHaveTextContent("Normal text");
      expect(divs[0]).toHaveStyle({ marginTop: undefined, marginBottom: "1rem" });

      // Second item - bold, has both margins
      expect(divs[1].querySelector("b")).toHaveTextContent("Bold text");
      expect(divs[1]).toHaveStyle({ marginTop: "1rem", marginBottom: "1rem" });

      // Third item - italic, has top margin, no bottom margin
      expect(divs[2].querySelector("i")).toHaveTextContent("Italic text");
      expect(divs[2]).toHaveStyle({ marginTop: "1rem", marginBottom: undefined });
    });

    it("should handle PRIME_DIRECTIVE_CONTENT correctly", () => {
      const { container } = render(<>{renderContent(PRIME_DIRECTIVE_CONTENT)}</>);

      const divs = container.querySelectorAll("div");
      expect(divs).toHaveLength(3);

      // First paragraph is normal
      expect(divs[0]).toHaveTextContent(/The purpose of the Prime Directive/);

      // Second paragraph is bold
      expect(divs[1].querySelector("b")).toHaveTextContent(/Regardless of what we discover/);

      // Third paragraph is italic
      expect(divs[2].querySelector("i")).toHaveTextContent(/--Norm Kerth/);
    });

    it("should handle RETRO_HELP_CONTENT correctly", () => {
      const { container } = render(<>{renderContent(RETRO_HELP_CONTENT)}</>);

      const divs = container.querySelectorAll("div");
      expect(divs).toHaveLength(2);

      expect(divs[0]).toHaveTextContent(/The purpose of the retrospective/);
      expect(divs[1]).toHaveTextContent(/For instructions on getting started/);
    });

    it("should handle VOLUNTEER_CONTENT correctly", () => {
      const { container } = render(<>{renderContent(VOLUNTEER_CONTENT)}</>);

      const divs = container.querySelectorAll("div");
      expect(divs).toHaveLength(3);

      expect(divs[0]).toHaveTextContent(/Help us make the Retrospective Extension even better/);
      expect(divs[1]).toHaveTextContent(/While we will continue to maintain/);
      expect(divs[2]).toHaveTextContent(/Want to contribute/);
    });

    it("should handle empty content array", () => {
      const content: any[] = [];
      const result = renderContent(content);

      expect(result).toEqual([]);
    });

    it("should handle single item with no margins", () => {
      const content = [{ content: "Single item" }];
      const { container } = render(<>{renderContent(content)}</>);

      const div = container.querySelector("div");
      expect(div).toHaveStyle({
        marginTop: undefined,
        marginBottom: undefined,
      });
    });
  });
});
