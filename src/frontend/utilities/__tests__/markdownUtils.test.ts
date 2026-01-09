import React from "react";
import * as markdownUtils from "../markdownUtils";

const { isValidUrl, escapeHtml, tokenizeMarkdown, parseMarkdown, hasMarkdownFormatting, stripMarkdown } = markdownUtils;

describe("markdownUtils", () => {
  describe("isValidUrl", () => {
    it("should return true for valid http URLs", () => {
      expect(isValidUrl("http://example.com")).toBe(true);
      expect(isValidUrl("http://www.example.com/path/to/page")).toBe(true);
      expect(isValidUrl("http://example.com:8080")).toBe(true);
    });

    it("should return true for valid https URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("https://www.example.com/path?query=1")).toBe(true);
      expect(isValidUrl("https://example.com:443/secure")).toBe(true);
    });

    it("should return false for javascript: URLs (XSS prevention)", () => {
      expect(isValidUrl("javascript:alert('xss')")).toBe(false);
      expect(isValidUrl("JAVASCRIPT:alert(1)")).toBe(false);
      expect(isValidUrl("javascript://comment%0aalert(1)")).toBe(false);
    });

    it("should return false for data: URLs", () => {
      expect(isValidUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    });

    it("should return false for file: URLs", () => {
      expect(isValidUrl("file:///etc/passwd")).toBe(false);
    });

    it("should return false for empty or invalid inputs", () => {
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl(null as unknown as string)).toBe(false);
      expect(isValidUrl(undefined as unknown as string)).toBe(false);
      expect(isValidUrl("not a url")).toBe(false);
      expect(isValidUrl("ftp://example.com")).toBe(false);
    });

    it("should handle URLs with whitespace", () => {
      expect(isValidUrl("  https://example.com  ")).toBe(true);
      expect(isValidUrl(" http://example.com")).toBe(true);
    });
  });

  describe("escapeHtml", () => {
    it("should escape HTML special characters", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
      expect(escapeHtml('Test "quoted" text')).toBe("Test &quot;quoted&quot; text");
      expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
    });

    it("should handle empty and null inputs", () => {
      expect(escapeHtml("")).toBe("");
      expect(escapeHtml(null as unknown as string)).toBe("");
      expect(escapeHtml(undefined as unknown as string)).toBe("");
    });

    it("should not escape normal text", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
      expect(escapeHtml("Simple text 123")).toBe("Simple text 123");
    });
  });

  describe("tokenizeMarkdown", () => {
    describe("bold formatting", () => {
      it("should tokenize bold text with asterisks", () => {
        const tokens = tokenizeMarkdown("This is **bold** text");
        expect(tokens).toHaveLength(3);
        expect(tokens[0]).toEqual({ type: "text", content: "This is " });
        expect(tokens[1]).toEqual({ type: "bold", content: "bold" });
        expect(tokens[2]).toEqual({ type: "text", content: " text" });
      });

      it("should tokenize bold text with underscores", () => {
        const tokens = tokenizeMarkdown("This is __bold__ text");
        expect(tokens).toHaveLength(3);
        expect(tokens[0]).toEqual({ type: "text", content: "This is " });
        expect(tokens[1]).toEqual({ type: "bold", content: "bold" });
        expect(tokens[2]).toEqual({ type: "text", content: " text" });
      });

      it("should handle multiple bold sections", () => {
        const tokens = tokenizeMarkdown("**first** and **second**");
        expect(tokens).toHaveLength(3);
        expect(tokens[0]).toEqual({ type: "bold", content: "first" });
        expect(tokens[1]).toEqual({ type: "text", content: " and " });
        expect(tokens[2]).toEqual({ type: "bold", content: "second" });
      });
    });

    describe("italic formatting", () => {
      it("should tokenize italic text with asterisk", () => {
        const tokens = tokenizeMarkdown("This is *italic* text");
        expect(tokens).toHaveLength(3);
        expect(tokens[0]).toEqual({ type: "text", content: "This is " });
        expect(tokens[1]).toEqual({ type: "italic", content: "italic" });
        expect(tokens[2]).toEqual({ type: "text", content: " text" });
      });

      it("should tokenize italic text with underscore", () => {
        const tokens = tokenizeMarkdown("This is _italic_ text");
        expect(tokens).toHaveLength(3);
        expect(tokens[0]).toEqual({ type: "text", content: "This is " });
        expect(tokens[1]).toEqual({ type: "italic", content: "italic" });
        expect(tokens[2]).toEqual({ type: "text", content: " text" });
      });
    });

    describe("link formatting", () => {
      it("should tokenize links with valid URLs", () => {
        const tokens = tokenizeMarkdown("Check [this link](https://example.com) out");
        expect(tokens).toHaveLength(3);
        expect(tokens[0]).toEqual({ type: "text", content: "Check " });
        expect(tokens[1]).toEqual({ type: "link", content: "this link", url: "https://example.com" });
        expect(tokens[2]).toEqual({ type: "text", content: " out" });
      });

      it("should treat links with invalid URLs as plain text", () => {
        const tokens = tokenizeMarkdown("[bad link](javascript:alert(1))");
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toEqual({ type: "text", content: "[bad link](javascript:alert(1))" });
      });

      it("should handle links at the start of text", () => {
        const tokens = tokenizeMarkdown("[Link](https://example.com) at start");
        expect(tokens).toHaveLength(2);
        expect(tokens[0]).toEqual({ type: "link", content: "Link", url: "https://example.com" });
        expect(tokens[1]).toEqual({ type: "text", content: " at start" });
      });
    });

    describe("image formatting", () => {
      it("should tokenize images with valid URLs", () => {
        const tokens = tokenizeMarkdown("See ![alt text](https://example.com/image.png) here");
        expect(tokens).toHaveLength(3);
        expect(tokens[0]).toEqual({ type: "text", content: "See " });
        expect(tokens[1]).toEqual({ type: "image", content: "alt text", url: "https://example.com/image.png", alt: "alt text" });
        expect(tokens[2]).toEqual({ type: "text", content: " here" });
      });

      it("should handle images with empty alt text", () => {
        const tokens = tokenizeMarkdown("![](https://example.com/image.png)");
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toEqual({ type: "image", content: "", url: "https://example.com/image.png", alt: "" });
      });

      it("should treat images with invalid URLs as plain text", () => {
        const tokens = tokenizeMarkdown("![bad](javascript:alert(1))");
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toEqual({ type: "text", content: "![bad](javascript:alert(1))" });
      });
    });

    describe("mixed formatting", () => {
      it("should handle multiple formatting types", () => {
        const tokens = tokenizeMarkdown("**Bold** and *italic* with [link](https://example.com)");
        expect(tokens).toHaveLength(5);
        expect(tokens[0]).toEqual({ type: "bold", content: "Bold" });
        expect(tokens[1]).toEqual({ type: "text", content: " and " });
        expect(tokens[2]).toEqual({ type: "italic", content: "italic" });
        expect(tokens[3]).toEqual({ type: "text", content: " with " });
        expect(tokens[4]).toEqual({ type: "link", content: "link", url: "https://example.com" });
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", () => {
        expect(tokenizeMarkdown("")).toEqual([]);
        expect(tokenizeMarkdown(null as unknown as string)).toEqual([]);
        expect(tokenizeMarkdown(undefined as unknown as string)).toEqual([]);
      });

      it("should treat a single asterisk as plain text", () => {
        expect(tokenizeMarkdown("*")).toEqual([{ type: "text", content: "*" }]);
      });

      it("should handle plain text without markdown", () => {
        const tokens = tokenizeMarkdown("Just plain text");
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toEqual({ type: "text", content: "Just plain text" });
      });

      it("should handle incomplete markdown syntax", () => {
        const tokens = tokenizeMarkdown("Single *asterisk here");
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe("text");
      });

      it("should merge consecutive text tokens", () => {
        const tokens = tokenizeMarkdown("abc");
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toEqual({ type: "text", content: "abc" });
      });

      it("should not merge text tokens when non-text token is between them", () => {
        // This tests the branch when mergedTokens has tokens but the last one is not a text token
        const tokens = tokenizeMarkdown("**bold**text after");
        expect(tokens).toHaveLength(2);
        expect(tokens[0]).toEqual({ type: "bold", content: "bold" });
        expect(tokens[1]).toEqual({ type: "text", content: "text after" });
      });

      it("should push first text token when mergedTokens is empty", () => {
        // This tests the branch when mergedTokens.length === 0 and we push the first token
        const tokens = tokenizeMarkdown("just text");
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toEqual({ type: "text", content: "just text" });
      });

      it("should handle text ending without special characters after special char in middle", () => {
        // This tests the branch when nextSpecialIndex === -1 (no more special chars after the current position)
        const tokens = tokenizeMarkdown("text with a trailing asterisk* at end");
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toEqual({ type: "text", content: "text with a trailing asterisk* at end" });
      });

      it("should handle unmatched opening marker with plain text after", () => {
        // This tests the branch when nextSpecialIndex === -1 with remaining plain text
        const tokens = tokenizeMarkdown("start *incomplete");
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe("text");
        expect(tokens[0].content).toBe("start *incomplete");
      });
    });
  });

  describe("parseMarkdown", () => {
    it("should return null for empty input", () => {
      expect(parseMarkdown("")).toBeNull();
      expect(parseMarkdown(null as unknown as string)).toBeNull();
    });

    it("should return input text when tokenizer yields no tokens", () => {
      const tokenizeSpy = jest.spyOn(markdownUtils, "tokenizeMarkdown").mockReturnValue([]);

      expect(parseMarkdown("noop" as unknown as string)).toBe("noop");

      tokenizeSpy.mockRestore();
    });

    it("should return string for plain text", () => {
      const result = parseMarkdown("Just text");
      expect(result).toBe("Just text");
    });

    it("should parse bold text to strong elements", () => {
      const result = parseMarkdown("**bold**");
      // Single markdown element returns as array with one element
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result.length > 0) {
        const element = result[0];
        expect(React.isValidElement(element)).toBe(true);
        if (React.isValidElement(element)) {
          expect(element.type).toBe("strong");
          const props = element.props as { children: string };
          expect(props.children).toBe("bold");
        }
      }
    });

    it("should parse italic text to em elements", () => {
      const result = parseMarkdown("*italic*");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result.length > 0) {
        const element = result[0];
        expect(React.isValidElement(element)).toBe(true);
        if (React.isValidElement(element)) {
          expect(element.type).toBe("em");
          const props = element.props as { children: string };
          expect(props.children).toBe("italic");
        }
      }
    });

    it("should parse links to anchor elements with proper attributes", () => {
      const result = parseMarkdown("[link](https://example.com)");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result.length > 0) {
        const element = result[0];
        expect(React.isValidElement(element)).toBe(true);
        if (React.isValidElement(element)) {
          expect(element.type).toBe("a");
          const props = element.props as { href: string; target: string; rel: string; children: string };
          expect(props.href).toBe("https://example.com");
          expect(props.target).toBe("_blank");
          expect(props.rel).toBe("noopener noreferrer");
          expect(props.children).toBe("link");
        }
      }
    });

    it("should have onClick handler that stops propagation on link elements", () => {
      const result = parseMarkdown("[link](https://example.com)");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result.length > 0) {
        const element = result[0];
        expect(React.isValidElement(element)).toBe(true);
        if (React.isValidElement(element)) {
          const props = element.props as { onClick: (e: React.MouseEvent) => void };
          expect(typeof props.onClick).toBe("function");
          // Call the onClick handler with a mock event to cover line 159
          const mockEvent = { stopPropagation: jest.fn() } as unknown as React.MouseEvent;
          props.onClick(mockEvent);
          expect(mockEvent.stopPropagation).toHaveBeenCalled();
        }
      }
    });

    it("should parse images to img elements with proper attributes", () => {
      const result = parseMarkdown("![alt](https://example.com/img.png)");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result.length > 0) {
        const element = result[0];
        expect(React.isValidElement(element)).toBe(true);
        if (React.isValidElement(element)) {
          expect(element.type).toBe("img");
          const props = element.props as { src: string; alt: string };
          expect(props.src).toBe("https://example.com/img.png");
          expect(props.alt).toBe("alt");
        }
      }
    });

    it("should default image alt text to empty string when missing", () => {
      const tokenizeSpy = jest.spyOn(markdownUtils, "tokenizeMarkdown").mockReturnValue([{ type: "image", content: "", url: "https://example.com/img.png" }] as unknown as ReturnType<typeof tokenizeMarkdown>);

      const result = parseMarkdown("![missing-alt](https://example.com/img.png)");

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result.length > 0) {
        const element = result[0];
        expect(React.isValidElement(element)).toBe(true);
        if (React.isValidElement(element)) {
          expect((element.props as { alt: string }).alt).toBe("");
        }
      }

      tokenizeSpy.mockRestore();
    });

    it("should use empty string fallback when image token.alt is undefined (line 105 branch)", () => {
      // Mock tokenizeMarkdown to return an image token without the alt property at all
      const tokenizeSpy = jest.spyOn(markdownUtils, "tokenizeMarkdown").mockReturnValue([
        { type: "image", content: "alt content", url: "https://example.com/img.png" },
        // Note: alt property is intentionally omitted to test the || "" fallback
      ] as unknown as ReturnType<typeof tokenizeMarkdown>);

      const result = parseMarkdown("![](https://example.com/img.png)");

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result.length > 0) {
        const element = result[0];
        expect(React.isValidElement(element)).toBe(true);
        if (React.isValidElement(element)) {
          // The alt should fallback to empty string when token.alt is undefined
          expect((element.props as { alt: string }).alt).toBe("");
        }
      }

      tokenizeSpy.mockRestore();
    });

    it("should return array of elements for mixed formatting", () => {
      const result = parseMarkdown("**bold** text");
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result).toHaveLength(2);
        expect(React.isValidElement(result[0])).toBe(true);
        if (React.isValidElement(result[0])) {
          expect(result[0].type).toBe("strong");
        }
      }
    });
  });

  describe("hasMarkdownFormatting", () => {
    it("should return true for text with bold formatting", () => {
      expect(hasMarkdownFormatting("**bold**")).toBe(true);
      expect(hasMarkdownFormatting("__bold__")).toBe(true);
    });

    it("should return true for text with italic formatting", () => {
      expect(hasMarkdownFormatting("*italic*")).toBe(true);
      expect(hasMarkdownFormatting("_italic_")).toBe(true);
    });

    it("should return true for text with links", () => {
      expect(hasMarkdownFormatting("[link](https://example.com)")).toBe(true);
    });

    it("should return true for text with images", () => {
      expect(hasMarkdownFormatting("![alt](https://example.com/img.png)")).toBe(true);
    });

    it("should return false for plain text", () => {
      expect(hasMarkdownFormatting("plain text")).toBe(false);
      expect(hasMarkdownFormatting("no markdown here")).toBe(false);
    });

    it("should return false for empty input", () => {
      expect(hasMarkdownFormatting("")).toBe(false);
      expect(hasMarkdownFormatting(null as unknown as string)).toBe(false);
    });

    it("should return false for invalid markdown with javascript URLs", () => {
      expect(hasMarkdownFormatting("[link](javascript:alert(1))")).toBe(false);
    });
  });

  describe("stripMarkdown", () => {
    it("should strip bold formatting", () => {
      expect(stripMarkdown("**bold** text")).toBe("bold text");
      expect(stripMarkdown("__bold__ text")).toBe("bold text");
    });

    it("should strip italic formatting", () => {
      expect(stripMarkdown("*italic* text")).toBe("italic text");
      expect(stripMarkdown("_italic_ text")).toBe("italic text");
    });

    it("should strip link formatting keeping text", () => {
      expect(stripMarkdown("[link text](https://example.com)")).toBe("link text");
    });

    it("should strip image formatting keeping alt text", () => {
      expect(stripMarkdown("![alt text](https://example.com/img.png)")).toBe("alt text");
    });

    it("should strip multiple formatting types", () => {
      expect(stripMarkdown("**bold** and *italic* with [link](https://example.com)")).toBe("bold and italic with link");
    });

    it("should return empty string for empty input", () => {
      expect(stripMarkdown("")).toBe("");
      expect(stripMarkdown(null as unknown as string)).toBe("");
    });

    it("should return plain text unchanged", () => {
      expect(stripMarkdown("plain text")).toBe("plain text");
    });
  });
});
