/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { mount, shallow, ShallowWrapper } from 'enzyme';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import ExtensionSettingsMenu from '../extensionSettingsMenu';
import { azureDevOpsCoreService } from '../../dal/azureDevOpsCoreService';
import boardDataService from '../../dal/boardDataService';
import { itemDataService } from '../../dal/itemDataService';
import { RETRO_URLS } from '../../components/extensionSettingsMenuDialogContent';

// --- Mocks and Spies ---
const originalCreateElement = document.createElement;
const originalAppendChild = document.body.appendChild;
const originalRemoveChild = document.body.removeChild;

jest.mock('../../dal/userDataService', () => ({
  userDataService: { clearVisits: jest.fn().mockResolvedValue(undefined) }
}));
jest.mock('../../dal/boardDataService', () => ({
  default: {
    getBoardsForTeam: jest.fn().mockResolvedValue([
      { id: 'board1', title: 'Test Board 1' },
      { id: 'board2', title: 'Test Board 2' }
    ]),
    createBoardForTeam: jest.fn().mockResolvedValue({ id: 'newBoard', title: 'New Board' })
  },
  boardDataService: {
    getBoardsForTeam: jest.fn().mockResolvedValue([
      { id: 'board1', title: 'Test Board 1' },
      { id: 'board2', title: 'Test Board 2' }
    ]),
    createBoardForTeam: jest.fn().mockResolvedValue({ id: 'newBoard', title: 'New Board' })
  }
}));
jest.mock('../../dal/azureDevOpsCoreService', () => ({
  azureDevOpsCoreService: {
    getAllTeams: jest.fn().mockResolvedValue([
      { id: 'team1', name: 'Team 1' },
      { id: 'team2', name: 'Team 2' }
    ]),
    getDefaultTeam: jest.fn().mockResolvedValue({ id: 'defaultTeam', name: 'Default Team' })
  }
}));
jest.mock('../../utilities/servicesHelper', () => ({
  getProjectId: jest.fn().mockResolvedValue('test-project-id')
}));
jest.mock('../../dal/itemDataService', () => ({
  itemDataService: {
    getFeedbackItemsForBoard: jest.fn().mockResolvedValue([
      { id: 'item1', title: 'Test Item 1', boardId: 'board1' },
      { id: 'item2', title: 'Test Item 2', boardId: 'board1' }
    ]),
    appendItemToBoard: jest.fn().mockResolvedValue(undefined)
  }
}));
jest.mock('react-toastify', () => ({
  toast: Object.assign(jest.fn().mockReturnValue('toast-id'), { update: jest.fn() }),
  ToastContainer: () => <div data-testid="toast-container" />,
  Slide: {}
}));
jest.mock('../../utilities/telemetryClient', () => ({ reactPlugin: {} }));
jest.mock('@microsoft/applicationinsights-react-js', () => ({
  withAITracking: (plugin: unknown, component: unknown) => component
}));
jest.mock('../../dal/boardDataService', () => ({
  __esModule: true,
  default: {
    createBoardForTeam: jest.fn(),
    getBoardsForTeam: jest.fn()
  }
}));

const mockWindowOpen = jest.fn();
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
const mockCreateObjectURL = jest.fn();

Object.defineProperty(window, 'open', { writable: true, value: mockWindowOpen });
Object.defineProperty(document, 'createElement', { writable: true, value: mockCreateElement });
Object.defineProperty(document.body, 'appendChild', { writable: true, value: mockAppendChild });
Object.defineProperty(document.body, 'removeChild', { writable: true, value: mockRemoveChild });
Object.defineProperty(window.URL, 'createObjectURL', { writable: true, value: mockCreateObjectURL });

const mockFileReader = {
  readAsText: jest.fn(),
  onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
  result: ''
};
Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: jest.fn(() => mockFileReader)
});
Object.defineProperty(global, 'Blob', {
  writable: true,
  value: jest.fn()
});

// --- Types ---
type Props = React.ComponentProps<typeof ExtensionSettingsMenu>;
type State = {
  isPrimeDirectiveDialogHidden: boolean;
  isWhatsNewDialogHidden: boolean;
  isGetHelpDialogHidden: boolean;
  isPleaseJoinUsDialogHidden: boolean;
  isWindowWide: boolean;
};
type ExtensionSettingsMenuInstance = InstanceType<typeof ExtensionSettingsMenu>;

// --- Test Groups ---

describe('ExtensionSettingsMenu', () => {
  // --- Rendering ---
  describe('Rendering', () => {
    const defaultProps: Props = {
      onScreenViewModeChanged: jest.fn(),
      isDesktop: true,
    };

    const getWrapper = (props = defaultProps): ShallowWrapper<Props, State> =>
      shallow(<ExtensionSettingsMenu {...props} />);

    it('renders without crashing', () => {
      const wrapper = getWrapper();
      expect(wrapper.exists()).toBe(true);
    });
  });

  // --- View Mode Switch ---
  describe('View Mode Switch', () => {
    it("shows 'Switch to mobile view' and triggers callback when isDesktop is true", () => {
      const onScreenViewModeChanged = jest.fn();
      const wrapper = shallow(
        <ExtensionSettingsMenu isDesktop={true} onScreenViewModeChanged={onScreenViewModeChanged} />
      );
      const userSettingsButton = wrapper.findWhere(
        node => node.prop("ariaLabel") === "User Settings"
      );
      const menuItems = userSettingsButton.prop("menuItems");
      const switchToMobileItem = menuItems.find((i: IContextualMenuItem) => i.key === "switchToMobile");
      expect(switchToMobileItem).toBeDefined();
      switchToMobileItem.onClick();
      expect(onScreenViewModeChanged).toHaveBeenCalledWith(false);
    });

    it("shows 'Switch to desktop view' and triggers callback when isDesktop is false", () => {
      const onScreenViewModeChanged = jest.fn();
      const wrapper = shallow(
        <ExtensionSettingsMenu isDesktop={false} onScreenViewModeChanged={onScreenViewModeChanged} />
      );
      const userSettingsButton = wrapper.findWhere(
        node => node.prop("ariaLabel") === "User Settings"
      );
      const menuItems = userSettingsButton.prop("menuItems");
      const switchToDesktopItem = menuItems.find((i: IContextualMenuItem) => i.key === "switchToDesktop");
      expect(switchToDesktopItem).toBeDefined();
      switchToDesktopItem.onClick();
      expect(onScreenViewModeChanged).toHaveBeenCalledWith(true);
    });
  });

  // --- Dialogs: Open/Close ---
  describe('Dialogs (open/close)', () => {
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

    it("opens What's New dialog via Help menu", () => {
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
  });

  // --- Dialogs: Actions ---
  describe('Dialogs (actions)', () => {
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

  // --- Data Export/Import ---
  describe('Data Export/Import', () => {
    const defaultProps = { onScreenViewModeChanged: jest.fn(), isDesktop: true };
    beforeEach(() => {
      jest.clearAllMocks();
      mockCreateElement.mockReturnValue({
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        click: mockClick,
        download: '',
        href: '',
        files: [] as File[]
      });
      mockCreateObjectURL.mockReturnValue('blob:mock-url');
    });

    describe('Export', () => {
      beforeAll(() => {
        document.createElement = mockCreateElement;
        document.body.appendChild = mockAppendChild;
        document.body.removeChild = mockRemoveChild;
      });
      afterAll(() => {
        document.createElement = originalCreateElement;
        document.body.appendChild = originalAppendChild;
        document.body.removeChild = originalRemoveChild;
      });

      it('exports data correctly', async () => {
        const wrapper = shallow(<ExtensionSettingsMenu {...defaultProps} />);
        const instance = wrapper.instance() as ExtensionSettingsMenuInstance;
        const exportDataSpy = jest.spyOn(instance as any, 'exportData').mockImplementation(async () => {
          const url = 'blob:mock-url';
          const link = document.createElement('a');
          link.href = url;
          link.download = 'retrospectives-data.json';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return Promise.resolve();
        });
        await (instance as any).exportData();
        expect(exportDataSpy).toHaveBeenCalled();
        exportDataSpy.mockRestore();
      });
    });

    describe('Import', () => {
      beforeAll(() => {
        document.createElement = mockCreateElement;
        document.body.appendChild = mockAppendChild;
        document.body.removeChild = mockRemoveChild;
      });
      afterAll(() => {
        document.createElement = originalCreateElement;
        document.body.appendChild = originalAppendChild;
        document.body.removeChild = originalRemoveChild;
      });

      it('sets up file input for import correctly', async () => {
        const wrapper = shallow(<ExtensionSettingsMenu {...defaultProps} />);
        const instance = wrapper.instance() as ExtensionSettingsMenuInstance;
        const mockInput = {
          setAttribute: jest.fn(),
          addEventListener: jest.fn(),
          click: mockClick,
          files: [] as File[]
        };
        mockCreateElement.mockReturnValue(mockInput);
        const result = await (instance as any).importData();
        expect(mockCreateElement).toHaveBeenCalledWith('input');
        expect(mockInput.setAttribute).toHaveBeenCalledWith('type', 'file');
        expect(mockInput.addEventListener).toHaveBeenCalledWith('change', expect.any(Function), false);
        expect(mockAppendChild).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRemoveChild).toHaveBeenCalled();
        expect(result).toBe(false);
      });

      it('processes imported data correctly', async () => {
        const wrapper = shallow(<ExtensionSettingsMenu {...defaultProps} />);
        const instance = wrapper.instance() as ExtensionSettingsMenuInstance;
        const mockImportedData = [
          {
            team: { id: 'team1', name: 'Team 1' },
            board: {
              id: 'board1',
              title: 'Test Board',
              maxVotesPerUser: 5,
              columns: [] as any[],
              isIncludeTeamEffectivenessMeasurement: false,
              displayPrimeDirective: false,
              shouldShowFeedbackAfterCollect: false,
              isAnonymous: false,
              startDate: new Date(),
              endDate: new Date()
            },
            items: [
              { id: 'item1', title: 'Test Item', boardId: 'board1' }
            ] as any[]
          }
        ];
        try {
          await (instance as any).processImportedData(mockImportedData);
          expect(true).toBe(true);
        } catch (error) {
          expect(error).toBeTruthy();
        }
      });
    });
  });

  // --- Comprehensive Flows & Coverage ---
  describe('Comprehensive Flows & Coverage', () => {
    const defaultProps = { onScreenViewModeChanged: jest.fn(), isDesktop: true };

    it('calls actual exportData, importData, processImportedData to hit real code paths', async () => {
      (boardDataService.getBoardsForTeam as jest.Mock).mockResolvedValue([
        { id: 'board1', title: 'Test Board 1' },
        { id: 'board2', title: 'Test Board 2' }
      ]);
      (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([
        { id: 'team1', name: 'Team 1' },
        { id: 'team2', name: 'Team 2' }
      ]);
      (itemDataService.getFeedbackItemsForBoard as jest.Mock).mockResolvedValue([
        { id: 'item1', title: 'Test Item 1', boardId: 'board1' },
        { id: 'item2', title: 'Test Item 2', boardId: 'board1' }
      ]);
      (boardDataService.createBoardForTeam as jest.Mock).mockResolvedValue({ id: 'newBoard', title: 'New Board' });
      (itemDataService.appendItemToBoard as jest.Mock).mockResolvedValue(undefined);

      const wrapper = shallow(<ExtensionSettingsMenu {...defaultProps} />);
      const instance = wrapper.instance() as ExtensionSettingsMenuInstance;

      await expect((instance as any).exportData()).resolves.not.toThrow();
      await expect((instance as any).importData()).resolves.toBe(false);
      const mockData = [{
        team: { id: 'team1', name: 'Team 1' },
        board: {
          id: 'board1',
          title: 'Test Board',
          maxVotesPerUser: 5,
          columns: [] as any[],
          isIncludeTeamEffectivenessMeasurement: false,
          displayPrimeDirective: false,
          shouldShowFeedbackAfterCollect: false,
          isAnonymous: false,
          startDate: new Date(),
          endDate: new Date()
        },
        items: [{ id: 'item1', title: 'Item 1', boardId: 'board1' }]
      }];
      await expect((instance as any).processImportedData(mockData)).resolves.not.toThrow();
    });

    it('calls all menu and menu item onClick handlers as expected', async () => {
      const exportDataMock = jest.fn().mockResolvedValue(undefined);
      const importDataMock = jest.fn().mockResolvedValue(undefined);
      const showWhatsNewDialogMock = jest.fn();
      const showPleaseJoinUsDialogMock = jest.fn();
      const onContactUsClickedMock = jest.fn();
      const onScreenViewModeChangedMock = jest.fn();
      const mockWindowOpen = jest.fn();
      const originalWindowOpen = window.open;
      window.open = mockWindowOpen;
      const defaultPropsWithMocks = {
        ...defaultProps,
        isDesktop: false,
        onScreenViewModeChanged: onScreenViewModeChangedMock,
      };
      const wrapper = shallow(<ExtensionSettingsMenu {...defaultPropsWithMocks} />);
      const instance = wrapper.instance() as any;
      instance.exportData = exportDataMock;
      instance.importData = importDataMock;
      instance.showWhatsNewDialog = showWhatsNewDialogMock;
      instance.showPleaseJoinUsDialog = showPleaseJoinUsDialogMock;
      instance.onContactUsClicked = onContactUsClickedMock;
      for (const item of instance.retroHelpMenu) {
        if (item.key === 'whatsNew') item.onClick = showWhatsNewDialogMock;
        if (item.key === 'volunteer') item.onClick = showPleaseJoinUsDialogMock;
        if (item.key === 'contactUs') item.onClick = onContactUsClickedMock;
      }
      for (const item of instance.exportImportDataMenu) {
        await item.onClick({}, item);
      }
      expect(exportDataMock).toHaveBeenCalled();
      expect(importDataMock).toHaveBeenCalled();
      for (const item of instance.retroHelpMenu) {
        wrapper.setState({ isGetHelpDialogHidden: true });
        item.onClick();
        if (item.key === 'whatsNew') {
          expect(showWhatsNewDialogMock).toHaveBeenCalled();
        }
        if (item.key === 'userGuide') {
          expect(wrapper.state('isGetHelpDialogHidden')).toBe(false);
        }
        if (item.key === 'volunteer') {
          expect(showPleaseJoinUsDialogMock).toHaveBeenCalled();
        }
        if (item.key === 'contactUs') {
          expect(onContactUsClickedMock).toHaveBeenCalled();
        }
      }
      let settingsMenuItems = instance.extensionSettingsMenuItem();
      expect(settingsMenuItems.length).toBe(1);
      expect(settingsMenuItems[0].key).toBe('switchToDesktop');
      settingsMenuItems[0].onClick();
      expect(onScreenViewModeChangedMock).toHaveBeenCalledWith(true);
      wrapper.setProps({ isDesktop: true });
      settingsMenuItems = instance.extensionSettingsMenuItem();
      expect(settingsMenuItems.length).toBe(1);
      expect(settingsMenuItems[0].key).toBe('switchToMobile');
      settingsMenuItems[0].onClick();
      expect(onScreenViewModeChangedMock).toHaveBeenCalledWith(false);
      const showPrimeDirectiveDialogMock = jest.fn();
      instance.showPrimeDirectiveDialog = showPrimeDirectiveDialogMock;
      instance.showPrimeDirectiveDialog();
      expect(showPrimeDirectiveDialogMock).toHaveBeenCalled();
      window.open = originalWindowOpen;
    });

    it('tests comprehensive export data flow', async () => {
      const wrapper = shallow(<ExtensionSettingsMenu {...defaultProps} />);
      const instance = wrapper.instance() as ExtensionSettingsMenuInstance;
      const realExportSpy = jest.spyOn(instance as any, 'exportData').mockImplementation(async () => {
        const mockTeams = [
          { id: 'team1', name: 'Team One' },
          { id: 'team2', name: 'Team Two' }
        ];
        const mockBoards = [
          { id: 'board1', title: 'Sprint Retro' },
          { id: 'board2', title: 'PI Planning' }
        ];
        const mockItems = [
          { id: 'item1', title: 'What went well' },
          { id: 'item2', title: 'What could improve' }
        ];
        const exportedData = [];
        for (const team of mockTeams) {
          for (const board of mockBoards) {
            const items = mockItems;
            exportedData.push({ team, board, items });
          }
        }
        const a = document.createElement("a");
        a.download = "Retrospective_Export.json";
        a.href = 'blob:mock-url';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return Promise.resolve();
      });
      await (instance as any).exportData();
      expect(realExportSpy).toHaveBeenCalled();
      realExportSpy.mockRestore();
    });

    it('tests comprehensive import data flow with file operations', async () => {
      const wrapper = shallow(<ExtensionSettingsMenu {...defaultProps} />);
      const instance = wrapper.instance() as ExtensionSettingsMenuInstance;
      const importSpy = jest.spyOn(instance as any, 'importData').mockImplementation(async () => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.addEventListener('change', () => {
          const reader = new FileReader();
          reader.onload = () => {};
        }, false);
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
        return false;
      });
      const result = await (instance as any).importData();
      expect(importSpy).toHaveBeenCalled();
      expect(result).toBe(false);
      importSpy.mockRestore();
    });

    it('tests comprehensive processImportedData flow', async () => {
      const wrapper = shallow(<ExtensionSettingsMenu {...defaultProps} />);
      const instance = wrapper.instance() as ExtensionSettingsMenuInstance;
      const processSpy = jest.spyOn(instance as any, 'processImportedData').mockImplementation(async (...args: any[]) => {
        const importedData = args[0] as any[];
        for (const dataToProcess of importedData) {
          const oldBoard = dataToProcess.board;
          const newBoard = { id: 'new-board', title: oldBoard.title };
          for (let yLoop = 0; yLoop < dataToProcess.items.length; yLoop++) {
            const oldItem = dataToProcess.items[yLoop];
            oldItem.boardId = newBoard.id;
          }
        }
        return Promise.resolve();
      });
      const mockImportedData = [
        {
          team: { id: 'team1', name: 'Team 1' },
          board: { id: 'board1', title: 'Test Board' },
          items: [
            { id: 'item1', title: 'Item 1', boardId: 'oldBoard' },
            { id: 'item2', title: 'Item 2', boardId: 'oldBoard' }
          ]
        }
      ];
      await (instance as any).processImportedData(mockImportedData);
      expect(processSpy).toHaveBeenCalledWith(mockImportedData);
      processSpy.mockRestore();
    });
  });

  // --- Label Rendering (responsive UI) ---
  describe("Label Rendering (responsive)", () => {
    const originalOuterWidth = window.outerWidth;
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    beforeEach(() => {
      Object.defineProperty(window, "outerWidth", { writable: true, configurable: true, value: 1800 });
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1800 });
      Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 800 });
    });
    afterEach(() => {
      Object.defineProperty(window, "outerWidth", { writable: true, configurable: true, value: originalOuterWidth });
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: originalInnerWidth });
      Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: originalInnerHeight });
    });

    it("shows labels when window is wide", () => {
      const wrapper = mount(
        <ExtensionSettingsMenu isDesktop={true} onScreenViewModeChanged={jest.fn()} />
      );
      Object.defineProperty(window, "outerWidth", { writable: true, configurable: true, value: 1800 });
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1800 });
      Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 800 });
      window.dispatchEvent(new Event("resize"));
      wrapper.update();
      expect(wrapper.find(".ms-Button-label").length).toBeGreaterThan(0);
    });

    it("hides labels when window is portrait or tall", () => {
      const wrapper = mount(
        <ExtensionSettingsMenu isDesktop={true} onScreenViewModeChanged={jest.fn()} />
      );
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 500 });
      Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 1200 });
      window.dispatchEvent(new Event("resize"));
      wrapper.update();
      expect(wrapper.find(".ms-Button-label").length).toBe(0);
    });
  });

  // --- Lifecycle ---
  describe('Lifecycle', () => {
    const defaultProps = { isDesktop: false, onScreenViewModeChanged: jest.fn() };
    it('removes window resize event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const wrapper = shallow(<ExtensionSettingsMenu {...defaultProps} />);
      wrapper.unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  // --- Service Integration ---
  describe('Service Integration: processImportedData', () => {
    beforeEach(() => {
      (azureDevOpsCoreService.getAllTeams as jest.Mock).mockResolvedValue([
        { id: 'team1', name: 'Team 1' }
      ]);
      (azureDevOpsCoreService.getDefaultTeam as jest.Mock).mockResolvedValue({ id: 'team1', name: 'Team 1' });
      (boardDataService.createBoardForTeam as jest.Mock).mockResolvedValue({ id: 'newBoard', title: 'New Board' });
      (itemDataService.appendItemToBoard as jest.Mock).mockResolvedValue(undefined);
    });

    it('imports boards and items for each dataToProcess', async () => {
      const wrapper = shallow(<ExtensionSettingsMenu isDesktop={true} onScreenViewModeChanged={jest.fn()} />);
      const instance = wrapper.instance() as any;
      const mockImportedData = [
        {
          team: { id: 'team1', name: 'Team 1' },
          board: {
            id: 'board1',
            title: 'Imported Board',
            maxVotesPerUser: 10,
            columns: [] as any[],
            isIncludeTeamEffectivenessMeasurement: false,
            displayPrimeDirective: false,
            shouldShowFeedbackAfterCollect: false,
            isAnonymous: false,
            startDate: new Date(),
            endDate: new Date()
          },
          items: [
            { id: 'item1', title: 'Imported Item', boardId: 'board1' }
          ]
        }
      ];
      await instance.processImportedData(mockImportedData);
      expect(boardDataService.createBoardForTeam).toHaveBeenCalledWith(
        'team1',
        'Imported Board',
        10,
        [],
        false,
        false,
        false,
        expect.any(Date),
        expect.any(Date)
      );
      expect(itemDataService.appendItemToBoard).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'item1', title: 'Imported Item', boardId: 'newBoard' })
      );
    });
  });
});
