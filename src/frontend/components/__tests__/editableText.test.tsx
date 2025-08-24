import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
// @ts-ignore - user-event types seem to have issues
import userEvent from "@testing-library/user-event";
import EditableText, { EditableTextProps } from "../editableText";

// Mock the telemetry client to avoid dependency issues
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

    // Should show the text input when text is empty
    expect(document.querySelector('[aria-label="Please enter feedback title"]')).toBeTruthy();
    // The TextField creates a different structure, so let's look for the textarea/input
    expect(document.querySelector("textarea, input")).toBeTruthy();
  });

  it("renders in display mode when text is provided", () => {
    const propsWithText = { ...mockedTestProps, text: "Test Text" };
    render(<EditableText {...propsWithText} />);

    // Should show the display text with click-to-edit functionality
    expect(document.body.textContent).toContain("Test Text");
    expect(document.querySelector('[title="Click to edit"]')).toBeTruthy();
  });

  it("switches to edit mode when clicked", async () => {
    const propsWithText = { ...mockedTestProps, text: "Test Text" };
    render(<EditableText {...propsWithText} />);

    // Click on the text to edit
    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    // Should now show the input field
    expect(document.querySelector('[aria-label="Please enter feedback title"]')).toBeTruthy();
    expect(document.querySelector('input[value="Test Text"], textarea[value="Test Text"]')).toBeTruthy();
  });

  it("switches to edit mode when Enter key is pressed", async () => {
    const propsWithText = { ...mockedTestProps, text: "Test Text" };
    render(<EditableText {...propsWithText} />);

    // Focus and press Enter on the text to edit
    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    clickableElement.focus();
    await userEvent.keyboard("{Enter}");

    // Should now show the input field
    expect(document.querySelector('[aria-label="Please enter feedback title"]')).toBeTruthy();
    expect(document.querySelector('input[value="Test Text"], textarea[value="Test Text"]')).toBeTruthy();
  });

  it("calls onSave when text changes and isChangeEventRequired is true", async () => {
    const propsWithChangeEvent = { ...mockedTestProps, isChangeEventRequired: true, text: "Initial" };
    render(<EditableText {...propsWithChangeEvent} />);

    // Click to edit
    const clickableElement = document.querySelector('[title="Click to edit"]') as HTMLElement;
    await userEvent.click(clickableElement);

    // Change the text
    const input = document.querySelector('input[value="Initial"], textarea[value="Initial"]') as HTMLElement;
    await userEvent.clear(input);
    await userEvent.type(input, "New Text");

    // Should call onSave immediately due to isChangeEventRequired
    expect(mockOnSave).toHaveBeenCalledWith("New Text");
  });

  it("shows error message when text is empty", async () => {
    render(<EditableText {...mockedTestProps} />);

    // Input should be visible since text is empty
    const input = document.querySelector('[aria-label="Please enter feedback title"]') as HTMLElement;

    // Try to clear the input (simulate empty input)
    await userEvent.clear(input);
    await userEvent.type(input, " "); // Add space then clear
    await userEvent.clear(input);

    // Error message should appear
    expect(document.body.textContent).toContain("This cannot be empty.");
  });
});
