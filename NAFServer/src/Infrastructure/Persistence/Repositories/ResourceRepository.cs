using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceRepository : IResourceRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cacheService;
        private readonly string _cacheKey = "all_resources";

        public ResourceRepository(AppDbContext context, CacheService cacheService)
        {
            _context = context;
            _cacheService = cacheService;
        }

        public async Task<List<Resource>> GetAllResourcesAsync()
        {
            return await _cacheService.GetOrSetAsync(_cacheKey, async () =>
            {
                return await _context.Resources.ToListAsync();
            });
        }

        public async Task<Resource> GetResourceByIdAsync(int resourceId)
        {
            var resources = await GetAllResourcesAsync();

            return resources.SingleOrDefault(r => r.Id == resourceId)
                 ?? throw new KeyNotFoundException("Resource not found.");
        }
    }
}
