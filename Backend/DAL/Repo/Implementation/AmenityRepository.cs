namespace DAL.Repo.Implementation
{
    public class AmenityRepository : GenericRepository<Amenity>, IAmenityRepository
    {
        public AmenityRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<Listing>> GetListingsWithAmenityAsync(int amenityId)
        {
            var amenity = await _context.Amenities
                .Include(a => a.Listings)
                .FirstOrDefaultAsync(a => a.Id == amenityId);

            return amenity?.Listings ?? new List<Listing>();
        }

        public async Task<IEnumerable<Amenity>> SearchAmenitiesAsync(string searchTerm)
        {
            return await _context.Amenities
                .Where(a => a.Name.Contains(searchTerm))
                .ToListAsync();
        }
    }
}
