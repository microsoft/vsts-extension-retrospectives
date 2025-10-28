import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExtensionSettingsMenu, { ContextualMenuButton } from "../extensionSettingsMenu";

// Mock dependencies
jest.mock("../../utilities/telemetryClient", () => ({
  reactPlugin: {},
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: (_plugin: any, component: any) => component,
}));

jest.mock("react-toastify", () => ({
  toast: jest.fn(() => "toast-id"),
  Slide: {},
  ToastContainer: (): null => null,
}));

jest.mock("../extensionSettingsMenuDialogContent", () => ({
  RETRO_URLS: {
    retrospectivewiki: "https://retrospectivewiki.org/",
    changelog: "https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CHANGELOG.md",
    readme: "https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md",
    contributing: "https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CONTRIBUTING.md",
    issues: "https://github.com/microsoft/vsts-extension-retrospectives/issues",
  },
  PRIME_DIRECTIVE_CONTENT: [{ content: "Test", style: "normal" }],
  RETRO_HELP_CONTENT: [{ content: "Test", style: "normal" }],
  VOLUNTEER_CONTENT: [{ content: "Test", style: "normal" }],
  WHATISNEW_MARKDOWN: "# What's New\n\nTest",
  renderContent: jest.fn(content => (
    <div data-testid="rendered-content">
      {content.map((item: any, i: number) => (
        <span key={i}>{item.content}</span>
      ))}
    </div>
  )),
}));

jest.mock("../../dal/boardDataService", () => ({
  default: {
    getBoardsForTeam: jest.fn().mockResolvedValue([]),
    createBoardForTeam: jest.fn().mockResolvedValue({}),
  },
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

  it("hides labels when narrow", () => {
    Object.defineProperty(window, "outerWidth", { value: 800, writable: true, configurable: true });
    Object.defineProperty(window, "innerWidth", { value: 800, writable: true, configurable: true });

    render(<ExtensionSettingsMenu />);
    expect(screen.queryByText("Directive")).not.toBeInTheDocument();
  });

  it("opens Prime Directive dialog", () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Prime Directive"));
    expect(screen.getByText("The Prime Directive")).toBeInTheDocument();
  });

  it("opens retrospective wiki", () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Prime Directive"));
    fireEvent.click(screen.getByText("Open Retrospective Wiki"));
    expect(windowOpenSpy).toHaveBeenCalledWith("https://retrospectivewiki.org/", "_blank");
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
      fireEvent.click(screen.getByText("Volunteer"));
    });
    await waitFor(() => {
      expect(screen.getByText("Volunteer")).toBeInTheDocument();
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

  it("adds resize listener on mount", () => {
    const spy = jest.spyOn(window, "addEventListener");
    render(<ExtensionSettingsMenu />);
    expect(spy).toHaveBeenCalledWith("resize", expect.any(Function));
    spy.mockRestore();
  });

  it("removes resize listener on unmount", () => {
    const spy = jest.spyOn(window, "removeEventListener");
    const { unmount } = render(<ExtensionSettingsMenu />);
    unmount();
    expect(spy).toHaveBeenCalledWith("resize", expect.any(Function));
    spy.mockRestore();
  });

  it("closes Prime Directive dialog", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Prime Directive"));
    expect(screen.getByText("The Prime Directive")).toBeInTheDocument();
    const closeButtons = screen.getAllByText("Close");
    fireEvent.click(closeButtons[0]);
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
    const closeButtons = screen.getAllByText("Close");
    fireEvent.click(closeButtons[0]);
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
    const closeButtons = screen.getAllByText("Close");
    fireEvent.click(closeButtons[0]);
    await waitFor(() => {
      expect(screen.queryByText("Retrospectives User Guide")).not.toBeVisible();
    });
  });

  it("opens contributing from Volunteer", async () => {
    render(<ExtensionSettingsMenu />);
    fireEvent.click(screen.getByTitle("Retrospective Help"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("Volunteer"));
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
      fireEvent.click(screen.getByText("Volunteer"));
    });
    await waitFor(() => {
      expect(screen.getByText("Volunteer")).toBeInTheDocument();
    });
    const closeButtons = screen.getAllByText("Close");
    fireEvent.click(closeButtons[0]);
    await waitFor(() => {
      expect(screen.queryByText("Volunteer")).not.toBeVisible();
    });
  });

  it("handles tall narrow window", () => {
    Object.defineProperty(window, "outerWidth", { value: 1728, writable: true, configurable: true });
    Object.defineProperty(window, "innerWidth", { value: 800, writable: true, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 1200, writable: true, configurable: true });

    render(<ExtensionSettingsMenu />);
    expect(screen.queryByText("Directive")).not.toBeInTheDocument();
  });

  it("updates state on window resize", async () => {
    const { rerender } = render(<ExtensionSettingsMenu />);
    expect(screen.getByText("Directive")).toBeInTheDocument();

    Object.defineProperty(window, "outerWidth", { value: 800, writable: true, configurable: true });
    Object.defineProperty(window, "innerWidth", { value: 800, writable: true, configurable: true });

    fireEvent(window, new Event("resize"));
    rerender(<ExtensionSettingsMenu />);

    await waitFor(() => {
      expect(screen.queryByText("Directive")).not.toBeInTheDocument();
    });
  });
});

describe("ContextualMenuButton", () => {
  it("renders with label", () => {
    render(<ContextualMenuButton ariaLabel="Test" title="Test" iconClass="fas fa-test" label="TestLabel" showLabel={true} />);
    expect(screen.getByText("TestLabel")).toBeInTheDocument();
  });

  it("hides label when showLabel false", () => {
    render(<ContextualMenuButton ariaLabel="Test" title="Test" iconClass="fas fa-test" label="TestLabel" showLabel={false} />);
    expect(screen.queryByText("TestLabel")).not.toBeInTheDocument();
  });

  it("calls onClick", () => {
    const onClick = jest.fn();
    render(<ContextualMenuButton ariaLabel="Test" title="Test" iconClass="fas fa-test" label="Test" onClick={onClick} showLabel={true} />);
    fireEvent.click(screen.getByTitle("Test"));
    expect(onClick).toHaveBeenCalled();
  });

  it("applies contextual menu button class", () => {
    render(<ContextualMenuButton ariaLabel="Test" title="Test" iconClass="fas fa-test" label="Test" showLabel={true} />);
    expect(screen.getByTitle("Test")).toHaveClass("contextual-menu-button");
  });
});
