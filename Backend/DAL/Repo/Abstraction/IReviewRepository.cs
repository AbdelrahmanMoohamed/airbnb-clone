namespace DAL.Repo.Abstraction
{
    public interface IReviewRepository : IGenericRepository<Review>
    {
        Task<IEnumerable<Review>> GetReviewsByGuestAsync(Guid guestId);             // All reviews for a specific guest
        Task<IEnumerable<Review>> GetReviewsByBookingAsync(int bookingId);          // All reviews for a specific booking
        Task<IEnumerable<Review>> GetReviewsByListingAsync(int listingId);          // All reviews for a specific listing

        // Repository creates and persists review entities
        Task<Review> CreateAsync(int bookingId, Guid guestId, int rating, string comment, DateTime createdAt);
        Task<Review> UpdateAsync(Review review);
        Task<bool> DeleteAsync(Review review);
        
        // Enhanced methods
        Task<Review?> GetByIdWithGuestAsync(int id);                                // Get review with guest info
        Task<IEnumerable<Review>> GetFlaggedReviewsAsync();                         // Get all flagged reviews (admin)
    }
}