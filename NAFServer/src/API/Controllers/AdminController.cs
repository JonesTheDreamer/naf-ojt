using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Infrastructure.Persistence;
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
        private readonly AppDbContext _context;

        public AdminController(IAdminService adminService, INAFService nafService, AppDbContext context)
        {
            _adminService = adminService;
            _nafService = nafService;
            _context = context;
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

        [HttpGet("nafs")]
        public async Task<IActionResult> GetAdminNAFs(
            [FromQuery] int? locationId = null,
            [FromQuery] string status = "all",
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            return Ok(await _nafService.GetNAFsByLocationPagedAsync(locationId, status, page));
        }

        [HttpGet("resource-requests/for-screening")]
        public async Task<IActionResult> GetForScreening([FromQuery] int locationId)
        {
            return Ok(await _nafService.GetForScreeningAsync(locationId));
        }

        [HttpGet("resource-requests")]
        public async Task<IActionResult> GetAdminResourceRequests(
            [FromQuery] int locationId,
            [FromQuery] string progress = "all",
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            return Ok(await _nafService.GetResourceRequestsByLocationPagedAsync(locationId, progress, page));
        }

        [HttpGet("audit-trails")]
        public async Task<IActionResult> GetAuditTrails(
            [FromQuery] string? search,
            [FromQuery] string? entity,
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            const int pageSize = 20;

            var query = _context.AuditTrails.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(a => a.Activity.Contains(search));

            if (!string.IsNullOrWhiteSpace(entity) && !entity.Equals("all", StringComparison.OrdinalIgnoreCase))
                query = query.Where(a => a.Entity == entity);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new { a.Id, a.Activity, a.Entity, a.Timestamp })
                .ToListAsync();

            return Ok(new
            {
                data = items,
                totalCount,
                pageSize,
                currentPage = page,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            });
        }
    }
}
