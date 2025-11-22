namespace BLL.ModelVM.Review
{
 public class CreateReviewVM
 {
 public int BookingId { get; set; }
 public Guid GuestId { get; set; }
 public int Rating { get; set; }
 public string Comment { get; set; } = null!;
 public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
 }
}
