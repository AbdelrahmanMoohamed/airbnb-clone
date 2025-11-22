

namespace DAL.Repo.Implementation
{
    public class AdminRepository : IAdminRepository
    {
        private readonly AppDbContext _context;
        public AdminRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<User>> GetAllUsersAsync() => await _context.Users.ToListAsync();
        public async Task<User?> GetUserByIdAsync(Guid id) => await _context.Users.FindAsync(id);
        public async Task<IEnumerable<Listing>> GetAllListingsAsync() => await _context.Listings.ToListAsync();
        public async Task<IEnumerable<Booking>> GetAllBookingsAsync() => await _context.Bookings.ToListAsync();
        public async Task<int> CountUsersAsync() => await _context.Users.CountAsync();
        public async Task<int> CountListingsAsync() => await _context.Listings.CountAsync();
        public async Task<int> CountBookingsAsync() => await _context.Bookings.CountAsync();
    }
}
