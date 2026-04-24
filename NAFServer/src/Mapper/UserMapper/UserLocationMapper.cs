using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Mapper.UserMapper
{
    public class UserLocationMapper
    {
        public static UserLocationDTO ToDTO(UserLocation userLocation)
        {
            return new UserLocationDTO
            (
                userLocation.Id,
                userLocation.LocationId,
                userLocation.Location.Name,
                userLocation.UserId,
                userLocation.Location.IsActive,
                userLocation.IsActive,
                userLocation.DateAdded,
                userLocation.DateRemoved
            );
        }
        public static List<UserLocationDTO> ListToDTO(List<UserLocation> userLocations)
        {
            return userLocations.Select(ul => ToDTO(ul)).ToList();
        }
    }
}
