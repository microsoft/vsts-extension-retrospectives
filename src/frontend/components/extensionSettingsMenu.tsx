import React from "react";
import { PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";
import { Dialog, DialogContent, DialogFooter, DialogType } from "@fluentui/react/lib/Dialog";
import { IContextualMenuItem } from "@fluentui/react/lib/ContextualMenu";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";
import boardDataService from "../dal/boardDataService";
import { azureDevOpsCoreService } from "../dal/azureDevOpsCoreService";
import { getProjectId } from "../utilities/servicesHelper";
import { itemDataService } from "../dal/itemDataService";
import { IFeedbackBoardDocument, IFeedbackItemDocument } from "../interfaces/feedback";
import { toast } from "./toastNotifications";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import KeyboardShortcutsDialog from "./keyboardShortcutsDialog";

import { RETRO_URLS, RETRO_HELP_CONTENT, VOLUNTEER_CONTENT, renderContent } from "./extensionSettingsMenuDialogContent";
import { CelebrationIcon, CloseIcon, CloudDownloadIcon, CloudIcon, CloudUploadIcon, ContactPhoneIcon, HelpIcon, KeyboardIcon, MenuBookIcon, PrivacyTipIcon, VolunteerActivismIcon } from "./icons";

interface IExtensionSettingsMenuState {
  isPrimeDirectiveDialogHidden: boolean;
  isWhatsNewDialogHidden: boolean;
  isGetHelpDialogHidden: boolean;
  isPleaseJoinUsDialogHidden: boolean;
  isKeyboardShortcutsDialogHidden: boolean;
}

interface IExportImportDataSchema {
  team: WebApiTeam;
  board: IFeedbackBoardDocument;
  items: IFeedbackItemDocument[];
}

interface ExtensionSettingsButtonProps {
  ariaLabel: string;
  title: string;
  iconClass: string;
  label: string;
  onClick?: () => void;
  menuItems?: IContextualMenuItem[];
}

export const ExtensionSettingsButton: React.FC<ExtensionSettingsButtonProps> = ({ ariaLabel, title, iconClass, label, onClick, menuItems }) => {
  const buttonClass = "extension-settings-button";
  const menuProps = menuItems
    ? {
        items: menuItems,
        className: "extended-options-menu",
      }
    : undefined;

  return (
    <DefaultButton className={buttonClass} aria-label={ariaLabel} title={title} onClick={onClick} menuProps={menuProps}>
      <span className="ms-Button-icon">
        <i className={iconClass}></i>
      </span>
      &nbsp;
      <span className="ms-Button-label hidden lg:inline">{label}</span>
    </DefaultButton>
  );
};

interface ExtensionDialogProps {
  hidden: boolean;
  onDismiss: () => void;
  title: string;
  children: React.ReactNode;
  onDefaultClick: () => void;
  defaultButtonText: string;
  primaryButtonText?: string;
  containerClassName: string;
  subText?: string;
}

const ExtensionDialog: React.FC<ExtensionDialogProps> = ({ hidden, onDismiss, title, children, onDefaultClick, defaultButtonText, primaryButtonText = "Close", containerClassName, subText }) => (
  <Dialog
    hidden={hidden}
    onDismiss={onDismiss}
    dialogContentProps={{
      type: DialogType.close,
      title,
      subText,
    }}
    minWidth="600"
    modalProps={{
      isBlocking: true,
      containerClassName,
      className: "retrospectives-dialog-modal",
    }}
  >
    <DialogContent>{children}</DialogContent>
    <DialogFooter>
      <DefaultButton onClick={onDefaultClick} text={defaultButtonText} />
      <PrimaryButton onClick={onDismiss} text={primaryButtonText} className={primaryButtonText === "Close" ? "extension-menu-close-button" : undefined} />
    </DialogFooter>
  </Dialog>
);

export class ExtensionSettingsMenu extends React.Component<Record<string, never>, IExtensionSettingsMenuState> {
  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      isPrimeDirectiveDialogHidden: true,
      isKeyboardShortcutsDialogHidden: true,
      isWhatsNewDialogHidden: true,
      isGetHelpDialogHidden: true,
      isPleaseJoinUsDialogHidden: true,
    };
  }

  private readonly primeDirectiveDialogRef = React.createRef<HTMLDialogElement>();
  private readonly whatsNewDialogRef = React.createRef<HTMLDialogElement>();

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

  private readonly hidePleaseJoinUsDialog = () => {
    this.setState({ isPleaseJoinUsDialogHidden: true });
  };

  private readonly onGetHelpClicked = () => {
    window.open(RETRO_URLS.readme, "_blank");
  };

  private readonly onContributingClicked = () => {
    window.open(RETRO_URLS.contributing, "_blank");
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
            <button onClick={() => this.setState({ isKeyboardShortcutsDialogHidden: false })}>
              <KeyboardIcon />
              Keyboard shortcuts
            </button>
            <button onClick={() => this.setState({ isGetHelpDialogHidden: false })}>
              <MenuBookIcon />
              User guide
            </button>
            <button onClick={() => this.setState({ isPleaseJoinUsDialogHidden: false })}>
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

        <ExtensionDialog
          hidden={this.state.isGetHelpDialogHidden}
          onDismiss={() => {
            this.setState({ isGetHelpDialogHidden: true });
          }}
          title="Retrospectives User Guide"
          onDefaultClick={this.onGetHelpClicked}
          defaultButtonText="Open user guide"
          containerClassName="retro-help-dialog retro-dialog-shell"
        >
          {renderContent(RETRO_HELP_CONTENT)}
        </ExtensionDialog>
        <ExtensionDialog hidden={this.state.isPleaseJoinUsDialogHidden} onDismiss={this.hidePleaseJoinUsDialog} title="Volunteer" onDefaultClick={this.onContributingClicked} defaultButtonText="Open contributing guidelines" containerClassName="volunteer-dialog retro-dialog-shell">
          {renderContent(VOLUNTEER_CONTENT)}
        </ExtensionDialog>

        <KeyboardShortcutsDialog isOpen={!this.state.isKeyboardShortcutsDialogHidden} onClose={() => this.setState({ isKeyboardShortcutsDialogHidden: true })} />
      </div>
    );
  }
}

export default withAITracking(reactPlugin, ExtensionSettingsMenu);
