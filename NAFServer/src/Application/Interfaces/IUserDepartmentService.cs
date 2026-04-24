using NAFServer.src.Application.DTOs.User;

namespace NAFServer.src.Application.Interfaces
{
    public interface IUserDepartmentService
    {
        Task<UserDepartmentDTO> GetUserActiveDepartmentAsync(int userId);
        Task<List<UserDepartmentDTO>> GetUserDepartmentHistoryAsync(int userId);
        Task AssignDepartmentAsync(int userId, int departmentId);
        Task RemoveUserFromDepartmentAsync(int userId, int departmentId);
    }
}
