using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/user-departments")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class UserDepartmentController : ControllerBase
    {
        private readonly IUserDepartmentService _userDepartmentService;

        public UserDepartmentController(IUserDepartmentService userDepartmentService)
        {
            _userDepartmentService = userDepartmentService;
        }

        [HttpGet("{userId}/active")]
        public async Task<IActionResult> GetActiveDepartment(int userId)
        {
            try
            {
                return Ok(await _userDepartmentService.GetUserActiveDepartmentAsync(userId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("{userId}/history")]
        public async Task<IActionResult> GetDepartmentHistory(int userId)
        {
            return Ok(await _userDepartmentService.GetUserDepartmentHistoryAsync(userId));
        }

        [HttpPost("{userId}/assign")]
        public async Task<IActionResult> AssignDepartment(int userId, [FromBody] int departmentId)
        {
            try
            {
                await _userDepartmentService.AssignDepartmentAsync(userId, departmentId);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{userId}/remove/{departmentId}")]
        public async Task<IActionResult> RemoveDepartment(int userId, int departmentId)
        {
            try
            {
                await _userDepartmentService.RemoveUserFromDepartmentAsync(userId, departmentId);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
