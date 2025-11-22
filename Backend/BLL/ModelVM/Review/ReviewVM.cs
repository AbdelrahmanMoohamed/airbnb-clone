namespace BLL.ModelVM.Review
{
 public class ReviewVM
 {
 public int Id { get; set; }
 public int BookingId { get; set; }
 public Guid GuestId { get; set; }
 public int Rating { get; set; }
 public string Comment { get; set; } = null!;
 public DateTime CreatedAt { get; set; }
 }
}
