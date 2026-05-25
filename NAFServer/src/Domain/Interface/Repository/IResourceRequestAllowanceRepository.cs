using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IResourceRequestAllowanceRepository
    {
        Task<List<ResourceRequestAllowance>> GetAllAsync();
        Task<ResourceRequestAllowance?> GetByIdAsync(int id);
        Task<ResourceRequestAllowance?> GetByResourceAndLocationAsync(int resourceId, int locationId);
        Task<ResourceRequestAllowance> CreateAsync(int resourceId, int locationId, int allowanceDays);
        Task<ResourceRequestAllowance> UpdateAsync(int id, int allowanceDays);
        Task DeleteAsync(int id);
    }
}
