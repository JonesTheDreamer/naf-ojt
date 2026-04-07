using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Application.Interfaces
{
    public interface IResourceRequestApprovalStepService
    {
        public Task<ResourceRequestApprovalStep> ApproveStepAsync(Guid stepId, string? comment);
        public Task<ResourceRequestApprovalStep> RejectStepAsync(Guid stepId, string reasonForRejection);
    }
}
