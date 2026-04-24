using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IUserDepartmentRepository
    {
        Task<List<UserDepartment>> GetUserDepartmentsAsync(int userId);
        Task<UserDepartment> GetUserActiveDepartment(int userId);
        Task<List<UserDepartment>> AddUserCurrentDepartment(int userId, int departmentId);
        Task<List<UserDepartment>> RemoveUserFromDepartment(int userId, int departmentId);
    }
}
