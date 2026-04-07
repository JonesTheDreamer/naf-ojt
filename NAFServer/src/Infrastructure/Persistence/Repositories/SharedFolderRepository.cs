using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class SharedFolderRepository : ISharedFolderRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cacheService;
        private readonly string _cacheKey = "all_SharedFolders";

        public SharedFolderRepository(AppDbContext context, CacheService cacheService)
        {
            _context = context;
            _cacheService = cacheService;
        }

        public async Task<List<SharedFolder>> GetAllAsync()
        {
            return await _cacheService.GetOrSetAsync(_cacheKey, async () =>
                await _context.SharedFolders.ToListAsync());
        }
    }
}
