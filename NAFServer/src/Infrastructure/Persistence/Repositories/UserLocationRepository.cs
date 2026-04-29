using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class UserLocationRepository : IUserLocationRepository
    {
        private readonly AppDbContext _context;

        public UserLocationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserLocation>> AddUserCurrentLocation(int userId, int locationId)
        {
            List<UserLocation> locations;
            try
            {
                locations = await GetUserLocationsAsync(userId);
            }
            catch (KeyNotFoundException)
            {
                locations = new List<UserLocation>();
            }

            var existingLocation = locations.FirstOrDefault(l => l.LocationId == locationId);
            if (existingLocation != null)
            {
                if (existingLocation.IsActive)
                {
                    throw new KeyNotFoundException("User is already in this location");
                }
                existingLocation.SetToActive();
            }
            else
            {
                _context.UserLocations.Add(new UserLocation(userId, locationId));
            }
            await _context.SaveChangesAsync();
            return await GetUserLocationsAsync(userId);
        }

        public async Task<UserLocation> GetUserActiveLocation(int userId)
        {
            var locations = await GetUserLocationsAsync(userId);
            return locations.FirstOrDefault(l => l.IsActive) ?? throw new KeyNotFoundException("No active location found");
        }

        public async Task<List<UserLocation>> GetUserLocationsAsync(int userId)
        {
            var result = await _context.UserLocations
            .Include(ul => ul.Location)
            .Include(ul => ul.User)
            .Where(ul => ul.UserId == userId)
            .ToListAsync();

            if (!result.Any())
                throw new KeyNotFoundException("No user locations found");

            return result;
        }

        public async Task<List<UserLocation>> GetUserLocationsByLocationIdAsync(int locationId)
        {
            var result = await _context.UserLocations
                .Include(ul => ul.Location)
                .Include(ul => ul.User)
                .Where(ul => ul.LocationId == locationId)
                .ToListAsync();

            if (!result.Any())
                throw new KeyNotFoundException("No user locations found");

            return result;
        }

        public Task<bool> IsUserInLocation(int userId, int locationId)
        {
            return _context.UserLocations.AnyAsync(ul => ul.UserId == userId && ul.LocationId == locationId && ul.IsActive);
        }

        public async Task<List<UserLocation>> RemoveUserFromLocation(int userId, int locationId)
        {
            var locations = await GetUserLocationsAsync(userId);
            var existingLocation = locations.FirstOrDefault(l => l.LocationId == locationId);
            if (existingLocation != null)
            {
                if (!existingLocation.IsActive)
                {
                    throw new KeyNotFoundException("User is already not in this location");
                }
                existingLocation.SetToInactive();
                await _context.SaveChangesAsync();
            }
            await _context.SaveChangesAsync();
            return await GetUserLocationsAsync(userId);
        }
    }
}
