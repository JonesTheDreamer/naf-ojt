using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IApprovalWorkflowStepsTemplateRepository
    {
        public Task<List<ApprovalWorkflowStepsTemplate>> GetTemplateSteps();
        public Task<List<ApprovalWorkflowStepsTemplate>> GetTemplateStepsById(Guid approvalWorkflowTemplateId);
        public Task<List<ApprovalWorkflowStepsTemplate>> GetTemplateStepsByResourceId(int resourceId);
    }
}
