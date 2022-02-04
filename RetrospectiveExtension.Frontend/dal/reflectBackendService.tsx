import * as SignalR from '@aspnet/signalr';
import  moment from 'moment';
import { getAppToken } from 'azure-devops-extension-sdk';

import Environment from '../config/environment';
import { decodeJwt } from '../utilities/tokenHelper';
import { isHostedAzureDevOps } from '../utilities/azureDevOpsContextHelper';

const enum ReflectBackendSignals {
  JoinReflectBoardGroup = 'joinReflectBoardGroup',
  LeaveReflectBoardGroup = 'leaveReflectBoardGroup',
  ReceiveNewItem = 'receiveNewItem',
  ReceiveUpdatedItem = 'receiveUpdatedItem',
  ReceiveUpdatedBoard = 'receiveUpdatedBoard',
  ReceiveDeletedItem = 'receiveDeletedItem',
  ReceiveDeletedBoard = 'receiveDeletedBoard',
  ReceiveNewBoard = 'receiveNewBoard',
  BroadcastNewItem = 'broadcastNewItem',
  BroadcastUpdatedItem = 'broadcastUpdatedItem',
  BroadcastUpdatedBoard = 'broadcastUpdatedBoard',
  BroadcastDeletedItem = 'broadcastDeletedItem',
  BroadcastDeletedBoard = 'broadcastDeletedBoard',
  BroadcastNewBoard = 'broadcastNewBoard',
}

class ReflectBackendService {
  private static signalRHubUrl = new URL('/collaborationUpdates', Environment.CollaborationStateServiceUrl);

  private _currentBoardId: string;
  private _signalRConnection: SignalR.HubConnection;
  private _appToken: string;
  private _tokenExpiry: Date;
  private _connectionAvailable: boolean;

  constructor() {
    if (!isHostedAzureDevOps()) {
      return;
    }

    if (!this._signalRConnection) {
      this._signalRConnection = new SignalR.HubConnectionBuilder()
      .withUrl(ReflectBackendService.signalRHubUrl.href, {
        accessTokenFactory: this.retrieveValidToken,
      })
      .configureLogging(SignalR.LogLevel.Error)
      .build();
      this._connectionAvailable = false;

      this._signalRConnection.onclose((error) => {
        this._connectionAvailable = false;
        console.error("SignalR closed with an error of: ", error);
      });
    }
  }

  /**
   * Starts the connection to the signalR hub.
   */
  public startConnection = async () => {
    if (!this._signalRConnection) {
      return false;
    }

    try {
      await this._signalRConnection.start();
      this._connectionAvailable = true;
    }
    catch (error) {
      console.error('Error when trying to start signalR connection: ', error);
      console.debug('Unable to establish signalR connection, live syncing will be affected.');
      this._connectionAvailable = false;
    }

    return this._connectionAvailable;
  }

  private retrieveValidToken = (that = this) => {
    if (that._tokenExpiry && moment().isBefore(that._tokenExpiry)) {
      return that._appToken;
    }

    return Promise.resolve(getAppToken().then((appToken) => {
      that._appToken = appToken;

      const tokenData = decodeJwt(that._appToken);
      if (tokenData) {
        that._tokenExpiry = moment.unix(tokenData.exp).toDate();
        return that._appToken;
      }

      // TODO (phongcao) : appInsightsClient.trackException(new Error(e.message));
      throw new Error('VSTS returned a malformed appToken value!');
    }));
  }

  private joinBoardGroup = (boardId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(
      ReflectBackendSignals.JoinReflectBoardGroup,
      boardId
    );
  }

  private leaveBoardGroup = (boardId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(
      ReflectBackendSignals.LeaveReflectBoardGroup,
      boardId
    );
  }

  private removeSignalCallback = (signal: string, callback: (columnId: string, feedbackItemId: string) => void) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.off(
      signal,
      callback
    );
  }

  /**
   * Removes the connection from the current board group
   * and, if newBoardId isn't falsy, adds it to the new
   * board group for the specified board id.
   * @param newBoardId The id of the board to join.
   */
  public switchToBoard = (newBoardId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this.leaveBoardGroup(this._currentBoardId);
    if (newBoardId) {
      this.joinBoardGroup(newBoardId);
    }
    this._currentBoardId = newBoardId;
  }

  /**
   * Sends a BroadcastNewItem signal for other instances.
   * @param columnId The column id that the feedback item is a part of.
   * @param feedbackItemId The id of the new feedback item.
   */
  public broadcastNewItem = (columnId: string, feedbackItemId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(
      ReflectBackendSignals.BroadcastNewItem,
      this._currentBoardId,
      columnId,
      feedbackItemId
    );
  }

  /**
   * Sends a BroadcastNewBoard signal for other instances.
   * @param teamId The id of the parent team.
   * @param boardId The id of the board.
   */
  public broadcastNewBoard = (teamId: string, boardId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(
      ReflectBackendSignals.BroadcastNewBoard,
      teamId,
      boardId
    );
  }

  /**
   * Sends a BroadcastUpdatedBoard signal for other instances.
   * @param teamId The id of the parent team.
   * @param boardId The id of the board.
   */
  public broadcastUpdatedBoard = (teamId: string, boardId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(
      ReflectBackendSignals.BroadcastUpdatedBoard,
      teamId,
      boardId
    );
  }

  /**
   * Sends a BroadcastDeletedBoard signal for other instances.
   * @param teamId The id of the parent team.
   * @param boardId The id of the board.
   */
  public broadcastDeletedBoard = (teamId: string, boardId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(
      ReflectBackendSignals.BroadcastDeletedBoard,
      teamId,
      boardId
    );
  }

  /**
   * Sends a BroadcastUpdatedItem signal for other instances.
   * @param columnId The column id that the feedback item is a part of.
   * @param feedbackItemId The id of the feedback item to update.
   */
  public broadcastUpdatedItem = (columnId: string, feedbackItemId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(
      ReflectBackendSignals.BroadcastUpdatedItem,
      this._currentBoardId,
      columnId,
      feedbackItemId
    );
  }

  /**
 * Sends a BroadcaseDeleteItem signal for other instances.
 * @param columnId The column id that the feedback item is a part of.
 * @param feedbackItemId The id of the feedback item to update.
 */
  public broadcastDeletedItem = (columnId: string, feedbackItemId: string) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.send(
      ReflectBackendSignals.BroadcastDeletedItem,
      this._currentBoardId,
      columnId,
      feedbackItemId
    );
  }

  /**
   * Registers a callback to execute when the connection to the signalR hub is closed,
   * either purposefully or by some connection failure.
   * @param callback The callback function: (errror?: Error) => void
   */
  public onConnectionClose = (callback: (error?: Error) => void) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.onclose(callback);
  }

  /**
   * Registers a callback to execute when a ReceiveNewItem signal is received.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public onReceiveNewItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.on(
      ReflectBackendSignals.ReceiveNewItem,
      callback
    );
  }

  /**
   * Removes the specified callback for the ReceiveNewItem signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveNewItem}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveNewItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveNewItem, callback);
  }

  /**
   * Registers a callback to execute when a ReceiveNewBoard signal is received.
   * @param callback The callback function: (teamId: string, boardId: string) => void
   */
  public onReceiveNewBoard = (callback: (teamId: string, boardId: string) => void) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.on(
      ReflectBackendSignals.ReceiveNewBoard,
      callback
    );
  }

  /**
   * Removes the specified callback for the ReceiveNewBoard signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveNewBoard}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveNewBoard = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveNewBoard, callback);
  }

  /**
   * Registers a callback to execute when a ReceiveUpdatedItem signal is received.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public onReceiveUpdatedItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.on(
      ReflectBackendSignals.ReceiveUpdatedItem,
      callback
    );
  }

  /**
   * Removes the specified callback for the ReceiveUpdatedItem signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveUpdatedItem}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveUpdatedItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveUpdatedItem, callback);
  }

  /**
   * Registers a callback to execute when a ReceiveDeletedItem signal is received.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public onReceiveDeletedItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.on(
      ReflectBackendSignals.ReceiveDeletedItem,
      callback
    );
  }

  /**
   * Removes the specified callback for the ReceiveDeletedItem signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveDeletedItem}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveDeletedItem = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveDeletedItem, callback);
  }

  /**
   * Registers a callback to execute when a ReceiveDeletedBoard signal is received.
   * @param callback The callback function: (teamId: string, boardId: string) => void
   */
  public onReceiveDeletedBoard = (callback: (teamId: string, boardId: string) => void) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.on(
      ReflectBackendSignals.ReceiveDeletedBoard,
      callback
    );
  }

  /**
   * Removes the specified callback for the ReceiveDeletedBoard signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveDeletedBoard}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveDeletedBoard = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveDeletedBoard, callback);
  }

  /**
   * Registers a callback to execute when a ReceiveUpdatedBoard signal is received.
   * @param callback The callback function: (teamId: string, boardId: string) => void
   */
  public onReceiveUpdatedBoard = (callback: (teamId: string, boardId: string) => void) => {
    if (!this._connectionAvailable) {
      return;
    }

    this._signalRConnection.on(
      ReflectBackendSignals.ReceiveUpdatedBoard,
      callback
    );
  }

  /**
   * Removes the specified callback for the ReceiveUpdatedBoard signal.
   * You must pass the exact same Function instance as was previously passed to {@link onReceiveUpdatedBoard}.
   * Passing a different instance (even if the function body is the same) will not remove the callback.
   * @param callback The callback function: (columnId: string, feedbackItemId: string) => void
   */
  public removeOnReceiveUpdatedBoard = (callback: (columnId: string, feedbackItemId: string) => void) => {
    this.removeSignalCallback(ReflectBackendSignals.ReceiveUpdatedBoard, callback);
  }
}

export const reflectBackendService = new ReflectBackendService();
