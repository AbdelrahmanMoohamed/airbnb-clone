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

        public async Task<IEnumerable<Review>> GetReviewsByListingAsync(int listingId)
        {
            return await _context.Reviews
                .Include(r => r.Booking)
                .Include(r => r.Guest)
                .Where(r => r.Booking != null && r.Booking.ListingId == listingId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }
        
        public async Task<Review?> GetByIdWithGuestAsync(int id)
        {
            return await _context.Reviews
                .Include(r => r.Guest)
                .Include(r => r.Booking)
                .FirstOrDefaultAsync(r => r.Id == id);
        }
        
        public async Task<IEnumerable<Review>> GetFlaggedReviewsAsync()
        {
            return await _context.Reviews
                .Include(r => r.Guest)
                .Include(r => r.Booking)
                .Where(r => r.IsFlagged)
                .OrderByDescending(r => r.FlaggedAt)
                .ToListAsync();
        }

        public async Task<Review> CreateAsync(int bookingId, Guid guestId, int rating, string comment, DateTime createdAt)
        {
            var entity = Review.Create(bookingId, guestId, rating, comment, createdAt);
            await _context.Reviews.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<Review> UpdateAsync(Review review)
        {
            _context.Reviews.Update(review);
            await _context.SaveChangesAsync();
            return review;
        }

        public async Task<bool> DeleteAsync(Review review)
        {
            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
