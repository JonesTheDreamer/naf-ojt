using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.Interfaces
{
    public interface IAdminService
    {
        Task<List<UserWithRolesDTO>> GetAllUsersAsync();
        Task AddUserAsync(AddUserDTO dto);
        Task RemoveRoleAsync(string employeeId, Roles role);
        Task<List<string>> GetLocationsAsync();
        Task AssignLocationAsync(AssignLocationDTO dto);
    }
}
