

namespace BLL.Services.Impelementation
{
    public class AdminService : IAdminService
    {
        private readonly IAdminRepository _adminRepo;
        private readonly IUnitOfWork _uow;

        public AdminService(IAdminRepository adminRepo, IUnitOfWork uow)
        {
            _adminRepo = adminRepo;
            _uow = uow;
        }

        public async Task<Response<List<UserSummaryVM>>> GetAllUsersAsync()
        {
            try
            {
                var users = await _adminRepo.GetAllUsersAsync();
                var mapped = users.Select(u => new UserSummaryVM { Id = u.Id, Email = u.Email, FullName = u.FullName, Role = u.Role.ToString(), IsActive = u.IsActive }).ToList();
                return Response<List<UserSummaryVM>>.SuccessResponse(mapped);
            }
            catch (Exception ex)
            {
                return Response<List<UserSummaryVM>>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<UserSummaryVM>> GetUserByIdAsync(Guid id)
        {
            try
            {
                var u = await _adminRepo.GetUserByIdAsync(id);
                if (u == null) return Response<UserSummaryVM>.FailResponse("User not found");
                var vm = new UserSummaryVM { Id = u.Id, Email = u.Email, FullName = u.FullName, Role = u.Role.ToString(), IsActive = u.IsActive };
                return Response<UserSummaryVM>.SuccessResponse(vm);
            }
            catch (Exception ex)
            {
                return Response<UserSummaryVM>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<bool>> DeactivateUserAsync(Guid id)
        {
            try
            {
                await _adminRepo.GetUserByIdAsync(id);
                await _uow.SaveChangesAsync();
                return Response<bool>.SuccessResponse(true);
            }
            catch (Exception ex)
            {
                return Response<bool>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<SystemStatsVM>> GetSystemStatsAsync()
        {
            try
            {
                var stats = new SystemStatsVM
                {
                    TotalUsers = await _adminRepo.CountUsersAsync(),
                    TotalListings = await _adminRepo.CountListingsAsync(),
                    TotalBookings = await _adminRepo.CountBookingsAsync()
                };
                return Response<SystemStatsVM>.SuccessResponse(stats);
            }
            catch (Exception ex)
            {
                return Response<SystemStatsVM>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<List<Listing>>> GetAllListingsAsync()
        {
            try
            {
                var listings = await _adminRepo.GetAllListingsAsync();
                return Response<List<Listing>>.SuccessResponse(listings.ToList());
            }
            catch (Exception ex)
            {
                return Response<List<Listing>>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<List<Booking>>> GetAllBookingsAsync()
        {
            try
            {
                var bookings = await _adminRepo.GetAllBookingsAsync();
                return Response<List<Booking>>.SuccessResponse(bookings.ToList());
            }
            catch (Exception ex)
            {
                return Response<List<Booking>>.FailResponse(ex.Message);
            }
        }
    }
}
