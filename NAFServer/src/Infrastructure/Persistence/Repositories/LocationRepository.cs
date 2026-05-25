using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class LocationRepository : ILocationRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cache;
        private static readonly TimeSpan Ttl = TimeSpan.FromHours(24);
        private const string AllKey = "locations:all";

        public LocationRepository(AppDbContext context, CacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        public Task<List<Location>> GetAllAsync() =>
            _cache.GetOrSetAsync(AllKey, () => _context.Locations.ToListAsync(),
                new() { AbsoluteExpirationRelativeToNow = Ttl });

        public async Task<Location?> GetByIdAsync(int id)
        {
            var locations = await GetAllAsync();
            return locations.FirstOrDefault(l => l.Id == id);
        }

        public async Task<Location?> GetByNameAsync(string name)
        {
            var locations = await GetAllAsync();
            return locations.FirstOrDefault(l => l.Name == name);
        }

        public async Task<Location> CreateAsync(string name)
        {
            var entity = new Location(name);
            _context.Locations.Add(entity);
            await _context.SaveChangesAsync();
            _cache.Remove(AllKey);
            return entity;
        }

        public async Task<Location> UpdateAllowWeekendAsync(int id, bool allowWeekend)
        {
            var location = await _context.Locations.FindAsync(id)
                ?? throw new KeyNotFoundException($"Location {id} not found.");
            location.AllowWeekendDateNeeded = allowWeekend;
            await _context.SaveChangesAsync();
            _cache.Remove(AllKey);
            return location;
        }
    }
}
