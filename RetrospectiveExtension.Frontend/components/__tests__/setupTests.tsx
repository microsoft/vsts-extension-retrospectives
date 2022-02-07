import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { mockEnv } from '../__mocks__/config/environment';
import { mockCore } from '../__mocks__/azure-devops-extension-api/Core/Core';
import { mockCommon } from '../__mocks__/azure-devops-extension-api/Common/Common';
import { MockSDK } from '../__mocks__/azure-devops-extension-sdk/sdk';

Enzyme.configure({ adapter: new Adapter() });

jest.mock('../../config/environment', () => { return mockEnv; });
jest.mock('azure-devops-extension-sdk', () => { return MockSDK; });
jest.mock('azure-devops-extension-api/Core', () => { return mockCore; });

jest.mock('azure-devops-extension-api/Core/CoreClient', () => {});
jest.mock('azure-devops-extension-api/WebApi', () => {});
jest.mock('azure-devops-extension-api/WorkItemTracking', () => {});
jest.mock('azure-devops-extension-api/WorkItemTracking/WorkItemTracking', () => {});
jest.mock('azure-devops-extension-api/WorkItemTracking/WorkItemTrackingClient', () => {
  const mockWorkItemTrackingClient = {
    WorkItemTrackingRestClient: {},
  };

  return mockWorkItemTrackingClient;
});

jest.mock('azure-devops-extension-api/Common', () => {
  return mockCommon;
});