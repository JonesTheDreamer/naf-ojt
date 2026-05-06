using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Application.Interfaces
{
    public interface ISharedFolderService
    {
        Task<List<SharedFolderItemDTO>> GetAllAsync();
        Task<SharedFolder> FindOrCreateAsync(string name);
    }
}
