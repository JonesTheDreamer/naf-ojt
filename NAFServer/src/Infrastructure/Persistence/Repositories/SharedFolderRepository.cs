using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class SharedFolderRepository : ISharedFolderRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cache;
        private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(30);
        internal const string AllKey = "shared-folders:all";

        public SharedFolderRepository(AppDbContext context, CacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        public Task<List<SharedFolder>> GetAllAsync() =>
            _cache.GetOrSetAsync(AllKey, () => _context.SharedFolders.ToListAsync(),
                new() { AbsoluteExpirationRelativeToNow = Ttl });
    }
}
