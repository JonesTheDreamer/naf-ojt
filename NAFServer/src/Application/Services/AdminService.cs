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
        private readonly IUserLocationRepository _userLocationRepository;
        private readonly IUserDepartmentRepository _userDepartmentRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IRoleRepository _roleRepository;

        public AdminService(
            IUserRepository userRepository,
            IUserRoleRepository userRoleRepository,
            IUserLocationRepository userLocationRepository,
            IUserDepartmentRepository userDepartmentRepository,
            IEmployeeRepository employeeRepository,
            IRoleRepository roleRepository)
        {
            _userRepository = userRepository;
            _userRoleRepository = userRoleRepository;
            _userLocationRepository = userLocationRepository;
            _userDepartmentRepository = userDepartmentRepository;
            _employeeRepository = employeeRepository;
            _roleRepository = roleRepository;
        }

        public async Task<List<UserDTO>> GetAllUsersInLocationAsync(int locationId)
        {
            List<UserLocation> userLocations;
            try
            {
                userLocations = await _userLocationRepository.GetUserLocationsByLocationIdAsync(locationId);
            }
            catch (KeyNotFoundException)
            {
                return new List<UserDTO>();
            }

            var result = new List<UserDTO>();
            foreach (var ul in userLocations.Where(ul => ul.IsActive))
            {
                var user = ul.User;
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

                UserDepartment? activeDept = null;
                try
                {
                    activeDept = await _userDepartmentRepository.GetUserActiveDepartment(user.Id);
                }
                catch (KeyNotFoundException) { }

                result.Add(new UserDTO(
                    user.Id,
                    user.EmployeeNumber,
                    employee.LastName,
                    employee.FirstName,
                    employee.MiddleName,
                    employee.Company,
                    employee.Position ?? "",
                    activeDept?.DepartmentId ?? 0,
                    activeDept?.Department?.Name ?? "",
                    ul.LocationId,
                    ul.Location?.Name ?? "",
                    activeRoles.Select(r => r.Role.Name.ToString()).ToList()
                ));
            }
            return result;
        }

        public async Task AssignRoleToEmployeeAsync(string employeeId, AssignRoleDTO dto)
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
                await _userLocationRepository.AddUserCurrentLocation(user.Id, dto.LocationId);
            }
            catch (KeyNotFoundException)
            {
                // Already in this location — not an error
            }

            try
            {
                await _userRoleRepository.AddUserRoleAsync(user.Id, roleEntity.Id);
            }
            catch (KeyNotFoundException)
            {
                // Already has this role — not an error
            }
        }
    }
}
