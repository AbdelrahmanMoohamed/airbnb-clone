

namespace DAL.Repo.Abstraction
{
    public interface IFaceIdRepo
    {
        Task<FaceId?> GetByIdAsync(int id);
        Task<IEnumerable<FaceId>> GetByUserIdAsync(Guid userId); // Get FaceIds by UserId
        Task<bool> AddAsync(FaceId face);
        Task<bool> UpdateAsync(FaceId newFace);
        Task<List<User>> GetAllUsersWithFacesAsync();
        Task<bool> DeleteAsync(Guid userId);
    }
}
