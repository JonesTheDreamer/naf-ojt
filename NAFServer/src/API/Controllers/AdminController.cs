using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            return Ok(await _adminService.GetAllUsersAsync());
        }

        [HttpPost("users")]
        public async Task<IActionResult> AddUser([FromBody] AddUserDTO dto)
        {
            try
            {
                await _adminService.AddUserAsync(dto);
                return Created("", null);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch("users/{employeeId}/roles/{role}/remove")]
        public async Task<IActionResult> RemoveRole(string employeeId, Roles role)
        {
            try
            {
                await _adminService.RemoveRoleAsync(employeeId, role);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("locations")]
        public async Task<IActionResult> GetLocations()
        {
            return Ok(await _adminService.GetLocationsAsync());
        }

        [HttpPost("locations/assign")]
        public async Task<IActionResult> AssignLocation([FromBody] AssignLocationDTO dto)
        {
            try
            {
                await _adminService.AssignLocationAsync(dto);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
