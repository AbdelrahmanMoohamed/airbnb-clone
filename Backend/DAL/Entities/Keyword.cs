namespace DAL.Entities
{
    public class Keyword
    {
        public int Id { get; private set; }
        public string Word { get; private set; } = null!;

        // Relationships
        public ICollection<Listing> Listings { get; private set; } = new List<Listing>();

        private Keyword() { }

        // Create a new keyword
        public static Keyword Create(string word)
        {
            return new Keyword
            {
                Word = word
            };
        }

        // Update existing keyword
        internal void Update(string word)
        {
            Word = word;
        }
    }
}
