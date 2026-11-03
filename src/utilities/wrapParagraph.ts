export const wrapParagraph = (paragraph: string, maxCharsPerLine: number): string[] => {
  if (paragraph.trim().length === 0) {
    return [" "];
  }

  const words = paragraph.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  const pushCurrent = () => {
    if (current.length > 0) {
      lines.push(current);
      current = "";
    }
  };

  for (let word of words) {
    if (word.length > maxCharsPerLine) {
      pushCurrent();
      while (word.length > 0) {
        lines.push(word.slice(0, maxCharsPerLine));
        word = word.slice(maxCharsPerLine);
      }
      continue;
    }

    if (current.length === 0) {
      current = word;
      continue;
    }

    if (current.length + 1 + word.length <= maxCharsPerLine) {
      current = `${current} ${word}`;
    } else {
      pushCurrent();
      current = word;
    }
  }

  pushCurrent();
  return lines;
};
