namespace DAL.Entities
{
    public class Review
    {
        public int Id { get; private set; }
        public int BookingId { get; private set; }
        public Guid GuestId { get; set; } 
        public int Rating { get; private set; }
        public string Comment { get; private set; } = null!;
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }
        
        // Enhanced features
        public string? HostReply { get; private set; }
        public DateTime? HostReplyDate { get; private set; }
        public List<string> ImageUrls { get; private set; } = new List<string>();
        public int HelpfulVotes { get; private set; } = 0;
        public int NotHelpfulVotes { get; private set; } = 0;
        public bool IsFlagged { get; private set; } = false;
        public string? FlagReason { get; private set; }
        public DateTime? FlaggedAt { get; private set; }

        // Relationships
        public Booking? Booking { get; private set; }
        public User? Guest { get; private set; }

        private Review() { }
         
        // Create a review
        public static Review Create(
            int bookingId,
            Guid guestId,
            int rating,
            string comment,
            DateTime createdAt)
        {
            return new Review
            {
                BookingId = bookingId,
                GuestId = guestId,
                Rating = rating,
                Comment = comment,
                CreatedAt = createdAt
            };
        }
         
        // Update existing review
        public void Update(
            int rating,
            string comment)
        {
            Rating = rating;
            Comment = comment;
            UpdatedAt = DateTime.UtcNow;
        }
        
        // Add images to review
        public void AddImages(List<string> imageUrls)
        {
            ImageUrls = imageUrls ?? new List<string>();
            UpdatedAt = DateTime.UtcNow;
        }
        
        // Host reply to review
        public void AddHostReply(string reply)
        {
            HostReply = reply;
            HostReplyDate = DateTime.UtcNow;
        }
        
        // Vote helpful
        public void VoteHelpful(bool isHelpful)
        {
            if (isHelpful)
                HelpfulVotes++;
            else
                NotHelpfulVotes++;
        }
        
        // Flag review
        public void Flag(string reason)
        {
            IsFlagged = true;
            FlagReason = reason;
            FlaggedAt = DateTime.UtcNow;
        }
        
        // Unflag review (admin action)
        public void Unflag()
        {
            IsFlagged = false;
            FlagReason = null;
            FlaggedAt = null;
        }
    }
}