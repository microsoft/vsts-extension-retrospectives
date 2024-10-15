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
  isWhatsNewDialogHidden: boolean;
  isGetHelpDialogHidden: boolean;
}

interface IExtensionSettingsMenuProps {
  onScreenViewModeChanged: () => void;
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
      isWhatsNewDialogHidden: true,
      isGetHelpDialogHidden: true
    };
  }

  private getChangelog = (): string[] => {
    return [
      'Team Assessment form: Background colors for each number on the spectrum now more closely resemble the Retrospective summary\'s color separation for the three categories: Reds and Oranges for Unfavorable (1-6), Yellows for Neutral (7-8), Greens for Favorable (9-10).',
      'Related feedback items, in "Focus Mode", now show the original column textual as well as visually.',
      'New tab in "Focus Mode", called "All", which contains every card on the current retrospective board so that your team can prioritize the highest voted cards first. ',
      'Duplicate an existing board with the new menu option "Create a copy of retrospective".'
    ];
  }

  private exportData = async () => {
    const toastId = toast('Processing boards...');
    const exportedData: IExportImportDataSchema[] = [];
    const projectId = await getProjectId();
    const teams = await azureDevOpsCoreService.getAllTeams(projectId, true);
    for (let iLoop = 0; iLoop < teams.length; iLoop++) {
      const team = teams[iLoop];
      const boards = await boardDataService.getBoardsForTeam(team.id);
      for (let yLoop = 0; yLoop < boards.length; yLoop++) {
        const board = boards[yLoop];
        const items = await itemDataService.getFeedbackItemsForBoard(board.id);
        exportedData.push({team, board, items});
        toast.update(toastId, { render: `Processing boards... (${board.title} is done)` })
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

  private importData = async () => {
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

  private processImportedData = async (importedData: IExportImportDataSchema[]) => {
    const projectId = await getProjectId();

    const teams = await azureDevOpsCoreService.getAllTeams(projectId, true);
    const defaultTeam = await azureDevOpsCoreService.getDefaultTeam(projectId);

    const toastId = toast('Importing data...');

    for (let iLoop = 0; iLoop < importedData.length; iLoop++) {
      const dataToProcess = importedData[iLoop];

      const team = teams.find(e => e.name === dataToProcess.team.name) ?? defaultTeam;

      const oldBoard = dataToProcess.board;

      const newBoard = await boardDataService.createBoardForTeam(team.id, oldBoard.title, oldBoard.maxVotesPerUser, oldBoard.columns, oldBoard.isIncludeTeamEffectivenessMeasurement, oldBoard.isAnonymous, oldBoard.shouldShowFeedbackAfterCollect, oldBoard.displayPrimeDirective, oldBoard.startDate, oldBoard.endDate);

      for (let yLoop = 0; yLoop < dataToProcess.items.length; yLoop++) {
        const oldItem = dataToProcess.items[yLoop];
        oldItem.boardId = newBoard.id;

        await itemDataService.appendItemToBoard(oldItem);

        toast.update(toastId, { render: `Importing data... (${newBoard.title} to ${team.name} is done)` });
      }
    }
  };

  private clearVisitHistory = async () => {
    await userDataService.clearVisits();
    this.hideClearVisitHistoryDialog();
  }

  private showClearVisitHistoryDialog = () => {
    this.setState({ isClearVisitHistoryDialogHidden: false });
  }

  private hideClearVisitHistoryDialog = () => {
    this.setState({ isClearVisitHistoryDialogHidden: true });
  }

  private showMobileExtensionSettingsMenuDialog = () => {
    this.setState({ isMobileExtensionSettingsDialogHidden: false });
  }

  private showWhatsNewDialog = () => {
    this.setState({ isWhatsNewDialogHidden: false });
  }

  private hideWhatsNewDialog = () => {
    this.setState({ isWhatsNewDialogHidden: true });
  }

  private hideMobileExtensionSettingsMenuDialog = () => {
    this.setState({ isMobileExtensionSettingsDialogHidden: true });
  }

  private onChangeLogClicked = () => {
    window.open('https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CHANGELOG.md', '_blank');
  }

  private onContactUsClicked = () => {
    window.open('https://github.com/microsoft/vsts-extension-retrospectives/issues', '_blank');
  }

  // If an action needs to be hidden on desktop or mobile view, use the item's className property
  // with .hide-mobile or .hide-desktop
  private readonly extensionSettingsMenuItem: IContextualMenuItem[] = [
    {
      key: 'exportData',
      iconProps: { iconName: 'CloudDownload' },
      onClick: this.exportData,
      text: 'Export Data',
      title: 'Export Data',
    },
    {
      key: 'importData',
      iconProps: { iconName: 'CloudUpload' },
      onClick: this.importData,
      text: 'Import Data',
      title: 'Import Data',
    },
    {
      key: 'clearVisitHistory',
      iconProps: { iconName: 'RemoveEvent' },
      onClick: this.showClearVisitHistoryDialog,
      text: 'Clear visit history',
      title: 'Clear visit history',
    },
    {
      key: 'switchToDesktop',
      iconProps: { iconName: 'TVMonitor' },
      onClick: this.props.onScreenViewModeChanged,
      text: 'Switch to Desktop View',
      title: 'Switch to Desktop View',
      className: 'hide-desktop',
    },
    {
      key: 'switchToMobile',
      iconProps: { iconName: 'CellPhone' },
      onClick: this.props.onScreenViewModeChanged,
      text: 'Switch to Mobile View',
      title: 'Switch to Mobile View',
      className: 'hide-mobile'
    },
    {
      key: 'contactUs',
      iconProps: { iconName: 'ChatInviteFriend' },
      onClick: this.onContactUsClicked,
      text: 'Contact Us',
      title: 'Contact Us'
    },
  ];

  public render() {
    return (
      <div className="extension-settings-menu">
        <DefaultButton
          className="contextual-menu-button hide-mobile"
          aria-label="User Settings Menu"
          title="User Settings Menu"
          menuProps={{
            items: this.extensionSettingsMenuItem,
            className: "user-settings-menu",
          }}
        >
          <span className="ms-Button-icon"><i className="fas fa-bars"></i></span>
        </DefaultButton>
        <DefaultButton
          className="contextual-menu-button"
          aria-label="What's New"
          title="What's New"
          onClick={this.showWhatsNewDialog}
        >
          <span className="ms-Button-icon"><i className="fas fa-certificate"></i></span>&nbsp;
          <span className="ms-Button-label">What&apos;s New</span>
        </DefaultButton>
        <DefaultButton
          className="contextual-menu-button"
          aria-label="Get Help"
          title="Get Help"
          onClick={() => this.setState({ isGetHelpDialogHidden: false })}
        >
          <span className="ms-Button-icon"><i className="fa fa-question-circle"></i></span>&nbsp;
          <span className="ms-Button-label">Get Help</span>
        </DefaultButton>
        <Dialog
          hidden={this.state.isWhatsNewDialogHidden}
          onDismiss={this.hideWhatsNewDialog}
          dialogContentProps={{
            type: DialogType.close,
            title: 'What\'s New'
          }}
          minWidth={450}
          modalProps={{
            isBlocking: true,
            containerClassName: 'whatsnew-dialog',
          }}>
          <DialogBase>

          </DialogBase>
          <DialogContent>
            <ul style={{listStyle: 'initial'}}>
              {this.getChangelog().map((change, index) => {
                return <li key={`changelog-item${index}`} style={{marginBottom: '1rem'}}>{change}</li>;
              })}
            </ul>
          </DialogContent>
          <DialogFooter>
            <DefaultButton onClick={this.onChangeLogClicked} text="Changelog" />
            <PrimaryButton className="whats-new-close-button" onClick={this.hideWhatsNewDialog} text="Close" />
          </DialogFooter>
        </Dialog>
        <Dialog
          hidden={this.state.isGetHelpDialogHidden}
          onDismiss={() => { this.setState({ isGetHelpDialogHidden: true }); }}
          dialogContentProps={{
            type: DialogType.close,
            title: 'Retrospectives',
          }}
          minWidth={600}
          modalProps={{
            isBlocking: true,
            containerClassName: 'prime-directive-dialog',
            className: 'gethelp-dialog',
          }}>
          <DialogContent>
            The purpose of the retrospective is to build a practice of gathering feedback and continuously improving by acting on that feedback.
            <br /><br />
            The Team Assessment addition to the retrospective guides teams through a set of questions that highlight strengths and opportunities. Teams can then utilize specific retrospective templates to identify the top opportunities for improvement.
            <br /><br />
            Research from the <a href="https://services.google.com/fh/files/misc/state-of-devops-2018.pdf" target="_blank" rel="noreferrer">2018 State of DevOps</a> report indicates that Elite teams are 1.5 times more likely to consistently hold retrospectives and use them to improve their work. Furthermore, a <a href="https://journals.sagepub.com/doi/full/10.1177/0018720812448394" target="_blank" rel="noreferrer">2013 meta-analysis on teams</a> indicates that teams that effectively debrief are 20-25% more effective.
          </DialogContent>
          <DialogFooter>
            <DefaultButton onClick={() => {
              window.open('https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md', '_blank', 'noreferrer');
            }}
              text="Get more information" />
            <PrimaryButton onClick={() => {
              this.setState({ isGetHelpDialogHidden: true });
            }}
              text="Close"
              className="prime-directive-close-button" />
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
          <div className="mobile-contextual-menu-list">
            {
              this.extensionSettingsMenuItem.map((extensionSettingsMenuItem) =>
                <ActionButton
                  key={extensionSettingsMenuItem.key}
                  iconProps={extensionSettingsMenuItem.iconProps}
                  className={extensionSettingsMenuItem.className}
                  aria-label={extensionSettingsMenuItem.text}
                  onClick={() => {
                    this.hideMobileExtensionSettingsMenuDialog();
                    extensionSettingsMenuItem.onClick();
                  }}
                  text={extensionSettingsMenuItem.text}
                  title={extensionSettingsMenuItem.title}
                >
                  <span className="ms-Button-icon"><i className={"fa-solid fa-" + extensionSettingsMenuItem.iconProps}></i></span>&nbsp;
                  <span className="ms-Button-label">{extensionSettingsMenuItem.text}</span>
                </ActionButton>
              )
            }
          </div>
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
              'you will not be automatically directed to the your last visited board.',
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
