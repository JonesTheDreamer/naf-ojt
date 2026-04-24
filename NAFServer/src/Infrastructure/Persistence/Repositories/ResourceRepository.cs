using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceRepository : IResourceRepository
    {
        private readonly AppDbContext _context;

        public ResourceRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Resource>> GetAllResourcesAsync()
        {
            return await _context.Resources.ToListAsync();
        }

        public async Task<Resource> GetResourceByIdAsync(int resourceId)
        {
            var resources = await GetAllResourcesAsync();

            return resources.SingleOrDefault(r => r.Id == resourceId)
                 ?? throw new KeyNotFoundException("Resource not found.");
        }
    }
}
