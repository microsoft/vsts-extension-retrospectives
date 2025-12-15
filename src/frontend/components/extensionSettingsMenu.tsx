import React from "react";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";
import boardDataService from "../dal/boardDataService";
import { azureDevOpsCoreService } from "../dal/azureDevOpsCoreService";
import { getProjectId } from "../utilities/servicesHelper";
import { itemDataService } from "../dal/itemDataService";
import { IFeedbackBoardDocument, IFeedbackItemDocument } from "../interfaces/feedback";
import { toast } from "./toastNotifications";
import { WebApiTeam } from "azure-devops-extension-api/Core";

import { CelebrationIcon, CloseIcon, CloudDownloadIcon, CloudIcon, CloudUploadIcon, ContactPhoneIcon, HelpIcon, KeyboardIcon, MenuBookIcon, PrivacyTipIcon, VolunteerActivismIcon } from "./icons";

interface IExportImportDataSchema {
  team: WebApiTeam;
  board: IFeedbackBoardDocument;
  items: IFeedbackItemDocument[];
}

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

export class ExtensionSettingsMenu extends React.Component<Record<string, never>, {}> {
  private readonly primeDirectiveDialogRef = React.createRef<HTMLDialogElement>();
  private readonly whatsNewDialogRef = React.createRef<HTMLDialogElement>();
  private readonly userGuideDialogRef = React.createRef<HTMLDialogElement>();
  private readonly volunteerDialogRef = React.createRef<HTMLDialogElement>();
  private readonly keyboardShortcutsDialogRef = React.createRef<HTMLDialogElement>();

  private readonly keyboardShortcuts: KeyboardShortcut[] = [
    // Global shortcuts
    { keys: ["?"], description: "Show keyboard shortcuts", category: "Global" },
    { keys: ["Esc"], description: "Close dialogs or cancel actions", category: "Global" },

    // Column navigation
    { keys: ["1-5"], description: "Jump to column by number", category: "Navigation" },
    { keys: ["←", "→"], description: "Navigate between columns", category: "Navigation" },
    { keys: ["↑", "↓"], description: "Navigate between feedback items", category: "Navigation" },
    { keys: ["Tab"], description: "Move focus to next element", category: "Navigation" },
    { keys: ["Shift", "Tab"], description: "Move focus to previous element", category: "Navigation" },
    { keys: ["Page Up"], description: "Scroll up in column", category: "Navigation" },
    { keys: ["Page Down"], description: "Scroll down in column", category: "Navigation" },

    // Item actions - Collect phase
    { keys: ["Insert"], description: "Create new feedback item", category: "Actions" },
    { keys: ["Enter"], description: "Edit feedback item", category: "Actions" },
    { keys: ["Delete"], description: "Delete feedback item", category: "Actions" },

    // Column actions
    { keys: ["E"], description: "Edit column notes", category: "Column" },
  ];

  private readonly exportData = async () => {
    const toastId = toast("Processing boards...");
    const exportedData: IExportImportDataSchema[] = [];
    const projectId = await getProjectId();
    const teams = await azureDevOpsCoreService.getAllTeams(projectId, true);
    for (const team of teams) {
      const boards = await boardDataService.getBoardsForTeam(team.id);
      for (const board of boards) {
        const items = await itemDataService.getFeedbackItemsForBoard(board.id);
        exportedData.push({ team, board, items });
        toast.update(toastId, { render: `Processing boards... (${board.title} is done)` });
      }
    }
    const content = [JSON.stringify(exportedData)];

    const blob = new Blob(content, { type: "text/plain;charset=utf-8" });

    const a = document.createElement("a");
    a.download = "Retrospective_Export.json";
    a.href = window.URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  private readonly importData = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.addEventListener(
      "change",
      () => {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
          const importedData: IExportImportDataSchema[] = JSON.parse(event.target.result.toString());
          this.processImportedData(importedData);
        };
        reader.readAsText(input.files[0]);
      },
      false,
    );
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
    return false;
  };

  private readonly processImportedData = async (importedData: IExportImportDataSchema[]) => {
    const projectId = await getProjectId();

    const teams = await azureDevOpsCoreService.getAllTeams(projectId, true);
    const defaultTeam = await azureDevOpsCoreService.getDefaultTeam(projectId);

    const toastId = toast("Importing data...");

    for (const dataToProcess of importedData) {
      const team = teams.find(e => e.name === dataToProcess.team.name) ?? defaultTeam;
      const oldBoard = dataToProcess.board;
      const newBoard = await boardDataService.createBoardForTeam(team.id, oldBoard.title, oldBoard.maxVotesPerUser, oldBoard.columns, oldBoard.isIncludeTeamEffectivenessMeasurement, oldBoard.shouldShowFeedbackAfterCollect, oldBoard.isAnonymous, oldBoard.startDate, oldBoard.endDate);
      for (let yLoop = 0; yLoop < dataToProcess.items.length; yLoop++) {
        const oldItem = dataToProcess.items[yLoop];
        oldItem.boardId = newBoard.id;

        await itemDataService.appendItemToBoard(oldItem);

        toast.update(toastId, { render: `Importing data... (${newBoard.title} to ${team.name} is done)` });
      }
    }
  };

  public render() {
    return (
      <div className="extension-settings-menu">
        <button onClick={() => this.primeDirectiveDialogRef.current?.showModal()} aria-label="Prime Directive" title="Prime Directive" className="extension-settings-button">
          <PrivacyTipIcon />
          <span className="hidden lg:inline">Directive</span>
        </button>
        <dialog className="prime-directive-dialog" aria-label="The Prime Directive" ref={this.primeDirectiveDialogRef} onClose={() => this.primeDirectiveDialogRef.current?.close()}>
          <div className="header">
            <h2 className="title">The Prime Directive</h2>
            <button onClick={() => this.primeDirectiveDialogRef.current?.close()} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
          <div className="subText">The purpose of the Prime Directive is to set the stage for a respectful and constructive retrospective. By embracing this mindset, we create an environment where everyone feels safe to share openly, learn together, and improve as a team.</div>
          <strong className="subText">&apos;Regardless of what we discover, we understand and truly believe that everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand.&apos;</strong>
          <em className="subText">--Norm Kerth, Project Retrospectives: A Handbook for Team Review</em>
          <div className="inner">
            <button className="button" onClick={() => window.open("https://retrospectivewiki.com", "_blank")}>
              Open Retrospective Wiki
            </button>
            <button className="default button" onClick={() => this.primeDirectiveDialogRef.current?.close()}>
              Close
            </button>
          </div>
        </dialog>

        <details className="flex items-center relative">
          <summary aria-label="Data Import/Export" title="Data Import/Export" className="extension-settings-button">
            <CloudIcon />
            <span className="hidden lg:inline">Data</span>
          </summary>

          <div className="callout-menu left">
            <button onClick={this.importData}>
              <CloudUploadIcon />
              Import Data
            </button>
            <button onClick={this.exportData}>
              <CloudDownloadIcon />
              Export Data
            </button>
          </div>
        </details>

        <details className="flex items-center relative">
          <summary aria-label="Retrospective Help" title="Retrospective Help" className="extension-settings-button">
            <HelpIcon />
            <span className="hidden lg:inline">Help</span>
          </summary>

          <div className="callout-menu right">
            <button onClick={() => this.whatsNewDialogRef.current?.showModal()}>
              <CelebrationIcon />
              What&apos;s new
            </button>
            <button onClick={() => this.keyboardShortcutsDialogRef.current?.showModal()}>
              <KeyboardIcon />
              Keyboard shortcuts
            </button>
            <button onClick={() => this.userGuideDialogRef.current?.showModal()}>
              <MenuBookIcon />
              User guide
            </button>
            <button onClick={() => this.volunteerDialogRef.current?.showModal()}>
              <VolunteerActivismIcon />
              Volunteer
            </button>
            <button onClick={() => window.open("https://github.com/microsoft/vsts-extension-retrospectives/issues", "_blank")}>
              <ContactPhoneIcon />
              Contact us
            </button>
          </div>
        </details>

        <dialog className="whats-new-dialog" aria-label="What is New" ref={this.whatsNewDialogRef} onClose={() => this.whatsNewDialogRef.current?.close()}>
          <div className="header">
            <h2 className="title">What&apos;s New</h2>
            <button onClick={() => this.whatsNewDialogRef.current?.close()} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
          <div className="subText">The latest release includes redesign of menu options, enabling mobile view, role-based permission setting, redesign of deleting boards, and implementation of sticky defaults.</div>
          <div className="subText li">Extension settings menu was redesigned to mirror the ADO settings menu, in addition to moving Prime Directive and adding Volunteer options.</div>
          <div className="subText li">Switch to mobile view was enabled for improved viewing on mobile devices with support limited to core functionality.</div>
          <div className="subText li">Ability to set permissions for accessing the retrospective board is now restricted to the board owner or a team admin.</div>
          <div className="subText li">Functionality to delete boards was moved from the Board menu to the History table and is only enabled for archived boards.</div>
          <div className="subText li">User settings for maximum votes, Team Assessment, obscure feedback, and anonymous feedback are saved and used as defaults when the user creates the next retrospective board.</div>
          <div className="subText">Refer to the Changelog for a comprehensive listing of the updates included in this release and past releases.</div>
          <div className="inner">
            <button className="button" onClick={() => window.open("https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CHANGELOG.md", "_blank")}>
              Open change log
            </button>
            <button className="default button" onClick={() => this.whatsNewDialogRef.current?.close()}>
              Close
            </button>
          </div>
        </dialog>

        <dialog className="user-guide-dialog" aria-label="Retrospectives User Guide" ref={this.userGuideDialogRef} onClose={() => this.userGuideDialogRef.current?.close()}>
          <div className="header">
            <h2 className="title">Retrospectives User Guide</h2>
            <button onClick={() => this.userGuideDialogRef.current?.close()} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
          <div className="subText">The purpose of the retrospective is to build a practice of gathering feedback and continuously improving by acting on that feedback. The Retrospective extension and Team Assessment feature are valuable tools supporting that process.</div>
          <div className="subText">For instructions on getting started, using the Retrospective extension and Team Assessment feature, and best practices for running effective retrospectives, open the user guide documented in the Readme file.</div>
          <div className="inner">
            <button className="button" onClick={() => window.open("https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md", "_blank")}>
              Open user guide
            </button>
            <button className="default button" onClick={() => this.userGuideDialogRef.current?.close()}>
              Close
            </button>
          </div>
        </dialog>

        <dialog className="volunteer-dialog" aria-label="Volunteer" ref={this.volunteerDialogRef} onClose={() => this.volunteerDialogRef.current?.close()}>
          <div className="header">
            <h2 className="title">Volunteer</h2>
            <button onClick={() => this.volunteerDialogRef.current?.close()} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
          <div className="subText">Help us make the Retrospective Extension even better!</div>
          <div className="subText">While we will continue to maintain the extension to meet Microsoft&apos;s high standards for security and accessibility, we rely on volunteers like you to add new features and enhance the user experience.</div>
          <div className="subText">Want to contribute? Join us and become part of our community! 🙋</div>
          <div className="inner">
            <button className="button" onClick={() => window.open("https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CONTRIBUTING.md", "_blank")}>
              Open contributing guidelines
            </button>
            <button className="default button" onClick={() => this.volunteerDialogRef.current?.close()}>
              Close
            </button>
          </div>
        </dialog>

        <dialog className="keyboard-shortcuts-dialog" aria-label="Keyboard Shortcuts" ref={this.keyboardShortcutsDialogRef} onClose={() => this.keyboardShortcutsDialogRef.current?.close()}>
          <div className="header">
            <h2 className="title">Keyboard Shortcuts</h2>
            <button onClick={() => this.keyboardShortcutsDialogRef.current?.close()} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
          <div className="subText">Use these keyboard shortcuts to navigate and interact with the retrospective board.</div>
          <div className="subText">
            {Object.entries(
              this.keyboardShortcuts.reduce(
                (acc, shortcut) => {
                  if (!acc[shortcut.category]) {
                    acc[shortcut.category] = [];
                  }
                  acc[shortcut.category].push(shortcut);
                  return acc;
                },
                {} as { [key: string]: KeyboardShortcut[] },
              ),
            ).map(([category, shortcuts]) => (
              <div key={category}>
                <table className="keyboard-shortcuts-table">
                  <thead>
                    <tr>
                      <th scope="col">{category} Shortcuts</th>
                      <th scope="col">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortcuts.map((shortcut, index) => (
                      <tr key={index}>
                        <td>
                          {shortcut.keys.map((key, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="keyboard-shortcuts-key-separator">+</span>}
                              <kbd key={key}>{key}</kbd>
                            </React.Fragment>
                          ))}
                        </td>
                        <td>{shortcut.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className="inner">
            <button className="default button" onClick={() => this.keyboardShortcutsDialogRef.current?.close()}>
              Close
            </button>
          </div>
        </dialog>
      </div>
    );
  }
}

export default withAITracking(reactPlugin, ExtensionSettingsMenu);
