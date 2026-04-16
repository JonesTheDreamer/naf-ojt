using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class InternetResourceRepository : IInternetResourceRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cacheService;
        private readonly string cacheKey = "all_InternetResources";

        public InternetResourceRepository(AppDbContext context, CacheService cacheService)
        {
            _context = context;
            _cacheService = cacheService;
        }

        public async Task<List<InternetResource>> GetAllAsync()
        {
            return await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                return await _context.InternetResources
                .Include(ir => ir.Purpose)
                .ToListAsync();
            });

        }

        public async Task<InternetResource> GetByIdAsync(int id)
        {
            var resources = await GetAllAsync();
            return resources.Where(r => r.Id == id)
                .FirstOrDefault()
                ?? throw new KeyNotFoundException("Resource not found");
        }

        public async Task<List<InternetResource>> RecacheAllAsync()
        {
            _cacheService.Remove(cacheKey);
            return await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                return await _context.InternetResources.ToListAsync();
            });
        }

        public async Task<InternetResource> CreateAsync(string name, string url, string? description, int purposeId)
        {
            var entity = new InternetResource(name, url, description, purposeId);
            _context.InternetResources.Add(entity);
            await _context.SaveChangesAsync();
            await RecacheAllAsync();
            return entity;
        }
    }
}
