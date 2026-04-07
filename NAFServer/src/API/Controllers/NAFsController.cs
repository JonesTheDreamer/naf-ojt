using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Application.Interfaces;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NAFsController : ControllerBase
    {
        private readonly INAFService _nafService;
        public NAFsController(INAFService nafService)
        {
            _nafService = nafService;
        }

        // GET: api/<NAFsController>
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        [HttpGet("{employeeId}/subordinates")]
        public async Task<IActionResult> GetNAFsUnderEmployee(string employeeId, int page = 1)
        {
            var nafs = await _nafService.GetNAFsUnderEmployeeAsync(employeeId, page);
            return Ok(nafs);
        }

        [HttpGet("{employeeId}/approver/")]
        public async Task<IActionResult> GetNAFsToApprove(string employeeId, int page = 1)
        {
            var nafs = await _nafService.GetNAFToApproveAsync(employeeId, page);
            return Ok(nafs);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var naf = await _nafService.GetNAFByIdAsync(id);
            return Ok(naf);
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> HasNAF(string employeeId)
        {
            var naf = await _nafService.GetNAFByEmployeeIdAsync(employeeId);
            return Ok(naf);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] CreateNAFRequestDTO request)
        {
            try
            {
                var naf = await _nafService.CreateAsync(request);
                return CreatedAtAction(
                    nameof(Get),
                    new { id = naf.Id },
                    new
                    {
                        success = true,
                        message = "NAF created successfully",
                        data = naf
                    }
                    );
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // DELETE api/<NAFsController>/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeactivateNAF(Guid id)
        {
            var naf = await _nafService.DeactivateNAFAsync(id);
            return Ok(naf);
        }
    }
}
