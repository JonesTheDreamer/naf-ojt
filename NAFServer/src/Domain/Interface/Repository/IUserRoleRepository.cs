using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IUserRoleRepository
    {
        Task<List<UserRole>> GetUserRolesAsync(int userId);
        Task<List<UserRole>> GetUserActiveRolesAsync(int userId);
        Task<List<UserRole>> AddUserRoleAsync(int userId, int roleId);
        Task<List<UserRole>> RemoveUserRoleAsync(int userId, int roleId);
        Task<bool> UserHasRoleAsync(int userId, int roleId);
    }
}
