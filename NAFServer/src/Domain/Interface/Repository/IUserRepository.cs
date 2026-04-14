using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IUserRepository
    {
        Task<bool> HasRoleAsync(string employeeId, Roles role);
        Task<List<User>> GetAllAsync();
        Task<List<UserRole>> GetRolesByEmployeeIdAsync(string employeeId);
        Task AddAsync(User user, UserRole userRole);
        Task RemoveRoleAsync(string employeeId, Roles role);
        Task<List<string>> GetLocationsAsync();
        Task AssignLocationAsync(string employeeId, string location);
        Task<User> GetNetworkAdminOfLocation(string location);
        Task<User> GetUserById(string employeeId);
    }
}
