using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceRepository : IResourceRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cache;
        private static readonly TimeSpan Ttl = TimeSpan.FromHours(24);
        private const string AllKey = "resources:all";

        public ResourceRepository(AppDbContext context, CacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        public Task<List<Resource>> GetAllResourcesAsync() =>
            _cache.GetOrSetAsync(AllKey, () => _context.Resources.ToListAsync(),
                new() { AbsoluteExpirationRelativeToNow = Ttl });

        public async Task<Resource> GetResourceByIdAsync(int resourceId)
        {
            var all = await GetAllResourcesAsync();
            return all.FirstOrDefault(r => r.Id == resourceId)
                ?? throw new KeyNotFoundException("Resource not found.");
        }
    }
}
