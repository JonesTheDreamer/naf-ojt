using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IResourceRequestAllowanceRepository
    {
        Task<ResourceRequestAllowance?> GetByResourceAndLocationAsync(int resourceId, int locationId);
    }
}
