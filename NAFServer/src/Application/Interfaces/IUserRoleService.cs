using NAFServer.src.Application.DTOs.User;

namespace NAFServer.src.Application.Interfaces
{
    public interface IUserRoleService
    {
        Task<List<UserRoleDTO>> GetUserActiveRolesAsync(int userId);
        Task<List<UserRoleDTO>> GetUserRoleHistoryAsync(int userId);
        Task AssignRoleAsync(int userId, int roleId);
        Task RemoveRoleAsync(int userId, int roleId);
    }
}
