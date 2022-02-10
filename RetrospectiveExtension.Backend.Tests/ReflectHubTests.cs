using Microsoft.AspNetCore.SignalR;
using Moq;
using ReflectBackend;
using System.Threading;
using Xunit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CollaborationStateService.Configuration;
using static ReflectBackend.ReflectBackendSignals;

namespace RetrospectiveExtension.Backend.Tests
{
    public class ReflectHubTests
    {
        private ILogger<ReflectHub> _logger = Mock.Of<ILogger<ReflectHub>>();
        private IOptions<AppInsightsSettings> _appInsightsOptions = Options.Create(new AppInsightsSettings() { InstrumentationKey = "" });

        [Fact]
        public async void BroadcastDeletedBoardTest()
        {
            using (var hub = new ReflectHub(_logger, _appInsightsOptions))
            {

                // Set up mock objects
                var mockClientProxy = new Mock<IClientProxy>();
                var mockClients = new Mock<IHubCallerClients>();
                mockClients.SetupGet(x => x.Others).Returns(mockClientProxy.Object);
                hub.Clients = mockClients.Object;
                hub.Context = Mock.Of<HubCallerContext>();

                // Invoke method
                await hub.BroadcastDeletedBoard("teamId", "reflectBoardId");

                // Assert
                mockClientProxy.Verify(x => x.SendCoreAsync(
                  receiveDeletedBoard.ToString(),
                  new string[] { "teamId", "reflectBoardId" },
                  default(CancellationToken)));
            }
        }

        [Fact]
        public async void BroadcastNewBoardTest()
        {
            using (var hub = new ReflectHub(_logger, _appInsightsOptions))
            {
                // Set up mock objects
                var mockClientProxy = new Mock<IClientProxy>();
                var mockClients = new Mock<IHubCallerClients>();
                mockClients.SetupGet(x => x.Others).Returns(mockClientProxy.Object);
                hub.Clients = mockClients.Object;
                hub.Context = Mock.Of<HubCallerContext>();

                // Invoke method
                await hub.BroadcastNewBoard("teamId", "reflectBoardId");

                // Assert
                mockClientProxy.Verify(x => x.SendCoreAsync(
                  receiveNewBoard.ToString(),
                  new string[] { "teamId", "reflectBoardId" },
                  default(CancellationToken)));
            }
        }

        [Fact]
        public async void BroadcastUpdatedBoardTest()
        {
            using (var hub = new ReflectHub(_logger, _appInsightsOptions))
            {
                // Set up mock objects
                var mockClientProxy = new Mock<IClientProxy>();
                var mockClients = new Mock<IHubCallerClients>();
                mockClients.SetupGet(x => x.Others).Returns(mockClientProxy.Object);
                hub.Clients = mockClients.Object;
                hub.Context = Mock.Of<HubCallerContext>();

                // Invoke method
                await hub.BroadcastUpdatedBoard("teamId", "reflectBoardId");

                // Assert
                mockClientProxy.Verify(x => x.SendCoreAsync(
                  receiveUpdatedBoard.ToString(),
                  new string[] { "teamId", "reflectBoardId" },
                  default(CancellationToken)));
            }
        }

        [Fact]
        public async void BroadcastDeletedItemTest()
        {
            using (var hub = new ReflectHub(_logger, _appInsightsOptions))
            {
                // Set up mock objects
                var mockClientProxy = new Mock<IClientProxy>();
                var mockClients = new Mock<IHubCallerClients>();
                mockClients.Setup(x => x.OthersInGroup(It.IsAny<string>())).Returns(mockClientProxy.Object);
                hub.Clients = mockClients.Object;
                hub.Context = Mock.Of<HubCallerContext>();

                // Invoke method
                await hub.BroadcastDeletedItem("reflectBoardId", "columnId", "feedbackItemId");

                // Assert
                mockClients.Verify(x => x.OthersInGroup("reflectBoardId"));
                mockClientProxy.Verify(x => x.SendCoreAsync(
                  receiveDeletedItem.ToString(),
                  new string[] { "columnId", "feedbackItemId" },
                  default(CancellationToken)));
            }
        }

        [Fact]
        public async void BroadcastNewItemTest()
        {
            using (var hub = new ReflectHub(_logger, _appInsightsOptions))
            {
                // Set up mock objects
                var mockClientProxy = new Mock<IClientProxy>();
                var mockClients = new Mock<IHubCallerClients>();
                mockClients.Setup(x => x.OthersInGroup(It.IsAny<string>())).Returns(mockClientProxy.Object);
                hub.Clients = mockClients.Object;
                hub.Context = Mock.Of<HubCallerContext>();

                // Invoke method
                await hub.BroadcastNewItem("reflectBoardId", "columnId", "feedbackItemId");

                // Assert
                mockClients.Verify(x => x.OthersInGroup("reflectBoardId"));
                mockClientProxy.Verify(x => x.SendCoreAsync(
                  receiveNewItem.ToString(),
                  new string[] { "columnId", "feedbackItemId" },
                  default(CancellationToken)));
            }
        }

        [Fact]
        public async void BroadcastUpdatedItem()
        {
            using (var hub = new ReflectHub(_logger, _appInsightsOptions))
            {
                // Set up mock objects
                var mockClientProxy = new Mock<IClientProxy>();
                var mockClients = new Mock<IHubCallerClients>();
                mockClients.Setup(x => x.OthersInGroup(It.IsAny<string>())).Returns(mockClientProxy.Object);
                hub.Clients = mockClients.Object;
                hub.Context = Mock.Of<HubCallerContext>();

                // Invoke method
                await hub.BroadcastUpdatedItem("reflectBoardId", "columnId", "feedbackItemId");

                // Assert
                mockClients.Verify(x => x.OthersInGroup("reflectBoardId"));
                mockClientProxy.Verify(x => x.SendCoreAsync(
                  receiveUpdatedItem.ToString(),
                  new string[] { "columnId", "feedbackItemId" },
                  default(CancellationToken)));
            }
        }

        [Fact]
        public async void JoinReflectBoardGroupTest()
        {
            using (var hub = new ReflectHub(_logger, _appInsightsOptions))
            {
                // Set up mock objects
                var mockGroups = new Mock<IGroupManager>();
                mockGroups.Setup(x => x.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()));
                hub.Groups = mockGroups.Object;
                hub.Context = Mock.Of<HubCallerContext>();

                // Invoke method
                await hub.JoinReflectBoardGroup("reflectBoardId");

                // Assert
                mockGroups.Verify(x => x.AddToGroupAsync(It.IsAny<string>(), "reflectBoardId", It.IsAny<CancellationToken>()));
            }
        }

        [Fact]
        public async void LeaveReflectBoardGroupTest()
        {
            using (var hub = new ReflectHub(_logger, _appInsightsOptions))
            {
                // Set up mock objects
                var mockGroups = new Mock<IGroupManager>();
                mockGroups.Setup(x => x.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()));
                hub.Groups = mockGroups.Object;
                hub.Context = Mock.Of<HubCallerContext>();

                // Invoke method
                await hub.LeaveReflectBoardGroup("reflectBoardId");

                // Assert
                mockGroups.Verify(x => x.RemoveFromGroupAsync(It.IsAny<string>(), "reflectBoardId", It.IsAny<CancellationToken>()));
            }
        }

    }
}
