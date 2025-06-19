import React from 'react';
import { mount, shallow, ShallowWrapper } from 'enzyme';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { ExtensionSettingsMenu } from '../extensionSettingsMenu';
import { RETRO_URLS } from '../../components/extensionSettingsMenuDialogContent';

type Props = React.ComponentProps<typeof ExtensionSettingsMenu>;
type State = {
//  isClearVisitHistoryDialogHidden: boolean;
  isPrimeDirectiveDialogHidden: boolean;
  isWhatsNewDialogHidden: boolean;
  isGetHelpDialogHidden: boolean;
  isPleaseJoinUsDialogHidden: boolean;
  isWindowWide: boolean;
};

describe('ExtensionSettingsMenu', () => {
  const onScreenViewModeChangedMock = jest.fn();

  const defaultProps: Props = {
    onScreenViewModeChanged: onScreenViewModeChangedMock,
    isDesktop: true,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getWrapper = (props = defaultProps): ShallowWrapper<Props, State> =>
    shallow(<ExtensionSettingsMenu {...props} />);

  it('renders without crashing', () => {
    const wrapper = getWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('shows labels when isWindowWide is true', () => {
    const wrapper = mount(<ExtensionSettingsMenu isDesktop={true} onScreenViewModeChanged={jest.fn()} />);
    wrapper.setState({ isWindowWide: true });
    expect(wrapper.find('.ms-Button-label').length).toBeGreaterThan(0);
  });

  it('does not show labels when isWindowWide is false', () => {
    const wrapper = mount(<ExtensionSettingsMenu isDesktop={true} onScreenViewModeChanged={jest.fn()} />);
    wrapper.setState({ isWindowWide: false });
    const labels = wrapper.find('.ms-Button-label');
    expect(labels.length).toBe(0);
  });

  it('renders only the "Switch to desktop view" option when isDesktop is false', () => {
    const props = {
      onScreenViewModeChanged: jest.fn(),
      isDesktop: false,
    };
    const wrapper = shallow(<ExtensionSettingsMenu {...props} />);

    const userSettingsButton = wrapper.findWhere(
      node => node.prop('ariaLabel') === 'User Settings'
    );

    const menuItems = userSettingsButton.prop('menuItems');

    expect(menuItems).toHaveLength(1);
    expect(menuItems?.[0].key).toBe('switchToDesktop');
  });
});

describe('ExtensionSettingsMenu dialog toggles', () => {
  const getWrapper = (): ShallowWrapper<Props, State> =>
    shallow(<ExtensionSettingsMenu isDesktop={true} onScreenViewModeChanged={jest.fn()} />);

  const clickButtonByLabel = (wrapper: ShallowWrapper<Props, State>, label: string) => {
    const button = wrapper.findWhere(node => node.prop('ariaLabel') === label);
    expect(button.exists()).toBe(true);
    button.simulate('click');
  };

  it('opens Prime Directive dialog', () => {
    const wrapper = getWrapper();
    clickButtonByLabel(wrapper, 'Prime Directive');
    expect(wrapper.state('isPrimeDirectiveDialogHidden')).toBe(false);
  });

  it('opens Whats New dialog via Help menu', () => {
    const wrapper = getWrapper();
    const helpButton = wrapper.findWhere(node => node.prop('ariaLabel') === 'Retrospective Help');
    const menuItems = helpButton.prop('menuItems') ?? [];
    const whatsNew = menuItems.find((i: IContextualMenuItem) => i.key === 'whatsNew');
    whatsNew?.onClick?.();
    expect(wrapper.state('isWhatsNewDialogHidden')).toBe(false);
  });

  it('opens Get Help dialog via Help menu', () => {
    const wrapper = getWrapper();
    const helpButton = wrapper.findWhere(node => node.prop('ariaLabel') === 'Retrospective Help');
    const menuItems = helpButton.prop('menuItems') ?? [];
    const help = menuItems.find((i: IContextualMenuItem) => i.key === 'userGuide');
    help?.onClick?.();
    expect(wrapper.state('isGetHelpDialogHidden')).toBe(false);
  });

  it('opens Volunteer dialog via Help menu', () => {
    const wrapper = getWrapper();
    const helpButton = wrapper.findWhere(node => node.prop('ariaLabel') === 'Retrospective Help');
    const menuItems = helpButton.prop('menuItems') ?? [];
    const volunteer = menuItems.find((i: IContextualMenuItem) => i.key === 'volunteer');
    volunteer?.onClick?.();
    expect(wrapper.state('isPleaseJoinUsDialogHidden')).toBe(false);
  });
/*
  it('opens Clear Visit History dialog via Settings', () => {
    const wrapper = getWrapper();
    const settings = wrapper.findWhere(node => node.prop('ariaLabel') === 'User Settings');
    const items = settings.prop('menuItems') ?? [];
    const clearItem = items.find((i: IContextualMenuItem) => i.key === 'clearVisitHistory');
    clearItem?.onClick?.();
    expect(wrapper.state('isClearVisitHistoryDialogHidden')).toBe(false);
  });
*/
});

describe('ExtensionSettingsMenu dialog dismisses', () => {
  const getWrapper = (): ShallowWrapper<Props, State> =>
    shallow(<ExtensionSettingsMenu isDesktop={true} onScreenViewModeChanged={jest.fn()} />);

  it('closes Prime Directive dialog when dismissed', () => {
    const wrapper = getWrapper();
    wrapper.setState({ isPrimeDirectiveDialogHidden: false });

    const dialog = wrapper.findWhere(node => node.prop('title') === 'The Prime Directive');
    dialog.prop('onDismiss')?.();
    expect(wrapper.state('isPrimeDirectiveDialogHidden')).toBe(true);
  });

  it("closes What's New dialog when dismissed", () => {
    const wrapper = getWrapper();
    wrapper.setState({ isWhatsNewDialogHidden: false });

    const dialog = wrapper.findWhere(node => node.prop('title') === "What's New");
    dialog.prop('onDismiss')?.();
    expect(wrapper.state('isWhatsNewDialogHidden')).toBe(true);
  });

  it('closes Retrospectives User Guide dialog when dismissed', () => {
    const wrapper = getWrapper();
    wrapper.setState({ isGetHelpDialogHidden: false });

    const dialog = wrapper.findWhere(node => node.prop('title') === 'Retrospectives User Guide');
    dialog.prop('onDismiss')?.();
    expect(wrapper.state('isGetHelpDialogHidden')).toBe(true);
  });

  it('closes Volunteer dialog when dismissed', () => {
    const wrapper = getWrapper();
    wrapper.setState({ isPleaseJoinUsDialogHidden: false });

    const dialog = wrapper.findWhere(node => node.prop('title') === 'Volunteer');
    dialog.prop('onDismiss')?.();
    expect(wrapper.state('isPleaseJoinUsDialogHidden')).toBe(true);
  });
/*
  it('closes Clear Visit History dialog when dismissed', () => {
    const wrapper = getWrapper();
    wrapper.setState({ isClearVisitHistoryDialogHidden: false });

    const dialog = wrapper.findWhere(node => node.prop('title') === 'Clear Visit History');
    dialog.prop('onDismiss')?.();
    expect(wrapper.state('isClearVisitHistoryDialogHidden')).toBe(true);
  });
*/
});

describe('ExtensionSettingsMenu dialog default actions', () => {
  const getWrapper = (): ShallowWrapper<Props, State> =>
    shallow(<ExtensionSettingsMenu isDesktop={true} onScreenViewModeChanged={jest.fn()} />);

  let openSpy: jest.SpyInstance;

beforeEach((): void => {
  openSpy = jest.spyOn(window, 'open').mockImplementation((): Window | null => null);
});


  afterEach(() => {
    openSpy.mockRestore();
  });

  it('opens retrospective wiki from Prime Directive dialog', () => {
    const wrapper = getWrapper();
    wrapper.setState({ isPrimeDirectiveDialogHidden: false });
    const dialog = wrapper.findWhere(n => n.prop('title') === 'The Prime Directive');
    dialog.prop('onDefaultClick')?.();
    expect(openSpy).toHaveBeenCalledWith(RETRO_URLS.retrospectivewiki, '_blank');
  });

  it("opens changelog from What's New dialog", () => {
    const wrapper = getWrapper();
    wrapper.setState({ isWhatsNewDialogHidden: false });
    const dialog = wrapper.findWhere(n => n.prop('title') === "What's New");
    dialog.prop('onDefaultClick')?.();
    expect(openSpy).toHaveBeenCalledWith(RETRO_URLS.changelog, '_blank');
  });

  it('opens user guide from Retrospectives User Guide dialog', () => {
    const wrapper = getWrapper();
    wrapper.setState({ isGetHelpDialogHidden: false });
    const dialog = wrapper.findWhere(n => n.prop('title') === 'Retrospectives User Guide');
    dialog.prop('onDefaultClick')?.();
    expect(openSpy).toHaveBeenCalledWith(RETRO_URLS.readme, '_blank', 'noreferrer');
  });

  it('opens contributing guide from Volunteer dialog', () => {
    const wrapper = getWrapper();
    wrapper.setState({ isPleaseJoinUsDialogHidden: false });
    const dialog = wrapper.findWhere(n => n.prop('title') === 'Volunteer');
    dialog.prop('onDefaultClick')?.();
    expect(openSpy).toHaveBeenCalledWith(RETRO_URLS.contributing, '_blank');
  });

  it('opens issues page from Help menu (Contact Us)', () => {
    const wrapper = getWrapper();
    const helpButton = wrapper.findWhere(n => n.prop('ariaLabel') === 'Retrospective Help');
    const menuItems = helpButton.prop('menuItems') ?? [];
    const contactItem = menuItems.find((i: IContextualMenuItem) => i.key === 'contactUs');
    contactItem?.onClick?.();
    expect(openSpy).toHaveBeenCalledWith(RETRO_URLS.issues, '_blank');
  });
});
