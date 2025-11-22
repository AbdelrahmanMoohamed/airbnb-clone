namespace BLL.ModelVM.Message
{
 public class CreateMessageVM
 {
 public Guid SenderId { get; set; }
 public Guid ReceiverId { get; set; }
 public string Content { get; set; } = null!;
 }
}
