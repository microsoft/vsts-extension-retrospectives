const CommonServiceIds = {
  ExtensionDataService: "ms.vss-features.extension-data-service",
  GlobalMessagesService: "ms.vss-tfs-web.tfs-global-messages-service",
  HostNavigationService: "ms.vss-features.host-navigation-service",
  HostPageLayoutService: "ms.vss-features.host-page-layout-service",
  LocationService: "ms.vss-features.location-service",
  ProjectPageService: "ms.vss-tfs-web.tfs-page-data-service"
};

const mockExtensionDataService = {
  getExtensionDataManager: () => {},
};

const mockLocationService = {
  getResourceAreaLocation: () => {return 'https://hosturl'},
};

const mockProjectPageService = {
  getProject: () => {
    return {
    id: "id",
    name: "name",
    };
  },
};

const mockUser = {id: "userId", };
const mockExtensionContext = { id: "contextId", };
const getServiceMock = (id:string) => {
  if (id == CommonServiceIds.LocationService)
    return mockLocationService;
  else if (id == CommonServiceIds.ProjectPageService)
    return mockProjectPageService;
  else
    return mockExtensionDataService;
};

const mockSdk = {
  getService: getServiceMock,
  getUser: () => { return mockUser },
  getExtensionContext: () => { return mockExtensionContext },
  getAccessToken: () => { return 'token' },
};

export const MockSDK = mockSdk;