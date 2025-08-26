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
});
