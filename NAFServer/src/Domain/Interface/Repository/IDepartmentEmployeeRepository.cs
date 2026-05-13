using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IDepartmentEmployeeRepository
    {
        Task<List<DepartmentEmployee>> GetActiveByDepartmentAsync(int departmentId);
        Task<DepartmentEmployee?> GetActiveAsync(int departmentId, string employeeId);
        Task<DepartmentEmployee> AddAsync(int departmentId, string employeeId);
        Task RemoveAsync(int departmentId, string employeeId);
    }
}
