using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IApprovalWorkflowTemplateRepository
    {
        public Task<List<ApprovalWorkflowTemplate>> GetAllAsync();
        public Task<Guid> GetActiveWorkflowIdOfResourceAsync(int resourceId);
        public Task<ApprovalWorkflowTemplate> GetByIdAsync(int resourceId);
    }
}
