using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IDepartmentRepository
    {
        public Task<Department?> GetByIdAsync(int id);
        public Task<Department> GetByCodeAsync(string departmentCode);
        public Task<List<Department>> GetAllAsync();
        public Task<Department> AddAsync(CreateDepartmentDTO department);
        public Task RemoveAsync(string code);
        public Task<Department> SetDepartmentHeadAsync(string departmentCode, string employeeNumber);
        public Task<Department> SetLocationAsync(string departmentCode, int locationId);
    }
}
