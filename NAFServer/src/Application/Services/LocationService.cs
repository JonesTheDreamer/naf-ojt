using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class LocationService : ILocationRepository
    {
        private readonly ILocationRepository _locationRepository;

        public LocationService(ILocationRepository locationRepository)
        {
            _locationRepository = locationRepository;
        }

        public Task<Location> CreateAsync(string name)
            => _locationRepository.CreateAsync(name);

        public Task<List<Location>> GetAllAsync()
            => _locationRepository.GetAllAsync();

        public Task<Location?> GetByIdAsync(int locationId)
            => _locationRepository.GetByIdAsync(locationId);

        public Task<Location?> GetByNameAsync(string name)
            => _locationRepository.GetByNameAsync(name);

        public Task<Location> UpdateAllowWeekendAsync(int id, bool allowWeekend)
            => _locationRepository.UpdateAllowWeekendAsync(id, allowWeekend);
    }
}
