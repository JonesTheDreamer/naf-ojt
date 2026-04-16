using NAFServer.src.Application.DTOs.ResourceGroup;

namespace NAFServer.src.Application.Interfaces
{
    public interface IResourceGroupService
    {
        Task<List<ResourceGroupDTO>> GetAllGroupsAsync();
        Task<ResourceGroupDTO> AddResourceToGroupAsync(int groupId, int resourceId);
        Task<ResourceGroupDTO> RemoveResourceFromGroupAsync(int groupId, int resourceId);
    }
}
