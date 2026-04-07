using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceRequestStepHistoryRepository : IResourceRequestStepHistoryRepository
    {
        private readonly AppDbContext _context;
        public ResourceRequestStepHistoryRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task<ResourceRequestApprovalStepHistory> Create(ResourceRequestApprovalStepHistory resourceRequestApprovalStepHistory)
        {
            _context.ResourceRequestApprovalStepHistories.Add(resourceRequestApprovalStepHistory);
            await _context.SaveChangesAsync();
            return resourceRequestApprovalStepHistory;
        }

        public async Task<ResourceRequestApprovalStepHistory> GetByIdAsync(Guid resourceRequestApprovalStepHistoryId)
        {
            return await _context.ResourceRequestApprovalStepHistories.FindAsync(resourceRequestApprovalStepHistoryId)
                ?? throw new KeyNotFoundException("History not found");
        }

        public async Task<List<ResourceRequestApprovalStepHistory>> GetAllHistoryOnApprovalRequestStep(Guid resourceRequestApprovalStep)
        {
            return await _context.ResourceRequestApprovalStepHistories
                .Where(r => r.ResourceRequestApprovalStepId == resourceRequestApprovalStep)
                .Include(r => r.ResourceRequestApprovalStep)
                .ToListAsync();
        }

        public async Task<ResourceRequestApprovalStepHistory> GetApprovedHistory(Guid resourceRequestApprovalStep)
        {
            return await _context.ResourceRequestApprovalStepHistories
                .Where(r => r.ResourceRequestApprovalStepId == resourceRequestApprovalStep
                && r.Status == Status.APPROVED)
                .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("History not found");
        }

        public async Task<List<ResourceRequestApprovalStepHistory>> GetAllRejectedHistory(Guid resourceRequestApprovalStep)
        {
            return await _context.ResourceRequestApprovalStepHistories
                .Where(r => r.ResourceRequestApprovalStepId == resourceRequestApprovalStep
                && r.Status == Status.REJECTED)
                .ToListAsync();
        }

        public Task<ResourceRequestApprovalStepHistory> GetLatestHistory(Guid resourceRequestApprovalStep)
        {
            throw new NotImplementedException();
        }
    }
}
