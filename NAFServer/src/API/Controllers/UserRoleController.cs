using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/user-roles")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class UserRoleController : ControllerBase
    {
        private readonly IUserRoleService _userRoleService;

        public UserRoleController(IUserRoleService userRoleService)
        {
            _userRoleService = userRoleService;
        }

        [HttpGet("{userId}/active")]
        public async Task<IActionResult> GetActiveRoles(int userId)
        {
            return Ok(await _userRoleService.GetUserActiveRolesAsync(userId));
        }

        [HttpGet("{userId}/history")]
        public async Task<IActionResult> GetRoleHistory(int userId)
        {
            return Ok(await _userRoleService.GetUserRoleHistoryAsync(userId));
        }

        [HttpPost("{userId}/assign")]
        public async Task<IActionResult> AssignRole(int userId, [FromBody] int roleId)
        {
            try
            {
                await _userRoleService.AssignRoleAsync(userId, roleId);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpDelete("{userId}/remove/{roleId}")]
        public async Task<IActionResult> RemoveRole(int userId, int roleId)
        {
            try
            {
                await _userRoleService.RemoveRoleAsync(userId, roleId);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
