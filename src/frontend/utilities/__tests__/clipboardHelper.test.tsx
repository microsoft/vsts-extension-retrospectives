import { copyToClipboard } from "../clipboardHelper";

describe("clipboardHelper", () => {
  describe("copyToClipboard", () => {
    let originalClipboard: Clipboard;
    let originalExecCommand: typeof document.execCommand;

    beforeEach(() => {
      // Save original implementations
      originalClipboard = navigator.clipboard;
      originalExecCommand = document.execCommand;
    });

    afterEach(() => {
      // Restore original implementations
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
      document.execCommand = originalExecCommand;

      // Clean up any leftover textareas
      const textareas = document.querySelectorAll("textarea");
      textareas.forEach(textarea => {
        if (textarea.parentNode) {
          textarea.parentNode.removeChild(textarea);
        }
      });
    });

    it("should copy text using Clipboard API when available", async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      const testText = "Test text to copy";
      const result = await copyToClipboard(testText);

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(testText);
    });

    it("should return true when Clipboard API succeeds", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true,
      });

      const result = await copyToClipboard("test");
      expect(result).toBe(true);
    });

    it("should fallback to execCommand when Clipboard API fails", async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error("Clipboard API failed"));
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      const mockExecCommand = jest.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const testText = "Fallback test";
      const result = await copyToClipboard(testText);

      expect(result).toBe(true);
      expect(mockExecCommand).toHaveBeenCalledWith("copy");
    });

    it("should fallback to execCommand when Clipboard API is not available", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const mockExecCommand = jest.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const testText = "No clipboard API";
      const result = await copyToClipboard(testText);

      expect(result).toBe(true);
      expect(mockExecCommand).toHaveBeenCalledWith("copy");
    });

    it("should create and remove textarea element when using fallback", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      document.execCommand = jest.fn().mockReturnValue(true);

      const initialTextareaCount = document.querySelectorAll("textarea").length;
      await copyToClipboard("test");
      const finalTextareaCount = document.querySelectorAll("textarea").length;

      expect(finalTextareaCount).toBe(initialTextareaCount);
    });

    it("should set correct styles on fallback textarea", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      let capturedTextarea: HTMLTextAreaElement | null = null;
      const originalExecCommand = document.execCommand;
      document.execCommand = jest.fn((command: string) => {
        capturedTextarea = document.querySelector("textarea");
        return originalExecCommand.call(document, command);
      });

      await copyToClipboard("test");

      expect(capturedTextarea).not.toBeNull();
      if (capturedTextarea) {
        expect(capturedTextarea.style.position).toBe("fixed");
        expect(capturedTextarea.style.opacity).toBe("0");
        expect(capturedTextarea.getAttribute("readonly")).toBe("");
        expect(capturedTextarea.getAttribute("aria-hidden")).toBe("true");
      }
    });

    it("should return false when both methods fail", async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error("Clipboard API failed"));
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      const mockExecCommand = jest.fn().mockReturnValue(false);
      document.execCommand = mockExecCommand;

      const result = await copyToClipboard("test");

      expect(result).toBe(false);
    });

    it("should return false when fallback throws an exception", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      document.execCommand = jest.fn().mockImplementation(() => {
        throw new Error("execCommand not supported");
      });

      const result = await copyToClipboard("test");

      expect(result).toBe(false);
    });

    it("should handle empty strings", async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      const result = await copyToClipboard("");

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith("");
    });

    it("should handle multi-line text", async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      const multiLineText = "Line 1\nLine 2\nLine 3";
      const result = await copyToClipboard(multiLineText);

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(multiLineText);
    });

    it("should handle special characters", async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      const specialText = "Special chars: @#$%^&*()[]{}|\\<>?/~`";
      const result = await copyToClipboard(specialText);

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(specialText);
    });

    it("should log error when Clipboard API fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const mockWriteText = jest.fn().mockRejectedValue(new Error("Permission denied"));
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      document.execCommand = jest.fn().mockReturnValue(true);

      await copyToClipboard("test");

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to copy using Clipboard API:", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it("should log error when fallback method fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      document.execCommand = jest.fn().mockImplementation(() => {
        throw new Error("execCommand failed");
      });

      await copyToClipboard("test");

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to copy using fallback method:", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });
});
