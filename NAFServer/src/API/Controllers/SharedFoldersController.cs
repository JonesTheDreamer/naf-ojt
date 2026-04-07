using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SharedFoldersController : ControllerBase
    {
        private readonly ISharedFolderService _service;
        public SharedFoldersController(ISharedFolderService service) { _service = service; }
        [HttpGet]
        public async Task<IActionResult> Get() => Ok(await _service.GetAllAsync());
    }
}
