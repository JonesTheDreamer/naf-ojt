using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class InternetResourceRepository : IInternetResourceRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cache;
        private static readonly TimeSpan Ttl = TimeSpan.FromHours(1);
        private const string AllKey = "internet-resources:all";

        public InternetResourceRepository(AppDbContext context, CacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        public Task<List<InternetResource>> GetAllAsync() =>
            _cache.GetOrSetAsync(AllKey,
                () => _context.InternetResources.Include(ir => ir.Purpose).ToListAsync(),
                new() { AbsoluteExpirationRelativeToNow = Ttl });

        public async Task<InternetResource> GetByIdAsync(int id)
        {
            var all = await GetAllAsync();
            return all.FirstOrDefault(r => r.Id == id)
                ?? throw new KeyNotFoundException("Resource not found");
        }

        public async Task<InternetResource> CreateAsync(string name, string url, string? description, int purposeId)
        {
            var entity = new InternetResource(name, url, description, purposeId);
            _context.InternetResources.Add(entity);
            await _context.SaveChangesAsync();
            _cache.Remove(AllKey);
            return entity;
        }
    }
}
