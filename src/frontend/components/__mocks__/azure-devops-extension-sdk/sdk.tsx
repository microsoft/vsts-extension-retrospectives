const CommonServiceIds = {
  ExtensionDataService: "ms.vss-features.extension-data-service",
  GlobalMessagesService: "ms.vss-tfs-web.tfs-global-messages-service",
  HostNavigationService: "ms.vss-features.host-navigation-service",
  HostPageLayoutService: "ms.vss-features.host-page-layout-service",
  LocationService: "ms.vss-features.location-service",
  ProjectPageService: "ms.vss-tfs-web.tfs-page-data-service",
};

const mockExtensionDataManager = {
  getDocuments: () => {},
  getDocument: () => {},
};

const mockExtensionDataService = {
  getExtensionDataManager: () => mockExtensionDataManager,
};

const mockLocationService = {
  getResourceAreaLocation: () => {
    return "https://hosturl";
  },
};

const mockProjectPageService = {
  getProject: () => {
    return {
      id: "id",
      name: "name",
    };
  },
};

const mockUser = { id: "01234567-8910-1112-1314-151617181920" };
let mockExtensionContext = { id: "ms-devlabs.team-retrospectives", publisherId: "ms-devlabs", extensionId: "team-retrospectives" };
let mockConfiguration = { team: { id: "team-id", name: "Team" } };
let mockContributionId = "ms-devlabs.team-retrospectives.home";

const getServiceMock = (id: string) => {
  if (id == CommonServiceIds.LocationService) return mockLocationService;
  else if (id == CommonServiceIds.ProjectPageService) return mockProjectPageService;
  else return mockExtensionDataService;
};

const mockSdk = {
  init: () => Promise.resolve(),
  ready: () => Promise.resolve(),
  getService: getServiceMock,
  getConfiguration: () => mockConfiguration,
  getContributionId: () => mockContributionId,
  getUser: () => {
    return mockUser;
  },
  getExtensionContext: () => {
    return mockExtensionContext;
  },
  getAccessToken: () => {
    return "token";
  },
  register: (): void => undefined,
  unregister: (): void => undefined,
  resize: (): void => undefined,
  notifyLoadSucceeded: (): Promise<void> => Promise.resolve(),
};

export const MockSDK = mockSdk;
export const MockSDKControls = {
  setConfiguration: (configuration: typeof mockConfiguration) => {
    mockConfiguration = configuration;
  },
  setContributionId: (contributionId: string) => {
    mockContributionId = contributionId;
  },
  setExtensionContext: (extensionContext: typeof mockExtensionContext) => {
    mockExtensionContext = extensionContext;
  },
  reset: () => {
    mockExtensionContext = { id: "ms-devlabs.team-retrospectives", publisherId: "ms-devlabs", extensionId: "team-retrospectives" };
    mockConfiguration = { team: { id: "team-id", name: "Team" } };
    mockContributionId = "ms-devlabs.team-retrospectives.home";
  },
};
