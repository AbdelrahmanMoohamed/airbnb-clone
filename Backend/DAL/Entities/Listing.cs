namespace DAL.Entities
{
    public class Listing
    {
        public int Id { get; private set; }
        public string Title { get; private set; } = null!;
        public string Description { get; private set; } = null!;
        public decimal PricePerNight { get; private set; }
        public string Location { get; private set; } = null!;
        public double Latitude { get; private set; }
        public double Longitude { get; private set; }
        public int MaxGuests { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public bool IsPromoted { get; private set; }
        public DateTime? PromotionEndDate { get; private set; }

        // Foreign Key
        public Guid UserId { get; private set; }
        public User User { get; private set; } = null!;

        // Relationships
        public ICollection<Booking> Bookings { get; private set; } = new List<Booking>();
        public ICollection<Review> Reviews { get; private set; } = new List<Review>();
        public ICollection<Amenity> Amenities { get; private set; } = new List<Amenity>();
        public ICollection<Keyword> Keywords { get; private set; } = new List<Keyword>();
        public ICollection<ListingImage> Images { get; private set; } = new List<ListingImage>();

        private Listing() { }

        // Create a new listing
        public static Listing Create(
            string title,
            string description,
            decimal pricePerNight,
            string location,
            double latitude,
            double longitude,
            int maxGuests,
            Guid userId,
            bool isPromoted = false,
            DateTime? promotionEndDate = null)
        {
            return new Listing
            {
                Title = title,
                Description = description,
                PricePerNight = pricePerNight,
                Location = location,
                Latitude = latitude,
                Longitude = longitude,
                MaxGuests = maxGuests,
                CreatedAt = DateTime.UtcNow,
                UserId = userId,
                IsPromoted = isPromoted,
                PromotionEndDate = promotionEndDate
            };
        }

        // Update existing listing
        internal void Update(
            string title,
            string description,
            decimal pricePerNight,
            string location,
            double latitude,
            double longitude,
            int maxGuests,
            bool isPromoted,
            DateTime? promotionEndDate)
        {
            Title = title;
            Description = description;
            PricePerNight = pricePerNight;
            Location = location;
            Latitude = latitude;
            Longitude = longitude;
            MaxGuests = maxGuests;
            IsPromoted = isPromoted;
            PromotionEndDate = promotionEndDate;
        }
    }
}