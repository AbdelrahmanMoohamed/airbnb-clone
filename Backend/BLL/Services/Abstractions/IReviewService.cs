

namespace BLL.Services.Abstractions
{
    public interface IReviewService
    {
        Task<Response<ReviewVM>> CreateReviewAsync(CreateReviewVM model, Guid userId);
        Task<Response<ReviewVM>> UpdateReviewAsync(int id, UpdateReviewVM model);
        Task<Response<bool>> DeleteReviewAsync(int id);
        Task<Response<List<ReviewVM>>> GetReviewsByListingAsync(int listingId);
        Task<Response<List<ReviewVM>>> GetReviewsByGuestAsync(Guid guestId);
        Task<Response<double>> GetAverageRatingAsync(int listingId);
        
        // Enhanced features
        Task<Response<ReviewVM>> AddHostReplyAsync(int id, AddHostReplyVM model, Guid hostId);
        Task<Response<ReviewVM>> AddReviewImagesAsync(int id, AddReviewImagesVM model, Guid userId);
        Task<Response<ReviewVM>> VoteHelpfulAsync(int id, bool isHelpful);
        Task<Response<ReviewVM>> FlagReviewAsync(int id, FlagReviewVM model, Guid userId);
        Task<Response<ReviewVM>> UnflagReviewAsync(int id); // Admin only
        Task<Response<List<ReviewVM>>> GetFlaggedReviewsAsync(); // Admin only
    }
}
