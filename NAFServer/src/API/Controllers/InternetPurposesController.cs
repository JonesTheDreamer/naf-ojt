using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class InternetPurposesController : ControllerBase
    {
        private readonly IInternetPurposeService _service;
        public InternetPurposesController(IInternetPurposeService service) { _service = service; }
        [HttpGet]
        public async Task<IActionResult> Get() => Ok(await _service.GetAllAsync());

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateInternetPurposeDTO dto) =>
            Ok(await _service.CreateAsync(dto));
    }
}
