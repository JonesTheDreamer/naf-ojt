using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Location;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence.HostedServices;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin/locations")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class LocationController : ControllerBase
    {
        private readonly ILocationRepository _locationRepository;

        public LocationController(ILocationRepository locationRepository)
        {
            _locationRepository = locationRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var locations = await _locationRepository.GetAllAsync();
            return Ok(locations.Select(l => new LocationDTO(l.Id, l.Name, l.IsActive, l.AllowWeekendDateNeeded)));
        }

        [HttpPut("{id:int}/weekend")]
        public async Task<IActionResult> UpdateWeekend(int id, [FromBody] bool allowWeekend)
        {
            var location = await _locationRepository.UpdateAllowWeekendAsync(id, allowWeekend);
            return Ok(new LocationDTO(location.Id, location.Name, location.IsActive, location.AllowWeekendDateNeeded));
        }
    }
}
