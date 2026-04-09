using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ImplementationRepository : IImplementationRepository
    {
        private readonly AppDbContext _context;

        public ImplementationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ResourceRequestImplementation> GetByIdAsync(string id)
        {
            return await _context.Implementations.FindAsync(Guid.Parse(id))
                ?? throw new KeyNotFoundException("Implementation not found");
        }

        public async Task<List<ResourceRequestImplementation>> GetByEmployeeIdAsync(string employeeId)
        {
            return await _context.Implementations
                .Include(i => i.ResourceRequest)
                    .ThenInclude(rr => rr.Resource)
                .Where(i => i.EmployeeId == employeeId)
                .ToListAsync();
        }

        public async Task<List<ResourceRequest>> GetForImplementationsAsync()
        {
            return await _context.ResourceRequests
                .Include(rr => rr.Resource)
                .Include(rr => rr.ResourceRequestImplementation)
                .Where(rr => rr.Progress == Progress.IMPLEMENTATION)
                .ToListAsync();
        }

        public async Task<ResourceRequestImplementation?> GetByResourceRequestIdAsync(Guid resourceRequestId)
        {
            return await _context.Implementations
                .FirstOrDefaultAsync(i => i.ResourceRequestId == resourceRequestId);
        }

        public async Task<ResourceRequestImplementation> CreateAsync(Guid resourceRequestId)
        {
            var implementation = new ResourceRequestImplementation(resourceRequestId);
            _context.Implementations.Add(implementation);
            await _context.SaveChangesAsync();
            return implementation;
        }
    }
}
