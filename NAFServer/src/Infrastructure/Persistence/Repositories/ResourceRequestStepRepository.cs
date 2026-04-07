using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceRequestStepRepository : IResourceRequestStepRepository
    {
        private readonly AppDbContext _context;
        public ResourceRequestStepRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task<ResourceRequestApprovalStep> GetByIdAsync(Guid id)
        {
            return await _context.ResourceRequestApprovalSteps
                    .Include(rras => rras.Histories)
                    .Include(rras => rras.ResourceRequest)
                        .ThenInclude(rr => rr.NAF)
                    .Include(rras => rras.ResourceRequest)
                        .ThenInclude(rr => rr.Resource)
                    .FirstOrDefaultAsync(s => s.Id == id) ??
                    throw new KeyNotFoundException("Resource Request Apprval Step not found");
        }

        public async Task<ResourceRequestApprovalStep> GetResourceCurrentStepAsync(Guid resourceRequestId)
        {
            return await _context.ResourceRequests
                    .Where(rr => rr.Id == resourceRequestId)
                    .Select(rr => rr.ResourceRequestsApprovalSteps
                        .FirstOrDefault(s => s.StepOrder == rr.CurrentStep))
                    .FirstAsync() ??
                    throw new KeyNotFoundException("Resource Request Apprval Step not found");
        }
    }
}
