using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceRequestAllowanceRepository : IResourceRequestAllowanceRepository
    {
        private readonly AppDbContext _context;

        public ResourceRequestAllowanceRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ResourceRequestAllowance?> GetByResourceAndLocationAsync(int resourceId, int locationId)
        {
            return await _context.ResourceRequestAllowances
                .FirstOrDefaultAsync(a => a.ResourceId == resourceId && a.LocationId == locationId);
        }
    }
}
