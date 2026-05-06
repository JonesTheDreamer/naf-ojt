using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.ResourceManagement;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/ResourceGroups")]
    [Authorize]
    [ApiController]
    public class ResourceGroupsController : ControllerBase
    {
        private readonly IResourceGroupService _resourceGroupService;

        public ResourceGroupsController(IResourceGroupService resourceGroupService)
        {
            _resourceGroupService = resourceGroupService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var groups = await _resourceGroupService.GetAllGroupsAsync();
            return Ok(groups);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateResourceGroupDTO dto)
        {
            try
            {
                var group = await _resourceGroupService.CreateAsync(dto);
                return Created("", group);
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

        [HttpPost("{groupId}/resources/{resourceId}")]
        public async Task<IActionResult> AddResource(int groupId, int resourceId)
        {
            try
            {
                var group = await _resourceGroupService.AddResourceToGroupAsync(groupId, resourceId);
                return Ok(group);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{groupId}/resources/{resourceId}")]
        public async Task<IActionResult> RemoveResource(int groupId, int resourceId)
        {
            try
            {
                var group = await _resourceGroupService.RemoveResourceFromGroupAsync(groupId, resourceId);
                return Ok(group);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
