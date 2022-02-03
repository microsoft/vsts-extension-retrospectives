using System.Threading.Tasks;
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using static ReflectBackend.ReflectBackendSignals;

namespace ReflectBackend
{
  public enum ReflectBackendSignals
  {
    receiveNewItem,
    receiveUpdatedItem,
    receiveUpdatedBoard,
    receiveDeletedItem,
    receiveDeletedBoard,
    receiveNewBoard
  }

  [Authorize]
  public class ReflectHub : Hub
  {
    private readonly TelemetryConfiguration _config;
    private readonly TelemetryClient _insights;

    public ReflectHub()
    {
      this._config = TelemetryConfiguration.CreateDefault();
      this._insights = new TelemetryClient(this._config);
    }

    /// <summary>
    /// Broadcast receiveDeletedBoard to all connected clients except the sender.
    /// </summary>
    /// <param name="teamId">The id of the team to which the board belongs.</param>
    /// <param name="reflectBoardId">The id of the deleted Reflect board.</param>
    public Task BroadcastDeletedBoard(string teamId, string reflectBoardId)
    {
      _insights.TrackEvent("Broadcasting delete board");
      return Clients.Others.SendAsync(receiveDeletedBoard.ToString(), teamId, reflectBoardId);
    }

    /// <summary>
    /// Broadcast receiveDeletedItem to all other clients viewing the same reflect board.
    /// </summary>
    /// <param name="reflectBoardId">The id of the reflect board.</param>
    /// <param name="columnId">The id of column this item is associated with.</param>
    /// <param name="feedbackItemId">The id of the new feedback item.</param>
    public Task BroadcastDeletedItem(string reflectBoardId, string columnId, string feedbackItemId)
    {
      _insights.TrackEvent("Broadcasting delete item");
      return Clients.OthersInGroup(reflectBoardId).SendAsync(receiveDeletedItem.ToString(), columnId, feedbackItemId);
    }

    /// <summary>
    /// Broadcast receiveNewBoard to all connected clients except the sender.
    /// </summary>
    /// <param name="teamId">The id of the team to which the board belongs.</param>
    /// <param name="reflectBoardId">The id of the new Reflect board.</param>
    public Task BroadcastNewBoard(string teamId, string reflectBoardId)
    {
      _insights.TrackEvent("Broadcasting new board");
      return Clients.Others.SendAsync(receiveNewBoard.ToString(), teamId, reflectBoardId);
    }

    /// <summary>
    /// Broadcast receiveNewItem to all other clients viewing the same reflect board.
    /// </summary>
    /// <param name="reflectBoardId">The id of the reflect board.</param>
    /// <param name="columnId">The id of column this item is associated with.</param>
    /// <param name="feedbackItemId">The id of the new feedback item.</param>
    public Task BroadcastNewItem(string reflectBoardId, string columnId, string feedbackItemId)
    {
      _insights.TrackEvent("Broadcasting new item");
      return Clients.OthersInGroup(reflectBoardId).SendAsync(receiveNewItem.ToString(), columnId, feedbackItemId);
    }

    /// <summary>
    /// Broadcast receiveUpdatedBoard to all other clients except the sender.
    /// </summary>
    /// <param name="teamId">The id of the team to which the board belongs.</param>
    /// <param name="reflectBoardId">The id of the reflect board.</param>
    public Task BroadcastUpdatedBoard(string teamId, string reflectBoardId)
    {
      _insights.TrackEvent("Broadcasting board update");
      return Clients.Others.SendAsync(receiveUpdatedBoard.ToString(), teamId, reflectBoardId);
    }

    /// <summary>
    /// Broadcast receiveUpdatedItem to all other clients viewing the same reflect board.
    /// </summary>
    /// <param name="reflectBoardId">The id of the reflect board.</param>
    /// <param name="columnId">The id of column this item is associated with.</param>
    /// <param name="feedbackItemId">The id of the new feedback item.</param>
    public Task BroadcastUpdatedItem(string reflectBoardId, string columnId, string feedbackItemId)
    {
      _insights.TrackEvent("Broadcasting item update");
      return Clients.OthersInGroup(reflectBoardId).SendAsync(receiveUpdatedItem.ToString(), columnId, feedbackItemId);
    }

    /// <summary>
    /// Adds the client to the group for this reflect board.
    /// </summary>
    /// <param name="reflectBoardId">The id of the reflect board.</param>
    public Task JoinReflectBoardGroup(string reflectBoardId)
    {
      _insights.TrackEvent("Adding client to board");
      return Groups.AddToGroupAsync(Context.ConnectionId, reflectBoardId);
    }

    /// <summary>
    /// Removes the client from the group for this reflect board.
    /// </summary>
    /// <param name="reflectBoardId">The id of the reflect board.</param>
    public Task LeaveReflectBoardGroup(string reflectBoardId)
    {
      _insights.TrackEvent("Removing client from board");
      return Groups.RemoveFromGroupAsync(Context.ConnectionId, reflectBoardId);
    }
  }
}
