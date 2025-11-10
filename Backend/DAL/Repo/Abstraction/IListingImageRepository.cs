namespace DAL.Repo.Abstraction
{
    public interface IListingImageRepository : IGenericRepository<ListingImage>
    {
        Task<IEnumerable<ListingImage>> GetImagesByListingIdAsync(int listingId);      // All images of a listing
        Task DeleteImagesByListingIdAsync(int listingId);                              // Delete all images for a listing
    }
}
