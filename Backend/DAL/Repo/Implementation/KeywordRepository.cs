namespace DAL.Repo.Implementation
{
    public class KeywordRepository : GenericRepository<Keyword>, IKeywordRepository
    {
        public KeywordRepository(AppDbContext context) : base(context) { }

        public async Task<Keyword?> GetListingsWithKeywordAsync(int keywordId)
        {
            return await _context.Keywords
                .Include(k => k.Listings)
                .FirstOrDefaultAsync(k => k.Id == keywordId);
        }

        public async Task<IEnumerable<Keyword>> SearchKeywordsAsync(string searchTerm)
        {
            return await _context.Keywords
                .Where(k => k.Word.Contains(searchTerm))
                .ToListAsync();
        }
    }
}