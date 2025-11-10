namespace DAL.Repo.Implementation
{
    public class BookingRepository : GenericRepository<Booking>, IBookingRepository
    {
        public BookingRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<Booking>> GetBookingsByGuestAsync(Guid guestId)
        {
            return await _context.Bookings
                .Where(b => b.GuestId == guestId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Booking>> GetBookingsByListingAsync(int listingId)
        {
            return await _context.Bookings
                .Where(b => b.ListingId == listingId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Booking>> GetActiveBookingsAsync()
        {
            return await _context.Bookings
                .Where(b => b.BookingStatus == BookingStatus.Active)
                .ToListAsync();
        }
    }
}
