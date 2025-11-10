namespace DAL.Entities
{
    public class ListingImage
    {
        public int Id { get; private set; }
        public int ListingId { get; private set; }
        public string ImageUrl { get; private set; } = null!;

        // Relationships
        public Listing Listing { get; private set; } = null!;

        private ListingImage() { }

        // Create a new listing image
        public static ListingImage Create(
            int listingId,
            string imageUrl)
        {
            return new ListingImage
            {
                ListingId = listingId,
                ImageUrl = imageUrl
            };
        }

        // Update existing image
        internal void Update(string imageUrl)
        {
            ImageUrl = imageUrl;
        }
    }
}