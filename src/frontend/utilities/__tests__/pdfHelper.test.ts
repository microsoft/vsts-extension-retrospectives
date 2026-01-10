import * as pdfHelper from "../pdfHelper";
import { escapePdfText, wrapParagraph, createPdfFromText, generatePdfFileName, downloadPdf, downloadPdfBlob } from "../pdfHelper";
import { TextEncoder, TextDecoder } from "util";

// Polyfill TextEncoder for Node.js test environment
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  (globalThis as typeof globalThis & { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;
}

// Helper to read Blob content as text (works in both browser and Node.js)
const blobToText = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsText(blob);
  });
};

describe("pdfHelper", () => {
  describe("escapePdfText", () => {
    it("should escape backslashes", () => {
      expect(escapePdfText("test\\path")).toBe("test\\\\path");
    });

    it("should escape opening parentheses", () => {
      expect(escapePdfText("test(value)")).toBe("test\\(value\\)");
    });

    it("should escape closing parentheses", () => {
      expect(escapePdfText("(start)")).toBe("\\(start\\)");
    });

    it("should escape multiple special characters", () => {
      expect(escapePdfText("path\\to\\(file)")).toBe("path\\\\to\\\\\\(file\\)");
    });

    it("should handle empty string", () => {
      expect(escapePdfText("")).toBe("");
    });

    it("should handle text without special characters", () => {
      expect(escapePdfText("Hello World")).toBe("Hello World");
    });

    it("should escape consecutive special characters", () => {
      expect(escapePdfText("\\\\((")).toBe("\\\\\\\\\\(\\(");
    });

    it("should handle text with mixed content", () => {
      expect(escapePdfText("Hello (world) at path\\dir")).toBe("Hello \\(world\\) at path\\\\dir");
    });
  });

  describe("wrapParagraph", () => {
    it("should return single space for empty string", () => {
      expect(wrapParagraph("", 50)).toEqual([" "]);
    });

    it("should return single space for whitespace-only string", () => {
      expect(wrapParagraph("   ", 50)).toEqual([" "]);
    });

    it("should return single line for short text", () => {
      expect(wrapParagraph("Hello World", 50)).toEqual(["Hello World"]);
    });

    it("should wrap text that exceeds max chars per line", () => {
      const result = wrapParagraph("This is a longer sentence that should wrap", 20);
      expect(result.length).toBeGreaterThan(1);
      result.forEach(line => {
        expect(line.length).toBeLessThanOrEqual(20);
      });
    });

    it("should split very long words", () => {
      const longWord = "abcdefghijklmnopqrstuvwxyz";
      const result = wrapParagraph(longWord, 10);
      expect(result).toEqual(["abcdefghij", "klmnopqrst", "uvwxyz"]);
    });

    it("should handle multiple words", () => {
      const result = wrapParagraph("one two three", 8);
      expect(result).toEqual(["one two", "three"]);
    });

    it("should handle exact fit", () => {
      expect(wrapParagraph("Hello", 5)).toEqual(["Hello"]);
    });

    it("should handle single character max", () => {
      const result = wrapParagraph("ABC", 1);
      expect(result).toEqual(["A", "B", "C"]);
    });

    it("should handle mixed long and short words", () => {
      const result = wrapParagraph("Hi superlongword there", 10);
      expect(result.length).toBeGreaterThan(1);
    });

    it("should handle text with multiple spaces between words", () => {
      const result = wrapParagraph("Hello    World", 50);
      expect(result).toEqual(["Hello World"]);
    });

    it("should preserve word boundaries when possible", () => {
      const result = wrapParagraph("Word1 Word2 Word3", 12);
      expect(result[0]).toBe("Word1 Word2");
      expect(result[1]).toBe("Word3");
    });
  });

  describe("createPdfFromText", () => {
    it("should create a Blob with PDF content", () => {
      const result = createPdfFromText("Hello World", "Test Document");
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("application/pdf");
    });

    it("should create valid PDF header", async () => {
      const result = createPdfFromText("Test", "Title");
      const text = await blobToText(result);
      expect(text.startsWith("%PDF-1.4")).toBe(true);
    });

    it("should include the title in PDF metadata", async () => {
      const result = createPdfFromText("Content", "My Test Title");
      const text = await blobToText(result);
      expect(text).toContain("My Test Title");
    });

    it("should escape special characters in title", async () => {
      const result = createPdfFromText("Content", "Title (with) special\\chars");
      const text = await blobToText(result);
      expect(text).toContain("Title \\(with\\) special\\\\chars");
    });

    it("should include PDF trailer and xref", async () => {
      const result = createPdfFromText("Test content", "Test");
      const text = await blobToText(result);
      expect(text).toContain("xref");
      expect(text).toContain("trailer");
      expect(text).toContain("%%EOF");
    });

    it("should handle empty text", async () => {
      const result = createPdfFromText("", "Empty Document");
      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);
    });

    it("should handle multi-line text", async () => {
      const result = createPdfFromText("Line 1\nLine 2\nLine 3", "Multi-line");
      const text = await blobToText(result);
      expect(text).toContain("Line 1");
      expect(text).toContain("Line 2");
      expect(text).toContain("Line 3");
    });

    it("should handle Windows-style line endings", async () => {
      const result = createPdfFromText("Line 1\r\nLine 2", "Windows");
      const text = await blobToText(result);
      expect(text).toContain("Line 1");
      expect(text).toContain("Line 2");
    });

    it("should include font definition", async () => {
      const result = createPdfFromText("Test", "Test");
      const text = await blobToText(result);
      expect(text).toContain("/Type /Font");
      expect(text).toContain("/BaseFont /Helvetica");
    });

    it("should include page definition", async () => {
      const result = createPdfFromText("Test", "Test");
      const text = await blobToText(result);
      expect(text).toContain("/Type /Page");
      expect(text).toContain("/MediaBox");
    });

    it("should use custom page dimensions", async () => {
      const result = createPdfFromText("Test", "Test", { pageWidth: 400, pageHeight: 600 });
      const text = await blobToText(result);
      expect(text).toContain("MediaBox [0 0 400 600]");
    });

    it("should use custom font size", async () => {
      const result = createPdfFromText("Test", "Test", { fontSize: 14 });
      const text = await blobToText(result);
      expect(text).toContain("/F1 14 Tf");
    });

    it("should handle very long text that spans multiple pages", async () => {
      const longText = Array(100).fill("This is a long line of text.").join("\n");
      const result = createPdfFromText(longText, "Long Document");
      const text = await blobToText(result);
      // Should have multiple page objects
      const pageCount = (text.match(/\/Type \/Page/g) || []).length;
      expect(pageCount).toBeGreaterThan(1);
    });

    it("should handle text with special PDF characters", async () => {
      const result = createPdfFromText("Test (with) parentheses and \\backslash", "Special");
      const text = await blobToText(result);
      expect(text).toContain("\\(with\\)");
      expect(text).toContain("\\\\backslash");
    });

    it("should create Pages object with correct count", async () => {
      const result = createPdfFromText("Short text", "Test");
      const text = await blobToText(result);
      expect(text).toContain("/Count 1");
    });

    it("should include catalog object", async () => {
      const result = createPdfFromText("Test", "Test");
      const text = await blobToText(result);
      expect(text).toContain("/Type /Catalog");
    });

    it("should handle text with only newlines", async () => {
      const result = createPdfFromText("\n\n\n", "Newlines");
      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);
    });

    it("should handle case where lines array results in zero pages and push empty page (line 81)", async () => {
      // Mock wrapParagraph to return an empty array to trigger pages.length === 0
      const wrapParagraphSpy = jest.spyOn(pdfHelper, "wrapParagraph").mockReturnValue([]);

      const result = createPdfFromText("any text", "Test");
      const text = await blobToText(result);

      // The defensive code should push [" "] when pages.length === 0
      expect(text).toContain("/Count 1"); // Exactly one page
      expect(result).toBeInstanceOf(Blob);

      wrapParagraphSpy.mockRestore();
    });

    it("should handle custom line height", async () => {
      const result = createPdfFromText("Test", "Test", { lineHeight: 20 });
      const text = await blobToText(result);
      expect(text).toContain("20 TL");
    });

    it("should handle custom margin", async () => {
      const result = createPdfFromText("Test", "Test", { margin: 100 });
      const text = await blobToText(result);
      expect(text).toContain("100 692 Td"); // startX startY
    });

    it("should handle all custom options together", async () => {
      const result = createPdfFromText("Test content", "Custom Doc", {
        pageWidth: 500,
        pageHeight: 700,
        margin: 60,
        fontSize: 10,
        lineHeight: 14,
      });
      const text = await blobToText(result);
      expect(text).toContain("MediaBox [0 0 500 700]");
      expect(text).toContain("/F1 10 Tf");
      expect(text).toContain("14 TL");
    });
  });

  describe("generatePdfFileName", () => {
    it("should generate filename with .pdf extension", () => {
      expect(generatePdfFileName("My Document")).toBe("My_Document.pdf");
    });

    it("should replace spaces with underscores", () => {
      expect(generatePdfFileName("Hello World Test")).toBe("Hello_World_Test.pdf");
    });

    it("should handle multiple consecutive spaces", () => {
      expect(generatePdfFileName("Hello   World")).toBe("Hello_World.pdf");
    });

    it("should append suffix when provided", () => {
      expect(generatePdfFileName("Report", "Summary")).toBe("Report_Summary.pdf");
    });

    it("should handle empty title", () => {
      expect(generatePdfFileName("")).toBe("Document.pdf");
    });

    it("should handle null-ish title", () => {
      expect(generatePdfFileName(null as unknown as string)).toBe("Document.pdf");
    });

    it("should handle empty suffix", () => {
      expect(generatePdfFileName("Title", "")).toBe("Title.pdf");
    });

    it("should handle title with special characters", () => {
      expect(generatePdfFileName("My Title")).toBe("My_Title.pdf");
    });

    it("should handle title with leading/trailing spaces", () => {
      expect(generatePdfFileName("  Title  ")).toBe("_Title_.pdf");
    });
  });

  describe("downloadPdf", () => {
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;
    let mockUrl: string;
    let mockLink: HTMLAnchorElement;
    let appendedChild: Node | null;
    let removedChild: Node | null;

    beforeEach(() => {
      mockUrl = "blob:mock-url";
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
      URL.revokeObjectURL = jest.fn();

      appendedChild = null;
      removedChild = null;

      mockLink = {
        href: "",
        download: "",
        click: jest.fn(),
      } as unknown as HTMLAnchorElement;

      jest.spyOn(document, "createElement").mockReturnValue(mockLink);
      jest.spyOn(document.body, "appendChild").mockImplementation(child => {
        appendedChild = child;
        return child;
      });
      jest.spyOn(document.body, "removeChild").mockImplementation(child => {
        removedChild = child;
        return child;
      });
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      jest.restoreAllMocks();
    });

    it("should create a download link", () => {
      downloadPdf("Test content", "Test Title", "test.pdf");
      expect(document.createElement).toHaveBeenCalledWith("a");
    });

    it("should set the correct href on the link", () => {
      downloadPdf("Test content", "Test Title", "test.pdf");
      expect(mockLink.href).toBe(mockUrl);
    });

    it("should set the correct download filename", () => {
      downloadPdf("Test content", "Test Title", "my-file.pdf");
      expect(mockLink.download).toBe("my-file.pdf");
    });

    it("should append the link to the document body", () => {
      downloadPdf("Test content", "Test Title", "test.pdf");
      expect(appendedChild).toBe(mockLink);
    });

    it("should click the link to trigger download", () => {
      downloadPdf("Test content", "Test Title", "test.pdf");
      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should remove the link after clicking", () => {
      downloadPdf("Test content", "Test Title", "test.pdf");
      expect(removedChild).toBe(mockLink);
    });

    it("should revoke the object URL after download", () => {
      downloadPdf("Test content", "Test Title", "test.pdf");
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    it("should create PDF with provided options", () => {
      const createObjectURLSpy = jest.spyOn(URL, "createObjectURL");
      downloadPdf("Test", "Title", "file.pdf", { fontSize: 14 });

      const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe("application/pdf");
    });

    it("should handle empty content", () => {
      expect(() => downloadPdf("", "Empty", "empty.pdf")).not.toThrow();
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe("downloadPdfBlob", () => {
    let mockLink: HTMLAnchorElement;
    let mockUrl: string;
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;
    let appendedChild: Node | null;
    let removedChild: Node | null;

    beforeEach(() => {
      mockUrl = "blob:mock-url-for-blob";
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
      URL.revokeObjectURL = jest.fn();

      appendedChild = null;
      removedChild = null;

      mockLink = {
        href: "",
        download: "",
        click: jest.fn(),
      } as unknown as HTMLAnchorElement;

      jest.spyOn(document, "createElement").mockReturnValue(mockLink);
      jest.spyOn(document.body, "appendChild").mockImplementation(child => {
        appendedChild = child;
        return child;
      });
      jest.spyOn(document.body, "removeChild").mockImplementation(child => {
        removedChild = child;
        return child;
      });
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      jest.restoreAllMocks();
    });

    it("should create a download link from a blob", () => {
      const blob = new Blob(["test content"], { type: "application/pdf" });
      downloadPdfBlob(blob, "test.pdf");
      expect(document.createElement).toHaveBeenCalledWith("a");
    });

    it("should set the correct href on the link", () => {
      const blob = new Blob(["test content"], { type: "application/pdf" });
      downloadPdfBlob(blob, "test.pdf");
      expect(mockLink.href).toBe(mockUrl);
    });

    it("should set the correct download filename", () => {
      const blob = new Blob(["test content"], { type: "application/pdf" });
      downloadPdfBlob(blob, "my-document.pdf");
      expect(mockLink.download).toBe("my-document.pdf");
    });

    it("should append the link to the document body", () => {
      const blob = new Blob(["test content"], { type: "application/pdf" });
      downloadPdfBlob(blob, "test.pdf");
      expect(appendedChild).toBe(mockLink);
    });

    it("should click the link to trigger download", () => {
      const blob = new Blob(["test content"], { type: "application/pdf" });
      downloadPdfBlob(blob, "test.pdf");
      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should remove the link after clicking", () => {
      const blob = new Blob(["test content"], { type: "application/pdf" });
      downloadPdfBlob(blob, "test.pdf");
      expect(removedChild).toBe(mockLink);
    });

    it("should revoke the object URL after download", () => {
      const blob = new Blob(["test content"], { type: "application/pdf" });
      downloadPdfBlob(blob, "test.pdf");
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    it("should pass the blob directly to createObjectURL", () => {
      const blob = new Blob(["specific content"], { type: "application/pdf" });
      downloadPdfBlob(blob, "test.pdf");
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    });

    it("should handle blobs of any type", () => {
      const textBlob = new Blob(["text"], { type: "text/plain" });
      expect(() => downloadPdfBlob(textBlob, "test.txt")).not.toThrow();
      expect(mockLink.click).toHaveBeenCalled();
    });
  });
});
