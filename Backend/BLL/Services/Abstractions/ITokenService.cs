namespace BLL.Services.Abstractions
{
    public interface ITokenService
    {
        string GenerateToken(Guid userId, string role, string fullName, Guid? orderId = null, Guid? listingId = null);
    }
}
