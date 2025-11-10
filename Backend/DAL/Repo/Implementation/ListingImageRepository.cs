namespace DAL.Repo.Implementation
{
    public class ListingImageRepository : GenericRepository<ListingImage>, IListingImageRepository
    {
        public ListingImageRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<ListingImage>> GetImagesByListingIdAsync(int listingId)
        {
            return await _context.ListingImages
                .Where(i => i.ListingId == listingId)
                .ToListAsync();
        }

        public async Task DeleteImagesByListingIdAsync(int listingId)
        {
            var images = await _context.ListingImages
                .Where(i => i.ListingId == listingId)
                .ToListAsync();

            if (images.Any())
            {
                _context.ListingImages.RemoveRange(images);
                await _context.SaveChangesAsync();
            }
        }
    }
}
