using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class SharedFolderRepository : ISharedFolderRepository
    {
        private readonly AppDbContext _context;

        public SharedFolderRepository(AppDbContext context, CacheService cacheService)
        {
            _context = context;
        }

        public async Task<List<SharedFolder>> GetAllAsync()
        {
            return await _context.SharedFolders.ToListAsync();
        }
    }
}
