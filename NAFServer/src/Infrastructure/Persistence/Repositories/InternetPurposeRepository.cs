using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class InternetPurposeRepository : IInternetPurposeRepository
    {
        private readonly AppDbContext _context;

        public InternetPurposeRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<InternetPurpose>> GetAllAsync()
        {
            return await _context.InternetPurposes.ToListAsync();
        }

        public async Task<InternetPurpose> CreateAsync(string name, string description)
        {
            var entity = new InternetPurpose(name, description);
            _context.InternetPurposes.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }
    }
}
