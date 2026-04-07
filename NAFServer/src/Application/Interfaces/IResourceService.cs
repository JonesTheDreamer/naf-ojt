using NAFServer.src.Application.DTOs.ResourceRequest;

namespace NAFServer.src.Application.Interfaces
{
    public interface IResourceService
    {
        public Task<List<ResourceDTO>> GetAllResourceAsync();
        public Task<ResourceDTO> GetResourceByIdAsync(int id);
    }
}
