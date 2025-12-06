

namespace DAL.Repo.Abstraction
{
    public interface IAdminRepository
    {
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<User?> GetUserByIdAsync(Guid id);
        Task<IEnumerable<Listing>> GetAllListingsAsync();
        Task<IEnumerable<Booking>> GetAllBookingsAsync();
        Task<int> CountUsersAsync();
        Task<int> CountListingsAsync();
        Task<int> CountBookingsAsync();
        Task<bool> ToggleUserActiveStatusAsync(Guid id);

    }
}
