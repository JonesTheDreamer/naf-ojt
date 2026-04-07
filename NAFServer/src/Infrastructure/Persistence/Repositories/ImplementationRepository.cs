using NAFServer.src.Domain.Entities;
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
            return await _context.Implementations.FindAsync(id)
                ?? throw new KeyNotFoundException("Implementation not found");
        }
    }
}
