namespace DAL.Repo.Abstraction
{
    public interface IAmenityRepository : IGenericRepository<Amenity>
    {
        Task<IEnumerable<Listing>> GetListingsWithAmenityAsync(int amenityId);       // All listings with a specific amenity
        Task<IEnumerable<Amenity>> SearchAmenitiesAsync(string searchTerm);          // Search amenities by partial name
    }
}
