import { copyToClipboard } from "../clipboardHelper";

describe("clipboardHelper", () => {
  describe("copyToClipboard", () => {
        it("should return false if document is undefined (non-browser environment)", async () => {
          // @ts-ignore
          const originalDocument = global.document;
          // @ts-ignore
          delete global.document;
          const { copyToClipboard } = await import("../clipboardHelper");
          const result = await copyToClipboard("test");
          expect(result).toBe(false);
          global.document = originalDocument;
        });
    let originalExecCommand: typeof document.execCommand;
    let originalAddEventListener: typeof document.addEventListener;
    let originalRemoveEventListener: typeof document.removeEventListener;
    let originalConsoleWarn: typeof console.warn;
    let originalConsoleError: typeof console.error;

    beforeEach(() => {
      originalExecCommand = document.execCommand;
      originalAddEventListener = document.addEventListener;
      originalRemoveEventListener = document.removeEventListener;
      originalConsoleWarn = console.warn;
      originalConsoleError = console.error;
    });

    afterEach(() => {
      document.execCommand = originalExecCommand;
      document.addEventListener = originalAddEventListener;
      document.removeEventListener = originalRemoveEventListener;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      jest.restoreAllMocks();
    });

    it("should intercept copy event and set text/plain clipboard data", async () => {
      let copyHandler: ((e: ClipboardEvent) => void) | null = null;
      const setData = jest.fn();
      const preventDefault = jest.fn();

      document.addEventListener = jest.fn((type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === "copy") {
          copyHandler = listener as (e: ClipboardEvent) => void;
        }
      }) as typeof document.addEventListener;

      document.execCommand = jest.fn().mockImplementation(() => {
        copyHandler?.({
          clipboardData: ({ setData } as unknown) as DataTransfer,
          preventDefault,
        } as unknown as ClipboardEvent);
        return true;
      });

      const testText = "Test text to copy";
      const result = await copyToClipboard(testText);

      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith("copy");
      expect(setData).toHaveBeenCalledWith("text/plain", testText);
      expect(preventDefault).toHaveBeenCalled();
    });

    it("should return true when execCommand succeeds", async () => {
      document.execCommand = jest.fn().mockReturnValue(true);

      const result = await copyToClipboard("test");

      expect(result).toBe(true);
    });

    it("should return false when execCommand returns false", async () => {
      document.execCommand = jest.fn().mockReturnValue(false);
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();
      const result = await copyToClipboard("test");

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith("execCommand('copy') returned false - clipboard not updated.");
    });

    it("should return false when execCommand throws an exception", async () => {
      document.execCommand = jest.fn().mockImplementation(() => {
        throw new Error("execCommand not supported");
      });

      const result = await copyToClipboard("test");

      expect(result).toBe(false);
    });

    it("should handle empty strings", async () => {
      let copyHandler: ((e: ClipboardEvent) => void) | null = null;
      const setData = jest.fn();

      document.addEventListener = jest.fn((type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === "copy") {
          copyHandler = listener as (e: ClipboardEvent) => void;
        }
      }) as typeof document.addEventListener;

      document.execCommand = jest.fn().mockImplementation(() => {
        copyHandler?.({
          clipboardData: ({ setData } as unknown) as DataTransfer,
          preventDefault: jest.fn(),
        } as unknown as ClipboardEvent);
        return true;
      });

      const result = await copyToClipboard("");

      expect(result).toBe(true);
      expect(setData).toHaveBeenCalledWith("text/plain", "");
    });

    it("should handle multi-line text", async () => {
      let copyHandler: ((e: ClipboardEvent) => void) | null = null;
      const setData = jest.fn();

      document.addEventListener = jest.fn((type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === "copy") {
          copyHandler = listener as (e: ClipboardEvent) => void;
        }
      }) as typeof document.addEventListener;

      document.execCommand = jest.fn().mockImplementation(() => {
        copyHandler?.({
          clipboardData: ({ setData } as unknown) as DataTransfer,
          preventDefault: jest.fn(),
        } as unknown as ClipboardEvent);
        return true;
      });

      const multiLineText = "Line 1\nLine 2\nLine 3";
      const result = await copyToClipboard(multiLineText);

      expect(result).toBe(true);
      expect(setData).toHaveBeenCalledWith("text/plain", multiLineText);
    });

    it("should handle special characters", async () => {
      let copyHandler: ((e: ClipboardEvent) => void) | null = null;
      const setData = jest.fn();

      document.addEventListener = jest.fn((type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === "copy") {
          copyHandler = listener as (e: ClipboardEvent) => void;
        }
      }) as typeof document.addEventListener;

      document.execCommand = jest.fn().mockImplementation(() => {
        copyHandler?.({
          clipboardData: ({ setData } as unknown) as DataTransfer,
          preventDefault: jest.fn(),
        } as unknown as ClipboardEvent);
        return true;
      });

      const specialText = "Special chars: @#$%^&*()[]{}|\\<>?/~`";
      const result = await copyToClipboard(specialText);

      expect(result).toBe(true);
      expect(setData).toHaveBeenCalledWith("text/plain", specialText);
    });

    it("should log error when copy-event approach fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      document.execCommand = jest.fn().mockReturnValue(true);
      document.addEventListener = jest.fn().mockImplementation(() => {
        throw new Error("addEventListener failed");
      }) as typeof document.addEventListener;

      await copyToClipboard("test");

      expect(consoleErrorSpy).toHaveBeenCalledWith("Copy-event approach failed:", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it("should remove copy listener when execCommand returns false", async () => {
      const removeSpy = jest.fn();
      document.removeEventListener = removeSpy as typeof document.removeEventListener;
      document.execCommand = jest.fn().mockReturnValue(false);

      await copyToClipboard("test");

      expect(removeSpy).toHaveBeenCalledWith("copy", expect.any(Function));
    });
  });
});
