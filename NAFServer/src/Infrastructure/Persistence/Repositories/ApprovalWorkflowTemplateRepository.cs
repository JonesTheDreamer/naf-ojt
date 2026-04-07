using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ApprovalWorkflowTemplateRepository : IApprovalWorkflowTemplateRepository
    {
        private readonly AppDbContext _context;
        private readonly CacheService _cacheService;
        private readonly string cacheKey = "all_ApprovalWorkflowTemplate";

        public ApprovalWorkflowTemplateRepository(AppDbContext context, CacheService cacheService)
        {
            _cacheService = cacheService;
            _context = context;
        }

        public async Task<List<ApprovalWorkflowTemplate>> GetAllAsync()
        {
            return await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                return await _context.ApprovalWorkflowTemplates.ToListAsync();
            });
        }

        public async Task<ApprovalWorkflowTemplate> GetByIdAsync(int resourceId)
        {
            var templates = await GetAllAsync();

            return templates
                   .Where(w => w.ResourceId == resourceId)
                   .Where(w => w.IsActive)
                   .FirstOrDefault()
                   ?? throw new KeyNotFoundException("Approval Workflow Template not found");
        }

        public async Task<Guid> GetActiveWorkflowIdOfResourceAsync(int resourceId)
        {
            var templates = await GetAllAsync();

            var id = templates
                   .Where(w => w.ResourceId == resourceId)
                   .Where(w => w.IsActive)
                   .Select(w => w.Id)
                   .FirstOrDefault();

            if (id == Guid.Empty)
            {
                throw new KeyNotFoundException("Approval Workflow Template not found");
            }

            return id;
        }
    }
}
