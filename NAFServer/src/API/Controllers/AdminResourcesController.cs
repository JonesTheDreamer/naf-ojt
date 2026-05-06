using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.ResourceManagement;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin/resources")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class AdminResourcesController : ControllerBase
    {
        private readonly IResourceManagementService _resourceManagementService;

        public AdminResourcesController(IResourceManagementService resourceManagementService)
        {
            _resourceManagementService = resourceManagementService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _resourceManagementService.GetAllResourcesAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            try
            {
                return Ok(await _resourceManagementService.GetResourceDetailAsync(id));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateResourceDTO dto)
        {
            try
            {
                var id = await _resourceManagementService.CreateResourceAsync(dto);
                return Created($"/api/admin/resources/{id}", new { id });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(int id)
        {
            try
            {
                await _resourceManagementService.DeactivateResourceAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/workflow-templates")]
        public async Task<IActionResult> AddWorkflowTemplate(int id, [FromBody] AddWorkflowTemplateDTO dto)
        {
            try
            {
                await _resourceManagementService.AddWorkflowTemplateAsync(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
