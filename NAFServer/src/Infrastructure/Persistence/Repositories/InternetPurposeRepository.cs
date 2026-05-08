using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class InternetPurposeRepository : IInternetPurposeRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cache;
        private static readonly TimeSpan Ttl = TimeSpan.FromHours(1);
        private const string AllKey = "internet-purposes:all";

        public InternetPurposeRepository(AppDbContext context, CacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        public Task<List<InternetPurpose>> GetAllAsync() =>
            _cache.GetOrSetAsync(AllKey, () => _context.InternetPurposes.ToListAsync(),
                new() { AbsoluteExpirationRelativeToNow = Ttl });

        public async Task<InternetPurpose> CreateAsync(string name, string description)
        {
            var entity = new InternetPurpose(name, description);
            _context.InternetPurposes.Add(entity);
            await _context.SaveChangesAsync();
            _cache.Remove(AllKey);
            return entity;
        }
    }
}
