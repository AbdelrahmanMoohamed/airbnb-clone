namespace BLL.ModelVM.Auth
{
    public class TokenRequestVM
    {
        public string UserId { get; set; } = null!;
        public string Role { get; set; } = "Guest";
        public string? FullName { get; set; }
        public string? OrderId { get; set; }
        public string? ListingId { get; set; }
    }
}