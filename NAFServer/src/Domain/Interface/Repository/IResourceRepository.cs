using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IResourceRepository
    {
        public Task<List<Resource>> GetAllResourcesAsync();

        public Task<Resource> GetResourceByIdAsync(int resourceId);
    }
}
