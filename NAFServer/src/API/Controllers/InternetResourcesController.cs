using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InternetResourcesController : ControllerBase
    {
        private readonly IInternetResourceService _service;
        public InternetResourcesController(IInternetResourceService service) { _service = service; }
        [HttpGet]
        public async Task<IActionResult> Get() => Ok(await _service.GetAllAsync());
    }
}
