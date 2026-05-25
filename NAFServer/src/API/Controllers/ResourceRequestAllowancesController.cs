using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.ResourceRequestAllowance;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin/resource-allowances")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class ResourceRequestAllowancesController : ControllerBase
    {
        private readonly IResourceRequestAllowanceService _service;

        public ResourceRequestAllowancesController(IResourceRequestAllowanceService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _service.GetAllAsync());

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id) =>
            Ok(await _service.GetByIdAsync(id));

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateResourceRequestAllowanceDTO dto) =>
            Ok(await _service.CreateAsync(dto));

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateResourceRequestAllowanceDTO dto) =>
            Ok(await _service.UpdateAsync(id, dto));

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
