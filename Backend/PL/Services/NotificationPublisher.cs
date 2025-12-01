using BLL.Services.Abstractions;
using BLL.ModelVM.Notification;
using Microsoft.AspNetCore.SignalR;
using PL.Hubs;

namespace PL.Services
{
    public class NotificationPublisher : INotificationPublisher
    {
        private readonly IHubContext<NotificationHub> _hub;

        public NotificationPublisher(IHubContext<NotificationHub> hub)
        {
            _hub = hub;
        }

        public async Task PublishAsync(GetNotificationVM notification)
        {
            try
            {
                var userId = notification.UserId.ToString();
                var connectionIds = NotificationHub.GetConnectionIds(userId);
                if (connectionIds != null && connectionIds.Count > 0)
                {
                    await _hub.Clients.Clients(connectionIds).SendAsync("ReceiveNotification", new
                    {
                        Id = notification.Id,
                        UserId = notification.UserId,
                        Title = notification.Title,
                        Body = notification.Body,
                        CreatedAt = notification.CreatedAt,
                        IsRead = notification.IsRead,
                        ActionUrl = notification.ActionUrl,
                        ActionLabel = notification.ActionLabel
                    });
                }
            }
            catch
            {
                // swallow errors to avoid breaking the flow
            }
        }
    }
}
