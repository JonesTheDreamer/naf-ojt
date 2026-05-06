using NAFServer.src.Application.DTOs.ResourceGroup;
using NAFServer.src.Application.DTOs.ResourceManagement;

namespace NAFServer.src.Application.Interfaces
{
    public interface IResourceGroupService
    {
        Task<List<ResourceGroupDTO>> GetAllGroupsAsync();
        Task<ResourceGroupDTO> AddResourceToGroupAsync(int groupId, int resourceId);
        Task<ResourceGroupDTO> RemoveResourceFromGroupAsync(int groupId, int resourceId);
        Task<ResourceGroupDTO> CreateAsync(CreateResourceGroupDTO dto);
    }
}
