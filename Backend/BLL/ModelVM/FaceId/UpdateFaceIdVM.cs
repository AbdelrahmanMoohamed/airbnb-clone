

using System.Text.Json.Serialization;

namespace BLL.ModelVM.FaceId
{
    public class UpdateFaceIdVM
    {
        public int Id { get; set; }
        [JsonIgnore]
        public double[]? Encoding { get; set; }
        public string? UpdatedBy { get; set; }
        public Guid? UserId { get; set; }
        public IFormFile imageFile { get; set; }
    }
}
