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
        private const string EmployeeKey = "employees:all";
        private const string DepartmentKey = "departments:all";

        public EmployeeRepository(AppDbContext context, CacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        private Task<List<Employee>> GetAllAsync() =>
            _cache.GetOrSetAsync(EmployeeKey, () => _context.Employees.AsNoTracking().ToListAsync());

        private Task<List<DepartmentView>> GetAllDeptsAsync() =>
            _cache.GetOrSetAsync(DepartmentKey, () => _context.DepartmentViews.AsNoTracking().ToListAsync());

        public async Task<Employee?> GetByIdAsync(string employeeId)
        {
            try
            {
                var all = await GetAllAsync();
                return all.FirstOrDefault(e => e.Id == employeeId);
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }

        }

        public async Task<Employee?> GetByFullNameAsync(string fullName)
        {
            var all = await GetAllAsync();
            return all.FirstOrDefault(e => e.FullName == fullName);
        }

        public async Task<List<Employee>> GetSubordinatesAsync(string employeeId)
        {
            var all = await GetAllAsync();
            var target = all.FirstOrDefault(e => e.Id == employeeId);
            if (target is null)
                return [];

            return all.Where(e => e.DepartmentId == target.DepartmentId).ToList();
        }

        public async Task<List<Employee>> SearchAsync(string match)
        {
            var all = await GetAllAsync();
            return all
                .Where(e => e.Status == "Active" && (
                    e.Id.Contains(match, StringComparison.OrdinalIgnoreCase) ||
                    e.LastName.Contains(match, StringComparison.OrdinalIgnoreCase) ||
                    e.FirstName.Contains(match, StringComparison.OrdinalIgnoreCase) ||
                    (e.MiddleName != null && e.MiddleName.Contains(match, StringComparison.OrdinalIgnoreCase))
                ))
                .OrderBy(e => e.Id)
                .ToList();
        }

        public async Task<List<Employee>> GetByDepartmentAsync(string departmentId)
        {
            var all = await GetAllAsync();
            return all.Where(e => e.DepartmentId == departmentId).ToList();
        }

        public async Task<DepartmentView?> GetDepartmentByIdAsync(string departmentId)
        {
            var all = await GetAllDeptsAsync();
            return all.FirstOrDefault(d => d.Id == departmentId);
        }

        public async Task<List<DepartmentView>> GetAllDepartmentsAsync()
        {
            return await GetAllDeptsAsync();
        }
    }
}
