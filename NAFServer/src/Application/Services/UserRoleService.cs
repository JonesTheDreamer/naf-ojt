using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class UserRoleService : IUserRoleService
    {
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IRoleRepository _roleRepository;

        public UserRoleService(IUserRoleRepository userRoleRepository, IRoleRepository roleRepository)
        {
            _userRoleRepository = userRoleRepository;
            _roleRepository = roleRepository;
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

        public async Task AssignRoleAsync(int userId, string roleName)
        {
            if (!Enum.TryParse<Roles>(roleName, ignoreCase: true, out var role))
                throw new ArgumentException($"Invalid role: {roleName}");

            var roleEntity = await _roleRepository.GetByNameAsync(role)
                ?? throw new KeyNotFoundException($"Role '{roleName}' not found in database.");

            await _userRoleRepository.AddUserRoleAsync(userId, roleEntity.Id);
        }

        public async Task RemoveRoleAsync(int userId, int roleId)
        {
            await _userRoleRepository.RemoveUserRoleAsync(userId, roleId);
        }
    }
}
