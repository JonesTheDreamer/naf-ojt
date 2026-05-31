using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.API.Controllers
{
    [Route("api/soc")]
    [Authorize(Roles = nameof(Roles.SOC))]
    [ApiController]
    public class SocController : ControllerBase
    {
        private readonly INAFService _nafService;

        public SocController(INAFService nafService)
        {
            _nafService = nafService;
        }

        [HttpGet("resource-requests/for-soc-review")]
        public async Task<IActionResult> GetForSocReview()
        {
            return Ok(await _nafService.GetForSocReviewAsync());
        }
    }
}
