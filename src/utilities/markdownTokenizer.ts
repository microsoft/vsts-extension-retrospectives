const SAFE_URL_REGEX = /^https?:\/\//i;

export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") {
    return false;
  }
  const trimmedUrl = url.trim();
  return SAFE_URL_REGEX.test(trimmedUrl);
};

type TokenType = "text" | "bold" | "italic" | "link" | "image";

interface Token {
  type: TokenType;
  content: string;
  url?: string;
  alt?: string;
}

export const tokenizeMarkdown = (text: string): Token[] => {
  if (!text) return [];

  const tokens: Token[] = [];
  let remaining = text;

  const imagePattern = /^!\[([^\]]*)\]\(([^)]+)\)/;
  const linkPattern = /^\[([^\]]+)\]\(([^)]+)\)/;
  const boldAsteriskPattern = /^\*\*(.+?)\*\*/;
  const boldUnderscorePattern = /^__(.+?)__/;
  const italicAsteriskPattern = /^\*([^*]+)\*/;
  const italicUnderscorePattern = /^_([^_]+)_/;

  while (remaining.length > 0) {
    const imageMatch = imagePattern.exec(remaining);
    if (imageMatch) {
      const [fullMatch, alt, url] = imageMatch;
      if (isValidUrl(url)) {
        tokens.push({ type: "image", content: alt || "", url, alt: alt || "" });
      } else {
        tokens.push({ type: "text", content: fullMatch });
      }
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    const linkMatch = linkPattern.exec(remaining);
    if (linkMatch) {
      const [fullMatch, linkText, url] = linkMatch;
      if (isValidUrl(url)) {
        tokens.push({ type: "link", content: linkText, url });
      } else {
        tokens.push({ type: "text", content: fullMatch });
      }
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    const boldAsteriskMatch = boldAsteriskPattern.exec(remaining);
    if (boldAsteriskMatch) {
      const [fullMatch, content] = boldAsteriskMatch;
      tokens.push({ type: "bold", content });
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    const boldUnderscoreMatch = boldUnderscorePattern.exec(remaining);
    if (boldUnderscoreMatch) {
      const [fullMatch, content] = boldUnderscoreMatch;
      tokens.push({ type: "bold", content });
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    const italicAsteriskMatch = italicAsteriskPattern.exec(remaining);
    if (italicAsteriskMatch) {
      const [fullMatch, content] = italicAsteriskMatch;
      tokens.push({ type: "italic", content });
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    const italicUnderscoreMatch = italicUnderscorePattern.exec(remaining);
    if (italicUnderscoreMatch) {
      const [fullMatch, content] = italicUnderscoreMatch;
      tokens.push({ type: "italic", content });
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    const nextSpecialIndex = remaining.slice(1).search(/[*_[!]/);
    if (nextSpecialIndex === -1) {
      tokens.push({ type: "text", content: remaining });
      remaining = "";
    } else {
      const textContent = remaining.slice(0, nextSpecialIndex + 1);
      tokens.push({ type: "text", content: textContent });
      remaining = remaining.slice(nextSpecialIndex + 1);
    }
  }

  const mergedTokens: Token[] = [];
  for (const token of tokens) {
    if (token.type === "text" && mergedTokens.length > 0 && mergedTokens[mergedTokens.length - 1].type === "text") {
      mergedTokens[mergedTokens.length - 1].content += token.content;
    } else {
      mergedTokens.push(token);
    }
  }

  return mergedTokens;
};
