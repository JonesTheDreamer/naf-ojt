using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IResourceGroupRepository
    {
        Task<List<ResourceGroup>> GetAllGroupsAsync();
        Task<ResourceGroup?> GetGroupByIdAsync(int id);
        void InvalidateCache();
    }
}
