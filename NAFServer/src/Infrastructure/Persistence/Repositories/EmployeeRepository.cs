using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly CacheService _cache;
        private const string EmployeeKey = "employees:all";
        private const string DepartmentKey = "departments:all";

        public EmployeeRepository(CacheService cache)
        {
            _cache = cache;
        }

        private List<Employee> All() =>
            _cache.Get<List<Employee>>(EmployeeKey) ?? new List<Employee>();

        private List<DepartmentView> AllDepts() =>
            _cache.Get<List<DepartmentView>>(DepartmentKey) ?? new List<DepartmentView>();

        public Task<Employee?> GetByIdAsync(string employeeId) =>
            Task.FromResult(All().FirstOrDefault(e => e.Id == employeeId));

        public Task<Employee?> GetByFullNameAsync(string fullName) =>
            Task.FromResult(All().FirstOrDefault(e => e.FullName == fullName));

        public Task<List<Employee>> GetSubordinatesAsync(string employeeId)
        {
            var target = All().FirstOrDefault(e => e.Id == employeeId);
            if (target is null) return Task.FromResult(new List<Employee>());

            var result = All()
                .Where(e => e.SupervisorId == employeeId || e.DepartmentHead == target.FullName)
                .ToList();
            return Task.FromResult(result);
        }

        public Task<List<Employee>> SearchAsync(string match)
        {
            var result = All()
                .Where(e => e.Status == "Active" && (
                    e.Id.Contains(match, StringComparison.OrdinalIgnoreCase) ||
                    e.LastName.Contains(match, StringComparison.OrdinalIgnoreCase) ||
                    e.FirstName.Contains(match, StringComparison.OrdinalIgnoreCase) ||
                    (e.MiddleName != null && e.MiddleName.Contains(match, StringComparison.OrdinalIgnoreCase))
                ))
                .OrderBy(e => e.Id)
                .ToList();
            return Task.FromResult(result);
        }

        public Task<List<Employee>> GetByDepartmentAsync(string departmentId)
        {
            var result = All().Where(e => e.DepartmentId == departmentId).ToList();
            return Task.FromResult(result);
        }

        public Task<DepartmentView?> GetDepartmentByIdAsync(string departmentId) =>
            Task.FromResult(AllDepts().FirstOrDefault(d => d.Id == departmentId));
    }
}
