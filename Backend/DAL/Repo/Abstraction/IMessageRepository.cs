namespace DAL.Repo.Abstraction
{
    public interface IMessageRepository : IGenericRepository<Message>
    {
        Task<IEnumerable<Message>> GetConversationAsync(Guid userId1, Guid userId2);     // Chat between 2 users
        Task<IEnumerable<Message>> GetUnreadMessagesAsync(Guid receiverId);              // Unread messages for a receiver
    }
}