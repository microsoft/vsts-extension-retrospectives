import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { mocked } from "jest-mock";
import EditableDocumentCardTitle from "../../components/editableDocumentCardTitle";

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
}));

const mockedProps = mocked({
  isDisabled: true,
  isMultiline: false,
  maxLength: 50,
  title: "Mocked Title",
  isChangeEventRequired: true,
  onSave: jest.fn(() => {}),
});

describe("Editable Document Card Title", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with correct className wrapper", () => {
    render(<EditableDocumentCardTitle {...mockedProps} />);

    expect(document.querySelector(".editable-document-card-title")).toBeTruthy();
  });

  it("renders when disabled", () => {
    const disabledProps = { ...mockedProps, isDisabled: true };
    render(<EditableDocumentCardTitle {...disabledProps} />);

    expect(document.querySelector(".editable-document-card-title")).toBeTruthy();
    expect(document.body.textContent).toContain("Mocked Title");
  });

  it("renders when enabled", () => {
    const enabledProps = { ...mockedProps, isDisabled: false };
    render(<EditableDocumentCardTitle {...enabledProps} />);

    expect(document.querySelector(".editable-document-card-title")).toBeTruthy();
    expect(document.body.textContent).toContain("Mocked Title");
  });

  it("passes props correctly to EditableText", () => {
    const props = {
      ...mockedProps,
      title: "Test Title",
      maxLength: 100,
      isMultiline: true,
      isDisabled: false,
    };

    render(<EditableDocumentCardTitle {...props} />);

    expect(document.body.textContent).toContain("Test Title");
    expect(document.querySelector(".editable-document-card-title")).toBeTruthy();
  });
});
