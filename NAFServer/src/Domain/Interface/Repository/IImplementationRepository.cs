using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IImplementationRepository
    {
        Task<ResourceRequestImplementation> GetByIdAsync(string id);
        Task<List<ResourceRequestImplementation>> GetByEmployeeIdAsync(string employeeId);
        Task<List<ResourceRequest>> GetForImplementationsAsync();
        Task<ResourceRequestImplementation?> GetByResourceRequestIdAsync(Guid resourceRequestId);
        Task<ResourceRequestImplementation> CreateAsync(Guid resourceRequestId);
    }
}
