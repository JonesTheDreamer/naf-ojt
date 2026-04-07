using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResourcesController : ControllerBase
    {
        private readonly IResourceService _resourceService;

        public ResourcesController(IResourceService resourceService)
        {
            _resourceService = resourceService;
        }
        // GET: api/<ResourcesController>
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var resources = await _resourceService.GetAllResourceAsync();
            return Ok(resources);
        }

        // GET api/<ResourcesController>/5
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var resource = await _resourceService.GetResourceByIdAsync(id);
            return Ok(resource);
        }

    }
}
