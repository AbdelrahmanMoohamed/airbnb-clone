namespace BLL.ModelVM.Auth
{
    public class OAuthVM
    {
        public string Provider { get; set; } = null!;
        public string ExternalToken { get; set; } = null!;
    }
}