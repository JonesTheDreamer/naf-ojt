using NAFServer.src.Application.DTOs.Department;

namespace NAFServer.src.Application.Interfaces
{
    public interface IDepartmentService
    {
        Task<List<DepartmentDTO>> GetAllDepartmentsAsync();
        Task<DepartmentDTO> GetDepartmentByIdAsync(int departmentId);
        Task<DepartmentDTO> GetDepartmentByCodeAsync(string code);
        Task<DepartmentDTO> CreateDepartmentAsync(CreateDepartmentDTO req);
        Task RemoveDepartment(string Code);
        Task<DepartmentDTO> SetDepartmentHeadAsync(string code, string employeeNumber);
        Task<DepartmentDTO> SetLocationAsync(string code, int locationId);
    }
}
