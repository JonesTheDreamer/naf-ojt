using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class DepartmentRepository : IDepartmentRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cacheService;

        public DepartmentRepository(AppDbContext context, CacheService cacheService)
        {
            _context = context;
            _cacheService = cacheService;
        }

        private string GetCacheKey(string departmentCode) => $"single_Department:{departmentCode}";
        public async Task<Department?> GetByIdAsync(string departmentCode)
        {
            string cacheKey = GetCacheKey(departmentCode);
            return await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                return await _context.Set<Department>()
                .FromSqlRaw(
                    "EXEC sp_GetDepartmentDetails @DepartmentCode",
                    new SqlParameter("@DepartmentCode", departmentCode)
                )
                .AsNoTracking()
                    .SingleOrDefaultAsync();
            },
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(4)
            });
        }
    }
}
