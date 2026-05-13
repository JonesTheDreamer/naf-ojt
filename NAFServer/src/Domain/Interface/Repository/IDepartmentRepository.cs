using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IDepartmentRepository
    {
        Task<Department?> GetByIdAsync(int id);
        Task<Department> GetByCodeAsync(string departmentCode);
        Task<List<Department>> GetAllAsync(int? locationId = null);
        Task<Department> AddAsync(CreateDepartmentDTO department);
        Task RemoveAsync(string code);
        Task<Department> SetDepartmentHeadAsync(string departmentCode, string employeeNumber);
        Task<Department> SetLocationAsync(string departmentCode, int locationId);
    }
}
