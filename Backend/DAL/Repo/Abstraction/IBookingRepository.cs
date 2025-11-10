namespace DAL.Repo.Abstraction
{
    public interface IBookingRepository : IGenericRepository<Booking>
    {
        Task<IEnumerable<Booking>> GetBookingsByGuestAsync(Guid guestId);                // Bookings of a guest
        Task<IEnumerable<Booking>> GetBookingsByListingAsync(int listingId);             // Bookings for a listing
        Task<IEnumerable<Booking>> GetActiveBookingsAsync();                             // All active bookings  
    }
}