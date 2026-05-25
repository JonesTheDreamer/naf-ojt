using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class LocationService : ILocationRepository
    {
        private readonly ILocationRepository _locationRepository;
        //private readonly IEmployeeRepository _employeeRepository;
        //private readonly IResourceRequestRepository _resourceRequestRepository;
        private readonly AppDbContext _context;

        public LocationService
        (
            ILocationRepository locationRepository,
            //IEmployeeRepository employeeRepository,
            //IResourceRequestRepository resourceRequestRepository,
            AppDbContext context
        )
        {
            _locationRepository = locationRepository;
            //_employeeRepository = employeeRepository;
            //_resourceRequestRepository = resourceRequestRepository;
            _context = context;
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
