using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceRequestAllowanceRepository : IResourceRequestAllowanceRepository
    {
        private readonly AppDbContext _context;

        public ResourceRequestAllowanceRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<List<ResourceRequestAllowance>> GetAllAsync() =>
            _context.ResourceRequestAllowances
                .Include(a => a.Resource)
                .Include(a => a.Location)
                .AsNoTracking()
                .ToListAsync();

        public Task<ResourceRequestAllowance?> GetByIdAsync(int id) =>
            _context.ResourceRequestAllowances
                .Include(a => a.Resource)
                .Include(a => a.Location)
                .FirstOrDefaultAsync(a => a.Id == id);

        public Task<ResourceRequestAllowance?> GetByResourceAndLocationAsync(int resourceId, int locationId) =>
            _context.ResourceRequestAllowances
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.ResourceId == resourceId && a.LocationId == locationId);

        public async Task<ResourceRequestAllowance> CreateAsync(int resourceId, int locationId, int allowanceDays)
        {
            var allowance = new ResourceRequestAllowance(resourceId, locationId, allowanceDays);
            _context.ResourceRequestAllowances.Add(allowance);
            await _context.SaveChangesAsync();
            return await _context.ResourceRequestAllowances
                .Include(a => a.Resource)
                .Include(a => a.Location)
                .FirstAsync(a => a.Id == allowance.Id);
        }

        public async Task<ResourceRequestAllowance> UpdateAsync(int id, int allowanceDays)
        {
            var allowance = await _context.ResourceRequestAllowances.FindAsync(id)
                ?? throw new KeyNotFoundException($"Allowance {id} not found.");
            allowance.AllowanceDays = allowanceDays;
            await _context.SaveChangesAsync();
            return allowance;
        }

        public async Task DeleteAsync(int id)
        {
            var allowance = await _context.ResourceRequestAllowances.FindAsync(id)
                ?? throw new KeyNotFoundException($"Allowance {id} not found.");
            _context.ResourceRequestAllowances.Remove(allowance);
            await _context.SaveChangesAsync();
        }
    }
}
