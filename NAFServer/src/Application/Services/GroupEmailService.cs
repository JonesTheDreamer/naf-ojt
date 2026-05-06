using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class GroupEmailService : IGroupEmailService
    {
        private readonly IGroupEmailRepository _repo;
        private readonly AppDbContext _context;

        public GroupEmailService(IGroupEmailRepository repo, AppDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        public async Task<List<GroupEmailDTO>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(i => new GroupEmailDTO(i.Id, i.Email)).ToList();
        }

        public async Task<GroupEmail> FindOrCreateAsync(string email)
        {
            var existing = await _context.GroupEmails
                .FirstOrDefaultAsync(g => g.Email.ToLower() == email.ToLower());
            if (existing != null) return existing;

            var created = new GroupEmail(email);
            _context.GroupEmails.Add(created);
            await _context.SaveChangesAsync();
            return created;
        }
    }
}
