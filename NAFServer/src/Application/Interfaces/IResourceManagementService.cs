using NAFServer.src.Application.DTOs.ResourceManagement;

namespace NAFServer.src.Application.Interfaces
{
    public interface IResourceManagementService
    {
        Task<List<AdminResourceListItemDTO>> GetAllResourcesAsync();
        Task<AdminResourceDetailDTO> GetResourceDetailAsync(int id);
        Task<int> CreateResourceAsync(CreateResourceDTO dto);
        Task DeactivateResourceAsync(int id);
        Task AddWorkflowTemplateAsync(int resourceId, AddWorkflowTemplateDTO dto);
    }
}
