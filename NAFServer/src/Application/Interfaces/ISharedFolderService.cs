using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Application.Interfaces
{
    public interface ISharedFolderService
    {
        Task<List<SharedFolderItemDTO>> GetAllAsync();
        Task<SharedFolder> FindOrCreateAsync(string name);

        // Admin
        Task<(IEnumerable<SharedFolderDTO> Items, int TotalCount)> AdminListAsync(string? search, int page);
        Task<SharedFolderDetailDTO?> AdminDetailAsync(int id, string? progress, int page);
        Task<SharedFolderDTO> AdminCreateAsync(string name, string? ownerId);
        Task<SharedFolderDTO> AdminUpdateAsync(int id, string name, string? ownerId);
        Task AdminDeleteAsync(int id);
    }
}
