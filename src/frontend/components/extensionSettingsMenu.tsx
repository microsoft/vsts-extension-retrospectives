import React from 'react';
import { PrimaryButton, DefaultButton, ActionButton } from 'office-ui-fabric-react/lib/Button';
import { Dialog, DialogBase, DialogContent, DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog';
import { userDataService } from '../dal/userDataService';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { ViewMode } from '../config/constants';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/telemetryClient';
import boardDataService from '../dal/boardDataService';
import { azureDevOpsCoreService } from '../dal/azureDevOpsCoreService';
import { getProjectId } from '../utilities/servicesHelper';
import { itemDataService } from '../dal/itemDataService';
import { IFeedbackBoardDocument, IFeedbackItemDocument } from '../interfaces/feedback';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { WebApiTeam } from 'azure-devops-extension-api/Core';

interface IExtensionSettingsMenuState {
  isClearVisitHistoryDialogHidden: boolean;
  isMobileExtensionSettingsDialogHidden: boolean;
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

class ExtensionSettingsMenu extends React.Component<IExtensionSettingsMenuProps, IExtensionSettingsMenuState> {
  constructor(props: IExtensionSettingsMenuProps) {
    super(props);

    this.state = {
      isClearVisitHistoryDialogHidden: true,
      isMobileExtensionSettingsDialogHidden: true,
      isPrimeDirectiveDialogHidden: true,
      isWhatsNewDialogHidden: true,
      isGetHelpDialogHidden: true,
      isPleaseJoinUsDialogHidden: true,
      isWindowWide: this.checkIfWindowWideOrTall(),
    };
  }

  private readonly getChangelog = (): string[] => {
    return [
      'The latest release includes updates for setting permissions, deleting boards, and sticky defaults.',
      'Ability to set permissions for accessing the retrospective board now restricted to the board owner or a team admin.',
      'Functionality to delete boards was moved from the Board menu to the History table and is only enabled for archived boards.',
      'User settings for maximum votes, Team Assessment, Prime Directive, obscure feedback, and anonymous feedback are saved and used as defaults when the user creates the next retrospective board.',
      'Refer to the Changelog for a comprehensive listing of the updates included in this release and past releases.'
    ];
  }

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

  private readonly hideMobileExtensionSettingsMenuDialog = () => {
    this.setState({ isMobileExtensionSettingsDialogHidden: true });
  }

  private readonly onChangeLogClicked = () => {
    window.open('https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CHANGELOG.md', '_blank');
  }

  private readonly onContributingClicked = () => {
    window.open('https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CONTRIBUTING.md', '_blank');
  }

  private readonly onContactUsClicked = () => {
    window.open('https://github.com/microsoft/vsts-extension-retrospectives/issues', '_blank');
  }

  // Handler to show Prime Directive dialog
  showPrimeDirectiveDialog = () => {
    this.setState({ isPrimeDirectiveDialogHidden: false });
  };

  // Handler to hide Prime Directive dialog
  hidePrimeDirectiveDialog = () => {
    this.setState({ isPrimeDirectiveDialogHidden: true });
  };

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

  private readonly helpMenu: IContextualMenuItem[] = [
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

  public render() {
    const { isWindowWide } = this.state;

    return (
      <div className="extension-settings-menu">
        <DefaultButton
          className="contextual-menu-button hide-mobile"
          aria-label="Prime Directive"
          title="Prime Directive"
          onClick={this.showPrimeDirectiveDialog}
        >
          <span className="ms-Button-icon"><i className="fas fa-shield-halved"></i></span>&nbsp;
          {isWindowWide && (
            <span className="ms-Button-label">Directive</span>
          )}
        </DefaultButton>
        <DefaultButton
          className="contextual-menu-button hide-mobile"
          aria-label="Export Import"
          title="Export Import"
          menuProps={{
            items: this.exportImportDataMenu,
            className: "extended-options-menu",
          }}
        >
          <span className="ms-Button-icon"><i className="fas fa-cloud"></i></span>&nbsp;
          {isWindowWide && (
            <span className="ms-Button-label">Data</span>
          )}
        </DefaultButton>
        <DefaultButton
          className="contextual-menu-button hide-mobile"
          aria-label="Help"
          title="Help"
          menuProps={{
            items: this.helpMenu,
            className: "extended-options-menu",
          }}
        >
          <span className="ms-Button-icon"><i className="fas fa-question-circle"></i></span>&nbsp;
          {isWindowWide && (
            <span className="ms-Button-label">Help</span>
          )}
        </DefaultButton>
        <DefaultButton
          className="contextual-menu-button"
          aria-label="User Settings"
          title="User Settings"
          menuProps={{
            items: this.extensionSettingsMenuItem(),
            className: "extended-options-menu",
          }}
        >
          <span className="ms-Button-icon"><i className="fas fa-user-gear"></i></span>&nbsp;
          {isWindowWide && this.props.isDesktop && (
            <span className="ms-Button-label">Settings</span>
          )}
        </DefaultButton>

        <Dialog
          hidden={this.state.isPrimeDirectiveDialogHidden}
          onDismiss={this.hidePrimeDirectiveDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: "The Prime Directive",
          }}
          minWidth={600}
          modalProps={{
            isBlocking: true,
            containerClassName: "prime-directive-dialog",
            className: "retrospectives-dialog-modal",
          }}
        >
          <DialogContent>
            <p>The purpose of the Prime Directive is to set the stage for a respectful and constructive retrospective.  By embracing this mindset, we create an environment where everyone feels safe to share openly, learn together, and improve as a team.</p>
            <p style={{ fontWeight: "bold", marginTop: "1rem" }}>
              &quot;Regardless of what we discover, we understand and truly believe that everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand.&quot;
            </p>
            <p style={{ fontStyle: "italic", marginTop: "1rem" }}>
              --Norm Kerth, Project Retrospectives: A Handbook for Team Review
            </p>
          </DialogContent>
          <DialogFooter>
            <DefaultButton onClick={() => {
              window.open("https://retrospectivewiki.org/", "_blank");
            }} text="Open Retrospective Wiki" />
            <PrimaryButton onClick={this.hidePrimeDirectiveDialog} text="Close" className="extension-menu-close-button" />
          </DialogFooter>
        </Dialog>

        <Dialog
          hidden={this.state.isWhatsNewDialogHidden}
          onDismiss={this.hideWhatsNewDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: 'What\'s New'
          }}
          minWidth={600}
          modalProps={{
            isBlocking: true,
            containerClassName: 'whatsnew-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          <DialogContent>
            <p style={{ marginBottom: '1.25em' }}>{this.getChangelog()[0]}</p>
            <ul style={{ listStyle: 'initial', paddingLeft: "1rem" }}>
            {this.getChangelog().slice(1, -1).map((change, index) => (
            <li key={`changelog-item${index}`}>{change}</li>
            ))}
            </ul>
            <p style={{ marginTop: '1.25em' }}>{this.getChangelog().slice(-1)[0]}</p>
          </DialogContent>
          <DialogFooter>
            <DefaultButton onClick={this.onChangeLogClicked} text="Open change logs" />
            <PrimaryButton className="extension-menu-close-button" onClick={this.hideWhatsNewDialog} text="Close" />
          </DialogFooter>
        </Dialog>

        <Dialog
          hidden={this.state.isPleaseJoinUsDialogHidden}
          onDismiss={this.hidePleaseJoinUsDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: 'Volunteer'
          }}
          minWidth={600}
          modalProps={{
            isBlocking: true,
            containerClassName: 'volunteer-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          <DialogContent>
            We are looking for contributors!<br /><br />
            We will continue maintaining the Retrospective Extension, but with limited time for new features, we need help to make it even better.  Join us if you are interested! 🙌
          </DialogContent>
          <DialogFooter>
            <DefaultButton onClick={this.onContributingClicked} text="Open contributing guidelines" />
            <PrimaryButton className="extension-menu-close-button" onClick={this.hidePleaseJoinUsDialog} text="Close" />
          </DialogFooter>
        </Dialog>

        <Dialog
          hidden={this.state.isGetHelpDialogHidden}
          onDismiss={() => { this.setState({ isGetHelpDialogHidden: true }); }}
          dialogContentProps={{
            type: DialogType.close,
            title: 'Retrospectives User Guide',
          }}
          minWidth={600}
          modalProps={{
            isBlocking: true,
            containerClassName: 'gethelp-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          <DialogContent>
            The purpose of the retrospective is to build a practice of gathering feedback and continuously improving by acting on that feedback.  The Retrospective extension and Team Assessment feature are valuable tools supporting that process.
            <br /><br />
            Get more information in the Readme file, which includes instructions for getting started, using the Retrospective extension and Team Assessment feature, as well as best practices for running effective retrospectives.
          </DialogContent>
          <DialogFooter>
            <DefaultButton onClick={() => {
              window.open('https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md', '_blank', 'noreferrer');
            }}
              text="Open user guide" />
            <PrimaryButton onClick={() => {
              this.setState({ isGetHelpDialogHidden: true });
            }}
              text="Close"
              className="extension-menu-close-button" />
          </DialogFooter>
        </Dialog>

        <Dialog
          hidden={this.state.isMobileExtensionSettingsDialogHidden}
          onDismiss={this.hideMobileExtensionSettingsMenuDialog}
          modalProps={{
            isBlocking: false,
            containerClassName: 'ms-dialogMainOverride',
            className: `retrospectives-dialog-modal ${this.props.isDesktop ? ViewMode.Desktop : ViewMode.Mobile}`,
          }}
        >
          <DialogFooter>
            <DefaultButton onClick={this.hideMobileExtensionSettingsMenuDialog} text="Close" />
          </DialogFooter>
        </Dialog>
        <Dialog
          hidden={this.state.isClearVisitHistoryDialogHidden}
          onDismiss={this.hideClearVisitHistoryDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: 'Clear Visit History',
            subText: 'This extension maintains records of the teams and boards you visited. ' +
              'Clearing visit history means that the next time you use the extension, ' +
              'you will not be automatically directed to your last visited board.',
          }}
          minWidth={450}
          modalProps={{
            isBlocking: true,
            containerClassName: 'retrospectives-visit-history-cleared-info-dialog',
            className: 'retrospectives-dialog-modal',
          }}>
          <DialogFooter>
            <PrimaryButton onClick={this.clearVisitHistory} text="Clear my visit history" />
            <DefaultButton onClick={this.hideClearVisitHistoryDialog} text="Cancel" />
          </DialogFooter>
        </Dialog>
        <ToastContainer
          transition={Slide}
          closeButton={false}
          className="retrospective-notification-toast-container"
          toastClassName="retrospective-notification-toast"
          bodyClassName="retrospective-notification-toast-body"
          progressClassName="retrospective-notification-toast-progress-bar" />
      </div>
    );
  }
}

export default withAITracking(reactPlugin, ExtensionSettingsMenu);
