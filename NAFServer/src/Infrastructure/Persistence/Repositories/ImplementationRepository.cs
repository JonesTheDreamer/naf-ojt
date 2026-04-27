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

        public async Task<List<NAF>> GetForImplementationsAsync(int locationId)
        {
            var nafs = await _context.NAFs
                .Where(n => n.LocationId == locationId && n.ResourceRequests.Any(rr => rr.Progress == Progress.IMPLEMENTATION))
                .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.Resource)
                .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.ResourceRequestPurposes)
                .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.ResourceRequestsApprovalSteps)
                        .ThenInclude(step => step.Histories)
                .Include(n => n.ResourceRequests.Where(rr => rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.ResourceRequestImplementation)
                .AsNoTracking()
                .ToListAsync();

            var rrIds = nafs.SelectMany(n => n.ResourceRequests).Select(rr => rr.Id).ToList();

            if (rrIds.Any())
            {
                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is InternetRequestInfo)
                    .Include(rr => ((InternetRequestInfo)rr.AdditionalInfo).InternetResource)
                        .ThenInclude(ir => ir.Purpose)
                    .LoadAsync();

                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is SharedFolderRequestInfo)
                    .Include(rr => ((SharedFolderRequestInfo)rr.AdditionalInfo).SharedFolder)
                    .LoadAsync();

                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is GroupEmailRequestInfo)
                    .Include(rr => ((GroupEmailRequestInfo)rr.AdditionalInfo).GroupEmail)
                    .LoadAsync();
            }

            return nafs;
        }

        public async Task<List<NAF>> GetMyTasksByEmployeeIdAsync(string employeeId)
        {
            var resourceRequestIds = await _context.Implementations
                .Where(i => i.EmployeeId == employeeId)
                .Select(i => i.ResourceRequestId)
                .ToListAsync();

            if (!resourceRequestIds.Any())
                return new List<NAF>();

            var nafs = await _context.NAFs
                .Where(n => n.ResourceRequests.Any(rr => resourceRequestIds.Contains(rr.Id) && rr.Progress == Progress.IMPLEMENTATION))
                .Include(n => n.ResourceRequests.Where(rr => resourceRequestIds.Contains(rr.Id) && rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.Resource)
                .Include(n => n.ResourceRequests.Where(rr => resourceRequestIds.Contains(rr.Id) && rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.ResourceRequestPurposes)
                .Include(n => n.ResourceRequests.Where(rr => resourceRequestIds.Contains(rr.Id) && rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.ResourceRequestsApprovalSteps)
                        .ThenInclude(step => step.Histories)
                .Include(n => n.ResourceRequests.Where(rr => resourceRequestIds.Contains(rr.Id) && rr.Progress == Progress.IMPLEMENTATION))
                    .ThenInclude(rr => rr.ResourceRequestImplementation)
                .AsNoTracking()
                .ToListAsync();

            var rrIds = nafs.SelectMany(n => n.ResourceRequests).Select(rr => rr.Id).ToList();

            if (rrIds.Any())
            {
                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is InternetRequestInfo)
                    .Include(rr => ((InternetRequestInfo)rr.AdditionalInfo).InternetResource)
                        .ThenInclude(ir => ir.Purpose)
                    .LoadAsync();

                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is SharedFolderRequestInfo)
                    .Include(rr => ((SharedFolderRequestInfo)rr.AdditionalInfo).SharedFolder)
                    .LoadAsync();

                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is GroupEmailRequestInfo)
                    .Include(rr => ((GroupEmailRequestInfo)rr.AdditionalInfo).GroupEmail)
                    .LoadAsync();
            }

            return nafs;
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
