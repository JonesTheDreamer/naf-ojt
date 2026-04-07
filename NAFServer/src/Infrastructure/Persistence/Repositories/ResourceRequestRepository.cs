using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceRequestRepository : IResourceRequestRepository
    {
        private readonly AppDbContext _context;

        public ResourceRequestRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ResourceRequest> GetByIdAsync(Guid id)
        {
            return await _context.ResourceRequests
                .Include(rr => rr.ResourceRequestPurposes)
                .Include(rr => rr.ResourceRequestsApprovalSteps)
                    .ThenInclude(rras => rras.Histories)
                .Include(rr => rr.NAF)
                    .ThenInclude(n => n.ResourceRequests)
                .Include(rr => rr.Resource)
                .Include(rr => (rr.AdditionalInfo as InternetRequestInfo).InternetResource)
                .Include(rr => (rr.AdditionalInfo as SharedFolderRequestInfo).SharedFolder)
                .Include(rr => (rr.AdditionalInfo as GroupEmailRequestInfo).GroupEmail)
                .FirstAsync(rr => rr.Id == id) ?? throw new KeyNotFoundException("Resource Request not found");
        }

        public async Task<ResourceRequest> GetByApprovalStepId(Guid id)
        {
            return await _context.ResourceRequests
                .Where(rr => rr.ResourceRequestsApprovalSteps.Any(step => step.Id == id))
                .Include(rr => rr.ResourceRequestPurposes)
                .Include(rr => rr.ResourceRequestsApprovalSteps)
                    .ThenInclude(rras => rras.Histories)
                .Include(rr => rr.NAF)
                    .ThenInclude(n => n.ResourceRequests)
                .Include(rr => rr.Resource)
                .Include(rr => (rr.AdditionalInfo as InternetRequestInfo).InternetResource)
                .Include(rr => (rr.AdditionalInfo as SharedFolderRequestInfo).SharedFolder)
                .Include(rr => (rr.AdditionalInfo as GroupEmailRequestInfo).GroupEmail)
                .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Resource Request not found");
        }

        public async Task<bool> ResourceRequestExistsAsync<TAdditionalInfo>
        (
             Guid nafId,
             int resourceId,
             Func<TAdditionalInfo, int> resourceSelector
        ) where TAdditionalInfo : ResourceRequestAdditionalInfo
        {
            return await _context.ResourceRequests
            .Where(rr => rr.NAF.Id == nafId)
            .Select(rr => rr.AdditionalInfo)
            .OfType<TAdditionalInfo>()
            .AnyAsync(info => resourceSelector(info) == resourceId);
        }
    }
}
