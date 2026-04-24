using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ApprovalWorkflowStepsTemplateRepository : IApprovalWorkflowStepsTemplateRepository
    {
        private readonly AppDbContext _context;

        public ApprovalWorkflowStepsTemplateRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ApprovalWorkflowStepsTemplate>> GetTemplateSteps()
        {
            return await _context.ApprovalWorkflowStepsTemplates
               .OrderBy(s => s.StepOrder)
               .ToListAsync();
        }

        public async Task<List<ApprovalWorkflowStepsTemplate>> GetTemplateStepsById(Guid approvalWorkflowTemplateId)
        {
            var steps = await GetTemplateSteps();
            return [.. steps.FindAll(s => s.ApprovalWorkflowTemplateId == approvalWorkflowTemplateId).OrderBy(s => s.StepOrder)];
        }

        public async Task<List<ApprovalWorkflowStepsTemplate>> GetTemplateStepsByResourceId(int resourceId)
        {

            return await _context.ApprovalWorkflowStepsTemplates
                .Where(s => s.ApprovalWorkflowTemplate.ResourceId == resourceId &&
                            s.ApprovalWorkflowTemplate.IsActive)
                .OrderBy(s => s.StepOrder)
                .ToListAsync();
        }
    }
}
