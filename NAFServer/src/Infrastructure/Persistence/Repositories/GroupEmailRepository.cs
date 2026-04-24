using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class GroupEmailRepository : IGroupEmailRepository
    {
        private readonly AppDbContext _context;

        public GroupEmailRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<GroupEmail>> GetAllAsync()
        {
            return await _context.GroupEmails.ToListAsync();
        }
    }
}
