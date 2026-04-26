using Microsoft.IdentityModel.Tokens;
using NAFServer.src.Application.DTOs.Auth;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace NAFServer.src.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _config;
        private readonly IUserRepository _userRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IUserLocationRepository _userLocationRepository;

        public AuthService(
            IConfiguration config,
            IUserRepository userRepository,
            IEmployeeRepository employeeRepository,
            IUserRoleRepository userRoleRepository,
            IRoleRepository roleRepository,
            IUserLocationRepository userLocationRepository)
        {
            _config = config;
            _userRepository = userRepository;
            _employeeRepository = employeeRepository;
            _userRoleRepository = userRoleRepository;
            _roleRepository = roleRepository;
            _userLocationRepository = userLocationRepository;
        }

        public async Task<bool> ValidateRoleAsync(string employeeId, Roles role)
        {
            try
            {
                var user = await _userRepository.GetUserByEmployeeId(employeeId);
                var roleEntity = await _roleRepository.GetByNameAsync(role);
                if (roleEntity == null) return false;
                return await _userRoleRepository.UserHasRoleAsync(user.Id, roleEntity.Id);
            }
            catch (KeyNotFoundException)
            {
                return false;
            }
        }

        public Task<string> GenerateTokenAsync(string employeeId, Roles role)
        {
            var jwtSettings = _config.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expireMinutes = int.Parse(jwtSettings["ExpireMinutes"]!);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, employeeId),
                new Claim(ClaimTypes.Role, role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                signingCredentials: creds
            );

            return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
        }

        public async Task<AuthUserDTO> GetCurrentUserAsync(string employeeId)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeId)
                ?? throw new KeyNotFoundException($"Employee {employeeId} not found");

            var user = await _userRepository.GetUserByEmployeeId(employeeId);

            List<Domain.Entities.UserRole> activeRoles;
            try
            {
                activeRoles = await _userRoleRepository.GetUserActiveRolesAsync(user.Id);
            }
            catch (KeyNotFoundException)
            {
                activeRoles = new List<Domain.Entities.UserRole>();
            }

            var primaryRole = activeRoles.FirstOrDefault()?.Role.Name.ToString() ?? "";

            int locationId = 0;
            string location = "";
            try
            {
                var userLocation = await _userLocationRepository.GetUserActiveLocation(user.Id);
                locationId = userLocation.LocationId;
                location = userLocation.Location?.Name ?? "";
            }
            catch (KeyNotFoundException) { }

            return new AuthUserDTO(
                employeeId,
                primaryRole,
                $"{employee.FirstName} {employee.LastName}",
                locationId,
                location
            );
        }
    }
}
