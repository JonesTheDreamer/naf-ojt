using NAFServer.src.Application.DTOs.Location;

namespace NAFServer.src.Application.Interfaces
{
    public interface ILocationService
    {
        Task<List<LocationDTO>> GetAllAsync();
        Task<LocationDTO> CreateAsync(string name);
        Task<LocationDTO> GetByIdAsync(int locationId);
        Task<List<LocationDTO>> SetToInactiveAsync();
    }
}
