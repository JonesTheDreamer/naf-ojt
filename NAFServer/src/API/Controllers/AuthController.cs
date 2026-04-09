using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Auth;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.API.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ICurrentUserService _currentUserService;

        public AuthController(IAuthService authService, ICurrentUserService currentUserService)
        {
            _authService = authService;
            _currentUserService = currentUserService;
        }

        [HttpPost("login/admin")]
        public async Task<IActionResult> LoginAdmin([FromBody] LoginRequestDTO request)
            => await LoginWithRole(request.EmployeeId, Roles.ADMIN);

        [HttpPost("login/technical-team")]
        public async Task<IActionResult> LoginTechnicalTeam([FromBody] LoginRequestDTO request)
            => await LoginWithRole(request.EmployeeId, Roles.TECHNICAL_TEAM);

        [HttpPost("login/requestor-approver")]
        public async Task<IActionResult> LoginRequestorApprover([FromBody] LoginRequestDTO request)
            => await LoginWithRole(request.EmployeeId, Roles.REQUESTOR_APPROVER);

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var user = await _authService.GetCurrentUserAsync(_currentUserService.EmployeeId);
            return Ok(user);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth_token");
            return Ok();
        }

        private async Task<IActionResult> LoginWithRole(string employeeId, Roles role)
        {
            var isValid = await _authService.ValidateRoleAsync(employeeId, role);
            if (!isValid) return Unauthorized("Invalid employee ID or role.");

            var token = await _authService.GenerateTokenAsync(employeeId, role);

            Response.Cookies.Append("auth_token", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddHours(8),
                Path = "/"
            });

            return Ok(new { employeeId, role = role.ToString() });
        }
    }
}
