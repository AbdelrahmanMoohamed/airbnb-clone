
using BLL.ModelVM.FaceId;

namespace BLL.Services.Abstractions
{
    public interface IFaceIdService
    {
        Task<Response<FaceId>> RegisterFaceAsync(RegisterFaceIdVM model);
        Task<Response<bool>> UpdateFaceAsync(UpdateFaceIdVM model);
        Task<Response<IEnumerable<FaceId>>> VerifyFaceByUserIdAsync(Guid userId);
        Task<Response<string>> VerifyFaceLoginAsync(IFormFile image);
        Task<Response<bool>> DeleteFaceAsync(Guid userId);
    }
}
