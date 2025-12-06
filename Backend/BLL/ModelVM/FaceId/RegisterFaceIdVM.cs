
using System.Text.Json.Serialization;

namespace BLL.ModelVM.FaceId
{
    public class RegisterFaceIdVM
    {
        [JsonIgnore]
        public double[]? Encoding { get; set; }
        public string? CreatedBy { get; set; }
        public Guid? UserId { get; set; }
        public IFormFile? imageFile { get; set; }
    }
}
