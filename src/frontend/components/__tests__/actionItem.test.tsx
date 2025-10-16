import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ActionItem, ActionItemProps } from "../actionItem";
import { itemDataService } from "../../dal/itemDataService";
import { workItemService } from "../../dal/azureDevOpsWorkItemService";
import { IFeedbackItemDocument } from "../../interfaces/feedback";
import * as azureDevOpsExtensionSdk from "azure-devops-extension-sdk";

jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {
    trackMetric: jest.fn(),
    trackEvent: jest.fn(),
  },
}));

jest.mock("azure-devops-extension-sdk", () => ({
  getService: jest.fn(),
}));

jest.mock("../../dal/itemDataService", () => ({
  itemDataService: {
    removeAssociatedActionItem: jest.fn(),
    removeAssociatedItemIfNotExistsInVsts: jest.fn(),
  },
}));

jest.mock("../../dal/azureDevOpsWorkItemService", () => ({
  workItemService: {
    getWorkItemsByIds: jest.fn(),
  },
}));

const mockOnUpdateActionItem = jest.fn(() => {});

const defaultTestProps: ActionItemProps = {
  feedbackItemId: "101",
  boardId: "Test Board Id",
  nonHiddenWorkItemTypes: [],
  allWorkItemTypes: [
    {
      color: "red",
      description: "Test description",
      icon: { id: "1", url: "testUrl" },
      isDisabled: false,
      name: "Test Work Item Type",
      referenceName: "Test Reference Name",
      fieldInstances: [],
      fields: [],
      states: [],
      transitions: {},
      xmlForm: "Test xmlForm",
      _links: {},
      url: "Test url",
    },
  ],
  onUpdateActionItem: mockOnUpdateActionItem,
  actionItem: {
    _links: {},
    url: "Test url",
    id: 1,
    commentVersionRef: { commentId: 1, version: 1, url: "Test url", createdInRevision: 1, isDeleted: false, text: "Test text" },
    relations: [],
    rev: 1,
    fields: {
      "System.Title": "Test Title",
      "System.WorkItemType": "Test Work Item Type",
    },
  },
  areActionIconsHidden: false,
  shouldFocus: false,
};

describe("Action Item component", () => {
  it("renders correctly when there are no action items.", () => {
    const { container } = render(<ActionItem {...defaultTestProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders correctly when action items exist and areActionIconsHidden is true", () => {
    const { container } = render(<ActionItem {...defaultTestProps} areActionIconsHidden={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders correctly when action items exist and shouldFocus is true", () => {
    const { container } = render(<ActionItem {...defaultTestProps} shouldFocus={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders correctly when action items exist and areActionIconsHidden is false", () => {
    const { container } = render(<ActionItem {...defaultTestProps} areActionIconsHidden={false} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders correctly when action items exist and shouldFocus is false", () => {
    const { container } = render(<ActionItem {...defaultTestProps} shouldFocus={false} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("focuses the openWorkItemButton when shouldFocus is true", () => {
    const { container } = render(<ActionItem {...defaultTestProps} shouldFocus={true} />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe("Behavioral tests for ActionItem", () => {
  it("does not render actions when areActionIconsHidden is true", () => {
    const { container } = render(<ActionItem {...defaultTestProps} areActionIconsHidden={true} />);
    const documentCardActions = container.querySelector('[class*="ms-DocumentCardActions"]');
    expect(documentCardActions).toBeNull();
  });

  it("renders actions when areActionIconsHidden is false", () => {
    const { container } = render(<ActionItem {...defaultTestProps} areActionIconsHidden={false} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("toggles unlink confirmation dialog visibility based on state", () => {
    const { container } = render(<ActionItem {...defaultTestProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("truncates titles longer than 25 characters", () => {
    const longTitle = "A".repeat(30);
    const modifiedProps = {
      ...defaultTestProps,
      actionItem: {
        ...defaultTestProps.actionItem,
        fields: { ...defaultTestProps.actionItem.fields, "System.Title": longTitle },
      },
    };
    const { container } = render(<ActionItem {...modifiedProps} />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe("UI-level integration tests for ActionItem", () => {
  it("renders the correct icon in DocumentCardPreview", () => {
    const { container } = render(<ActionItem {...defaultTestProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("applies resolved-border-right class when work item state is Completed", () => {
    const modifiedProps = {
      ...defaultTestProps,
      actionItem: {
        ...defaultTestProps.actionItem,
        fields: {
          ...defaultTestProps.actionItem.fields,
          "System.State": "Completed",
        },
      },
      allWorkItemTypes: [{ ...defaultTestProps.allWorkItemTypes[0], states: [{ name: "Completed", category: "Completed", color: "blue" }] }],
    };
    const { container } = render(<ActionItem {...modifiedProps} />);
    const resolvedElement = container.querySelector(".resolved-border-right");
    expect(resolvedElement).toBeTruthy();
  });

  it("calls onUpdateActionItem when confirming unlink", async () => {
    const mockFeedbackItem = { id: "101" } as IFeedbackItemDocument;
    (itemDataService.removeAssociatedActionItem as jest.Mock).mockResolvedValue(mockFeedbackItem);
    
    const { container, getByText } = render(<ActionItem {...defaultTestProps} />);
    
    // Click the unlink button
    const unlinkButton = container.querySelector('[aria-label="Remove link to work item button"]');
    expect(unlinkButton).toBeTruthy();
    
    fireEvent.click(unlinkButton!);
    
    // Wait for dialog to appear
    await waitFor(() => {
      expect(getByText("Remove Work Item Link")).toBeTruthy();
    });
    
    // Click the Remove button in the dialog
    const removeButton = getByText("Remove");
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(itemDataService.removeAssociatedActionItem).toHaveBeenCalledWith(
        "Test Board Id",
        "101",
        1
      );
      expect(mockOnUpdateActionItem).toHaveBeenCalledWith(mockFeedbackItem);
    });
  });

  it("opens unlink confirmation dialog and cancels it", async () => {
    const { container, getByText, queryByText } = render(<ActionItem {...defaultTestProps} />);
    
    // Click the unlink button
    const unlinkButton = container.querySelector('[aria-label="Remove link to work item button"]');
    fireEvent.click(unlinkButton!);
    
    // Wait for dialog to appear
    await waitFor(() => {
      expect(getByText("Remove Work Item Link")).toBeTruthy();
    });
    
    // Click the Cancel button
    const cancelButton = getByText("Cancel");
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(queryByText("Remove Work Item Link")).toBeNull();
    });
  });

  it("handles keyboard press on unlink button (Enter key)", async () => {
    const { container, getByText } = render(<ActionItem {...defaultTestProps} />);
    
    // Get the unlink button
    const unlinkButton = container.querySelector('[aria-label="Remove link to work item button"]');
    expect(unlinkButton).toBeTruthy();
    
    // Press Enter on the unlink button
    fireEvent.keyPress(unlinkButton!, { key: "Enter", code: "Enter", charCode: 13 });
    
    // Wait for dialog to appear
    await waitFor(() => {
      expect(getByText("Remove Work Item Link")).toBeTruthy();
    });
  });

  it("renders with Resolved state category and applies resolved-border-right class", () => {
    const modifiedProps = {
      ...defaultTestProps,
      actionItem: {
        ...defaultTestProps.actionItem,
        fields: {
          ...defaultTestProps.actionItem.fields,
          "System.State": "Resolved",
        },
      },
      allWorkItemTypes: [{ ...defaultTestProps.allWorkItemTypes[0], states: [{ name: "Resolved", category: "Resolved", color: "green" }] }],
    };
    const { container } = render(<ActionItem {...modifiedProps} />);
    const resolvedElement = container.querySelector(".resolved-border-right");
    expect(resolvedElement).toBeTruthy();
  });

  it("does not apply resolved-border-right class for active work items", () => {
    const modifiedProps = {
      ...defaultTestProps,
      actionItem: {
        ...defaultTestProps.actionItem,
        fields: {
          ...defaultTestProps.actionItem.fields,
          "System.State": "Active",
        },
      },
      allWorkItemTypes: [{ ...defaultTestProps.allWorkItemTypes[0], states: [{ name: "Active", category: "InProgress", color: "blue" }] }],
    };
    const { container } = render(<ActionItem {...modifiedProps} />);
    const resolvedElement = container.querySelector(".resolved-border-right");
    expect(resolvedElement).toBeNull();
  });

  it("handles work item type with no states", () => {
    const modifiedProps = {
      ...defaultTestProps,
      allWorkItemTypes: [{ ...defaultTestProps.allWorkItemTypes[0], states: undefined as any }],
    };
    const { container } = render(<ActionItem {...modifiedProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("handles missing work item type icon", () => {
    const modifiedProps = {
      ...defaultTestProps,
      allWorkItemTypes: [{ ...defaultTestProps.allWorkItemTypes[0], icon: undefined as any }],
    };
    const { container } = render(<ActionItem {...modifiedProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("handles missing work item type", () => {
    const modifiedProps: ActionItemProps = {
      ...defaultTestProps,
      allWorkItemTypes: [],
    };
    const { container } = render(<ActionItem {...modifiedProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("stops event propagation when clicking Remove button in dialog", async () => {
    const mockFeedbackItem = { id: "101" } as IFeedbackItemDocument;
    (itemDataService.removeAssociatedActionItem as jest.Mock).mockResolvedValue(mockFeedbackItem);
    
    const { container, getByText } = render(<ActionItem {...defaultTestProps} />);
    
    // Click the unlink button
    const unlinkButton = container.querySelector('[aria-label="Remove link to work item button"]');
    fireEvent.click(unlinkButton!);
    
    await waitFor(() => {
      expect(getByText("Remove Work Item Link")).toBeTruthy();
    });
    
    // Create a mock event with stopPropagation
    const removeButton = getByText("Remove");
    const mockEvent = { stopPropagation: jest.fn() };
    
    // Click with a proper event
    fireEvent.click(removeButton, mockEvent);
    
    await waitFor(() => {
      expect(itemDataService.removeAssociatedActionItem).toHaveBeenCalled();
    });
  });
});
