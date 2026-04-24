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

        public async Task<Location> CreateAsync(string name)
        {
            return await _locationRepository.CreateAsync(name);
        }

        public async Task<List<Location>> GetAllAsync()
        {
            return await _locationRepository.GetAllAsync();
        }

        public async Task<Location> GetByIdAsync(int locationId)
        {
            return await _locationRepository.GetByIdAsync(locationId);
        }

        public async Task<Location> GetByNameAsync(string name)
        {
            return await _locationRepository.GetByNameAsync(name);
        }

        public Task<List<Location>> RecacheAllAsync()
        {
            throw new NotImplementedException();
        }
    }
}
