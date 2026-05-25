using Microsoft.IdentityModel.Tokens;
using NAFServer.src.Application.DTOs.Auth;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
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
        private readonly IAuditQueue _auditQueue;

        private static readonly Roles[] InScopeRoles = [Roles.ADMIN, Roles.REQUESTOR_APPROVER, Roles.HR];

        public AuthService
        (
            IConfiguration config,
            IUserRepository userRepository,
            IEmployeeRepository employeeRepository,
            IAuditQueue auditQueue
        )
        {
            _config = config;
            _userRepository = userRepository;
            _employeeRepository = employeeRepository;
            _auditQueue = auditQueue;
        }

        public async Task<AuthUserDTO> LoginAsync(string employeeId)
        {
            var user = await _userRepository.GetUserByEmployeeId(employeeId);
            var employee = await _employeeRepository.GetByIdAsync(employeeId);
            var name = employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : employeeId;

            var roles = user.UserRoles
                .Where(ur => ur.Role != null && InScopeRoles.Contains(ur.Role.Name))
                .OrderBy(ur => Array.IndexOf(InScopeRoles, ur.Role.Name))
                .Select(ur => ur.Role.Name)
                .ToList();

            if (roles.Count == 0)
                throw new UnauthorizedAccessException("No in-scope roles assigned.");

            await _auditQueue.EnqueueAsync(new AuditTrail($"{name} logged in", "Auth"));

            return await BuildAuthUserDTOAsync(employeeId, user, roles.First().ToString(), roles);
        }

        public async Task<AuthUserDTO> SelectRoleAsync(string employeeId, Roles role)
        {
            var user = await _userRepository.GetUserByEmployeeId(employeeId);
            var employee = await _employeeRepository.GetByIdAsync(employeeId);
            var name = employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : employeeId;

            var hasRole = user.UserRoles.Any(ur =>
                ur.Role != null && ur.Role.Name == role && InScopeRoles.Contains(ur.Role.Name));
            if (!hasRole)
                throw new UnauthorizedAccessException($"User does not have role {role}.");

            var roles = user.UserRoles
                .Where(ur => ur.Role != null && InScopeRoles.Contains(ur.Role.Name))
                .OrderBy(ur => Array.IndexOf(InScopeRoles, ur.Role.Name))
                .Select(ur => ur.Role.Name)
                .ToList();

            await _auditQueue.EnqueueAsync(new AuditTrail($"{name} logged in as {role}", "Auth"));

            return await BuildAuthUserDTOAsync(employeeId, user, role.ToString(), roles);
        }

        public async Task<AuthUserDTO> GetCurrentUserAsync(string employeeId, string role)
        {
            var user = await _userRepository.GetUserByEmployeeId(employeeId);

            var roles = user.UserRoles
                .Where(ur => ur.Role != null && InScopeRoles.Contains(ur.Role.Name))
                .OrderBy(ur => Array.IndexOf(InScopeRoles, ur.Role.Name))
                .Select(ur => ur.Role.Name)
                .ToList();

            return await BuildAuthUserDTOAsync(employeeId, user, role, roles);
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

        private async Task<AuthUserDTO> BuildAuthUserDTOAsync(
            string employeeId,
            User user,
            string activeRole,
            List<Roles> roles)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeId)
                ?? throw new ApplicationException($"Employee record not found for '{employeeId}'. Contact your administrator.");

            return new AuthUserDTO(
                employeeId,
                activeRole,
                roles.Select(r => r.ToString()).ToArray(),
                $"{employee.FirstName} {employee.LastName}",
                0,
                ""
            );
        }
    }
}
