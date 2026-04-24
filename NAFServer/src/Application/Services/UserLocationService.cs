using NAFServer.src.Application.DTOs.Location;
using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class UserLocationService : IUserLocationService
    {
        private readonly IUserLocationRepository _userLocationRepository;
        private readonly ILocationRepository _locationRepository;

        public UserLocationService(
            IUserLocationRepository userLocationRepository,
            ILocationRepository locationRepository)
        {
            _userLocationRepository = userLocationRepository;
            _locationRepository = locationRepository;
        }

        public async Task<List<LocationDTO>> GetAllLocationsAsync()
        {
            var locations = await _locationRepository.GetAllAsync();
            return locations.Select(l => new LocationDTO(l.Id, l.Name, l.IsActive)).ToList();
        }

        public async Task<UserLocationDTO> GetUserActiveLocationAsync(int userId)
        {
            var ul = await _userLocationRepository.GetUserActiveLocation(userId);
            return new UserLocationDTO(
                ul.Id,
                ul.LocationId,
                ul.Location.Name,
                ul.UserId,
                ul.Location.IsActive,
                ul.IsActive,
                ul.DateAdded,
                ul.DateRemoved);
        }

        public async Task<List<UserLocationDTO>> GetUserLocationHistoryAsync(int userId)
        {
            try
            {
                var history = await _userLocationRepository.GetUserLocationsAsync(userId);
                return history.Select(ul => new UserLocationDTO(
                    ul.Id,
                    ul.LocationId,
                    ul.Location.Name,
                    ul.UserId,
                    ul.Location.IsActive,
                    ul.IsActive,
                    ul.DateAdded,
                    ul.DateRemoved)).ToList();
            }
            catch (KeyNotFoundException)
            {
                return new List<UserLocationDTO>();
            }
        }

        public async Task AssignLocationAsync(int userId, int locationId)
        {
            try
            {
                var current = await _userLocationRepository.GetUserActiveLocation(userId);
                if (current.LocationId != locationId)
                    await _userLocationRepository.RemoveUserFromLocation(userId, current.LocationId);
            }
            catch (KeyNotFoundException) { }

            await _userLocationRepository.AddUserCurrentLocation(userId, locationId);
        }

        public async Task RemoveUserFromLocationAsync(int userId, int locationId)
        {
            await _userLocationRepository.RemoveUserFromLocation(userId, locationId);
        }
    }
}
