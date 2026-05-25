using NAFServer.src.Application.DTOs.ResourceRequestAllowance;

namespace NAFServer.src.Application.Interfaces
{
    public interface IResourceRequestAllowanceService
    {
        Task<List<ResourceRequestAllowanceDTO>> GetAllAsync();
        Task<ResourceRequestAllowanceDTO> GetByIdAsync(int id);
        Task<ResourceRequestAllowanceDTO> CreateAsync(CreateResourceRequestAllowanceDTO dto);
        Task<ResourceRequestAllowanceDTO> UpdateAsync(int id, UpdateResourceRequestAllowanceDTO dto);
        Task DeleteAsync(int id);
    }
}
