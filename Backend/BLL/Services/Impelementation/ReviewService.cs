using Microsoft.EntityFrameworkCore;

namespace BLL.Services.Impelementation
{
    public class ReviewService : IReviewService
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly INotificationService _notificationService;

        public ReviewService(IUnitOfWork uow, IMapper mapper, INotificationService notificationService)
        {
            _uow = uow;
            _mapper = mapper;
            _notificationService = notificationService;
        }

        public async Task<Response<ReviewVM>> CreateReviewAsync(CreateReviewVM model, Guid userId)
        {
            try
            {
                // Validate input
                if (model == null) return Response<ReviewVM>.FailResponse("Request model is required.");
                if (model.Rating < 1 || model.Rating > 5) return Response<ReviewVM>.FailResponse("Rating must be between 1 and 5.");

                // Ensure booking exists
                var booking = await _uow.Bookings.GetByIdAsync(model.BookingId);
                if (booking == null) return Response<ReviewVM>.FailResponse("Booking not found.");

                // Ensure the user creating the review is the guest who made the booking
                if (booking.GuestId != userId) return Response<ReviewVM>.FailResponse("User is not the guest for this booking.");

                // Prevent duplicate review for same booking
                var existingReviews = await _uow.Reviews.GetReviewsByBookingAsync(model.BookingId);
                if (existingReviews != null && existingReviews.Any())
                    return Response<ReviewVM>.FailResponse("A review for this booking already exists.");

                // Use domain factory to ensure invariants and required fields are set
                var entity = await _uow.Reviews.CreateAsync(model.BookingId, userId, model.Rating, model.Comment, DateTime.UtcNow);

                // Adjust listing priority based on review rating
                await _uow.Listings.AdjustPriorityByReviewRatingAsync(booking.ListingId, model.Rating);
                await _uow.SaveChangesAsync();

                // Send notification to host about new review
                var listing = await _uow.Listings.GetByIdAsync(booking.ListingId);
                if (listing != null)
                {
                    var guest = await _uow.Users.GetByIdAsync(userId);
                    var guestName = guest?.FullName ?? "A guest";
                    
                    await _notificationService.CreateAsync(new BLL.ModelVM.Notification.CreateNotificationVM
                    {
                        UserId = listing.UserId,
                        Title = "New Review Received!",
                        Body = $"{guestName} left a {model.Rating}-star review for your listing '{listing.Title}'",
                        Type = DAL.Enum.NotificationType.System,
                        ActionUrl = $"/host/listings/{listing.Id}",
                        ActionLabel = "View Review"
                    });
                }

                var vm = _mapper.Map<ReviewVM>(entity);
                return Response<ReviewVM>.SuccessResponse(vm);
            }
            catch (DbUpdateException dbEx)
            {
                // Return inner exception message or full exception details to help identify DB-level errors
                var msg = dbEx.InnerException?.Message ?? dbEx.ToString();
                return Response<ReviewVM>.FailResponse(msg);
            }
            catch (Exception ex)
            {
                return Response<ReviewVM>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<ReviewVM>> UpdateReviewAsync(int id, UpdateReviewVM model)
        {
            try
            {
                var existing = await _uow.Reviews.GetByIdAsync(id);
                if (existing == null) return Response<ReviewVM>.FailResponse("Review not found");

                // Store old rating before updating
                var oldRating = existing.Rating;

                // Update review
                existing.Update(model.Rating, model.Comment);
                await _uow.Reviews.UpdateAsync(existing);

                // Adjust listing priority: reverse old rating adjustment and apply new rating adjustment
                if (oldRating != model.Rating)
                {
                    var booking = await _uow.Bookings.GetByIdAsync(existing.BookingId);
                    if (booking != null)
                    {
                        await _uow.Listings.ReverseRatingPriorityAdjustmentAsync(booking.ListingId, oldRating);
                        await _uow.Listings.AdjustPriorityByReviewRatingAsync(booking.ListingId, model.Rating);
                        await _uow.SaveChangesAsync();
                    }
                }

                var vm = _mapper.Map<ReviewVM>(existing);
                return Response<ReviewVM>.SuccessResponse(vm);
            }
            catch (DbUpdateException dbEx)
            {
                // Return inner exception message or full exception details to help identify DB-level errors
                var msg = dbEx.InnerException?.Message ?? dbEx.ToString();
                return Response<ReviewVM>.FailResponse(msg);
            }
            catch (Exception ex)
            {
                return Response<ReviewVM>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<bool>> DeleteReviewAsync(int id)
        {
            try
            {
                var existing = await _uow.Reviews.GetByIdAsync(id);
                if (existing == null) return Response<bool>.FailResponse("Review not found");
                var ok = await _uow.Reviews.DeleteAsync(existing);
                return ok ? Response<bool>.SuccessResponse(true) : Response<bool>.FailResponse("Failed to delete");
            }
            catch (DbUpdateException dbEx)
            {
                // Return inner exception message or full exception details to help identify DB-level errors
                var msg = dbEx.InnerException?.Message ?? dbEx.ToString();
                return Response<bool>.FailResponse(msg);
            }
            catch (Exception ex)
            {
                return Response<bool>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<List<ReviewVM>>> GetReviewsByListingAsync(int listingId)
        {
            try
            {
                var list = await _uow.Reviews.GetReviewsByListingAsync(listingId);
                var mapped = _mapper.Map<List<ReviewVM>>(list);
                return Response<List<ReviewVM>>.SuccessResponse(mapped);
            }
            catch (Exception ex)
            {
                return Response<List<ReviewVM>>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<List<ReviewVM>>> GetReviewsByGuestAsync(Guid guestId)
        {
            try
            {
                var list = await _uow.Reviews.GetReviewsByGuestAsync(guestId); 
                var mapped = _mapper.Map<List<ReviewVM>>(list);
                return Response<List<ReviewVM>>.SuccessResponse(mapped);
            }
            catch (Exception ex)
            {
                return Response<List<ReviewVM>>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<double>> GetAverageRatingAsync(int listingId)
        {
            try
            {
                // compute avg rating for a listing by joining bookings -> reviews
                var reviews = await _uow.Reviews.GetAllAsync();
                var filtered = reviews.Where(r => r.Booking != null && r.Booking.ListingId == listingId);
                var avg = filtered.Any() ? filtered.Average(r => r.Rating) : 0.0;
                return Response<double>.SuccessResponse(avg);
            }
            catch (Exception ex)
            {
                return Response<double>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<ReviewVM>> AddHostReplyAsync(int id, AddHostReplyVM model, Guid hostId)
        {
            try
            {
                var review = await _uow.Reviews.GetByIdWithGuestAsync(id);
                if (review == null) return Response<ReviewVM>.FailResponse("Review not found");

                // Verify host owns the listing
                var booking = await _uow.Bookings.GetByIdAsync(review.BookingId);
                if (booking == null) return Response<ReviewVM>.FailResponse("Booking not found");
                
                var listing = await _uow.Listings.GetByIdAsync(booking.ListingId);
                if (listing == null || listing.UserId != hostId)
                    return Response<ReviewVM>.FailResponse("Only the host can reply to this review");

                review.AddHostReply(model.Reply);
                await _uow.Reviews.UpdateAsync(review);
                await _uow.SaveChangesAsync();

                var vm = _mapper.Map<ReviewVM>(review);
                return Response<ReviewVM>.SuccessResponse(vm);
            }
            catch (Exception ex)
            {
                return Response<ReviewVM>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<ReviewVM>> AddReviewImagesAsync(int id, AddReviewImagesVM model, Guid userId)
        {
            try
            {
                var review = await _uow.Reviews.GetByIdWithGuestAsync(id);
                if (review == null) return Response<ReviewVM>.FailResponse("Review not found");

                // Verify user owns the review
                if (review.GuestId != userId)
                    return Response<ReviewVM>.FailResponse("Only the review owner can add images");

                review.AddImages(model.ImageUrls);
                await _uow.Reviews.UpdateAsync(review);
                await _uow.SaveChangesAsync();

                var vm = _mapper.Map<ReviewVM>(review);
                return Response<ReviewVM>.SuccessResponse(vm);
            }
            catch (Exception ex)
            {
                return Response<ReviewVM>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<ReviewVM>> VoteHelpfulAsync(int id, bool isHelpful)
        {
            try
            {
                var review = await _uow.Reviews.GetByIdWithGuestAsync(id);
                if (review == null) return Response<ReviewVM>.FailResponse("Review not found");

                review.VoteHelpful(isHelpful);
                await _uow.Reviews.UpdateAsync(review);
                await _uow.SaveChangesAsync();

                var vm = _mapper.Map<ReviewVM>(review);
                return Response<ReviewVM>.SuccessResponse(vm);
            }
            catch (Exception ex)
            {
                return Response<ReviewVM>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<ReviewVM>> FlagReviewAsync(int id, FlagReviewVM model, Guid userId)
        {
            try
            {
                var review = await _uow.Reviews.GetByIdWithGuestAsync(id);
                if (review == null) return Response<ReviewVM>.FailResponse("Review not found");

                review.Flag(model.Reason);
                await _uow.Reviews.UpdateAsync(review);
                await _uow.SaveChangesAsync();

                var vm = _mapper.Map<ReviewVM>(review);
                return Response<ReviewVM>.SuccessResponse(vm);
            }
            catch (Exception ex)
            {
                return Response<ReviewVM>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<ReviewVM>> UnflagReviewAsync(int id)
        {
            try
            {
                var review = await _uow.Reviews.GetByIdWithGuestAsync(id);
                if (review == null) return Response<ReviewVM>.FailResponse("Review not found");

                review.Unflag();
                await _uow.Reviews.UpdateAsync(review);
                await _uow.SaveChangesAsync();

                var vm = _mapper.Map<ReviewVM>(review);
                return Response<ReviewVM>.SuccessResponse(vm);
            }
            catch (Exception ex)
            {
                return Response<ReviewVM>.FailResponse(ex.Message);
            }
        }

        public async Task<Response<List<ReviewVM>>> GetFlaggedReviewsAsync()
        {
            try
            {
                var list = await _uow.Reviews.GetFlaggedReviewsAsync();
                var mapped = _mapper.Map<List<ReviewVM>>(list);
                return Response<List<ReviewVM>>.SuccessResponse(mapped);
            }
            catch (Exception ex)
            {
                return Response<List<ReviewVM>>.FailResponse(ex.Message);
            }
        }
    }
}
