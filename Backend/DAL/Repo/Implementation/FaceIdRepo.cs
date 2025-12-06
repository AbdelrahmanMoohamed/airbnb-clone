


namespace DAL.Repo.Implementation
{
    public class FaceIdRepo : IFaceIdRepo
    {
        private readonly AppDbContext _context;
        public FaceIdRepo(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> AddAsync(FaceId face)
        {
            try
            {
                if (face != null)
                {
                    var result = await _context.FaceIds.AddAsync(face);
                    await _context.SaveChangesAsync();
                    return result.Entity.Id > 0;
                }
                return false;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<bool> DeleteAsync(Guid userId)
        {
            try
            {
                if(!string.IsNullOrEmpty(userId.ToString()))
                {
                    var faces = _context.FaceIds.Where(f => f.UserId == userId);
                    _context.FaceIds.RemoveRange(faces);
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<List<User>> GetAllUsersWithFacesAsync()
        {
            try
            {
                var usersWithFaces = await _context.Users
                    .Include(u => u.FaceIds)
                    .ToListAsync();
                return usersWithFaces;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<FaceId?> GetByIdAsync(int id)
        {
            try
            {
                if(id > 0)
                {
                    IQueryable<FaceId> query = _context.FaceIds.Where(f => f.Id == id);
                    var face = await query.FirstOrDefaultAsync();
                    if (face != null)
                    {
                        return face;
                    }
                    return null;
                }
                return null;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<IEnumerable<FaceId>> GetByUserIdAsync(Guid userId)
        {
            try
            {
                IQueryable<FaceId> query = _context.FaceIds.Where(f => f.UserId == userId);
                return await query.ToListAsync();
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<bool> UpdateAsync(FaceId newFace)
        {
            try
            {
                if (newFace == null)
                    return false;
                var oldFace = await _context.FaceIds.FirstOrDefaultAsync(f => f.Id == newFace.Id);
                if (oldFace == null)
                    return false;
                bool result = oldFace.Update(newFace.GetEncodingAsDouble(), newFace.UpdatedBy ?? "system");
                if (result)
                {
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
