using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly IUserRepository _userRepository;

        public AdminService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<List<UserWithRolesDTO>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();
            var result = new List<UserWithRolesDTO>();

            foreach (var user in users)
            {
                var roles = await _userRepository.GetRolesByEmployeeIdAsync(user.employeeId);
                var roleDTOs = roles.Select(r => new UserRoleDTO(
                    r.id,
                    r.userId,
                    r.role.ToString(),
                    r.date_added,
                    r.date_removed
                )).ToList();
                result.Add(new UserWithRolesDTO(user.employeeId, user.location, roleDTOs));
            }

            return result;
        }

        public async Task AddUserAsync(AddUserDTO dto)
        {
            if (!Enum.TryParse<Roles>(dto.Role, ignoreCase: true, out var role))
                throw new ArgumentException($"Invalid role: {dto.Role}");

            var user = new User(dto.EmployeeId, dto.Location);
            var userRole = new UserRole(dto.EmployeeId, role);
            await _userRepository.AddAsync(user, userRole);
        }

        public async Task RemoveRoleAsync(string employeeId, Roles role)
        {
            await _userRepository.RemoveRoleAsync(employeeId, role);
        }

        public async Task<List<string>> GetLocationsAsync()
        {
            return await _userRepository.GetLocationsAsync();
        }

        public async Task AssignLocationAsync(AssignLocationDTO dto)
        {
            await _userRepository.AssignLocationAsync(dto.EmployeeId, dto.Location);
        }
    }
}
