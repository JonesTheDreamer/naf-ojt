using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/user-locations")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class UserLocationController : ControllerBase
    {
        private readonly IUserLocationService _userLocationService;

        public UserLocationController(IUserLocationService userLocationService)
        {
            _userLocationService = userLocationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllLocations()
        {
            return Ok(await _userLocationService.GetAllLocationsAsync());
        }

        [HttpGet("{userId}/active")]
        public async Task<IActionResult> GetActiveLocation(int userId)
        {
            try
            {
                return Ok(await _userLocationService.GetUserActiveLocationAsync(userId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("{userId}/history")]
        public async Task<IActionResult> GetLocationHistory(int userId)
        {
            return Ok(await _userLocationService.GetUserLocationHistoryAsync(userId));
        }

        [HttpPost("{userId}/assign")]
        public async Task<IActionResult> AssignLocation(int userId, [FromBody] int locationId)
        {
            try
            {
                await _userLocationService.AssignLocationAsync(userId, locationId);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{userId}/remove/{locationId}")]
        public async Task<IActionResult> RemoveLocation(int userId, int locationId)
        {
            try
            {
                await _userLocationService.RemoveUserFromLocationAsync(userId, locationId);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
