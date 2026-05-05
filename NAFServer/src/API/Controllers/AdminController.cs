using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly INAFService _nafService;

        public AdminController(IAdminService adminService, INAFService nafService)
        {
            _adminService = adminService;
            _nafService = nafService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] int locationId)
        {
            return Ok(await _adminService.GetAllUsersInLocationAsync(locationId));
        }

        [HttpPost("users/{employeeId}")]
        public async Task<IActionResult> CreateUser(string employeeId, [FromBody] CreateUserDTO dto)
        {
            try
            {
                await _adminService.CreateUserAsync(employeeId, dto);
                return Created("", null);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("users/{userId:int}/roles")]
        public async Task<IActionResult> AddRoleToUser(int userId, [FromBody] AssignRoleDTO dto)
        {
            try
            {
                await _adminService.AddRoleToUserAsync(userId, dto);
                return Ok();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("nafs")]
        public async Task<IActionResult> GetAdminNAFs(
            [FromQuery] int locationId,
            [FromQuery] string status = "all",
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            return Ok(await _nafService.GetNAFsByLocationPagedAsync(locationId, status, page));
        }
    }
}
