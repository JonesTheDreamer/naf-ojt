using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Interfaces;


// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RequestsController : ControllerBase
    {
        private readonly IResourceRequestService _resourceRequestService;
        public RequestsController(IResourceRequestService resourceRequestService)
        {
            _resourceRequestService = resourceRequestService;
        }
        //// GET: api/<RequestsController>
        //[HttpGet]
        //public IEnumerable<string> Get()
        //{
        //    return new string[] { "value1", "value2" };
        //}

        // GET api/<RequestsController>/5
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            try
            {
                var rr = await _resourceRequestService.GetByIdAsync(id);
                return Ok(rr);
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }

        }

        // POST api/<RequestsController>
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] CreateResourceRequestDTO request)
        {
            try
            {
                var rr = await _resourceRequestService.CreateSpecialAsync(request);
                return CreatedAtAction(
                    nameof(Get),
                    new { id = rr.Id },
                    new
                    {
                        success = true,
                        message = "Resource request created successfully",
                        data = rr
                    }
                    );
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        //// PUT api/<RequestsController>/5
        //[HttpPut("{id}")]
        //public void Put(int id, [FromBody] string value)
        //{
        //}

        // DELETE api/<RequestsController>/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                await _resourceRequestService.DeleteAsync(id);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id:guid}/purpose")]
        public async Task<IActionResult> RevisePurpose(
            Guid id,
            [FromBody] EditPurposeDTO request
            )
        {
            try
            {
                var rr = await _resourceRequestService.EditPurposeAsync(id, request);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
