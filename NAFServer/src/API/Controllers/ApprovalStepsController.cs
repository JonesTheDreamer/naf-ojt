using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class ApprovalStepsController : ControllerBase
    {
        private readonly IResourceRequestApprovalStepService _resourceRequestApprovalStepService;
        private readonly ICurrentUserService _currentUserService;

        public ApprovalStepsController(IResourceRequestApprovalStepService resourceRequestApprovalStepService, ICurrentUserService currentUserService)
        {
            _resourceRequestApprovalStepService = resourceRequestApprovalStepService;
            _currentUserService = currentUserService;
        }
        // GET: api/<AprrovalStepsController>
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/<AprrovalStepsController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> Approve(Guid id, [FromBody] string? comment)
        {
            try
            {
                await _resourceRequestApprovalStepService.ApproveStepAsync(id, comment);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

        }

        [HttpPut("{id}/reject")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] string reasonForRejection)
        {
            try
            {
                await _resourceRequestApprovalStepService.RejectStepAsync(id, reasonForRejection);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/claim")]
        [Authorize(Roles = nameof(Roles.ADMIN))]
        public async Task<IActionResult> Claim(Guid id)
        {
            try
            {
                await _resourceRequestApprovalStepService.ClaimStepAsync(id, _currentUserService.EmployeeId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/claim-soc")]
        [Authorize(Roles = nameof(Roles.SOC))]
        public async Task<IActionResult> ClaimSoc(Guid id)
        {
            try
            {
                await _resourceRequestApprovalStepService.ClaimStepAsync(id, _currentUserService.EmployeeId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
