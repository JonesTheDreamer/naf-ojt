using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.DTOs.User;

namespace NAFServer.src.Application.Interfaces
{
    public interface IAdminService
    {
        Task<List<UserDTO>> GetAllUsersInLocationAsync(int locationId);
        Task AssignRoleToEmployeeAsync(string employeeId, AssignRoleDTO dto);
    }
}
