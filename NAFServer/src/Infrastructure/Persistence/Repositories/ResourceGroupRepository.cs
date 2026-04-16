using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceGroupRepository : IResourceGroupRepository
    {
        private readonly CacheService _cacheService;
        private readonly AppDbContext _context;
        private readonly string _cacheKey = "ResourceGroups";

        public ResourceGroupRepository(AppDbContext context, CacheService cacheService)
        {
            _context = context;
            _cacheService = cacheService;
        }

        public async Task<List<ResourceGroup>> GetAllGroupsAsync()
        {
            return await _cacheService.GetOrSetAsync(_cacheKey, async () =>
            {
                return await _context.ResourceGroups
                    .Include(g => g.Resources)
                    .ToListAsync();
            });
        }

        public async Task<ResourceGroup?> GetGroupByIdAsync(int id)
        {
            var groups = await GetAllGroupsAsync();
            return groups.FirstOrDefault(g => g.Id == id);
        }

        public void InvalidateCache()
        {
            _cacheService.Remove(_cacheKey);
        }
    }
}
