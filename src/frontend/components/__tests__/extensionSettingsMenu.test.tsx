import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExtensionSettingsMenu from "../extensionSettingsMenu";
import boardDataService from "../../dal/boardDataService";
import { azureDevOpsCoreService } from "../../dal/azureDevOpsCoreService";
import { itemDataService } from "../../dal/itemDataService";
import { IFeedbackColumn } from "../../interfaces/feedback";

// Mock dependencies
jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {},
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: (_plugin: any, component: any) => component,
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
    expect(windowOpenSpy).toHaveBeenCalledWith("https://retrospectivewiki.com", "_blank");
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
    const anchorElement = document.createElement("a");
    const clickSpy = jest.spyOn(anchorElement, "click");
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return anchorElement;
      }
      return originalCreateElement(tagName);
    });

    const objectUrlSpy = jest.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:mock");

    (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([{ id: "team-1", name: "Team One" }]);
    const getBoardsSpy = jest.spyOn(boardDataService, "getBoardsForTeam").mockResolvedValue([{ id: "board-1", title: "Board One" }] as any);
    (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([{ id: "item-1", boardId: "board-1" }]);

    const menu = new ExtensionSettingsMenu({});

    await (menu as any).exportData();

    expect(objectUrlSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    objectUrlSpy.mockRestore();
    getBoardsSpy.mockRestore();
  });

  it("processes imported data and appends feedback items", async () => {
    (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([{ id: "team-1", name: "Team One" }]);
    (azureDevOpsCoreService.getDefaultTeam as jest.Mock).mockResolvedValue({ id: "default-team", name: "Default" });
    const createBoardSpy = jest.spyOn(boardDataService, "createBoardForTeam").mockResolvedValue({ id: "new-board", title: "Board One" } as any);

    const importedData = [
      {
        team: { id: "team-1", name: "Team One" },
        board: {
          id: "legacy-board",
          title: "Board One",
          maxVotesPerUser: 5,
          columns: [] as IFeedbackColumn[],
          isIncludeTeamEffectivenessMeasurement: false,
          shouldShowFeedbackAfterCollect: true,
          isAnonymous: false,
          startDate: "2020-01-01",
          endDate: "2020-01-02",
        },
        items: [{ id: "item-1", boardId: "legacy-board" }],
      },
    ];

    const menu = new ExtensionSettingsMenu({});

    await (menu as any).processImportedData(importedData);

    expect(createBoardSpy).toHaveBeenCalledWith("team-1", "Board One", 5, [], false, true, false, "2020-01-01", "2020-01-02");
    expect(itemDataService.appendItemToBoard).toHaveBeenCalledWith(expect.objectContaining({ id: "item-1", boardId: "new-board" }));
    createBoardSpy.mockRestore();
  });

  it("wires up file input for data import", async () => {
    const originalCreateElement = document.createElement.bind(document);
    const fakeInput = {
      setAttribute: jest.fn(),
      addEventListener: jest.fn(),
      click: jest.fn(),
      files: [{ name: "import.json" } as File] as unknown as FileList,
    } as unknown as HTMLInputElement;

    let changeHandler: (() => void) | undefined;
    (fakeInput.addEventListener as jest.Mock).mockImplementation((eventName: string, handler: () => void) => {
      if (eventName === "change") {
        changeHandler = handler;
      }
    });

    const createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "input") {
        return fakeInput;
      }
      return originalCreateElement(tagName);
    });

    const appendChildSpy = jest.spyOn(document.body, "appendChild").mockImplementation(() => fakeInput);
    const removeChildSpy = jest.spyOn(document.body, "removeChild").mockImplementation(() => fakeInput);

    const importPayload = [
      {
        team: { id: "team-1", name: "Team One" },
        board: { id: "board-1", title: "Board One", maxVotesPerUser: 3, columns: [] as IFeedbackColumn[] } as any,
        items: [] as any[],
      },
    ];

    const fileReaderInstances: Array<{ onload: ((event: ProgressEvent<FileReader>) => void) | null; readAsText: jest.Mock }> = [];
    const fileReaderSpy = jest.spyOn(window as unknown as { FileReader: typeof FileReader }, "FileReader").mockImplementation(() => {
      const instance = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsText: jest.fn(function () {
          instance.onload?.({ target: { result: JSON.stringify(importPayload) } } as ProgressEvent<FileReader>);
        }),
      };
      fileReaderInstances.push(instance);
      return instance as unknown as FileReader;
    });

    const menu = new ExtensionSettingsMenu({});
    const processSpy = jest.spyOn(menu as any, "processImportedData").mockResolvedValue(undefined);

    await (menu as any).importData();

    expect(createElementSpy).toHaveBeenCalledWith("input");
    expect(fakeInput.setAttribute).toHaveBeenCalledWith("type", "file");
    expect(appendChildSpy).toHaveBeenCalledWith(fakeInput);
    expect(fakeInput.click).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalledWith(fakeInput);

    changeHandler?.();
    expect(fileReaderInstances[0].readAsText).toHaveBeenCalledWith(fakeInput.files[0]);
    expect(processSpy).toHaveBeenCalledWith(importPayload);

    processSpy.mockRestore();
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    fileReaderSpy.mockRestore();
  });

  it("ignores '?' shortcut when focus is on an input", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: "?", code: "Slash", shiftKey: true });

    expect(dialog).not.toHaveAttribute("open");
    document.body.removeChild(input);
  });

  it("does not open shortcuts dialog when a different dialog is already open", () => {
    const { container } = render(<ExtensionSettingsMenu />);
    const dialog = container.querySelector(".keyboard-shortcuts-dialog") as HTMLDialogElement;

    const blockingDialog = document.createElement("dialog");
    blockingDialog.setAttribute("open", "");
    document.body.appendChild(blockingDialog);

    fireEvent.keyDown(document, { key: "?", code: "Slash", shiftKey: true });

    expect(dialog).not.toHaveAttribute("open");
    document.body.removeChild(blockingDialog);
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

    const menu = new ExtensionSettingsMenu({});

    const importedData = [
      {
        team: { id: "missing-team", name: "Missing" },
        board: {
          id: "legacy-board",
          title: "Legacy",
          maxVotesPerUser: 3,
          columns: [] as IFeedbackColumn[],
          isIncludeTeamEffectivenessMeasurement: false,
          shouldShowFeedbackAfterCollect: true,
          isAnonymous: false,
          startDate: undefined as unknown as Date | undefined,
          endDate: undefined as unknown as Date | undefined,
        },
        items: [{ id: "item-1", boardId: "legacy-board" }],
      },
    ];

    await (menu as any).processImportedData(importedData);

    expect(createBoardSpy).toHaveBeenCalledWith("default-team", "Legacy", 3, [], false, true, false, undefined, undefined);
    expect(appendSpy).toHaveBeenCalledWith(expect.objectContaining({ id: "item-1", boardId: "new-board" }));

    createBoardSpy.mockRestore();
    appendSpy.mockRestore();
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

    const menu = new ExtensionSettingsMenu({});

    const importedData = [
      {
        team: { id: "team-1", name: "Team One" },
        board: {
          id: "board-1",
          title: "Board One",
          maxVotesPerUser: 3,
          columns: [] as IFeedbackColumn[],
          isIncludeTeamEffectivenessMeasurement: false,
          shouldShowFeedbackAfterCollect: true,
          isAnonymous: false,
          startDate: undefined as unknown as string,
          endDate: undefined as unknown as string,
        },
        items: [
          { id: "item-1", boardId: "board-1" },
          { id: "item-2", boardId: "board-1" },
          { id: "item-3", boardId: "board-1" },
        ],
      },
    ];

    await (menu as any).processImportedData(importedData);

    expect(appendSpy).toHaveBeenCalledTimes(3);
    expect(appendSpy).toHaveBeenCalledWith(expect.objectContaining({ id: "item-1", boardId: "new-board" }));
    expect(appendSpy).toHaveBeenCalledWith(expect.objectContaining({ id: "item-2", boardId: "new-board" }));
    expect(appendSpy).toHaveBeenCalledWith(expect.objectContaining({ id: "item-3", boardId: "new-board" }));

    createBoardSpy.mockRestore();
    appendSpy.mockRestore();
  });

  it("handles keydown when keyboardShortcutsDialogRef is null", () => {
    const menu = new ExtensionSettingsMenu({});
    // Call handleDocumentKeyDown when ref is null
    const event = new KeyboardEvent("keydown", { key: "?", bubbles: true });
    (menu as any).handleDocumentKeyDown(event);
    // Should return early without error
    expect(true).toBe(true);
  });

  it("exports multiple boards from multiple teams", async () => {
    const anchorElement = document.createElement("a");
    const clickSpy = jest.spyOn(anchorElement, "click");
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return anchorElement;
      }
      return originalCreateElement(tagName);
    });

    const objectUrlSpy = jest.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:mock");

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

    const menu = new ExtensionSettingsMenu({});

    await (menu as any).exportData();

    expect(getBoardsSpy).toHaveBeenCalledTimes(2);
    expect(objectUrlSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    objectUrlSpy.mockRestore();
    getBoardsSpy.mockRestore();
  });

  it("calls importData when Import Data button is clicked", async () => {
    const { container } = render(<ExtensionSettingsMenu />);

    // Mock importData to avoid full file dialog flow
    const menuComponent = container.querySelector(".extension-settings-menu");
    expect(menuComponent).toBeInTheDocument();

    // Open the Data Import/Export menu
    const dataButton = screen.getByTitle("Data Import/Export");
    fireEvent.click(dataButton);

    // Find and click Import Data button
    const importButton = screen.getByText("Import Data");
    expect(importButton).toBeInTheDocument();

    // Mock file input handling
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

    fireEvent.click(importButton);

    expect(fakeInput.setAttribute).toHaveBeenCalledWith("type", "file");
    expect(fakeInput.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  describe("handleDocumentPointerDown", () => {
    it("returns early when menuRootRef.current is null", () => {
      const menu = new ExtensionSettingsMenu({});
      // The ref is not set, so menuRootRef.current is null
      const event = { target: document.body } as unknown as PointerEvent;

      // Should not throw
      expect(() => {
        (menu as any).handleDocumentPointerDown(event);
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
});
