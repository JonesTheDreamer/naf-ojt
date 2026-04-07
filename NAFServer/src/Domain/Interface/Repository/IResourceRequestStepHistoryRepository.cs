using NAFServer.src.Domain.Entities;
namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IResourceRequestStepHistoryRepository
    {
        Task<ResourceRequestApprovalStepHistory> GetByIdAsync(Guid resourceRequestApprovalStepHistoryId);
        Task<ResourceRequestApprovalStepHistory> Create(ResourceRequestApprovalStepHistory resourceRequestApprovalStepHistory);
        Task<List<ResourceRequestApprovalStepHistory>> GetAllHistoryOnApprovalRequestStep(Guid resourceRequestApprovalStep);
        Task<ResourceRequestApprovalStepHistory> GetApprovedHistory(Guid resourceRequestApprovalStep);
        Task<List<ResourceRequestApprovalStepHistory>> GetAllRejectedHistory(Guid resourceRequestApprovalStep);
        Task<ResourceRequestApprovalStepHistory> GetLatestHistory(Guid resourceRequestApprovalStep);
    }
}
