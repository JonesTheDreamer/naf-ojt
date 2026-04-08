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
                return await _context.Employees.FindAsync(employeeNumber);
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
                return await _context.Employees
                    .Where(e =>
                        e.SupervisorId == employeeNumber ||
                        e.DepartmentHeadId == employeeNumber)
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
            return await _context.Employees
                .Where(e =>
                    e.Status == "1" && (
                        e.Id.Contains(match) ||
                        e.LastName.Contains(match) ||
                        e.FirstName.Contains(match) ||
                        (e.MiddleName != null && e.MiddleName.Contains(match)) ||
                        (e.Location != null && e.Location.Contains(match)) ||
                        e.DepartmentId.Contains(match)
                    ))
                .OrderBy(e => e.Id)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
