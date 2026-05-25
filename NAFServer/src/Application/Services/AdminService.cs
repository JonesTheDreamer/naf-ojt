using Microsoft.Extensions.Logging;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly INotificationService _notificationService;
        private readonly ILogger<AdminService> _logger;

        public AdminService(
            IUserRepository userRepository,
            IUserRoleRepository userRoleRepository,
            IEmployeeRepository employeeRepository,
            IRoleRepository roleRepository,
            INotificationService notificationService,
            ILogger<AdminService> logger)
        {
            _userRepository = userRepository;
            _userRoleRepository = userRoleRepository;
            _employeeRepository = employeeRepository;
            _roleRepository = roleRepository;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<List<UserDTO>> GetAllUsersInLocationAsync(int locationId)
        {
            var users = await _userRepository.GetAllAsync();
            var result = new List<UserDTO>();

            foreach (var user in users)
            {
                var employee = await _employeeRepository.GetByIdAsync(user.EmployeeNumber);
                if (employee == null) continue;

                List<UserRole> activeRoles;
                try
                {
                    activeRoles = await _userRoleRepository.GetUserActiveRolesAsync(user.Id);
                }
                catch (KeyNotFoundException)
                {
                    activeRoles = new List<UserRole>();
                }

                result.Add(new UserDTO(
                    user.Id,
                    user.EmployeeNumber,
                    employee.LastName,
                    employee.FirstName,
                    employee.MiddleName,
                    employee.Company,
                    employee.Position ?? "",
                    0,
                    "",
                    locationId,
                    "",
                    activeRoles.Select(r => r.Role.Name.ToString()).ToList()
                ));
            }
            return result;
        }

        public async Task CreateUserAsync(string employeeId, CreateUserDTO dto)
        {
            if (!Enum.TryParse<Roles>(dto.Role, ignoreCase: true, out var role))
                throw new ArgumentException($"Invalid role: {dto.Role}");

            var roleEntity = await _roleRepository.GetByNameAsync(role)
                ?? throw new KeyNotFoundException($"Role '{dto.Role}' not found in database.");

            User user;
            try
            {
                user = await _userRepository.GetUserByEmployeeId(employeeId);
            }
            catch (KeyNotFoundException)
            {
                user = new User(employeeId);
                await _userRepository.AddAsync(user);
            }

            try
            {
                await _userRoleRepository.AddUserRoleAsync(user.Id, roleEntity.Id);
            }
            catch (KeyNotFoundException) { }

            // Notify admins at the location
            try
            {
                var adminIds = await _notificationService.GetAdminsByLocationAsync(dto.LocationId);
                if (adminIds.Count > 0)
                {
                    await _notificationService.CreateForUsersAsync(
                        adminIds,
                        "New User Added",
                        "A new user has been added to the system.",
                        $"/admin/users/{user.Id}",
                        "User"
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send notification for new user {UserId}", user.Id);
            }
        }

    }
}
