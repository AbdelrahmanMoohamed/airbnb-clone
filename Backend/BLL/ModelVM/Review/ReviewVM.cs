namespace BLL.ModelVM.Review
{
    public class ReviewVM
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public Guid GuestId { get; set; }
        public string GuestName { get; set; } = null!;
        public string? GuestProfileImg { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Enhanced features
        public string? HostReply { get; set; }
        public DateTime? HostReplyDate { get; set; }
        public List<string> ImageUrls { get; set; } = new List<string>();
        public int HelpfulVotes { get; set; }
        public int NotHelpfulVotes { get; set; }
        public bool IsFlagged { get; set; }
        public string? FlagReason { get; set; }
        public DateTime? FlaggedAt { get; set; }
    }
}
