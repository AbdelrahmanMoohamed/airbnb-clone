namespace BLL.Services.Abstractions
{
    public interface INotificationPublisher
    {
        Task PublishAsync(ModelVM.Notification.GetNotificationVM notification);
    }
}
