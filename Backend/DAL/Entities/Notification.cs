namespace DAL.Entities
{
    public class Notification
    {
        public int Id { get; private set; }
        public Guid UserId { get; private set; }
        public string Title { get; private set; } = null!;
        public string Body { get; private set; } = null!;
        public NotificationType Type { get; private set; }
        public bool IsRead { get; private set; }
        public DateTime CreatedAt { get; private set; }

        // Relationships
        public User User { get; private set; } = null!;

        private Notification() { }

        // Create a notification
        internal static Notification Create(
            Guid userId,
            string title,
            string body,
            NotificationType type,
            DateTime createdAt)
        {
            return new Notification
            {
                UserId = userId,
                Title = title,
                Body = body,
                Type = type,
                IsRead = false,
                CreatedAt = createdAt
            };
        }

        // Mark the notification as read
        internal void MarkAsRead()
        {
            IsRead = true;
        }
    }
}
