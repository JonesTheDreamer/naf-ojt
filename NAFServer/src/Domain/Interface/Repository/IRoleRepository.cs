using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IRoleRepository
    {
        Task<Role?> GetByNameAsync(Roles role);
        Task<List<Role>> GetAllAsync();
    }
}
