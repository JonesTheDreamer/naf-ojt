using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class RoleRepository : IRoleRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cache;
        private static readonly TimeSpan Ttl = TimeSpan.FromHours(24);
        private const string AllKey = "roles:all";

        public RoleRepository(AppDbContext context, CacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<Role?> GetByNameAsync(Roles role)
        {
            var all = await GetAllAsync();
            return all.FirstOrDefault(r => r.Name == role);
        }

        public Task<List<Role>> GetAllAsync() =>
            _cache.GetOrSetAsync(AllKey, () => _context.Roles.ToListAsync(),
                new() { AbsoluteExpirationRelativeToNow = Ttl });
    }
}
