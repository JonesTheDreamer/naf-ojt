using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceGroupRepository : IResourceGroupRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cache;
        private static readonly TimeSpan Ttl = TimeSpan.FromHours(24);
        private const string AllKey = "resource-groups:all";

        public ResourceGroupRepository(AppDbContext context, CacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        public Task<List<ResourceGroup>> GetAllGroupsAsync() =>
            _cache.GetOrSetAsync(AllKey,
                () => _context.ResourceGroups.Include(g => g.Resources).ToListAsync(),
                new() { AbsoluteExpirationRelativeToNow = Ttl });

        public async Task<ResourceGroup?> GetGroupByIdAsync(int id)
        {
            var groups = await GetAllGroupsAsync();
            return groups.FirstOrDefault(g => g.Id == id);
        }
    }
}
