

namespace BLL.Services.Abstractions
{
    public interface IAdminService
    {
        Task<Response<List<UserSummaryVM>>> GetAllUsersAsync();
        Task<Response<UserSummaryVM>> GetUserByIdAsync(Guid id);
        Task<Response<bool>> DeactivateUserAsync(Guid id);
        Task<Response<SystemStatsVM>> GetSystemStatsAsync();
        Task<Response<List<Listing>>> GetAllListingsAsync();
        Task<Response<List<Booking>>> GetAllBookingsAsync();
    }
}
