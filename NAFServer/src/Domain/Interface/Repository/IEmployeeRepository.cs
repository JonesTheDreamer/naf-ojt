using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IEmployeeRepository
    {
        Task<Employee?> GetByIdAsync(string employeeId);
        Task<Employee?> GetByFullNameAsync(string fullName);
        Task<List<Employee>> GetSubordinatesAsync(string employeeId);
        Task<List<Employee>> SearchAsync(string match);
        Task<List<Employee>> GetByDepartmentAsync(string departmentId);
        Task<DepartmentView?> GetDepartmentByIdAsync(string departmentId);
        Task<List<DepartmentView>> GetAllDepartmentsAsync();
    }
}
