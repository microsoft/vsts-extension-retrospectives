import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { mockCore } from '../__mocks__/azure-devops-extension-api/Core/Core';
import { mockCommon } from '../__mocks__/azure-devops-extension-api/Common/Common';
import { MockSDK } from '../__mocks__/azure-devops-extension-sdk/sdk';

Enzyme.configure({ adapter: new Adapter() });

window.matchMedia = jest.fn().mockImplementation(query => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
});
jest.mock('azure-devops-extension-sdk', () => { return MockSDK; });
jest.mock('azure-devops-extension-api/Core', () => { return mockCore; });
jest.mock('azure-devops-extension-api/Core/CoreClient', () => { return mockCore; });
jest.mock('azure-devops-extension-api/WebApi', () => { });
jest.mock('azure-devops-extension-api/WorkItemTracking', () => { });
jest.mock('azure-devops-extension-api/WorkItemTracking/WorkItemTracking', () => { });
jest.mock('azure-devops-extension-api/WorkItemTracking/WorkItemTrackingClient', () => {
  const mockWorkItemTrackingClient = {
    WorkItemTrackingRestClient: {},
  };

  return mockWorkItemTrackingClient;
});

jest.mock('azure-devops-extension-api/Common', () => {
  return mockCommon;
});