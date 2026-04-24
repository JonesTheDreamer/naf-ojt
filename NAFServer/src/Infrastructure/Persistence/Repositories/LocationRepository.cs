using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class LocationRepository : ILocationRepository
    {
        private readonly AppDbContext _context;

        public LocationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Location>> RecacheAllAsync()
        {
            return await _context.Locations.ToListAsync();
        }
        public async Task<Location> CreateAsync(string name)
        {
            var entity = new Location(name);
            _context.Locations.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<Location> GetByIdAsync(int id)
        {
            var locations = await GetAllAsync();
            return locations.Where(l => l.Id == id)
                .FirstOrDefault()
                ?? throw new KeyNotFoundException("Location not found");
        }

        public async Task<List<Location>> GetAllAsync()
        {
            return await _context.Locations.ToListAsync();
        }

        public async Task<Location> GetByNameAsync(string name)
        {
            var locations = await GetAllAsync();
            return locations.Where(l => l.Name == name)
                .FirstOrDefault()
                ?? throw new KeyNotFoundException("Location not found");
        }
    }
}
