using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IResourceRequestStepRepository
    {
        public Task<ResourceRequestApprovalStep> GetByIdAsync(Guid id);
        public Task<ResourceRequestApprovalStep> GetResourceCurrentStepAsync(Guid resourceRequestId);
    }
}
