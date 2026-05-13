using NAFServer.src.Application.DTOs.Department;

namespace NAFServer.src.Application.Interfaces
{
    public interface IDepartmentEmployeeService
    {
        Task<List<DepartmentEmployeeDTO>> GetDepartmentEmployeesAsync(int departmentId);
        Task AddEmployeeToDepartmentAsync(int departmentId, string employeeId);
        Task RemoveEmployeeFromDepartmentAsync(int departmentId, string employeeId);
    }
}
