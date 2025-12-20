import { randomUUID } from "crypto";

import { mockCore } from "../__mocks__/azure-devops-extension-api/Core/Core";
import { mockCommon } from "../__mocks__/azure-devops-extension-api/Common/Common";
import { mockUuid } from "../__mocks__/uuid/v4";
import { MockSDK } from "../__mocks__/azure-devops-extension-sdk/sdk";

// Ensure global/window is available in jsdom environment
const globalAny = global as typeof globalThis & { crypto: Crypto; matchMedia: jest.Mock };

globalAny.crypto = {
  randomUUID: () => randomUUID() as `${string}-${string}-${string}-${string}-${string}`,
} as Crypto;

globalAny.matchMedia = jest.fn().mockImplementation(query => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
});
jest.mock("azure-devops-extension-sdk", () => {
  return MockSDK;
});
jest.mock("azure-devops-extension-api/Core", () => {
  return mockCore;
});
jest.mock("azure-devops-extension-api/Core/CoreClient", () => {
  return mockCore;
});
jest.mock("azure-devops-extension-api/WebApi", () => {});
jest.mock("azure-devops-extension-api/WorkItemTracking", () => {});
jest.mock("azure-devops-extension-api/WorkItemTracking/WorkItemTracking", () => {});
jest.mock("azure-devops-extension-api/WorkItemTracking/WorkItemTrackingClient", () => {
  const mockWorkItemTrackingClient = {
    WorkItemTrackingRestClient: {},
  };

  return mockWorkItemTrackingClient;
});

jest.mock("azure-devops-extension-api/Common", () => {
  return mockCommon;
});

jest.mock("uuid", () => {
  return mockUuid;
});

// jsdom does not implement the native <dialog> API (show/showModal/close).
// Our components use it directly, so tests need a minimal polyfill.
// This is test-only and does not affect production behavior.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dialogProto: any = (globalThis as any).HTMLDialogElement?.prototype;
if (dialogProto) {
  if (typeof dialogProto.show !== "function") {
    dialogProto.show = function () {
      this.setAttribute("open", "");
    };
  }

  if (typeof dialogProto.showModal !== "function") {
    dialogProto.showModal = function () {
      this.setAttribute("open", "");
    };
  }

  if (typeof dialogProto.close !== "function") {
    dialogProto.close = function (returnValue?: string) {
      // In browsers, calling close() on an already-closed dialog is a no-op (or throws).
      // We treat it as a no-op to avoid recursion with onClose handlers that also call close().
      if (!this.hasAttribute("open")) {
        return;
      }
      if (returnValue !== undefined) {
        this.returnValue = returnValue;
      }
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
}
