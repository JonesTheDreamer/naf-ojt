using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cacheService;
        //private readonly string singleEmployeeCacheKey = "single_Employee";

        public EmployeeRepository(AppDbContext context, CacheService cacheService)
        {
            _context = context;
            _cacheService = cacheService;
        }

        private static string GetSingleEmployeeCacheKey(string employeeNumber)
        {
            return $"single_Employee:{employeeNumber}";
        }

        private static string GetEmployeeSubordinatesCacheKey(string employeeNumber)
        {
            return $"subordinates_Employee:{employeeNumber}";
        }

        public async Task<Employee?> GetByIdAsync(string employeeNumber)
        {
            string cacheKey = GetSingleEmployeeCacheKey(employeeNumber);

            return await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                var employee = await _context.Set<Employee>()
                    .FromSqlRaw(
                        "EXEC sp_GetEmployeeDetails @EmployeeNumber",
                        new SqlParameter("@EmployeeNumber", employeeNumber)
                    )
                    .AsNoTracking()
                    .ToListAsync();
                return employee.SingleOrDefault();
            },
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(4)
            });
        }

        public async Task<List<Employee>> GetEmployeeSubordinates(string employeeNumber)
        {
            string cacheKey = GetEmployeeSubordinatesCacheKey(employeeNumber);

            return await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                return await _context.Set<Employee>()
                    .FromSqlRaw(
                        "EXEC sp_GetSubordinates @EmployeeNumber",
                        new SqlParameter("@EmployeeNumber", employeeNumber)
                    )
                    .AsNoTracking()
                    .ToListAsync();
            },
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(4)
            });
        }

        public async Task<List<Employee>> SearchEmployee(string match)
        {
            return await _context.Set<Employee>()
                    .FromSqlRaw(
                        "EXEC sp_SearchEmployee @SearchTerm",
                        new SqlParameter("@SearchTerm", match)
                    )
                    .AsNoTracking()
                    .ToListAsync();
        }
    }
}
