import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { getAppToken } from "azure-devops-extension-sdk";

import { config } from "../config/config";
import { decodeJwt } from "../utilities/tokenHelper";
import { appInsights } from "../utilities/telemetryClient";
import { IExceptionTelemetry } from "@microsoft/applicationinsights-web";

const enum ReflectBackendSignals {
  JoinReflectBoardGroup = "joinReflectBoardGroup",
  LeaveReflectBoardGroup = "leaveReflectBoardGroup",
  ReceiveNewItem = "receiveNewItem",
  ReceiveUpdatedItem = "receiveUpdatedItem",
  ReceiveUpdatedBoard = "receiveUpdatedBoard",
  ReceiveDeletedItem = "receiveDeletedItem",
  ReceiveDeletedBoard = "receiveDeletedBoard",
  ReceiveNewBoard = "receiveNewBoard",
  BroadcastNewItem = "broadcastNewItem",
  BroadcastUpdatedItem = "broadcastUpdatedItem",
  BroadcastUpdatedBoard = "broadcastUpdatedBoard",
  BroadcastDeletedItem = "broadcastDeletedItem",
  BroadcastDeletedBoard = "broadcastDeletedBoard",
  BroadcastNewBoard = "broadcastNewBoard",
}

class ReflectBackendService {
  private static signalRHubUrl = new URL("/collaborationUpdates", config.CollaborationStateServiceUrl);

  private _currentBoardId: string;
  private _signalRConnection: HubConnection;
  private _appToken: string;
  private _tokenExpiry: Date;
  private _connectionAvailable: boolean;
  private _connectionCloseCallbacks = new Set<(error?: Error) => void>();
  private _connectionReconnectingCallbacks = new Set<(error?: Error) => void>();
  private _connectionReconnectedCallbacks = new Set<(connectionId?: string) => void>();

  constructor() {
    this._signalRConnection = new HubConnectionBuilder()
      .withUrl(ReflectBackendService.signalRHubUrl.href, { accessTokenFactory: this.retrieveValidToken })
      .withKeepAliveInterval(10000)
      .withServerTimeout(20000)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Error)
      .build();
    this._connectionAvailable = false;

    this._signalRConnection.onclose((error?: Error) => {
      this._connectionAvailable = false;
      this._connectionCloseCallbacks.forEach(callback => callback(error));
    });

    this._signalRConnection.onreconnecting((error?: Error) => {
      this._connectionAvailable = false;
      this._connectionReconnectingCallbacks.forEach(callback => callback(error));
    });

    this._signalRConnection.onreconnected((connectionId?: string) => {
      this._connectionAvailable = true;
      if (this._currentBoardId) {
        this.joinBoardGroup(this._currentBoardId);
      }
      this._connectionReconnectedCallbacks.forEach(callback => callback(connectionId));
    });
  }

  private isConnected = () => this._signalRConnection && this._signalRConnection.state === HubConnectionState.Connected;

  /**
   * Starts the connection to the signalR hub.
   */
  public startConnection = async () => {
    if (!this._signalRConnection) {
      return false;
    }

    if (this.isConnected()) {
      this._connectionAvailable = true;
      return true;
    }

    if (this._signalRConnection.state === HubConnectionState.Connecting || this._signalRConnection.state === HubConnectionState.Reconnecting) {
      return this._connectionAvailable;
    }

    try {
      await this._signalRConnection.start();
      this._connectionAvailable = true;
      if (this._currentBoardId) {
        this.joinBoardGroup(this._currentBoardId);
      }
    } catch (error) {
      console.debug(`Error when trying to start signalR connection: ${error}. Unable to establish signalR connection, live syncing will be affected.`);
      this._connectionAvailable = false;
      appInsights.trackException(error, {
        action: "startSignalRConnection",
      });
    }

    return this._connectionAvailable;
  };

  public retryConnection = async () => {
    if (!this._signalRConnection) {
      return false;
    }

    if (this.isConnected()) {
      this._connectionAvailable = true;
      return true;
    }

    if (this._signalRConnection.state === HubConnectionState.Connecting || this._signalRConnection.state === HubConnectionState.Reconnecting) {
      return this._connectionAvailable;
    }

    try {
      await this._signalRConnection.stop();
    } catch {
      this._connectionAvailable = false;
    }

    return this.startConnection();
  };

  private retrieveValidToken = () => {
    if (this._tokenExpiry && new Date() < this._tokenExpiry) {
      return this._appToken;
    }

    return Promise.resolve(
      getAppToken().then(appToken => {
        this._appToken = appToken;

        const tokenData = decodeJwt(this._appToken);
        if (tokenData) {
          this._tokenExpiry = new Date(tokenData.exp * 1000);
          return this._appToken;
        }

        const e: IExceptionTelemetry = {
          exception: new Error("VSTS returned a malformed appToken value!"),
          id: "MalformedAppToken",
        };

        appInsights.trackException(e);

        throw e.exception;
      }),
    );
  };

  private joinBoardGroup = (boardId: string) => {
    if (!this.isConnected()) {
      return;
    }

    this._signalRConnection.send(ReflectBackendSignals.JoinReflectBoardGroup, boardId);
  };

  private removeSignalCallback = (signal: string, callback: (columnId: string, feedbackItemId: string) => void) => {
    this._signalRConnection.off(signal, callback);
  };

  /**
   * Removes the connection from the current board group
   * and, if newBoardId isn't falsy, adds it to the new
   * board group for the specified board id.
   * @param newBoardId The id of the board to join.
   */
  public switchToBoard = (newBoardId: string) => {
    if (this._currentBoardId !== undefined && this._currentBoardId !== null && this.isConnected()) {
      this._signalRConnection.send(ReflectBackendSignals.LeaveReflectBoardGroup, this._currentBoardId);
    }

    if (newBoardId && this.isConnected()) {
      this.joinBoardGroup(newBoardId);
    }
    this._currentBoardId = newBoardId;
  };

  /**
   * Sends a BroadcastNewItem signal for other instances.
   * @param columnId The column id that the feedback item is a part of.
   * @param feedbackItemId The id of the new feedback item.
   */
  public broadcastNewItem = (columnId: string, feedbackItemId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(ReflectBackendSignals.BroadcastNewItem, this._currentBoardId, columnId, feedbackItemId);
  };

  /**
   * Sends a BroadcastNewBoard signal for other instances.
   * @param teamId The id of the parent team.
   * @param boardId The id of the board.
   */
  public broadcastNewBoard = (teamId: string, boardId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(ReflectBackendSignals.BroadcastNewBoard, teamId, boardId);
  };

  /**
   * Sends a BroadcastUpdatedBoard signal for other instances.
   * @param teamId The id of the parent team.
   * @param boardId The id of the board.
   */
  public broadcastUpdatedBoard = (teamId: string, boardId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(ReflectBackendSignals.BroadcastUpdatedBoard, teamId, boardId);
  };

  /**
   * Sends a BroadcastDeletedBoard signal for other instances.
   * @param teamId The id of the parent team.
   * @param boardId The id of the board.
   */
  public broadcastDeletedBoard = (teamId: string, boardId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(ReflectBackendSignals.BroadcastDeletedBoard, teamId, boardId);
  };

  /**
   * Sends a BroadcastUpdatedItem signal for other instances.
   * @param columnId The column id that the feedback item is a part of.
   * @param feedbackItemId The id of the feedback item to update.
   */
  public broadcastUpdatedItem = (columnId: string, feedbackItemId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(ReflectBackendSignals.BroadcastUpdatedItem, this._currentBoardId, columnId, feedbackItemId);
  };

  /**
   * Sends a BroadcastDeletedItem signal for other instances.
   * @param columnId The column id that the feedback item is a part of.
   * @param feedbackItemId The id of the feedback item to update.
   */
  public broadcastDeletedItem = (columnId: string, feedbackItemId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(ReflectBackendSignals.BroadcastDeletedItem, this._currentBoardId, columnId, feedbackItemId);
  };

  /**
   * Registers a callback to execute when the connection to the signalR hub is closed,
   * either purposefully or by some connection failure.
   * @param callback The callback function: (errror?: Error) => void
   */
  public onConnectionClose = (callback: (error?: Error) => void) => {
    this._connectionCloseCallbacks.add(callback);
  };

  public removeOnConnectionClose = (callback: (error?: Error) => void) => {
    this._connectionCloseCallbacks.delete(callback);
  };

  public onConnectionReconnecting = (callback: (error?: Error) => void) => {
    this._connectionReconnectingCallbacks.add(callback);
  };

  public removeOnConnectionReconnecting = (callback: (error?: Error) => void) => {
    this._connectionReconnectingCallbacks.delete(callback);
  };

  public onConnectionReconnected = (callback: (connectionId?: string) => void) => {
    this._connectionReconnectedCallbacks.add(callback);
  };

  public removeOnConnectionReconnected = (callback: (connectionId?: string) => void) => {
    this._connectionReconnectedCallbacks.delete(callback);
  };

  /**
   * Registers a callback to execute when a ReceiveNewItem signal is received.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public onReceiveNewItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this._signalRConnection.on(ReflectBackendSignals.ReceiveNewItem, callback);
  };

  /**
   * Removes the specified callback for the ReceiveNewItem signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveNewItem}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveNewItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveNewItem, callback);
  };

  /**
   * Registers a callback to execute when a ReceiveNewBoard signal is received.
   * @param callback The callback function: (teamId: string, boardId: string) => void
   */
  public onReceiveNewBoard = (callback: (teamId: string, boardId: string) => void) => {
    this._signalRConnection.on(ReflectBackendSignals.ReceiveNewBoard, callback);
  };

  /**
   * Removes the specified callback for the ReceiveNewBoard signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveNewBoard}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveNewBoard = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveNewBoard, callback);
  };

  /**
   * Registers a callback to execute when a ReceiveUpdatedItem signal is received.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public onReceiveUpdatedItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this._signalRConnection.on(ReflectBackendSignals.ReceiveUpdatedItem, callback);
  };

  /**
   * Removes the specified callback for the ReceiveUpdatedItem signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveUpdatedItem}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveUpdatedItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveUpdatedItem, callback);
  };

  /**
   * Registers a callback to execute when a ReceiveDeletedItem signal is received.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public onReceiveDeletedItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this._signalRConnection.on(ReflectBackendSignals.ReceiveDeletedItem, callback);
  };

  /**
   * Removes the specified callback for the ReceiveDeletedItem signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveDeletedItem}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveDeletedItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveDeletedItem, callback);
  };

  /**
   * Registers a callback to execute when a ReceiveDeletedBoard signal is received.
   * @param callback The callback function: (teamId: string, boardId: string) => void
   */
  public onReceiveDeletedBoard = (callback: (teamId: string, boardId: string) => void) => {
    this._signalRConnection.on(ReflectBackendSignals.ReceiveDeletedBoard, callback);
  };

  /**
   * Removes the specified callback for the ReceiveDeletedBoard signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveDeletedBoard}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveDeletedBoard = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveDeletedBoard, callback);
  };

  /**
   * Registers a callback to execute when a ReceiveUpdatedBoard signal is received.
   * @param callback The callback function: (teamId: string, boardId: string) => void
   */
  public onReceiveUpdatedBoard = (callback: (teamId: string, boardId: string) => void) => {
    this._signalRConnection.on(ReflectBackendSignals.ReceiveUpdatedBoard, callback);
  };

  /**
   * Removes the specified callback for the ReceiveUpdatedBoard signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveUpdatedBoard}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveUpdatedBoard = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveUpdatedBoard, callback);
  };
}

export const reflectBackendService = new ReflectBackendService();
