namespace DAL.Repo.Abstraction
{
    public interface IReviewRepository : IGenericRepository<Review>
    {
        Task<IEnumerable<Review>> GetReviewsByGuestAsync(Guid guestId);             // All reviews for a specific guest
        Task<IEnumerable<Review>> GetReviewsByBookingAsync(int bookingId);          // All reviews for a specific booking
    }
}