namespace DAL.Repo.Abstraction
{
    public interface INotificationRepository : IGenericRepository<Notification>
    {
        Task<IEnumerable<Notification>> GetByUserIdAsync(Guid userId);            // All notifications for a user
        Task<IEnumerable<Notification>> GetUnreadAsync(Guid userId);                  // Unread notifications for a user
        Task MarkAllAsReadAsync(Guid userId);                                         // Mark all as read
    }
}
