using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class RequestsController : ControllerBase
    {
        private readonly IResourceRequestService _resourceRequestService;

        public RequestsController(IResourceRequestService resourceRequestService)
        {
            _resourceRequestService = resourceRequestService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var rr = await _resourceRequestService.GetByIdAsync(id);
            return Ok(rr);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] CreateResourceRequestDTO request)
        {
            var rr = await _resourceRequestService.CreateSpecialAsync(request);
            return CreatedAtAction(nameof(Get), new { id = rr.Id }, new
            {
                success = true,
                message = "Resource request created successfully",
                data = rr
            });
        }

        [HttpPost("change-resource/{requestId:guid}")]
        public async Task<IActionResult> ChangeResource(Guid requestId, [FromBody] int newResource)
        {
            var rr = await _resourceRequestService.ChangeResourceAsync(requestId, newResource);
            return CreatedAtAction(nameof(Get), new { id = rr.Id }, new
            {
                success = true,
                message = "Resource changed successfully",
                data = rr
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _resourceRequestService.DeleteAsync(id);
            return Ok();
        }

        [HttpPut("{id:guid}/cancel")]
        public async Task<IActionResult> Cancel(Guid id)
        {
            await _resourceRequestService.CancelAsync(id);
            return Ok();
        }

        [HttpPost("{id:guid}/purpose")]
        public async Task<IActionResult> RevisePurpose(Guid id, [FromBody] EditPurposeDTO request)
        {
            var rr = await _resourceRequestService.EditPurposeAsync(id, request);
            return Ok(rr);
        }
    }
}
