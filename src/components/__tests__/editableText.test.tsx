import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import EditableText, { EditableTextProps } from "../editableText";

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: (_plugin: any, Component: any) => Component,
  useTrackMetric: () => jest.fn(),
}));

const mockOnSave = jest.fn(() => {});

const mockedTestProps: EditableTextProps = {
  text: "",
  isChangeEventRequired: false,
  onSave: mockOnSave,
};

describe("Editable Text Component", () => {
  beforeEach(() => {
    mockOnSave.mockClear();
  });

  it("renders in editing mode when text is empty", () => {
    render(<EditableText {...mockedTestProps} />);

    expect(document.querySelector('[aria-label="Please enter feedback title"]')).toBeTruthy();
    expect(document.querySelector("textarea, input")).toBeTruthy();
  });

  it("renders native input in single-line mode", async () => {
    render(<EditableText {...mockedTestProps} text="Single line" isMultiline={false} />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const input = document.querySelector('input[aria-label="Please enter feedback title"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("renders native textarea in multiline mode", async () => {
    render(<EditableText {...mockedTestProps} text="Multi line" isMultiline={true} />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const textarea = document.querySelector('textarea[aria-label="Please enter feedback title"]') as HTMLTextAreaElement | null;
    expect(textarea).toBeTruthy();
    expect(document.querySelector("input")).toBeNull();
  });

  it("renders in display mode when text is provided", () => {
    const propsWithText = { ...mockedTestProps, text: "Test Text" };
    render(<EditableText {...propsWithText} />);

    expect(document.body.textContent).toContain("Test Text");
    expect(document.querySelector('[title="Click to edit"]')).toBeTruthy();
  });

  it("switches to edit mode when clicked", async () => {
    const propsWithText = { ...mockedTestProps, text: "Test Text" };
    render(<EditableText {...propsWithText} />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    expect(document.querySelector('[aria-label="Please enter feedback title"]')).toBeTruthy();
    expect(document.querySelector('input[value="Test Text"], textarea[value="Test Text"]')).toBeTruthy();
  });

  it("switches to edit mode when Enter key is pressed", async () => {
    const propsWithText = { ...mockedTestProps, text: "Test Text" };
    render(<EditableText {...propsWithText} />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    clickableElement.focus();
    await userEvent.keyboard("{Enter}");

    expect(document.querySelector('[aria-label="Please enter feedback title"]')).toBeTruthy();
    expect(document.querySelector('input[value="Test Text"], textarea[value="Test Text"]')).toBeTruthy();
  });

  it("does not switch to edit mode when non-Enter key is pressed in display mode", async () => {
    const propsWithText = { ...mockedTestProps, text: "Test Text" };
    render(<EditableText {...propsWithText} />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    clickableElement.focus();
    await userEvent.keyboard("a");

    // Should still be in display mode
    expect(document.querySelector('[title="Click to edit"]')).toBeTruthy();
    expect(document.querySelector("textarea, input")).toBeNull();
  });

  it("does not switch to edit mode when isDisabled is true", async () => {
    const propsWithDisabled = { ...mockedTestProps, text: "Test Text", isDisabled: true };
    render(<EditableText {...propsWithDisabled} />);

    const clickableElement = document.querySelector(".editable-text") as HTMLElement;
    expect(clickableElement).toBeTruthy();

    // Try clicking
    await userEvent.click(clickableElement);
    expect(document.querySelector("textarea, input")).toBeNull();

    // Try pressing Enter
    clickableElement.focus();
    await userEvent.keyboard("{Enter}");
    expect(document.querySelector("textarea, input")).toBeNull();
  });

  it("calls onSave when text changes and isChangeEventRequired is true", async () => {
    const propsWithChangeEvent = { ...mockedTestProps, isChangeEventRequired: true, text: "Initial" };
    render(<EditableText {...propsWithChangeEvent} />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const input = document.querySelector('input[value="Initial"], textarea[value="Initial"]') as HTMLElement;
    await userEvent.clear(input);
    await userEvent.type(input, "New Text");

    expect(mockOnSave).toHaveBeenCalledWith("New Text");
  });

  it("shows error message when text is empty", async () => {
    render(<EditableText {...mockedTestProps} />);

    const input = document.querySelector('[aria-label="Please enter feedback title"]') as HTMLElement;

    await userEvent.clear(input);
    await userEvent.type(input, " ");
    await userEvent.clear(input);

    expect(document.body.textContent).toContain("This cannot be empty.");
  });

  it("cancels edit and restores original text when Escape is pressed", async () => {
    const propsWithText = { ...mockedTestProps, text: "Original Text" };
    render(<EditableText {...propsWithText} />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const textarea = document.querySelector("textarea, input") as HTMLElement;
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Modified Text");
    await userEvent.keyboard("{Escape}");

    expect(mockOnSave).toHaveBeenCalledWith("Original Text");
  });

  it("stays in edit mode when Ctrl+Enter is pressed (allows multiline)", async () => {
    const propsMultiline = { ...mockedTestProps, text: "Line 1", isMultiline: true };
    render(<EditableText {...propsMultiline} />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const textarea = document.querySelector("textarea") as HTMLElement;
    await userEvent.type(textarea, "{Control>}{Enter}{/Control}");

    // Component should still be in edit mode (not saved)
    expect(document.querySelector("textarea")).toBeTruthy();
    // onSave should not have been called
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("stays in edit mode when Shift+Enter is pressed (allows multiline)", async () => {
    const propsMultiline = { ...mockedTestProps, text: "Line 1", isMultiline: true };
    render(<EditableText {...propsMultiline} />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const textarea = document.querySelector("textarea") as HTMLElement;
    await userEvent.type(textarea, "{Shift>}{Enter}{/Shift}");

    // Component should still be in edit mode (not saved)
    expect(document.querySelector("textarea")).toBeTruthy();
    // onSave should not have been called
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("shows error when trying to save empty text with Enter", async () => {
    render(<EditableText {...mockedTestProps} />);

    const input = document.querySelector('[aria-label="Please enter feedback title"]') as HTMLElement;
    await userEvent.clear(input);
    await userEvent.keyboard("{Enter}");

    expect(document.body.textContent).toContain("This cannot be empty.");
  });

  it("saves text when Enter is pressed with valid content", async () => {
    render(<EditableText {...mockedTestProps} text="Initial" />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const input = document.querySelector("input, textarea") as HTMLElement;
    await userEvent.clear(input);
    await userEvent.type(input, "New Content{Enter}");

    expect(mockOnSave).toHaveBeenCalledWith("New Content");
  });

  it("saves text when Tab is pressed with valid content", async () => {
    render(<EditableText {...mockedTestProps} text="Initial" />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const input = document.querySelector("input, textarea") as HTMLElement;
    await userEvent.clear(input);
    await userEvent.type(input, "Tab Content{Tab}");

    expect(mockOnSave).toHaveBeenCalledWith("Tab Content");
  });

  it("updates newText when props.text changes and not editing", async () => {
    const { rerender } = render(<EditableText {...mockedTestProps} text="Initial" />);

    // Update props with new text
    rerender(<EditableText {...mockedTestProps} text="Updated from props" />);

    // Text should be updated in display mode
    expect(document.body.textContent).toContain("Updated from props");
  });

  it("saves text and exits edit mode when clicking outside with valid text", async () => {
    const { container } = render(<EditableText {...mockedTestProps} text="Initial" />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const input = document.querySelector("input, textarea") as HTMLElement;
    await userEvent.clear(input);
    await userEvent.type(input, "New Text");

    // Create an outside element and click it
    const outsideDiv = document.createElement("div");
    document.body.appendChild(outsideDiv);

    const mouseDownEvent = new MouseEvent("mousedown", { bubbles: true });
    Object.defineProperty(mouseDownEvent, "target", { value: outsideDiv, enumerable: true });
    document.dispatchEvent(mouseDownEvent);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockOnSave).toHaveBeenCalledWith("New Text");

    document.body.removeChild(outsideDiv);
  });

  it("saves empty string when clicking outside with empty text", async () => {
    const { container } = render(<EditableText {...mockedTestProps} text="Initial" />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const input = document.querySelector("input, textarea") as HTMLElement;
    await userEvent.clear(input);

    // Create an outside element and click it
    const outsideDiv = document.createElement("div");
    document.body.appendChild(outsideDiv);

    const mouseDownEvent = new MouseEvent("mousedown", { bubbles: true });
    Object.defineProperty(mouseDownEvent, "target", { value: outsideDiv, enumerable: true });
    document.dispatchEvent(mouseDownEvent);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockOnSave).toHaveBeenCalledWith("");

    document.body.removeChild(outsideDiv);
  });

  it("does not save when clicking inside the editable text component", async () => {
    const { container } = render(<EditableText {...mockedTestProps} text="Initial" />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const input = document.querySelector("input, textarea") as HTMLElement;
    await userEvent.clear(input);
    await userEvent.type(input, "New Text");

    // Click inside the component
    const mouseDownEvent = new MouseEvent("mousedown", { bubbles: true });
    Object.defineProperty(mouseDownEvent, "target", { value: input, enumerable: true });
    document.dispatchEvent(mouseDownEvent);

    await new Promise(resolve => setTimeout(resolve, 10));

    // Should not save yet, still in edit mode
    expect(document.querySelector("input, textarea")).toBeTruthy();
  });

  it("cleans up event listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");
    const { unmount } = render(<EditableText {...mockedTestProps} text="Test" />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it("shows error when trying to add newline with Ctrl+Enter on empty text", async () => {
    const propsMultiline = { ...mockedTestProps, text: "", isMultiline: true };
    render(<EditableText {...propsMultiline} />);

    const textarea = document.querySelector("textarea") as HTMLElement;
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "{Control>}{Enter}{/Control}");

    expect(document.body.textContent).toContain("This cannot be empty.");
  });

  it("shows error when trying to add newline with Shift+Enter on empty text", async () => {
    const propsMultiline = { ...mockedTestProps, text: "", isMultiline: true };
    render(<EditableText {...propsMultiline} />);

    const textarea = document.querySelector("textarea") as HTMLElement;
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "{Shift>}{Enter}{/Shift}");

    expect(document.body.textContent).toContain("This cannot be empty.");
  });

  describe("Accessibility - Fix double character announcement (Issue #1261)", () => {
    it("should not have aria-live on the editable text container", () => {
      render(<EditableText {...mockedTestProps} />);

      const container = document.querySelector(".editable-text-container") as HTMLElement;
      expect(container).toBeTruthy();
      expect(container.getAttribute("aria-live")).toBeNull();
    });

    it("should have aria-live only on error message when validation fails", async () => {
      render(<EditableText {...mockedTestProps} />);

      const input = document.querySelector('[aria-label="Please enter feedback title"]') as HTMLElement;
      await userEvent.clear(input);
      await userEvent.type(input, " ");
      await userEvent.clear(input);

      const errorMessage = document.querySelector(".input-validation-message") as HTMLElement;
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.getAttribute("aria-live")).toBe("assertive");
      expect(errorMessage.getAttribute("role")).toBe("alert");
    });

    it("should not announce character input twice during typing", async () => {
      const propsWithText = { ...mockedTestProps, text: "Initial" };
      render(<EditableText {...propsWithText} />);

      const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
      await userEvent.click(clickableElement);

      const container = document.querySelector(".editable-text-container") as HTMLElement;
      const input = document.querySelector("input, textarea") as HTMLElement;

      // Verify container does not have aria-live while editing
      expect(container.getAttribute("aria-live")).toBeNull();

      // Type characters and verify no aria-live on container
      await userEvent.type(input, " Text");
      expect(container.getAttribute("aria-live")).toBeNull();
    });

    it("should properly announce errors without double character echo", async () => {
      render(<EditableText {...mockedTestProps} text="" />);

      const input = document.querySelector('[aria-label="Please enter feedback title"]') as HTMLElement;

      // Type and clear to trigger error
      await userEvent.type(input, "a");
      await userEvent.clear(input);

      const container = document.querySelector(".editable-text-container") as HTMLElement;
      const errorMessage = document.querySelector(".input-validation-message") as HTMLElement;

      // Container should not have aria-live
      expect(container.getAttribute("aria-live")).toBeNull();

      // Only error message should have aria-live
      expect(errorMessage.getAttribute("aria-live")).toBe("assertive");
      expect(errorMessage.getAttribute("role")).toBe("alert");
    });

    it("should maintain proper ARIA attributes during edit mode", async () => {
      const propsWithText = { ...mockedTestProps, text: "Test" };
      render(<EditableText {...propsWithText} />);

      const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
      await userEvent.click(clickableElement);

      const input = document.querySelector('[aria-label="Please enter feedback title"]') as HTMLElement;
      const container = document.querySelector(".editable-text-container") as HTMLElement;

      // Verify input has proper ARIA but container doesn't have aria-live
      expect(input.getAttribute("aria-label")).toBe("Please enter feedback title");
      expect(container.getAttribute("aria-live")).toBeNull();
    });
  });

  describe("Markdown formatting support", () => {
    it("renders bold text with asterisks in display mode", () => {
      const propsWithBold = { ...mockedTestProps, text: "This is **bold** text" };
      render(<EditableText {...propsWithBold} />);

      const strongElement = document.querySelector("strong");
      expect(strongElement).toBeTruthy();
      expect(strongElement?.textContent).toBe("bold");
    });

    it("renders bold text with underscores in display mode", () => {
      const propsWithBold = { ...mockedTestProps, text: "This is __bold__ text" };
      render(<EditableText {...propsWithBold} />);

      const strongElement = document.querySelector("strong");
      expect(strongElement).toBeTruthy();
      expect(strongElement?.textContent).toBe("bold");
    });

    it("renders italic text with asterisk in display mode", () => {
      const propsWithItalic = { ...mockedTestProps, text: "This is *italic* text" };
      render(<EditableText {...propsWithItalic} />);

      const emElement = document.querySelector("em");
      expect(emElement).toBeTruthy();
      expect(emElement?.textContent).toBe("italic");
    });

    it("renders italic text with underscore in display mode", () => {
      const propsWithItalic = { ...mockedTestProps, text: "This is _italic_ text" };
      render(<EditableText {...propsWithItalic} />);

      const emElement = document.querySelector("em");
      expect(emElement).toBeTruthy();
      expect(emElement?.textContent).toBe("italic");
    });

    it("renders links with valid URLs in display mode", () => {
      const propsWithLink = { ...mockedTestProps, text: "Check [this link](https://example.com) out" };
      render(<EditableText {...propsWithLink} />);

      const anchorElement = document.querySelector("a");
      expect(anchorElement).toBeTruthy();
      expect(anchorElement?.textContent).toBe("this link");
      expect(anchorElement?.getAttribute("href")).toBe("https://example.com");
      expect(anchorElement?.getAttribute("target")).toBe("_blank");
      expect(anchorElement?.getAttribute("rel")).toBe("noopener noreferrer");
    });

    it("renders images with valid URLs in display mode", () => {
      const propsWithImage = { ...mockedTestProps, text: "See ![alt text](https://example.com/image.png)" };
      render(<EditableText {...propsWithImage} />);

      const imgElement = document.querySelector("img");
      expect(imgElement).toBeTruthy();
      expect(imgElement?.getAttribute("src")).toBe("https://example.com/image.png");
      expect(imgElement?.getAttribute("alt")).toBe("alt text");
    });

    it("does not render links with javascript: URLs (XSS prevention)", () => {
      const propsWithMaliciousLink = { ...mockedTestProps, text: "[click me](javascript:alert('xss'))" };
      render(<EditableText {...propsWithMaliciousLink} />);

      const anchorElement = document.querySelector("a");
      expect(anchorElement).toBeNull();
      // The text should be rendered as plain text
      expect(document.body.textContent).toContain("[click me](javascript:alert('xss'))");
    });

    it("does not render images with javascript: URLs (XSS prevention)", () => {
      const propsWithMaliciousImage = { ...mockedTestProps, text: "![xss](javascript:alert('xss'))" };
      render(<EditableText {...propsWithMaliciousImage} />);

      const imgElement = document.querySelector("img");
      expect(imgElement).toBeNull();
    });

    it("renders plain text without markdown unchanged", () => {
      const propsWithPlainText = { ...mockedTestProps, text: "Just plain text" };
      render(<EditableText {...propsWithPlainText} />);

      expect(document.body.textContent).toContain("Just plain text");
      expect(document.querySelector("strong")).toBeNull();
      expect(document.querySelector("em")).toBeNull();
      expect(document.querySelector("a")).toBeNull();
    });

    it("preserves raw markdown in edit mode", async () => {
      const propsWithMarkdown = { ...mockedTestProps, text: "**bold** text" };
      render(<EditableText {...propsWithMarkdown} />);

      const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
      await userEvent.click(clickableElement);

      const input = document.querySelector("input, textarea") as HTMLInputElement | HTMLTextAreaElement;
      expect(input?.value).toBe("**bold** text");
    });

    it("renders multiple markdown formats in same text", () => {
      const propsWithMixed = { ...mockedTestProps, text: "**Bold** and *italic* with [link](https://example.com)" };
      render(<EditableText {...propsWithMixed} />);

      expect(document.querySelector("strong")?.textContent).toBe("Bold");
      expect(document.querySelector("em")?.textContent).toBe("italic");
      expect(document.querySelector("a")?.textContent).toBe("link");
    });

    it("link click does not trigger edit mode", async () => {
      const propsWithLink = { ...mockedTestProps, text: "[link](https://example.com)" };
      render(<EditableText {...propsWithLink} />);

      const anchorElement = document.querySelector("a") as HTMLAnchorElement;
      expect(anchorElement).toBeTruthy();

      // Click the link - it should stop propagation
      await userEvent.click(anchorElement);

      // Should not be in edit mode since link click stops propagation
      // The component should still show the link, not an input
      const displayedLink = document.querySelector("a");
      expect(displayedLink).toBeTruthy();
    });
  });
});
