using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface ILocationRepository
    {
        Task<List<Location>> GetAllAsync();
        //Task<List<Location>> RecacheAllAsync();
        Task<Location> GetByIdAsync(int locationId);
        Task<Location> GetByNameAsync(string name);
        Task<Location> CreateAsync(string name);
    }
}
