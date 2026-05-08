using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cache;
        private static readonly TimeSpan EmployeeTtl = TimeSpan.FromHours(4);

        public EmployeeRepository(AppDbContext context, CacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        public Task<Employee?> GetByIdAsync(string employeeNumber) =>
            _cache.GetOrSetAsync(
                $"employee:{employeeNumber}",
                () => _context.Employees.FindAsync(employeeNumber).AsTask(),
                new() { AbsoluteExpirationRelativeToNow = EmployeeTtl });

        public Task<List<Employee>> GetEmployeeSubordinates(string employeeNumber) =>
            _cache.GetOrSetAsync(
                $"employee-subordinates:{employeeNumber}",
                () => _context.Employees
                    .Where(e => e.SupervisorId == employeeNumber || e.DepartmentHeadId == employeeNumber)
                    .AsNoTracking()
                    .ToListAsync(),
                new() { AbsoluteExpirationRelativeToNow = EmployeeTtl });

        public async Task<List<Employee>> SearchEmployee(string match)
        {
            return await _context.Employees
                .Where(e =>
                    e.Status == "Active" && (
                        e.Id.Contains(match) ||
                        e.LastName.Contains(match) ||
                        e.FirstName.Contains(match) ||
                        (e.MiddleName != null && e.MiddleName.Contains(match))
                    ))
                .OrderBy(e => e.Id)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
