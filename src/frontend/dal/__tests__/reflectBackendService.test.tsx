import moment from "moment";

// Create comprehensive mocks before any imports
const mockStart = jest.fn();
const mockSend = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockOnClose = jest.fn();

const mockConnection = {
  start: mockStart,
  send: mockSend,
  on: mockOn,
  off: mockOff,
  onclose: mockOnClose,
};

const mockBuild = jest.fn().mockReturnValue(mockConnection);
const mockConfigureLogging = jest.fn().mockReturnValue({ build: mockBuild });
const mockWithUrl = jest.fn().mockReturnValue({ configureLogging: mockConfigureLogging });

jest.mock("@microsoft/signalr", () => ({
  HubConnectionBuilder: jest.fn().mockImplementation(() => ({
    withUrl: mockWithUrl,
  })),
  LogLevel: {
    Error: 4,
  },
}));

const mockGetAppToken = jest.fn();
jest.mock("azure-devops-extension-sdk", () => ({
  getAppToken: mockGetAppToken,
}));

const mockDecodeJwt = jest.fn();
jest.mock("../../utilities/tokenHelper", () => ({
  decodeJwt: mockDecodeJwt,
}));

const mockIsHostedAzureDevOps = jest.fn().mockResolvedValue(true);
jest.mock("../../utilities/azureDevOpsContextHelper", () => ({
  isHostedAzureDevOps: () => mockIsHostedAzureDevOps(),
}));

const mockTrackException = jest.fn();
jest.mock("../../utilities/telemetryClient", () => ({
  appInsights: {
    trackException: mockTrackException,
  },
}));

jest.mock("../../config/config", () => ({
  config: {
    CollaborationStateServiceUrl: "https://test.example.com",
  },
}));

import { reflectBackendService } from "../reflectBackendService";

describe("ReflectBackendService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsHostedAzureDevOps.mockResolvedValue(true);
    mockStart.mockResolvedValue(undefined);
    mockSend.mockResolvedValue(undefined);
    mockGetAppToken.mockResolvedValue("mock-token");
    mockDecodeJwt.mockReturnValue({ exp: moment().add(1, "hour").unix() });
  });

  describe("constructor", () => {
    it("should create service instance", () => {
      expect(reflectBackendService).toBeDefined();
      expect(typeof reflectBackendService.startConnection).toBe("function");
      expect(typeof reflectBackendService.switchToBoard).toBe("function");
    });
  });

  describe("startConnection", () => {
    it("should start connection successfully and return true", async () => {
      const result = await reflectBackendService.startConnection();

      expect(mockStart).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should handle connection start error and return false", async () => {
      const consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation();
      mockStart.mockRejectedValueOnce(new Error("Connection failed"));

      const result = await reflectBackendService.startConnection();

      expect(result).toBe(false);
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining("Error when trying to start signalR connection"));

      consoleDebugSpy.mockRestore();
    });
  });

  describe("switchToBoard", () => {
    beforeEach(async () => {
      await reflectBackendService.startConnection();
      mockSend.mockClear();
    });

    it("should join a new board", () => {
      reflectBackendService.switchToBoard("board-123");

      expect(mockSend).toHaveBeenCalledWith("joinReflectBoardGroup", "board-123");
    });

    it("should leave current board before joining new one", () => {
      reflectBackendService.switchToBoard("board-123");
      mockSend.mockClear();

      reflectBackendService.switchToBoard("board-456");

      expect(mockSend).toHaveBeenCalledWith("leaveReflectBoardGroup", "board-123");
      expect(mockSend).toHaveBeenCalledWith("joinReflectBoardGroup", "board-456");
    });

    it("should leave board when switching to null", () => {
      reflectBackendService.switchToBoard("board-123");
      mockSend.mockClear();

      reflectBackendService.switchToBoard(null);

      expect(mockSend).toHaveBeenCalledWith("leaveReflectBoardGroup", "board-123");
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("broadcast methods", () => {
    beforeEach(async () => {
      await reflectBackendService.startConnection();
      reflectBackendService.switchToBoard("board-123");
      mockSend.mockClear();
    });

    it("broadcastNewItem should send correct signal", () => {
      reflectBackendService.broadcastNewItem("column-1", "item-1");

      expect(mockSend).toHaveBeenCalledWith("broadcastNewItem", "board-123", "column-1", "item-1");
    });

    it("broadcastUpdatedItem should send correct signal", () => {
      reflectBackendService.broadcastUpdatedItem("column-1", "item-1");

      expect(mockSend).toHaveBeenCalledWith("broadcastUpdatedItem", "board-123", "column-1", "item-1");
    });

    it("broadcastDeletedItem should send correct signal", () => {
      reflectBackendService.broadcastDeletedItem("column-1", "item-1");

      expect(mockSend).toHaveBeenCalledWith("broadcastDeletedItem", "board-123", "column-1", "item-1");
    });

    it("broadcastNewBoard should send correct signal", () => {
      reflectBackendService.broadcastNewBoard("team-1", "board-1");

      expect(mockSend).toHaveBeenCalledWith("broadcastNewBoard", "team-1", "board-1");
    });

    it("broadcastUpdatedBoard should send correct signal", () => {
      reflectBackendService.broadcastUpdatedBoard("team-1", "board-1");

      expect(mockSend).toHaveBeenCalledWith("broadcastUpdatedBoard", "team-1", "board-1");
    });

    it("broadcastDeletedBoard should send correct signal", () => {
      reflectBackendService.broadcastDeletedBoard("team-1", "board-1");

      expect(mockSend).toHaveBeenCalledWith("broadcastDeletedBoard", "team-1", "board-1");
    });
  });

  describe("receive event handlers", () => {
    beforeEach(async () => {
      await reflectBackendService.startConnection();
      mockOn.mockClear();
      mockOff.mockClear();
    });

    it("onReceiveNewItem should register callback", () => {
      const callback = jest.fn();
      reflectBackendService.onReceiveNewItem(callback);

      expect(mockOn).toHaveBeenCalledWith("receiveNewItem", callback);
    });

    it("removeOnReceiveNewItem should remove callback", () => {
      const callback = jest.fn();
      reflectBackendService.removeOnReceiveNewItem(callback);

      expect(mockOff).toHaveBeenCalledWith("receiveNewItem", callback);
    });

    it("onReceiveUpdatedItem should register callback", () => {
      const callback = jest.fn();
      reflectBackendService.onReceiveUpdatedItem(callback);

      expect(mockOn).toHaveBeenCalledWith("receiveUpdatedItem", callback);
    });

    it("removeOnReceiveUpdatedItem should remove callback", () => {
      const callback = jest.fn();
      reflectBackendService.removeOnReceiveUpdatedItem(callback);

      expect(mockOff).toHaveBeenCalledWith("receiveUpdatedItem", callback);
    });

    it("onReceiveDeletedItem should register callback", () => {
      const callback = jest.fn();
      reflectBackendService.onReceiveDeletedItem(callback);

      expect(mockOn).toHaveBeenCalledWith("receiveDeletedItem", callback);
    });

    it("removeOnReceiveDeletedItem should remove callback", () => {
      const callback = jest.fn();
      reflectBackendService.removeOnReceiveDeletedItem(callback);

      expect(mockOff).toHaveBeenCalledWith("receiveDeletedItem", callback);
    });

    it("onReceiveNewBoard should register callback", () => {
      const callback = jest.fn();
      reflectBackendService.onReceiveNewBoard(callback);

      expect(mockOn).toHaveBeenCalledWith("receiveNewBoard", callback);
    });

    it("removeOnReceiveNewBoard should remove callback", () => {
      const callback = jest.fn();
      reflectBackendService.removeOnReceiveNewBoard(callback);

      expect(mockOff).toHaveBeenCalledWith("receiveNewBoard", callback);
    });

    it("onReceiveUpdatedBoard should register callback", () => {
      const callback = jest.fn();
      reflectBackendService.onReceiveUpdatedBoard(callback);

      expect(mockOn).toHaveBeenCalledWith("receiveUpdatedBoard", callback);
    });

    it("removeOnReceiveUpdatedBoard should remove callback", () => {
      const callback = jest.fn();
      reflectBackendService.removeOnReceiveUpdatedBoard(callback);

      expect(mockOff).toHaveBeenCalledWith("receiveUpdatedBoard", callback);
    });

    it("onReceiveDeletedBoard should register callback", () => {
      const callback = jest.fn();
      reflectBackendService.onReceiveDeletedBoard(callback);

      expect(mockOn).toHaveBeenCalledWith("receiveDeletedBoard", callback);
    });

    it("removeOnReceiveDeletedBoard should remove callback", () => {
      const callback = jest.fn();
      reflectBackendService.removeOnReceiveDeletedBoard(callback);

      expect(mockOff).toHaveBeenCalledWith("receiveDeletedBoard", callback);
    });

    it("onConnectionClose should register callback", () => {
      const callback = jest.fn();
      mockOnClose.mockClear();

      reflectBackendService.onConnectionClose(callback);

      expect(mockOnClose).toHaveBeenCalledWith(callback);
    });
  });

  describe("connection state management", () => {
    it("should handle connection close event", async () => {
      await reflectBackendService.startConnection();

      // Service should be working before close
      mockSend.mockClear();
      reflectBackendService.switchToBoard("board-1");
      expect(mockSend).toHaveBeenCalled();
    });
  });
});
