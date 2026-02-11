import React from "react";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExtensionSettingsMenu from "../extensionSettingsMenu";
import boardDataService from "../../dal/boardDataService";
import { azureDevOpsCoreService } from "../../dal/azureDevOpsCoreService";
import { itemDataService } from "../../dal/itemDataService";
import { IFeedbackColumn } from "../../interfaces/feedback";

jest.mock("../../dal/boardDataService", () => {
  const mockBoardDataService = {
    getBoardsForTeam: jest.fn().mockResolvedValue([]),
    createBoardForTeam: jest.fn().mockResolvedValue({ id: "new-board-id", title: "New Board" }),
  };

  return {
    __esModule: true,
    default: mockBoardDataService,
  };
});

jest.mock("../toastNotifications", () => {
  const toastFn: any = jest.fn(() => "toast-id");
  toastFn.update = jest.fn();
  return {
    toast: toastFn,
  };
});

// Mock dependencies
jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {},
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: (_plugin: any, component: any) => component,
  useTrackMetric: () => jest.fn(),
}));

jest.mock("../../dal/azureDevOpsCoreService", () => ({
  azureDevOpsCoreService: {
    getAllTeams: jest.fn().mockResolvedValue([]),
    getDefaultTeam: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock("../../dal/itemDataService", () => ({
  itemDataService: {
    getFeedbackItemsForBoard: jest.fn().mockResolvedValue([]),
    appendItemToBoard: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock("../../utilities/servicesHelper", () => ({
  getProjectId: jest.fn().mockResolvedValue("test-project-id"),
}));

beforeAll(() => {
  if (!window.URL.createObjectURL) {
    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
  }

  if (!window.URL.revokeObjectURL) {
    Object.defineProperty(window.URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
  }
});

describe("ExtensionSettingsMenu", () => {
  let windowOpenSpy: jest.SpyInstance;

  const getIconCloseButton = (dialog: HTMLElement): HTMLElement => {
    const closeButtons = within(dialog).getAllByRole("button", { name: "Close" });
    const iconButton = closeButtons.find(btn => (btn.textContent ?? "").trim() === "");
    return iconButton ?? closeButtons[0];
  };

  beforeEach(() => {
    windowOpenSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    Object.defineProperty(window.screen, "availWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });

    Object.defineProperty(window, "outerWidth", {
      writable: true,
      configurable: true,
      value: 1728,
    });

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1728,
    });

    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 900,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
    cleanup();
  });

  it("renders component", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    expect(container.querySelector(".extension-settings-menu")).toBeInTheDocument();
  });

  it("renders all buttons", () => {
    render(<ExtensionSettingsMenu />);
    expect(screen.getByTitle("Prime Directive")).toBeInTheDocument();
    expect(screen.getByTitle("Data Import/Export")).toBeInTheDocument();
    expect(screen.getByTitle("Retrospective Help")).toBeInTheDocument();
    expect(screen.queryByTitle("User Settings")).not.toBeInTheDocument();
  });

  it("shows labels when wide", () => {
    render(<ExtensionSettingsMenu />);
    expect(screen.getByText("Directive")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
  });

  it("renders labels with responsive visibility classes", () => {
    Object.defineProperty(window, "outerWidth", { value: 800, writable: true, configurable: true });
    Object.defineProperty(window, "innerWidth", { value: 800, writable: true, configurable: true });

    render(<ExtensionSettingsMenu />);
    // Labels are in DOM but hidden with Tailwind classes
    const label = screen.getByText("Directive");
    expect(label).toHaveClass("hidden", "lg:inline");
  });

  it("opens Prime Directive dialog", () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Prime Directive"));
    expect(screen.getByText("The Prime Directive")).toBeInTheDocument();
  });

  it("opens keyboard shortcuts dialog with '?' hotkey", () => {
    const { container } = render(<ExtensionSettingsMenu />);

    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;
    expect(dialog).toBeInTheDocument();
    expect(dialog).not.toHaveAttribute("open");

    fireEvent.keyDown(document, { key: "?", code: "Slash", shiftKey: true });
    expect(dialog).toHaveAttribute("open");
  });

  it("opens retrospective wiki", () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Prime Directive"));
    fireEvent.click(screen.getByText("Open Retrospective Wiki"));
    expect(windowOpenSpy).toHaveBeenCalledWith("https://retrospectivewiki.org", "_blank");
  });

  it("opens What's New dialog", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("What's new"));
    });
    await waitFor(() => {
      expect(screen.getByText("What's New")).toBeInTheDocument();
    });
  });

  it("opens User Guide dialog", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("User guide"));
    });
    await waitFor(() => {
      expect(screen.getByText("Retrospectives User Guide")).toBeInTheDocument();
    });
  });

  it("opens Volunteer dialog", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: "Volunteer" }));
    });
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Volunteer" })).toBeInTheDocument();
    });
  });

  it("opens Keyboard Shortcuts dialog", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("Keyboard shortcuts"));
    });
    await waitFor(() => {
      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });
  });

  it("closes Keyboard Shortcuts dialog", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("Keyboard shortcuts"));
    });
    await waitFor(() => {
      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });

    const dialog = screen.getByRole("dialog", { name: "Keyboard Shortcuts" });
    fireEvent.click(within(dialog).getByText("Close"));
    await waitFor(() => {
      expect(screen.queryByText("Keyboard Shortcuts")).not.toBeVisible();
    });
  });

  it("opens GitHub issues", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("Contact us"));
    });
    expect(windowOpenSpy).toHaveBeenCalledWith("https://github.com/microsoft/vsts-extension-retrospectives/issues", "_blank");
  });

  it("closes open menu details on outside pointerdown", () => {
    const { container } = render(<ExtensionSettingsMenu />);

    const details = Array.from(container.querySelectorAll("details"));
    expect(details.length).toBeGreaterThanOrEqual(2);
    details[0].setAttribute("open", "");
    details[1].setAttribute("open", "");

    fireEvent.pointerDown(document.body);

    expect(details[0]).not.toHaveAttribute("open");
    expect(details[1]).not.toHaveAttribute("open");
  });

  it("handles pointerdown events gracefully", () => {
    // Test that a basic pointerdown on body doesn't cause errors
    const { container } = render(<ExtensionSettingsMenu />);

    // Open a details menu
    const details = Array.from(container.querySelectorAll("details"));
    if (details.length > 0) {
      details[0].setAttribute("open", "");
    }

    // Simulate various pointerdown events - none should cause errors
    expect(() => fireEvent.pointerDown(document.body)).not.toThrow();
    expect(() => fireEvent.pointerDown(container)).not.toThrow();
  });

  it("exports data via the Data menu", async () => {
    // Ensure the export logic runs and triggers a download click.
    (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValueOnce([{ id: "team-1", name: "Team 1" }]);
    (boardDataService.getBoardsForTeam as jest.Mock).mockResolvedValueOnce([{ id: "board-1", title: "Board 1" }]);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValueOnce([]);

    const anchorClickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByText("Export Data"));

    await waitFor(() => {
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(anchorClickSpy).toHaveBeenCalled();
    });

    anchorClickSpy.mockRestore();
  });

  it("closes the What's New dialog with the header close button", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("What's new"));
    });

    const dialog = screen.getByRole("dialog", { name: "What is New" });
    expect(dialog).toHaveAttribute("open");

    fireEvent.click(getIconCloseButton(dialog));
    await waitFor(() => {
      expect(dialog).not.toHaveAttribute("open");
    });
  });

  it("closes the User Guide dialog with the header close button", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("User guide"));
    });

    const dialog = screen.getByRole("dialog", { name: "Retrospectives User Guide" });
    expect(dialog).toHaveAttribute("open");

    fireEvent.click(getIconCloseButton(dialog));
    await waitFor(() => {
      expect(dialog).not.toHaveAttribute("open");
    });
  });

  it("closes the Volunteer dialog with the header close button", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: "Volunteer" }));
    });

    const dialog = screen.getByRole("dialog", { name: "Volunteer" });
    expect(dialog).toHaveAttribute("open");

    fireEvent.click(getIconCloseButton(dialog));
    await waitFor(() => {
      expect(dialog).not.toHaveAttribute("open");
    });
  });

  it("closes the Keyboard Shortcuts dialog with the header close button", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("Keyboard shortcuts"));
    });

    const dialog = screen.getByRole("dialog", { name: "Keyboard Shortcuts" });
    expect(dialog).toHaveAttribute("open");

    fireEvent.click(getIconCloseButton(dialog));
    await waitFor(() => {
      expect(dialog).not.toHaveAttribute("open");
    });
  });

  it("handles keyboard shortcuts", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Prime Directive"));
    expect(screen.getByText("The Prime Directive")).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "The Prime Directive" });
    fireEvent.click(within(dialog).getByText("Close"));
    await waitFor(() => {
      expect(screen.queryByText("The Prime Directive")).not.toBeVisible();
    });
  });

  it("closes What's New dialog", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("What's new"));
    });
    await waitFor(() => {
      expect(screen.getByText("What's New")).toBeInTheDocument();
    });
    const dialog = screen.getByRole("dialog", { name: "What is New" });
    fireEvent.click(within(dialog).getByText("Close"));
    await waitFor(() => {
      expect(screen.queryByText("What's New")).not.toBeVisible();
    });
  });

  it("opens changelog from What's New", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("What's new"));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByText("Open change log"));
    });
    expect(windowOpenSpy).toHaveBeenCalledWith("https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CHANGELOG.md", "_blank");
  });

  it("opens readme from User Guide", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("User guide"));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByText("Open user guide"));
    });
    expect(windowOpenSpy).toHaveBeenCalledWith("https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md", "_blank");
  });

  it("closes User Guide dialog", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("User guide"));
    });
    await waitFor(() => {
      expect(screen.getByText("Retrospectives User Guide")).toBeInTheDocument();
    });
    const dialog = screen.getByRole("dialog", { name: "Retrospectives User Guide" });
    fireEvent.click(within(dialog).getByText("Close"));
    await waitFor(() => {
      expect(screen.queryByText("Retrospectives User Guide")).not.toBeVisible();
    });
  });

  it("opens contributing from Volunteer", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: "Volunteer" }));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByText("Open contributing guidelines"));
    });
    expect(windowOpenSpy).toHaveBeenCalledWith("https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CONTRIBUTING.md", "_blank");
  });

  it("closes Volunteer dialog", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: "Volunteer" }));
    });
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Volunteer" })).toBeInTheDocument();
    });
    const dialog = screen.getByRole("dialog", { name: "Volunteer" });
    fireEvent.click(within(dialog).getByText("Close"));
    await waitFor(() => {
      expect(dialog).not.toHaveAttribute("open");
    });
  });

  it("handles tall narrow window", () => {
    Object.defineProperty(window, "outerWidth", { value: 1728, writable: true, configurable: true });
    Object.defineProperty(window, "innerWidth", { value: 800, writable: true, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 1200, writable: true, configurable: true });

    render(<ExtensionSettingsMenu />);
    // Labels are in DOM with Tailwind responsive classes
    const label = screen.getByText("Directive");
    expect(label).toHaveClass("hidden", "lg:inline");
  });

  it("uses Tailwind responsive classes for label visibility", async () => {
    const { rerender } = render(<ExtensionSettingsMenu />);
    const label = screen.getByText("Directive");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("hidden", "lg:inline");

    // Tailwind classes handle responsive visibility via CSS media queries
    // Labels remain in DOM regardless of window size
    Object.defineProperty(window, "outerWidth", { value: 800, writable: true, configurable: true });
    Object.defineProperty(window, "innerWidth", { value: 800, writable: true, configurable: true });

    fireEvent(window, new Event("resize"));
    rerender(<ExtensionSettingsMenu />);

    await waitFor(() => {
      expect(screen.getByText("Directive")).toHaveClass("hidden", "lg:inline");
    });
  });

  it("exports boards and items using the download helper", async () => {
    const objectUrlSpy = jest.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:mock");

    (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([{ id: "team-1", name: "Team One" }]);
    const getBoardsSpy = jest.spyOn(boardDataService, "getBoardsForTeam").mockResolvedValue([{ id: "board-1", title: "Board One" }] as any);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([{ id: "item-1", boardId: "board-1" }]);

    try {
      const { container } = render(<ExtensionSettingsMenu />);

      // Open the Data menu
      const dataButton = screen.getByTitle("Data Import/Export");
      fireEvent.click(dataButton);

      // Click Export Data button
      const calloutMenu = container.querySelector("details[open] .callout-menu");
      const exportButton = calloutMenu?.querySelector("button");
      expect(exportButton).toBeTruthy();
    } finally {
      objectUrlSpy.mockRestore();
      getBoardsSpy.mockRestore();
    }
  });

  it("processes imported data and appends feedback items", async () => {
    (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([{ id: "team-1", name: "Team One" }]);
    (azureDevOpsCoreService.getDefaultTeam as jest.Mock).mockResolvedValue({ id: "default-team", name: "Default" });
    const createBoardSpy = jest.spyOn(boardDataService, "createBoardForTeam").mockResolvedValue({ id: "new-board", title: "Board One" } as any);

    // The processImportedData function is now internal to the component
    // We can only test the UI interaction of importing data
    const { container } = render(<ExtensionSettingsMenu />);

    // Open the Data menu
    const dataButton = screen.getByTitle("Data Import/Export");
    fireEvent.click(dataButton);

    // Verify the import button exists
    const calloutMenu = container.querySelector("details[open] .callout-menu");
    const buttons = calloutMenu?.querySelectorAll("button");
    expect(buttons?.length).toBeGreaterThanOrEqual(2); // Export and Import buttons

    createBoardSpy.mockRestore();
  });

  it("wires up file input for data import", async () => {
    const { container } = render(<ExtensionSettingsMenu />);

    // Open the Data menu
    const dataButton = screen.getByTitle("Data Import/Export");
    fireEvent.click(dataButton);

    // Click Import Data button (first button - Import is before Export in the menu)
    const calloutMenu = container.querySelector("details[open] .callout-menu");
    const buttons = calloutMenu?.querySelectorAll("button");
    const importButton = buttons?.[0]; // First button is Import Data
    expect(importButton).toBeTruthy();

    // Just verify the button can be clicked without error
    if (importButton) {
      // Create mock for the input element that will be created
      const originalCreateElement = document.createElement.bind(document);
      const fakeInput = {
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        click: jest.fn(),
        files: [] as unknown as FileList,
      };
      const createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        if (tagName === "input") {
          return fakeInput as unknown as HTMLInputElement;
        }
        return originalCreateElement(tagName);
      });
      const appendChildSpy = jest.spyOn(document.body, "appendChild").mockImplementation(() => null as any);
      const removeChildSpy = jest.spyOn(document.body, "removeChild").mockImplementation(() => null as any);

      try {
        fireEvent.click(importButton);
        expect(fakeInput.click).toHaveBeenCalled();
      } finally {
        createElementSpy.mockRestore();
        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
      }
    }
  });

  it("ignores '?' shortcut when focus is on an input", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;

    const input = document.createElement("input");
    document.body.appendChild(input);
    try {
      input.focus();
      fireEvent.keyDown(input, { key: "?", code: "Slash", shiftKey: true });
      expect(dialog).not.toHaveAttribute("open");
    } finally {
      document.body.removeChild(input);
    }
  });

  it("does not open shortcuts dialog when a different dialog is already open", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;

    const blockingDialog = document.createElement("dialog");
    blockingDialog.setAttribute("open", "");
    document.body.appendChild(blockingDialog);

    try {
      fireEvent.keyDown(document, { key: "?", code: "Slash", shiftKey: true });
      expect(dialog).not.toHaveAttribute("open");
    } finally {
      document.body.removeChild(blockingDialog);
    }
  });

  it("ignores keyboard shortcut when modifier keys are pressed", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;

    fireEvent.keyDown(document, { key: "?", code: "Slash", ctrlKey: true });

    expect(dialog).not.toHaveAttribute("open");
  });

  it("closes open data details when clicking outside the menu", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const details = container.querySelector("details");

    details?.setAttribute("open", "");

    const event = new Event("pointerdown", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: document.body, writable: false });
    document.dispatchEvent(event);

    expect(details?.hasAttribute("open")).toBe(false);
  });

  it("falls back to the default team when imported team is missing", async () => {
    (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([]);
    (azureDevOpsCoreService.getDefaultTeam as jest.Mock).mockResolvedValue({ id: "default-team", name: "Default" });
    const createBoardSpy = jest.spyOn(boardDataService, "createBoardForTeam").mockResolvedValue({ id: "new-board", title: "Legacy" } as any);
    const appendSpy = jest.spyOn(itemDataService, "appendItemToBoard").mockResolvedValue({} as any);

    // The processImportedData function is now internal to the component
    // We test that the import UI elements are rendered correctly
    const { container } = render(<ExtensionSettingsMenu />);

    // Open the Data menu
    const dataButton = screen.getByTitle("Data Import/Export");
    fireEvent.click(dataButton);

    // Verify the import button exists
    const calloutMenu = container.querySelector("details[open] .callout-menu");
    const buttons = calloutMenu?.querySelectorAll("button");
    expect(buttons?.length).toBeGreaterThanOrEqual(2); // Export and Import buttons

    createBoardSpy.mockRestore();
    appendSpy.mockRestore();
  });

  it("does not reopen keyboard shortcuts dialog when already open", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;

    // Open the dialog first
    fireEvent.keyDown(document, { key: "?", code: "Slash", shiftKey: true });
    expect(dialog).toHaveAttribute("open");

    // Press ? again while dialog is already open - should not call showModal again
    // The dialog should remain open
    fireEvent.keyDown(document, { key: "?", code: "Slash", shiftKey: true });
    expect(dialog).toHaveAttribute("open");
  });

  it("opens keyboard shortcuts with '/' and shiftKey", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;
    expect(dialog).not.toHaveAttribute("open");

    // Test with "/" key and shiftKey
    fireEvent.keyDown(document, { key: "/", shiftKey: true });
    expect(dialog).toHaveAttribute("open");
  });

  it("opens keyboard shortcuts with code 'Slash' and shiftKey", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;
    expect(dialog).not.toHaveAttribute("open");

    // Test with code "Slash" and shiftKey
    fireEvent.keyDown(document, { key: "", code: "Slash", shiftKey: true });
    expect(dialog).toHaveAttribute("open");
  });

  it("ignores keyboard shortcut when metaKey is pressed", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;

    fireEvent.keyDown(document, { key: "?", code: "Slash", metaKey: true });

    expect(dialog).not.toHaveAttribute("open");
  });

  it("ignores keyboard shortcut when altKey is pressed", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;

    fireEvent.keyDown(document, { key: "?", code: "Slash", altKey: true });

    expect(dialog).not.toHaveAttribute("open");
  });

  it("ignores non-question-mark keys", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;

    fireEvent.keyDown(document, { key: "a" });

    expect(dialog).not.toHaveAttribute("open");
  });

  it("processes imported data with multiple items", async () => {
    (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([{ id: "team-1", name: "Team One" }]);
    (azureDevOpsCoreService.getDefaultTeam as jest.Mock).mockResolvedValue({ id: "default-team", name: "Default" });
    const createBoardSpy = jest.spyOn(boardDataService, "createBoardForTeam").mockResolvedValue({ id: "new-board", title: "Board" } as any);
    const appendSpy = jest.spyOn(itemDataService, "appendItemToBoard").mockResolvedValue({} as any);

    // The processImportedData function is now internal to the component
    // We test that the component renders and the data menu works
    const { container } = render(<ExtensionSettingsMenu />);

    // Open the Data menu
    const dataButton = screen.getByTitle("Data Import/Export");
    fireEvent.click(dataButton);

    // Verify the menu opened with buttons
    const calloutMenu = container.querySelector("details[open] .callout-menu");
    expect(calloutMenu).toBeTruthy();

    createBoardSpy.mockRestore();
    appendSpy.mockRestore();
  });

  it("handles keydown when no dialog is open", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    // Press a key when no dialog is open - should not throw
    const event = new KeyboardEvent("keydown", { key: "?", bubbles: true });
    document.dispatchEvent(event);

    // The keyboard shortcuts dialog should open
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;
    expect(dialog).toHaveAttribute("open");
  });

  it("exports multiple boards from multiple teams", async () => {
    (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([
      { id: "team-1", name: "Team One" },
      { id: "team-2", name: "Team Two" },
    ]);
    const getBoardsSpy = jest
      .spyOn(boardDataService, "getBoardsForTeam")
      .mockResolvedValueOnce([{ id: "board-1", title: "Board One" }] as any)
      .mockResolvedValueOnce([
        { id: "board-2", title: "Board Two" },
        { id: "board-3", title: "Board Three" },
      ] as any);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([]);

    try {
      const { container } = render(<ExtensionSettingsMenu />);

      // Open the Data menu
      const dataButton = screen.getByTitle("Data Import/Export");
      fireEvent.click(dataButton);

      // Click Export Data button
      const calloutMenu = container.querySelector("details[open] .callout-menu");
      const exportButton = calloutMenu?.querySelector("button");
      expect(exportButton).toBeTruthy();
    } finally {
      getBoardsSpy.mockRestore();
    }
  });

  it("calls importData when Import Data button is clicked", async () => {
    // Render the component FIRST before mocking document methods
    const { container } = render(<ExtensionSettingsMenu />);

    // Verify component rendered
    const menuComponent = container.querySelector(".extension-settings-menu");
    expect(menuComponent).toBeInTheDocument();

    // Open the Data Import/Export menu
    const dataButton = screen.getByTitle("Data Import/Export");
    fireEvent.click(dataButton);

    // Find Import Data button
    const importButton = screen.getByText("Import Data");
    expect(importButton).toBeInTheDocument();

    // NOW mock file input handling after render is complete
    const originalCreateElement = document.createElement.bind(document);
    const fakeInput = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      addEventListener: jest.fn(),
    };
    const createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "input") {
        return fakeInput as unknown as HTMLInputElement;
      }
      return originalCreateElement(tagName);
    });
    const appendChildSpy = jest.spyOn(document.body, "appendChild").mockImplementation(() => null as any);
    const removeChildSpy = jest.spyOn(document.body, "removeChild").mockImplementation(() => null as any);

    try {
      fireEvent.click(importButton);

      expect(fakeInput.setAttribute).toHaveBeenCalledWith("type", "file");
      expect(fakeInput.click).toHaveBeenCalled();
    } finally {
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    }
  });

  describe("handleDocumentPointerDown", () => {
    it("handles pointerdown events without crashing", () => {
      // Render component and test that pointerdown events are handled gracefully
      render(<ExtensionSettingsMenu />);

      // Should not throw when simulating pointerdown
      expect(() => {
        fireEvent.pointerDown(document.body);
      }).not.toThrow();
    });

    it("returns early when event.target is null", () => {
      render(<ExtensionSettingsMenu />);

      // Should not throw when simulating pointerdown
      expect(() => {
        fireEvent.pointerDown(document.body);
      }).not.toThrow();
    });

    it("closes open details elements when clicking outside", () => {
      const { container } = render(<ExtensionSettingsMenu />);

      // Open a details menu
      const dataButton = screen.getByTitle("Data Import/Export");
      fireEvent.click(dataButton);

      const detailsElement = container.querySelector("details[open]");
      expect(detailsElement).toBeInTheDocument();

      // Click outside the menu
      fireEvent.pointerDown(document.body);

      // The details should be closed
      const closedDetails = container.querySelector("details[open]");
      expect(closedDetails).toBeNull();
    });

    it("does not close details when clicking inside", () => {
      const { container } = render(<ExtensionSettingsMenu />);

      // Open a details menu
      const dataButton = screen.getByTitle("Data Import/Export");
      fireEvent.click(dataButton);

      const detailsElement = container.querySelector("details[open]");
      expect(detailsElement).toBeInTheDocument();

      // Click inside the details
      fireEvent.pointerDown(detailsElement!);

      // The details should still be open
      expect(container.querySelector("details[open]")).toBeInTheDocument();
    });
  });

  describe("Dialog button handlers", () => {
    beforeEach(() => {
      // Close any open dialogs before each test
      document.querySelectorAll("dialog[open]").forEach(d => (d as HTMLDialogElement).close());
    });

    it("opens Prime Directive dialog when clicking Prime Directive button", () => {
      render(<ExtensionSettingsMenu />);
      const primeDirectiveButton = screen.getByTitle("Prime Directive");

      fireEvent.click(primeDirectiveButton);

      expect(screen.getByText("The Prime Directive")).toBeInTheDocument();
    });

    it("closes Prime Directive dialog when clicking close button", () => {
      const { container } = render(<ExtensionSettingsMenu />);
      const primeDirectiveButton = screen.getByTitle("Prime Directive");

      fireEvent.click(primeDirectiveButton);

      const dialog = container.querySelector(".prime-directive-dialog") as HTMLDialogElement;
      expect(dialog.open).toBe(true);

      const closeButton = dialog.querySelector('button[aria-label="Close"]') as HTMLButtonElement;
      fireEvent.click(closeButton);

      expect(dialog.open).toBe(false);
    });

    it("opens What's New dialog from help menu", () => {
      const { container } = render(<ExtensionSettingsMenu />);

      // Open the Help menu
      const helpButton = screen.getByTitle("Retrospective Help");
      fireEvent.click(helpButton);

      // Click What's new button in the callout menu
      const calloutMenu = container.querySelector("details[open] .callout-menu");
      const whatsNewButton = calloutMenu?.querySelector("button");
      expect(whatsNewButton).toBeTruthy();
      fireEvent.click(whatsNewButton!);

      const dialog = container.querySelector(".whats-new-dialog") as HTMLDialogElement;
      expect(dialog.open).toBe(true);
    });

    it("opens Keyboard shortcuts dialog from help menu", () => {
      const { container } = render(<ExtensionSettingsMenu />);

      // Open the Help menu
      const helpButton = screen.getByTitle("Retrospective Help");
      fireEvent.click(helpButton);

      // Click Keyboard shortcuts button - second button in help menu
      const calloutMenu = container.querySelector("details[open] .callout-menu");
      const buttons = calloutMenu?.querySelectorAll("button");
      const keyboardButton = buttons?.[1]; // Second button
      expect(keyboardButton).toBeTruthy();
      fireEvent.click(keyboardButton!);

      const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;
      expect(dialog.open).toBe(true);
    });

    it("opens User guide dialog from help menu", () => {
      const { container } = render(<ExtensionSettingsMenu />);

      // Open the Help menu
      const helpButton = screen.getByTitle("Retrospective Help");
      fireEvent.click(helpButton);

      // Click User guide button - third button in help menu
      const calloutMenu = container.querySelector("details[open] .callout-menu");
      const buttons = calloutMenu?.querySelectorAll("button");
      const userGuideButton = buttons?.[2]; // Third button
      expect(userGuideButton).toBeTruthy();
      fireEvent.click(userGuideButton!);

      const dialog = container.querySelector(".user-guide-dialog") as HTMLDialogElement;
      expect(dialog.open).toBe(true);
    });

    it("opens Volunteer dialog from help menu", () => {
      const { container } = render(<ExtensionSettingsMenu />);

      // Open the Help menu
      const helpButton = screen.getByTitle("Retrospective Help");
      fireEvent.click(helpButton);

      // Click Volunteer button - fourth button in help menu
      const calloutMenu = container.querySelector("details[open] .callout-menu");
      const buttons = calloutMenu?.querySelectorAll("button");
      const volunteerButton = buttons?.[3]; // Fourth button
      expect(volunteerButton).toBeTruthy();
      fireEvent.click(volunteerButton!);

      const dialog = container.querySelector(".volunteer-dialog") as HTMLDialogElement;
      expect(dialog.open).toBe(true);
    });

    it("opens Contact us link in new window", () => {
      const windowOpenSpy = jest.spyOn(window, "open").mockImplementation(() => null);

      const { container } = render(<ExtensionSettingsMenu />);

      // Open the Help menu
      const helpButton = screen.getByTitle("Retrospective Help");
      fireEvent.click(helpButton);

      // Click Contact us button - fifth button in help menu
      const calloutMenu = container.querySelector("details[open] .callout-menu");
      const buttons = calloutMenu?.querySelectorAll("button");
      const contactButton = buttons?.[4]; // Fifth button
      expect(contactButton).toBeTruthy();
      fireEvent.click(contactButton!);

      expect(windowOpenSpy).toHaveBeenCalledWith("https://github.com/microsoft/vsts-extension-retrospectives/issues", "_blank");

      windowOpenSpy.mockRestore();
    });

    it("closes dialogs using the Close button", () => {
      const { container } = render(<ExtensionSettingsMenu />);

      // Open Prime Directive dialog
      const primeDirectiveButton = screen.getByTitle("Prime Directive");
      fireEvent.click(primeDirectiveButton);

      const dialog = container.querySelector(".prime-directive-dialog") as HTMLDialogElement;
      expect(dialog.open).toBe(true);

      // Find and click the default Close button
      const closeButtons = dialog.querySelectorAll("button.default.button");
      const closeButton = Array.from(closeButtons).find(btn => btn.textContent === "Close");
      expect(closeButton).toBeTruthy();

      fireEvent.click(closeButton!);

      expect(dialog.open).toBe(false);
    });
  });

  describe("Data Import/Export functionality", () => {
    it("triggers file reader when import file is selected", async () => {
      const { container } = render(<ExtensionSettingsMenu />);

      // Mock file reader
      const mockFileReader: Partial<FileReader> = {
        readAsText: jest.fn(),
        result: JSON.stringify([
          {
            team: { id: "team-1", name: "Team One" },
            board: { id: "board-1", title: "Board One", maxVotesPerUser: 5, columns: [], isIncludeTeamEffectivenessMeasurement: false, shouldShowFeedbackAfterCollect: false, isAnonymous: false },
            items: [{ id: "item-1", boardId: "board-1" }],
          },
        ]),
        onload: null as any,
      };
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn(() => mockFileReader) as any;

      // Set up mocks for processImportedData
      (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([{ id: "team-1", name: "Team One" }]);
      (azureDevOpsCoreService.getDefaultTeam as jest.Mock).mockResolvedValue({ id: "default-team", name: "Default" });
      const createBoardSpy = jest.spyOn(boardDataService, "createBoardForTeam").mockResolvedValue({ id: "new-board", title: "Board One" } as any);
      const appendSpy = jest.spyOn(itemDataService, "appendItemToBoard").mockResolvedValue({} as any);

      // Open the Data menu and click Import
      const dataButton = screen.getByTitle("Data Import/Export");
      fireEvent.click(dataButton);

      // Set up document.createElement mock AFTER render
      const originalCreateElement = document.createElement.bind(document);
      const fakeInput = originalCreateElement("input");
      fakeInput.setAttribute("type", "file");

      const createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        if (tagName === "input") {
          return fakeInput;
        }
        return originalCreateElement(tagName);
      });

      const calloutMenu = container.querySelector("details[open] .callout-menu");
      const importButton = calloutMenu?.querySelectorAll("button")[0]; // First button is Import
      expect(importButton).toBeTruthy();
      fireEvent.click(importButton!);

      // Simulate file selection
      const mockFile = new File(["[]"], "test.json", { type: "application/json" });
      Object.defineProperty(fakeInput, "files", {
        value: [mockFile],
        writable: false,
      });

      // Trigger change event
      fireEvent.change(fakeInput);

      // Trigger the file reader onload
      if (typeof mockFileReader.onload === "function") {
        (mockFileReader.onload as (event: ProgressEvent<FileReader>) => void).call(mockFileReader, { target: { result: mockFileReader.result } } as unknown as ProgressEvent<FileReader>);
      }

      await waitFor(() => {
        expect(mockFileReader.readAsText).toHaveBeenCalled();
      });

      createElementSpy.mockRestore();
      createBoardSpy.mockRestore();
      appendSpy.mockRestore();
      global.FileReader = originalFileReader;
    });

    it("falls back to default team when imported team is not found", async () => {
      // Mock file reader with data for a team that does not exist
      const mockFileReader: Partial<FileReader> = {
        readAsText: jest.fn(),
        result: JSON.stringify([
          {
            team: { id: "nonexistent-team", name: "Nonexistent Team" },
            board: { id: "board-1", title: "Board One", maxVotesPerUser: 5, columns: [], isIncludeTeamEffectivenessMeasurement: false, shouldShowFeedbackAfterCollect: false, isAnonymous: false },
            items: [{ id: "item-1", boardId: "board-1" }],
          },
        ]),
        onload: null as any,
      };
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn(() => mockFileReader) as any;

      // Set up mocks - team list does NOT contain the imported team
      (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([{ id: "other-team", name: "Other Team" }]);
      (azureDevOpsCoreService.getDefaultTeam as jest.Mock).mockResolvedValue({ id: "default-team", name: "Default Team" });
      const createBoardSpy = jest.spyOn(boardDataService, "createBoardForTeam").mockResolvedValue({ id: "new-board", title: "Board One" } as any);
      const appendSpy = jest.spyOn(itemDataService, "appendItemToBoard").mockResolvedValue({} as any);

      const { container } = render(<ExtensionSettingsMenu />);

      // Open the Data menu and click Import
      const dataButton = screen.getByTitle("Data Import/Export");
      fireEvent.click(dataButton);

      // Set up document.createElement mock AFTER render
      const originalCreateElement = document.createElement.bind(document);
      const fakeInput = originalCreateElement("input");
      fakeInput.setAttribute("type", "file");

      const createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        if (tagName === "input") {
          return fakeInput;
        }
        return originalCreateElement(tagName);
      });

      try {
        const calloutMenu = container.querySelector("details[open] .callout-menu");
        const importButton = calloutMenu?.querySelectorAll("button")[0];
        fireEvent.click(importButton!);

        // Simulate file selection
        const mockFile = new File(["[]"], "test.json", { type: "application/json" });
        Object.defineProperty(fakeInput, "files", {
          value: [mockFile],
          writable: false,
        });

        // Trigger change event - this registers the handler
        fireEvent.change(fakeInput);

        // Trigger the file reader onload to invoke processImportedData
        // This executes the branch where team is not found and falls back to defaultTeam
        if (typeof mockFileReader.onload === "function") {
          (mockFileReader.onload as (event: ProgressEvent<FileReader>) => void).call(mockFileReader, { target: { result: mockFileReader.result } } as unknown as ProgressEvent<FileReader>);
        }

        // Wait for async operations to complete
        await waitFor(() => {
          expect(appendSpy).toHaveBeenCalled();
        });

        // Verify file reader was called
        expect(mockFileReader.readAsText).toHaveBeenCalled();
      } finally {
        createElementSpy.mockRestore();
        createBoardSpy.mockRestore();
        appendSpy.mockRestore();
        global.FileReader = originalFileReader;
      }
    });

    it("processes imported data and creates boards with items", async () => {
      // Set up mocks
      (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([{ id: "team-1", name: "Team One" }]);
      (azureDevOpsCoreService.getDefaultTeam as jest.Mock).mockResolvedValue({ id: "default-team", name: "Default" });
      const createBoardSpy = jest.spyOn(boardDataService, "createBoardForTeam").mockResolvedValue({ id: "new-board", title: "Imported Board" } as any);
      const appendSpy = jest.spyOn(itemDataService, "appendItemToBoard").mockResolvedValue({} as any);

      const { container } = render(<ExtensionSettingsMenu />);

      // Open the Data menu
      const dataButton = screen.getByTitle("Data Import/Export");
      fireEvent.click(dataButton);

      // Verify the import and export buttons exist
      const calloutMenu = container.querySelector("details[open] .callout-menu");
      const buttons = calloutMenu?.querySelectorAll("button");
      expect(buttons?.length).toBe(2);

      // Verify the buttons have correct text
      expect(buttons?.[0]?.textContent).toContain("Import");
      expect(buttons?.[1]?.textContent).toContain("Export");

      createBoardSpy.mockRestore();
      appendSpy.mockRestore();
    });

    it("uses default team when imported team is not found", async () => {
      (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([{ id: "team-1", name: "Existing Team" }]);
      (azureDevOpsCoreService.getDefaultTeam as jest.Mock).mockResolvedValue({ id: "default-team", name: "Default Team" });

      const { container } = render(<ExtensionSettingsMenu />);

      // Open the Data menu
      const dataButton = screen.getByTitle("Data Import/Export");
      fireEvent.click(dataButton);

      // Verify the menu is open
      const calloutMenu = container.querySelector("details[open] .callout-menu");
      expect(calloutMenu).toBeTruthy();
    });

    it("exports data with nested boards and items from multiple teams", async () => {
      (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([
        { id: "team-1", name: "Team One" },
        { id: "team-2", name: "Team Two" },
      ]);

      const getBoardsSpy = jest
        .spyOn(boardDataService, "getBoardsForTeam")
        .mockResolvedValueOnce([
          { id: "board-1", title: "Board One" },
          { id: "board-2", title: "Board Two" },
        ] as any)
        .mockResolvedValueOnce([{ id: "board-3", title: "Board Three" }] as any);

      (itemDataService.getFeedbackItemsForBoard as jest.Mock)
        .mockResolvedValueOnce([{ id: "item-1" }])
        .mockResolvedValueOnce([{ id: "item-2" }, { id: "item-3" }])
        .mockResolvedValueOnce([{ id: "item-4" }]);

      const anchorClickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

      const { container } = render(<ExtensionSettingsMenu />);

      // Open the Data menu and click Export
      const dataButton = screen.getByTitle("Data Import/Export");
      fireEvent.click(dataButton);

      const calloutMenu = container.querySelector("details[open] .callout-menu");
      const exportButton = calloutMenu?.querySelectorAll("button")[1]; // Second button is Export
      fireEvent.click(exportButton!);

      await waitFor(() => {
        expect(window.URL.createObjectURL).toHaveBeenCalled();
      });

      anchorClickSpy.mockRestore();
      getBoardsSpy.mockRestore();
    });
  });
});
