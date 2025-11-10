namespace DAL.Repo.Implementation
{
    public class ReviewRepository : GenericRepository<Review>, IReviewRepository
    {
        public ReviewRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<Review>> GetReviewsByGuestAsync(Guid guestId)
        {
            return await _context.Reviews
                .Where(r => r.GuestId == guestId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetReviewsByBookingAsync(int bookingId)
        {
            return await _context.Reviews
                .Where(r => r.BookingId == bookingId)
                .ToListAsync();
        }
    }
}
