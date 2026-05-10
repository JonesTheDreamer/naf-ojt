using NAFServer.src.Application.DTOs.Auth;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthUserDTO> LoginAsync(string employeeId);
        Task<AuthUserDTO> SelectRoleAsync(string employeeId, Roles role);
        Task<string> GenerateTokenAsync(string employeeId, Roles role);
        Task<AuthUserDTO> GetCurrentUserAsync(string employeeId, string role);
    }
}
