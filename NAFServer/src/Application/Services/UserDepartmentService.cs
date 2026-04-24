using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class UserDepartmentService : IUserDepartmentService
    {
        private readonly IUserDepartmentRepository _userDepartmentRepository;

        public UserDepartmentService(IUserDepartmentRepository userDepartmentRepository)
        {
            _userDepartmentRepository = userDepartmentRepository;
        }

        public async Task<UserDepartmentDTO> GetUserActiveDepartmentAsync(int userId)
        {
            var ud = await _userDepartmentRepository.GetUserActiveDepartment(userId);
            return new UserDepartmentDTO(
                ud.Id,
                ud.DepartmentId,
                ud.Department.Name,
                ud.UserId,
                ud.Department.IsActive,
                ud.IsActive,
                ud.DateAdded,
                ud.DateRemoved);
        }

        public async Task<List<UserDepartmentDTO>> GetUserDepartmentHistoryAsync(int userId)
        {
            try
            {
                var history = await _userDepartmentRepository.GetUserDepartmentsAsync(userId);
                return history.Select(ud => new UserDepartmentDTO(
                    ud.Id,
                    ud.DepartmentId,
                    ud.Department.Name,
                    ud.UserId,
                    ud.Department.IsActive,
                    ud.IsActive,
                    ud.DateAdded,
                    ud.DateRemoved)).ToList();
            }
            catch (KeyNotFoundException)
            {
                return new List<UserDepartmentDTO>();
            }
        }

        public async Task AssignDepartmentAsync(int userId, int departmentId)
        {
            try
            {
                var current = await _userDepartmentRepository.GetUserActiveDepartment(userId);
                if (current.DepartmentId != departmentId)
                    await _userDepartmentRepository.RemoveUserFromDepartment(userId, current.DepartmentId);
            }
            catch (KeyNotFoundException) { }

            await _userDepartmentRepository.AddUserCurrentDepartment(userId, departmentId);
        }

        public async Task RemoveUserFromDepartmentAsync(int userId, int departmentId)
        {
            await _userDepartmentRepository.RemoveUserFromDepartment(userId, departmentId);
        }
    }
}
