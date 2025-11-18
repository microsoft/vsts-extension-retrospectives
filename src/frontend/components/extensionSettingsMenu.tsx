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
import { Slide, toast, ToastContainer } from "react-toastify";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import KeyboardShortcutsDialog from "./keyboardShortcutsDialog";
import { WorkflowPhase } from "../interfaces/workItem";

import { RETRO_URLS, PRIME_DIRECTIVE_CONTENT, RETRO_HELP_CONTENT, VOLUNTEER_CONTENT, WHATISNEW_CONTENT, renderContent, WHATISNEW_MARKDOWN } from "./extensionSettingsMenuDialogContent";

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

interface ContextualMenuButtonProps {
  ariaLabel: string;
  title: string;
  iconClass: string;
  label: string;
  onClick?: () => void;
  menuItems?: IContextualMenuItem[];
}

export const ContextualMenuButton: React.FC<ContextualMenuButtonProps> = ({ ariaLabel, title, iconClass, label, onClick, menuItems }) => {
  const buttonClass = "contextual-menu-button";
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

  private readonly showPrimeDirectiveDialog = () => {
    this.setState({ isPrimeDirectiveDialogHidden: false });
  };

  private readonly hidePrimeDirectiveDialog = () => {
    this.setState({ isPrimeDirectiveDialogHidden: true });
  };

  private readonly showWhatsNewDialog = () => {
    this.setState({ isWhatsNewDialogHidden: false });
  };

  private readonly hideWhatsNewDialog = () => {
    this.setState({ isWhatsNewDialogHidden: true });
  };

  private readonly showPleaseJoinUsDialog = () => {
    this.setState({ isPleaseJoinUsDialogHidden: false });
  };

  private readonly hidePleaseJoinUsDialog = () => {
    this.setState({ isPleaseJoinUsDialogHidden: true });
  };

  private readonly onRetrospectiveWikiClicked = () => {
    window.open(RETRO_URLS.retrospectivewiki, "_blank");
  };

  private readonly onChangeLogClicked = () => {
    window.open(RETRO_URLS.changelog, "_blank");
  };

  private readonly onGetHelpClicked = () => {
    window.open(RETRO_URLS.readme, "_blank");
  };

  private readonly onContributingClicked = () => {
    window.open(RETRO_URLS.contributing, "_blank");
  };

  private readonly onContactUsClicked = () => {
    window.open(RETRO_URLS.issues, "_blank");
  };

  private readonly exportImportDataMenu: IContextualMenuItem[] = [
    {
      key: "exportData",
      iconProps: { iconName: "CloudDownload" },
      onClick: () => {
        this.exportData().catch(console.error);
      },
      text: "Export data",
      title: "Export data",
    },
    {
      key: "importData",
      iconProps: { iconName: "CloudUpload" },
      onClick: () => {
        this.importData().catch(console.error);
      },
      text: "Import data",
      title: "Import data",
    },
  ];

  private readonly retroHelpMenu: IContextualMenuItem[] = [
    {
      key: "whatsNew",
      iconProps: { iconName: "Megaphone" },
      onClick: this.showWhatsNewDialog,
      text: "What's new",
      title: "What's new",
    },
    {
      key: "keyboardShortcuts",
      iconProps: { iconName: "KeyboardClassic" },
      onClick: () => this.setState({ isKeyboardShortcutsDialogHidden: false }),
      text: "Keyboard shortcuts",
      title: "Keyboard shortcuts",
    },
    {
      key: "userGuide",
      iconProps: { iconName: "BookAnswers" },
      onClick: () => this.setState({ isGetHelpDialogHidden: false }),
      text: "User guide",
      title: "User guide",
    },
    {
      key: "volunteer",
      iconProps: { iconName: "Teamwork" },
      onClick: this.showPleaseJoinUsDialog,
      text: "Volunteer",
      title: "Volunteer",
    },
    {
      key: "contactUs",
      iconProps: { iconName: "ChatInviteFriend" },
      onClick: this.onContactUsClicked,
      text: "Contact us",
      title: "Contact us",
    },
  ];

  public render() {
    return (
      <div className="extension-settings-menu">
        <ContextualMenuButton ariaLabel="Prime Directive" title="Prime Directive" iconClass="fas fa-shield-halved" label="Directive" onClick={this.showPrimeDirectiveDialog} />
        <ContextualMenuButton ariaLabel="Data Import/Export" title="Data Import/Export" iconClass="fas fa-cloud" label="Data" menuItems={this.exportImportDataMenu} />
        <ContextualMenuButton ariaLabel="Retrospective Help" title="Retrospective Help" iconClass="fas fa-question-circle" label="Help" menuItems={this.retroHelpMenu} />

        <ExtensionDialog hidden={this.state.isPrimeDirectiveDialogHidden} onDismiss={this.hidePrimeDirectiveDialog} title="The Prime Directive" onDefaultClick={this.onRetrospectiveWikiClicked} defaultButtonText="Open Retrospective Wiki" containerClassName="prime-directive-dialog retro-dialog-shell">
          {renderContent(PRIME_DIRECTIVE_CONTENT)}
        </ExtensionDialog>
        <ExtensionDialog hidden={this.state.isWhatsNewDialogHidden} onDismiss={this.hideWhatsNewDialog} title="What's New" onDefaultClick={this.onChangeLogClicked} defaultButtonText="Open change log" containerClassName="whatsnew-dialog retro-dialog-shell">
          {renderContent(WHATISNEW_CONTENT)}
        </ExtensionDialog>
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

        <KeyboardShortcutsDialog isOpen={!this.state.isKeyboardShortcutsDialogHidden} onClose={() => this.setState({ isKeyboardShortcutsDialogHidden: true })} currentWorkflowPhase={WorkflowPhase.Collect} />

        <ToastContainer transition={Slide} closeButton={false} className="retrospective-notification-toast-container" toastClassName="retrospective-notification-toast" progressClassName="retrospective-notification-toast-progress-bar" />
      </div>
    );
  }
}

export default withAITracking(reactPlugin, ExtensionSettingsMenu);
