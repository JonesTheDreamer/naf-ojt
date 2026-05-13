using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin/shared-folders")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class AdminSharedFoldersController : ControllerBase
    {
        private readonly ISharedFolderService _service;

        public AdminSharedFoldersController(ISharedFolderService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] string? search,
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            var (items, totalCount) = await _service.AdminListAsync(search, page);
            const int pageSize = 10;
            return Ok(new
            {
                data = items,
                totalCount,
                pageSize,
                currentPage = page,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            });
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Detail(
            int id,
            [FromQuery] string? progress,
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            var detail = await _service.AdminDetailAsync(id, progress, page);
            if (detail == null) return NotFound();
            return Ok(detail);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SharedFolderWriteDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");

            var result = await _service.AdminCreateAsync(dto.Name, dto.OwnerId);
            return Created($"api/admin/shared-folders/{result.Id}", result);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] SharedFolderWriteDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");
            try
            {
                var result = await _service.AdminUpdateAsync(id, dto.Name, dto.OwnerId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _service.AdminDeleteAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }

    public record SharedFolderWriteDTO(string Name, string? OwnerId);
}
