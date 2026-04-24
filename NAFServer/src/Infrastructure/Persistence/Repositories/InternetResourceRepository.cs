using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class InternetResourceRepository : IInternetResourceRepository
    {
        private readonly AppDbContext _context;

        public InternetResourceRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<InternetResource>> GetAllAsync()
        {
            return await _context.InternetResources
            .Include(ir => ir.Purpose)
            .ToListAsync();
        }

        public async Task<InternetResource> GetByIdAsync(int id)
        {
            var resources = await GetAllAsync();
            return resources.Where(r => r.Id == id)
                .FirstOrDefault()
                ?? throw new KeyNotFoundException("Resource not found");
        }


        public async Task<InternetResource> CreateAsync(string name, string url, string? description, int purposeId)
        {
            var entity = new InternetResource(name, url, description, purposeId);
            _context.InternetResources.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }
    }
}
