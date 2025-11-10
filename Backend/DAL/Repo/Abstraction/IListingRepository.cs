namespace DAL.Repo.Abstraction
{
    public interface IListingRepository : IGenericRepository<Listing>
    {
        Task<IEnumerable<Listing>> GetListingsByUserAsync(Guid userId);         // Listings for a specific user (owner)
        Task<IEnumerable<Listing>> GetActivePromotedListingsAsync();            // Active promoted listings
    }
}
