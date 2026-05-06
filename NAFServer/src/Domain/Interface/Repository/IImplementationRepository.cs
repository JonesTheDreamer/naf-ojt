using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IImplementationRepository
    {
        Task<ResourceRequestImplementation> GetByIdAsync(Guid id);
        Task<List<NAF>> GetForImplementationsAsync(int locationId);
        Task<List<NAF>> GetMyTasksByEmployeeIdAsync(string employeeId);
        Task<ResourceRequestImplementation?> GetByResourceRequestIdAsync(Guid resourceRequestId);
        Task<ResourceRequestImplementation> CreateAsync(Guid resourceRequestId);
    }
}
