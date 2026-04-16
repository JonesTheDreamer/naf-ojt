using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class InternetPurposeRepository : IInternetPurposeRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cacheService;
        private readonly string cacheKey = "all_InternetPurposes";

        public InternetPurposeRepository(AppDbContext context, CacheService cacheService)
        {
            _context = context;
            _cacheService = cacheService;
        }

        public async Task<List<InternetPurpose>> GetAllAsync()
        {
            return await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                return await _context.InternetPurposes.ToListAsync();
            });

        }

        public async Task<List<InternetPurpose>> RecacheAllAsync()
        {
            _cacheService.Remove(cacheKey);
            return await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                return await _context.InternetPurposes.ToListAsync();
            });
        }

        public async Task<InternetPurpose> CreateAsync(string name, string description)
        {
            var entity = new InternetPurpose(name, description);
            _context.InternetPurposes.Add(entity);
            await _context.SaveChangesAsync();
            await RecacheAllAsync();
            return entity;
        }
    }
}
