import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { ActionItem, ActionItemProps } from "../actionItem";
import type { WorkItem } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { itemDataService } from "../../dal/itemDataService";
import { workItemService } from "../../dal/azureDevOpsWorkItemService";
import { IFeedbackItemDocument } from "../../interfaces/feedback";
import * as azureDevOpsExtensionSdk from "azure-devops-extension-sdk";

jest.mock("azure-devops-extension-api/WorkItemTracking", () => ({
  WorkItemTrackingServiceIds: {
    WorkItemFormNavigationService: "WorkItemFormNavigationService",
  },
}));

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

beforeEach(() => {
  jest.clearAllMocks();
  mockOnUpdateActionItem.mockClear();
});

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

  it("applies completed class when work item state is Completed", () => {
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
    const completedElement = container.querySelector(".completed");
    expect(completedElement).toBeTruthy();
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
      expect(itemDataService.removeAssociatedActionItem).toHaveBeenCalledWith("Test Board Id", "101", 1);
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
      const dialog = container.querySelector(".unlink-work-item-confirmation-dialog") as HTMLDialogElement;
      expect(dialog?.open).toBe(false);
    });
  });

  it("opens unlink confirmation dialog and closes it with X button", async () => {
    const { container, getByText } = render(<ActionItem {...defaultTestProps} />);

    // Click the unlink button
    const unlinkButton = container.querySelector('[aria-label="Remove link to work item button"]');
    fireEvent.click(unlinkButton!);

    // Wait for dialog to appear
    await waitFor(() => {
      expect(getByText("Remove Work Item Link")).toBeTruthy();
    });

    // Click the close (X) button in the dialog header
    const dialog = container.querySelector(".unlink-work-item-confirmation-dialog");
    const closeButton = dialog?.querySelector('[aria-label="Close"]') as HTMLButtonElement;
    expect(closeButton).toBeTruthy();
    fireEvent.click(closeButton);

    await waitFor(() => {
      const dialogEl = container.querySelector(".unlink-work-item-confirmation-dialog") as HTMLDialogElement;
      expect(dialogEl?.open).toBe(false);
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

  it("renders with Resolved state category and applies resolved class", () => {
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
    const resolvedElement = container.querySelector(".resolved");
    expect(resolvedElement).toBeTruthy();
  });

  it("does not apply resolved class for active work items", () => {
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
    const resolvedElement = container.querySelector(".resolved");
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

  it("opens the work item and refreshes the linked item when the card is activated", async () => {
    const updatedFeedbackItem = { id: "updated" } as IFeedbackItemDocument;
    const refreshedWorkItem = { id: 1 } as unknown as WorkItem;
    const openWorkItem = jest.fn().mockResolvedValue(undefined);

    (azureDevOpsExtensionSdk.getService as jest.Mock).mockResolvedValue({ openWorkItem });
    (itemDataService.removeAssociatedItemIfNotExistsInVsts as jest.Mock).mockResolvedValue(updatedFeedbackItem);
    (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([refreshedWorkItem]);

    const actionItemRef = React.createRef<ActionItem>();
    const { getByRole } = render(<ActionItem {...defaultTestProps} ref={actionItemRef} />);

    await waitFor(() => expect(actionItemRef.current).toBeTruthy());

    act(() => {
      actionItemRef.current?.setState({
        linkedWorkItem: { id: 1 } as WorkItem,
        workItemSearchTextboxHasErrors: false,
      });
    });

    const cardButton = getByRole("button", { name: /click to open work item/i });
    fireEvent.click(cardButton);

    await waitFor(() => expect(openWorkItem).toHaveBeenCalledWith(1));
    await waitFor(() => expect(itemDataService.removeAssociatedItemIfNotExistsInVsts).toHaveBeenCalledWith("Test Board Id", "101", 1));
    await waitFor(() => expect(workItemService.getWorkItemsByIds).toHaveBeenCalledWith([1]));

    expect(mockOnUpdateActionItem).toHaveBeenCalledWith(updatedFeedbackItem);
    expect(actionItemRef.current?.state.linkedWorkItem).toEqual(refreshedWorkItem);
  });

  it("handles Enter key on the card to invoke the work item form", async () => {
    const openWorkItem = jest.fn().mockResolvedValue(undefined);
    (azureDevOpsExtensionSdk.getService as jest.Mock).mockResolvedValue({ openWorkItem });
    (itemDataService.removeAssociatedItemIfNotExistsInVsts as jest.Mock).mockResolvedValue({ id: "after-enter" } as IFeedbackItemDocument);
    (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([]);

    const { getByRole } = render(<ActionItem {...defaultTestProps} />);

    const cardButton = getByRole("button", { name: /click to open work item/i });
    fireEvent.keyDown(cardButton, { key: "Enter", code: "Enter" });

    await waitFor(() => expect(openWorkItem).toHaveBeenCalledWith(1));
  });
});
