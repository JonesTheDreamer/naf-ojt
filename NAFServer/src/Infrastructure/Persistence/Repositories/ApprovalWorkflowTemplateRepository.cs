using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ApprovalWorkflowTemplateRepository : IApprovalWorkflowTemplateRepository
    {
        private readonly AppDbContext _context;

        public ApprovalWorkflowTemplateRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ApprovalWorkflowTemplate>> GetAllAsync()
        {
            return await _context.ApprovalWorkflowTemplates.ToListAsync();
        }

        public async Task<ApprovalWorkflowTemplate> GetByIdAsync(int resourceId)
        {
            return await _context.ApprovalWorkflowTemplates
                   .Where(w => w.ResourceId == resourceId)
                   .Where(w => w.IsActive)
                   .FirstOrDefaultAsync()
                   ?? throw new KeyNotFoundException("Approval Workflow Template not found");
        }

        public async Task<Guid> GetActiveWorkflowIdOfResourceAsync(int resourceId)
        {

            var id = await _context.ApprovalWorkflowTemplates
                   .Where(w => w.ResourceId == resourceId)
                   .Where(w => w.IsActive)
                   .Select(w => w.Id)
                   .FirstOrDefaultAsync();

            if (id == Guid.Empty)
            {
                throw new KeyNotFoundException("Approval Workflow Template not found");
            }

            return id;
        }
    }
}
