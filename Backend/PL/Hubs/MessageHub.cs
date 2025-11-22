


namespace PL.Hubs
{
    public class MessageHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> UserConnections = new();

        public override Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext().Request.Query["userID"].ToString();
            if (!string.IsNullOrEmpty(userId))
            {
                UserConnections[userId] = Context.ConnectionId;
            }

            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = UserConnections.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
            if (!string.IsNullOrEmpty(userId))
            {
                UserConnections.TryRemove(userId, out _);
            }

            return base.OnDisconnectedAsync(exception);
        }

        public static string? GetConnectionId(string userId)
        {
            UserConnections.TryGetValue(userId, out var connectionId);
            return connectionId;
        }
    }
}
