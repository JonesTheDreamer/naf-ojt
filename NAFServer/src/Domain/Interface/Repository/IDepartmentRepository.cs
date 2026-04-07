using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IDepartmentRepository
    {
        public Task<Department?> GetByIdAsync(string departmentCode);

    }
}
