import React from 'react';
import { PrimaryButton, DefaultButton, ActionButton } from 'office-ui-fabric-react/lib/Button';
import { Dialog, DialogContent, DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog';
import { userDataService } from '../dal/userDataService';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { ViewMode } from '../config/constants';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/telemetryClient';

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

  private clearVisitHistory = async () => {
    await userDataService.clearVisits()
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
            title: 'What\'s New',
            subText: "Some visual fixes for the dark theme, and formatting dialog modals.",
          }}
          minWidth={450}
          modalProps={{
            isBlocking: true,
            containerClassName: 'whatsnew-dialog',
          }}>
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
            Research from the <a href="https://services.google.com/fh/files/misc/state-of-devops-2018.pdf" target="_blank">2018 State of DevOps</a> report indicates that Elite teams are 1.5 times more likely to consistently hold retrospectives and use them to improve their work. Furthermore, a <a href="https://journals.sagepub.com/doi/full/10.1177/0018720812448394" target="_blank">2013 meta-analysis on teams</a> indicates that teams that effectively debrief are 20-25% more effective.
          </DialogContent>
          <DialogFooter>
            <DefaultButton onClick={() => {
              window.open('https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md', '_blank');
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
      </div>
    );
  }
}

export default withAITracking(reactPlugin, ExtensionSettingsMenu);
