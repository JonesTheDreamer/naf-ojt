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

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO request)
        {
            try
            {
                var dto = await _authService.LoginAsync(request.EmployeeId);
                if (!Enum.TryParse<Roles>(dto.ActiveRole, out var activeRole))
                    return StatusCode(500, "Invalid role returned by login service.");
                var token = await _authService.GenerateTokenAsync(request.EmployeeId, activeRole);
                SetAuthCookie(token);
                return Ok(dto);
            }
            catch (KeyNotFoundException)
            {
                return Unauthorized("Invalid employee ID.");
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        [HttpPost("select-role")]
        [Authorize]
        public async Task<IActionResult> SelectRole([FromBody] SelectRoleRequestDTO request)
        {
            if (!Enum.TryParse<Roles>(request.Role, out var role))
                return BadRequest("Invalid role.");

            try
            {
                var dto = await _authService.SelectRoleAsync(_currentUserService.EmployeeId, role);
                var token = await _authService.GenerateTokenAsync(_currentUserService.EmployeeId, role);
                SetAuthCookie(token);
                return Ok(dto);
            }
            catch (KeyNotFoundException)
            {
                return Unauthorized("Invalid employee ID.");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var user = await _authService.GetCurrentUserAsync(
                _currentUserService.EmployeeId,
                _currentUserService.Role);
            return Ok(user);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth_token");
            return Ok();
        }

        private void SetAuthCookie(string token)
        {
            Response.Cookies.Append("auth_token", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddHours(8),
                Path = "/"
            });
        }
    }
}
