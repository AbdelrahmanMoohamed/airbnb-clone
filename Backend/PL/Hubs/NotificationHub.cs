
namespace PL.Hubs
{
    public class NotificationHub : Hub 
    {
        // Track multiple connections per user (support multi-tab)
        // Map: userId -> dictionary of connectionId -> byte (value unused)
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> UserConnections = new();

        public override Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext().Request.Query["userID"].ToString();
            if (!string.IsNullOrEmpty(userId))
            {
                var dict = UserConnections.GetOrAdd(userId, _ => new ConcurrentDictionary<string, byte>());
                dict[Context.ConnectionId] = 1;
            }

            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var pair = UserConnections.FirstOrDefault(kvp => kvp.Value.ContainsKey(Context.ConnectionId));
            if (!pair.Equals(default(KeyValuePair<string, ConcurrentDictionary<string, byte>>)))
            {
                var userId = pair.Key;
                if (UserConnections.TryGetValue(userId, out var dict))
                {
                    dict.TryRemove(Context.ConnectionId, out _);
                    if (dict.IsEmpty)
                    {
                        UserConnections.TryRemove(userId, out _);
                    }
                }
            }

            return base.OnDisconnectedAsync(exception);
        }

        public static List<string> GetConnectionIds(string userId)
        {
            if (UserConnections.TryGetValue(userId, out var dict))
            {
                return dict.Keys.ToList();
            }

            return new List<string>();
        }
    }
}
