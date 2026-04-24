using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class UserRoleService : IUserRoleService
    {
        private readonly IUserRoleRepository _userRoleRepository;

        public UserRoleService(IUserRoleRepository userRoleRepository)
        {
            _userRoleRepository = userRoleRepository;
        }

        public async Task<List<UserRoleDTO>> GetUserActiveRolesAsync(int userId)
        {
            try
            {
                var roles = await _userRoleRepository.GetUserActiveRolesAsync(userId);
                return roles.Select(ur => new UserRoleDTO(
                    ur.Id,
                    ur.RoleId,
                    ur.Role.Name.ToString(),
                    ur.UserId,
                    ur.IsActive,
                    ur.DateAdded,
                    ur.DateRemoved)).ToList();
            }
            catch (KeyNotFoundException)
            {
                return new List<UserRoleDTO>();
            }
        }

        public async Task<List<UserRoleDTO>> GetUserRoleHistoryAsync(int userId)
        {
            try
            {
                var history = await _userRoleRepository.GetUserRolesAsync(userId);
                return history.Select(ur => new UserRoleDTO(
                    ur.Id,
                    ur.RoleId,
                    ur.Role.Name.ToString(),
                    ur.UserId,
                    ur.IsActive,
                    ur.DateAdded,
                    ur.DateRemoved)).ToList();
            }
            catch (KeyNotFoundException)
            {
                return new List<UserRoleDTO>();
            }
        }

        public async Task AssignRoleAsync(int userId, int roleId)
        {
            await _userRoleRepository.AddUserRoleAsync(userId, roleId);
        }

        public async Task RemoveRoleAsync(int userId, int roleId)
        {
            await _userRoleRepository.RemoveUserRoleAsync(userId, roleId);
        }
    }
}
