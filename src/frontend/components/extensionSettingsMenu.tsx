import React from 'react';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Dialog, DialogContent, DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog';
import { userDataService } from '../dal/userDataService';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/telemetryClient';
import boardDataService from '../dal/boardDataService';
import { azureDevOpsCoreService } from '../dal/azureDevOpsCoreService';
import { getProjectId } from '../utilities/servicesHelper';
import { itemDataService } from '../dal/itemDataService';
import { IFeedbackBoardDocument, IFeedbackItemDocument } from '../interfaces/feedback';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { WebApiTeam } from 'azure-devops-extension-api/Core';

import {
  RETRO_URLS,
  PRIME_DIRECTIVE_CONTENT,
  CHANGELOG_CONTENT,
  RETRO_HELP_CONTENT,
  VOLUNTEER_CONTENT,
  CLEAR_VISIT_HISTORY_CONTENT,
  renderContent,
} from './extensionSettingsMenuDialogContent';

interface IExtensionSettingsMenuState {
  isClearVisitHistoryDialogHidden: boolean;
  isPrimeDirectiveDialogHidden: boolean;
  isWhatsNewDialogHidden: boolean;
  isGetHelpDialogHidden: boolean;
  isPleaseJoinUsDialogHidden: boolean;
  isWindowWide: boolean;
}

interface IExtensionSettingsMenuProps {
  onScreenViewModeChanged: (isDesktop: boolean) => void;
  isDesktop: boolean;
}

interface IExportImportDataSchema {
  team: WebApiTeam
  board: IFeedbackBoardDocument
  items: IFeedbackItemDocument[]
}

interface ContextualMenuButtonProps {
  ariaLabel: string;
  title: string;
  iconClass: string;
  label: string;
  onClick?: () => void;
  menuItems?: IContextualMenuItem[];
  hideMobile?: boolean;
  showLabel:boolean;
}

const ContextualMenuButton: React.FC<ContextualMenuButtonProps> = ({
  ariaLabel,
  title,
  iconClass,
  label,
  onClick,
  menuItems,
  hideMobile = true,
  showLabel,
}) => {
  const buttonClass = `contextual-menu-button${hideMobile ? ' hide-mobile' : ''}`;
  const menuProps = menuItems
  ? {
      items: menuItems,
      className: 'extended-options-menu',
    }
  : undefined;

  return (
    <DefaultButton
      className={buttonClass}
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      menuProps={menuProps}
    >
      <span className="ms-Button-icon">
        <i className={iconClass}></i>
      </span>
      &nbsp;
      {showLabel && (
        <span className="ms-Button-label">{label}</span>
      )}
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
  minWidth?: number;
  containerClassName: string;
  subText?: string;
}

const ExtensionDialog: React.FC<ExtensionDialogProps> = ({
  hidden,
  onDismiss,
  title,
  children,
  onDefaultClick,
  defaultButtonText,
  primaryButtonText = "Close",
  minWidth = 600,
  containerClassName,
  subText,
}) => (
  <Dialog
    hidden={hidden}
    onDismiss={onDismiss}
    dialogContentProps={{
      type: DialogType.close,
      title,
      subText,
    }}
    minWidth={minWidth}
    modalProps={{
      isBlocking: true,
      containerClassName,
      className: "retrospectives-dialog-modal",
    }}
  >
    <DialogContent>{children}</DialogContent>
    <DialogFooter>
      <DefaultButton onClick={onDefaultClick} text={defaultButtonText} />
      <PrimaryButton
        onClick={onDismiss}
        text={primaryButtonText}
        className={primaryButtonText === "Close" ? "extension-menu-close-button" : undefined}
      />
    </DialogFooter>
  </Dialog>
);

class ExtensionSettingsMenu extends React.Component<IExtensionSettingsMenuProps, IExtensionSettingsMenuState> {
  constructor(props: IExtensionSettingsMenuProps) {
    super(props);

    this.state = {
      isClearVisitHistoryDialogHidden: true,
      isPrimeDirectiveDialogHidden: true,
      isWhatsNewDialogHidden: true,
      isGetHelpDialogHidden: true,
      isPleaseJoinUsDialogHidden: true,
      isWindowWide: this.checkIfWindowWideOrTall(),
    };
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  // Function to check if the window is maximized (90% threshold) or vertical
  checkIfWindowWideOrTall = () => {
    const isWide = window.outerWidth >= screen.availWidth * 0.9;
    const isTallerThanWide = window.innerHeight > window.innerWidth;
    return isWide && !isTallerThanWide;
  };

  handleResize = () => {
    this.setState({
      isWindowWide: this.checkIfWindowWideOrTall(),
    });
  };

  private readonly exportData = async () => {
    const toastId = toast('Processing boards...');
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
  }

  private readonly importData = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.addEventListener('change', () => {
      const reader = new FileReader()
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const importedData: IExportImportDataSchema[] = JSON.parse(event.target.result.toString());
        this.processImportedData(importedData);
      };
      reader.readAsText(input.files[0])
    }, false);
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
    return false;
  }

  private readonly processImportedData = async (importedData: IExportImportDataSchema[]) => {
    const projectId = await getProjectId();

    const teams = await azureDevOpsCoreService.getAllTeams(projectId, true);
    const defaultTeam = await azureDevOpsCoreService.getDefaultTeam(projectId);

    const toastId = toast('Importing data...');

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

  private readonly clearVisitHistory = async () => {
    await userDataService.clearVisits();
    this.hideClearVisitHistoryDialog();
  }

  private readonly showClearVisitHistoryDialog = () => {
    this.setState({ isClearVisitHistoryDialogHidden: false });
  }

  private readonly hideClearVisitHistoryDialog = () => {
    this.setState({ isClearVisitHistoryDialogHidden: true });
  }

  private readonly showPrimeDirectiveDialog = () => {
    this.setState({ isPrimeDirectiveDialogHidden: false });
  };

  private readonly hidePrimeDirectiveDialog = () => {
    this.setState({ isPrimeDirectiveDialogHidden: true });
  };

  private readonly showWhatsNewDialog = () => {
    this.setState({ isWhatsNewDialogHidden: false });
  }

  private readonly hideWhatsNewDialog = () => {
    this.setState({ isWhatsNewDialogHidden: true });
  }

  private readonly showPleaseJoinUsDialog = () => {
    this.setState({ isPleaseJoinUsDialogHidden: false });
  }

  private readonly hidePleaseJoinUsDialog = () => {
    this.setState({ isPleaseJoinUsDialogHidden: true });
  }

  private readonly onRetrospectiveWikiClicked = () => {
    window.open(RETRO_URLS.retrospectivewiki, '_blank');
  }

  private readonly onChangeLogClicked = () => {
    window.open(RETRO_URLS.changelog, '_blank');
  }

  private readonly onGetHelpClicked = () => {
    window.open(RETRO_URLS.readme, '_blank', 'noreferrer');
  }

  private readonly onContributingClicked = () => {
    window.open(RETRO_URLS.contributing, '_blank');
  }

  private readonly onContactUsClicked = () => {
    window.open(RETRO_URLS.issues, '_blank');
  }

  private readonly exportImportDataMenu: IContextualMenuItem[] = [
    {
      key: 'exportData',
      iconProps: { iconName: 'CloudDownload' },
      onClick: (ev, item) => {
        this.exportData().catch(console.error); // Ensures async function runs without breaking `onClick`
      },
      text: 'Export data',
      title: 'Export data',
    },
    {
      key: 'importData',
      iconProps: { iconName: 'CloudUpload' },
      onClick: (ev, item) => {
        this.importData().catch(console.error); // Ensures async function runs without breaking `onClick`
      },
      text: 'Import data',
      title: 'Import data',
    },
  ];

  private readonly retroHelpMenu: IContextualMenuItem[] = [
    {
      key: 'whatsNew',
      iconProps: { iconName: 'Megaphone' },
      onClick: this.showWhatsNewDialog,
      text: "What's new",
      title: "What's new",
    },
    {
      key: 'userGuide',
      iconProps: { iconName: 'BookAnswers' },
      onClick: () => this.setState({ isGetHelpDialogHidden: false }),
      text: 'User guide',
      title: 'User guide',
    },
    {
      key: 'volunteer',
      iconProps: { iconName: 'Teamwork' },
      onClick: this.showPleaseJoinUsDialog,
      text: 'Volunteer',
      title: 'Volunteer',
    },
    {
      key: 'contactUs',
      iconProps: { iconName: 'ChatInviteFriend' },
      onClick: this.onContactUsClicked,
      text: 'Contact us',
      title: 'Contact us',
    },
  ];

    private extensionSettingsMenuItem(): IContextualMenuItem[] {
    return [
      this.props.isDesktop && {
        key: 'clearVisitHistory',
        iconProps: { iconName: 'RemoveEvent' },
        onClick: this.showClearVisitHistoryDialog,
        text: 'Clear visit history',
        title: 'Clear visit history',
      },
      !this.props.isDesktop && {
        key: 'switchToDesktop',
        iconProps: { iconName: 'TVMonitor' },
        onClick: () => this.props.onScreenViewModeChanged(true),
        text: 'Switch to desktop view',
        title: 'Switch to desktop view',
      },
      this.props.isDesktop && {
        key: 'switchToMobile',
        iconProps: { iconName: 'CellPhone' },
        onClick: () => this.props.onScreenViewModeChanged(false),
        text: 'Switch to mobile view',
        title: 'Switch to mobile view',
      },
    ].filter(Boolean) as IContextualMenuItem[];
  }

  public render() {
    const { isWindowWide } = this.state;

    return (
      <div className="extension-settings-menu">
        <ContextualMenuButton
          ariaLabel="Prime Directive"
          title="Prime Directive"
          iconClass="fas fa-shield-halved"
          label="Directive"
          onClick={this.showPrimeDirectiveDialog}
          showLabel={isWindowWide}
        />
        <ContextualMenuButton
          ariaLabel="Export Import"
          title="Export Import"
          iconClass="fas fa-cloud"
          label="Data"
          menuItems={this.exportImportDataMenu}
          showLabel={isWindowWide}
        />
        <ContextualMenuButton
          ariaLabel="Retrospective Help"
          title="Retrospective Help"
          iconClass="fas fa-question-circle"
          label="Help"
          menuItems={this.retroHelpMenu}
          showLabel={isWindowWide}
        />
        <ContextualMenuButton
          ariaLabel="User Settings"
          title="User Settings"
          iconClass="fas fa-user-gear"
          label="Settings"
          menuItems={this.extensionSettingsMenuItem()}
          hideMobile={false}
          showLabel={isWindowWide && this.props.isDesktop}
        />

        <ExtensionDialog
          hidden={this.state.isPrimeDirectiveDialogHidden}
          onDismiss={this.hidePrimeDirectiveDialog}
          title="The Prime Directive"
          onDefaultClick={this.onRetrospectiveWikiClicked}
          defaultButtonText="Open Retrospective Wiki"
          containerClassName="prime-directive-dialog"
        >
          {renderContent(PRIME_DIRECTIVE_CONTENT)}
        </ExtensionDialog>
        <ExtensionDialog
          hidden={this.state.isWhatsNewDialogHidden}
          onDismiss={this.hideWhatsNewDialog}
          title="What's New"
          onDefaultClick={this.onChangeLogClicked}
          defaultButtonText="Open change log"
          containerClassName="whatsnew-dialog"
        >
          {renderContent(CHANGELOG_CONTENT)}
        </ExtensionDialog>
        <ExtensionDialog
          hidden={this.state.isGetHelpDialogHidden}
          onDismiss={() => { this.setState({ isGetHelpDialogHidden: true }); }}
          title="Retrospectives User Guide"
          onDefaultClick={this.onGetHelpClicked}
          defaultButtonText="Open user guide"
          containerClassName="retro-help-dialog"
        >
          {renderContent(RETRO_HELP_CONTENT)}
        </ExtensionDialog>
        <ExtensionDialog
          hidden={this.state.isPleaseJoinUsDialogHidden}
          onDismiss={this.hidePleaseJoinUsDialog}
          title="Volunteer"
          onDefaultClick={this.onContributingClicked}
          defaultButtonText="Open contributing guidelines"
          containerClassName="volunteer-dialog"
        >
          {renderContent(VOLUNTEER_CONTENT)}
        </ExtensionDialog>
        <ExtensionDialog
          hidden={this.state.isClearVisitHistoryDialogHidden}
          onDismiss={this.hideClearVisitHistoryDialog}
          title="Clear Visit History"
          onDefaultClick={this.clearVisitHistory}
          defaultButtonText="Clear my visit history"
          primaryButtonText="Cancel"
          minWidth={450}
          containerClassName="visit-history-dialog"
        >
          {renderContent(CLEAR_VISIT_HISTORY_CONTENT)}
        </ExtensionDialog>

        <ToastContainer
          transition={Slide}
          closeButton={false}
          className="retrospective-notification-toast-container"
          toastClassName="retrospective-notification-toast"
          bodyClassName="retrospective-notification-toast-body"
          progressClassName="retrospective-notification-toast-progress-bar"
        />
      </div>
    );
  }
}

export default withAITracking(reactPlugin, ExtensionSettingsMenu);
