using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IUserLocationRepository
    {
        Task<List<UserLocation>> GetUserLocationsAsync(int userId);
        Task<List<UserLocation>> GetUserLocationsByLocationIdAsync(int locationId);
        Task<UserLocation> GetUserActiveLocation(int userId);
        Task<List<UserLocation>> AddUserCurrentLocation(int userId, int locationId);
        Task<List<UserLocation>> RemoveUserFromLocation(int userId, int locationId);
        Task<bool> IsUserInLocation(int userId, int locationId);
    }
}
