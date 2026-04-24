using NAFServer.src.Application.DTOs.Location;
using NAFServer.src.Application.DTOs.User;

namespace NAFServer.src.Application.Interfaces
{
    public interface IUserLocationService
    {
        Task<List<LocationDTO>> GetAllLocationsAsync();
        Task<UserLocationDTO> GetUserActiveLocationAsync(int userId);
        Task<List<UserLocationDTO>> GetUserLocationHistoryAsync(int userId);
        Task AssignLocationAsync(int userId, int locationId);
        Task RemoveUserFromLocationAsync(int userId, int locationId);
    }
}
