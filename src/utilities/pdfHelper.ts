export interface PdfOptions {
  pageWidth?: number;
  pageHeight?: number;
  margin?: number;
  fontSize?: number;
  lineHeight?: number;
}

const DEFAULT_OPTIONS: Required<PdfOptions> = {
  pageWidth: 612,
  pageHeight: 792,
  margin: 50,
  fontSize: 12,
  lineHeight: 16,
};

export const escapePdfText = (text: string): string => {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
};

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

export const createPdfFromText = (text: string, title: string, options: PdfOptions = {}): Blob => {
  const { pageWidth, pageHeight, margin, fontSize, lineHeight } = { ...DEFAULT_OPTIONS, ...options };

  const startY = pageHeight - margin;
  const startX = margin;
  const avgCharWidth = fontSize * 0.6; // rough width for Helvetica
  const maxCharsPerLine = Math.max(20, Math.floor((pageWidth - margin * 2) / avgCharWidth));
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

  const lines = text.split(/\r?\n/).flatMap(paragraph => wrapParagraph(paragraph, maxCharsPerLine));

  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    pages.push(lines.slice(i, i + maxLinesPerPage));
  }

  if (pages.length === 0) {
    pages.push([" "]);
  }

  const encoder = new TextEncoder();
  let offset = 0;
  const offsets: number[] = [];
  const parts: string[] = [];

  const add = (part: string) => {
    parts.push(part);
    offset += encoder.encode(part).length;
  };

  const addObject = (part: string) => {
    offsets.push(offset);
    add(part);
  };

  const pageObjectIds = pages.map((_, index) => 3 + index * 2);
  const contentObjectIds = pages.map((_, index) => 4 + index * 2);
  const fontObjId = 3 + pages.length * 2;

  add("%PDF-1.4\n");

  addObject(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R /Title (${escapePdfText(title)}) >>\nendobj\n`);

  const kidsArray = pageObjectIds.map(id => `${id} 0 R`).join(" ");
  addObject(`2 0 obj\n<< /Type /Pages /Kids [${kidsArray}] /Count ${pages.length} >>\nendobj\n`);

  pages.forEach((pageLines, index) => {
    const pageObjId = pageObjectIds[index];
    const contentObjId = contentObjectIds[index];

    const contentStreamLines = pageLines
      .map((line, lineIndex) => {
        const escaped = escapePdfText(line);
        const lineOp = `(${escaped}) Tj`;
        if (lineIndex === pageLines.length - 1) {
          return lineOp;
        }
        return `${lineOp}\nT*`;
      })
      .join("\n");

    const contentStream = `BT\n/F1 ${fontSize} Tf\n${startX} ${startY} Td\n${lineHeight} TL\n${contentStreamLines}\nET\n`;
    const contentLength = encoder.encode(contentStream).length;

    addObject(`${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 ${fontObjId} 0 R >> >> >>\nendobj\n`);
    addObject(`${contentObjId} 0 obj\n<< /Length ${contentLength} >>\nstream\n${contentStream}endstream\nendobj\n`);
  });

  addObject(`${fontObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  const xrefStart = offset;
  const totalObjects = fontObjId;
  add("xref\n");
  add(`0 ${totalObjects + 1}\n`);
  add("0000000000 65535 f \n");
  for (const objOffset of offsets) {
    add(`${objOffset.toString().padStart(10, "0")} 00000 n \n`);
  }

  add(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new Blob([parts.join("")], { type: "application/pdf" });
};

export const downloadPdfBlob = (pdfBlob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadPdf = (text: string, title: string, fileName: string, options: PdfOptions = {}): void => {
  const pdfBlob = createPdfFromText(text, title, options);
  downloadPdfBlob(pdfBlob, fileName);
};

export const generatePdfFileName = (title: string, suffix: string = ""): string => {
  const sanitizedTitle = (title || "Document").replace(/\s+/g, "_");
  const sanitizedSuffix = suffix ? `_${suffix}` : "";
  return `${sanitizedTitle}${sanitizedSuffix}.pdf`;
};
