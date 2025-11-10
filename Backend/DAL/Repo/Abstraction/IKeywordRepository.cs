namespace DAL.Repo.Abstraction
{
    public interface IKeywordRepository : IGenericRepository<Keyword>
    {
        Task<Keyword?> GetListingsWithKeywordAsync(int keywordId);             // All listings that use a specific keyword
        Task<IEnumerable<Keyword>> SearchKeywordsAsync(string searchTerm);     // Search for keywords that contain a word
    }
}
