import { randomUUID, subtle as nodeSubtle } from "crypto"
import { TextEncoder, TextDecoder } from 'util';

import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { mockCore } from '../__mocks__/azure-devops-extension-api/Core/Core';
import { mockCommon } from '../__mocks__/azure-devops-extension-api/Common/Common';
import { mockUuid } from '../__mocks__/uuid/v4';
import { MockSDK } from '../__mocks__/azure-devops-extension-sdk/sdk';

Enzyme.configure({ adapter: new Adapter() });

window.crypto = {
  randomUUID: () => randomUUID() as `${string}-${string}-${string}-${string}-${string}`,
  subtle: {
    generateKey: nodeSubtle.generateKey.bind(nodeSubtle),
    encrypt: nodeSubtle.encrypt.bind(nodeSubtle),
    decrypt: nodeSubtle.decrypt.bind(nodeSubtle),
    importKey: nodeSubtle.importKey.bind(nodeSubtle),
    exportKey: nodeSubtle.exportKey.bind(nodeSubtle),
  } as SubtleCrypto,
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
} as Crypto;

(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

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

jest.mock('uuid', () => { return mockUuid });
