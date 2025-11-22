namespace BLL.ModelVM.Admin
{
 public class UserSummaryVM
 {
 public Guid Id { get; set; }
 public string Email { get; set; } = null!;
 public string FullName { get; set; } = null!;
 public string Role { get; set; } = null!;
 public bool IsActive { get; set; }
 }
}
