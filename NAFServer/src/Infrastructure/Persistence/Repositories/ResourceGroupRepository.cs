using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class ResourceGroupRepository : IResourceGroupRepository
    {
        private readonly AppDbContext _context;

        public ResourceGroupRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ResourceGroup>> GetAllGroupsAsync()
        {
            return await _context.ResourceGroups
                .Include(g => g.Resources)
                .ToListAsync();
        }

        public async Task<ResourceGroup?> GetGroupByIdAsync(int id)
        {
            var groups = await GetAllGroupsAsync();
            return groups.FirstOrDefault(g => g.Id == id);
        }

    }
}
