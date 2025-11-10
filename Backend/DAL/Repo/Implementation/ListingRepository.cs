namespace DAL.Repo.Implementation
{
    public class ListingRepository : GenericRepository<Listing>, IListingRepository
    {
        public ListingRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<Listing>> GetListingsByUserAsync(Guid userId)
        {
            return await _context.Listings
                .Where(l => l.UserId == userId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Listing>> GetActivePromotedListingsAsync()
        {
            var now = DateTime.UtcNow;
            return await _context.Listings
                .Where(l => l.IsPromoted && (l.PromotionEndDate == null || l.PromotionEndDate > now))
                .ToListAsync();
        }
    }
}
