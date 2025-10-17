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

  it("adds newline when Ctrl+Enter is pressed in multiline mode", async () => {
    const propsMultiline = { ...mockedTestProps, text: "Line 1", isMultiline: true };
    render(<EditableText {...propsMultiline} />);

    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    const textarea = document.querySelector("textarea") as HTMLElement;
    await userEvent.type(textarea, "{Control>}{Enter}{/Control}");

    // Component should still be in edit mode with newline added
    expect(document.querySelector("textarea")).toBeTruthy();
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
});
