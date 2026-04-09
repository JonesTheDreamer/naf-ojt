using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Exceptions;

namespace NAFServer.src.API.Controllers
{
    [Route("api/implementations")]
    [ApiController]
    [Authorize(Roles = "TECHNICAL_TEAM")]
    public class ImplementationController : ControllerBase
    {
        private readonly IImplementationService _implementationService;
        private readonly ICurrentUserService _currentUserService;

        public ImplementationController(IImplementationService implementationService, ICurrentUserService currentUserService)
        {
            _implementationService = implementationService;
            _currentUserService = currentUserService;
        }

        [HttpGet("my-tasks")]
        public async Task<IActionResult> GetMyTasks()
        {
            return Ok(await _implementationService.GetMyTasksAsync(_currentUserService.EmployeeId));
        }

        [HttpGet("for-implementations")]
        public async Task<IActionResult> GetForImplementations()
        {
            return Ok(await _implementationService.GetForImplementationsAsync());
        }

        [HttpPost("resource-requests/{resourceRequestId}/assign")]
        public async Task<IActionResult> AssignToMe(Guid resourceRequestId)
        {
            try
            {
                var result = await _implementationService.AssignToMeAsync(resourceRequestId, _currentUserService.EmployeeId);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPatch("{implementationId}/in-progress")]
        public async Task<IActionResult> SetToInProgress(string implementationId)
        {
            try
            {
                return Ok(await _implementationService.SetToInProgress(implementationId, _currentUserService.EmployeeId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (DomainException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch("{implementationId}/delayed")]
        public async Task<IActionResult> SetToDelayed(string implementationId, [FromBody] string delayReason)
        {
            try
            {
                return Ok(await _implementationService.SetToDelayed(implementationId, delayReason));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (DomainException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch("{implementationId}/accomplished")]
        public async Task<IActionResult> SetToAccomplished(string implementationId)
        {
            try
            {
                return Ok(await _implementationService.SetToAccomplished(implementationId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (DomainException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
