import React from "react";
import { tokenizeMarkdown } from "./markdownTokenizer";

export { isValidUrl, tokenizeMarkdown } from "./markdownTokenizer";

export const escapeHtml = (text: string): string => {
  if (!text) return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

export const parseMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;

  const tokens = tokenizeMarkdown(text);

  if (tokens.length === 0) return text;

  if (tokens.length === 1 && tokens[0].type === "text") {
    return tokens[0].content;
  }

  return tokens.map((token, index) => {
    const key = `md-${index}`;

    switch (token.type) {
      case "bold":
        return React.createElement("strong", { key }, token.content);

      case "italic":
        return React.createElement("em", { key }, token.content);

      case "link":
        return React.createElement(
          "a",
          {
            key,
            href: token.url,
            target: "_blank",
            rel: "noopener noreferrer",
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
          },
          token.content,
        );

      case "image":
        return React.createElement("img", {
          key,
          src: token.url,
          alt: token.alt || "",
          style: { maxWidth: "100%", maxHeight: "200px" },
        });

      case "text":
      default:
        return React.createElement(React.Fragment, { key }, token.content);
    }
  });
};

export const hasMarkdownFormatting = (text: string): boolean => {
  if (!text) return false;

  const tokens = tokenizeMarkdown(text);
  return tokens.some(token => token.type !== "text");
};

export const stripMarkdown = (text: string): string => {
  if (!text) return "";

  const tokens = tokenizeMarkdown(text);
  return tokens.map(token => token.content).join("");
};
