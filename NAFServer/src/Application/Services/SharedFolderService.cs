using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class SharedFolderService : ISharedFolderService
    {
        private readonly ISharedFolderRepository _repo;
        private readonly AppDbContext _context;

        public SharedFolderService(ISharedFolderRepository repo, AppDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        public async Task<List<SharedFolderItemDTO>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(i => new SharedFolderItemDTO(i.Id, i.Name)).ToList();
        }

        public async Task<SharedFolder> FindOrCreateAsync(string name)
        {
            var existing = await _context.SharedFolders
                .FirstOrDefaultAsync(f => f.Name.ToLower() == name.ToLower());
            if (existing != null) return existing;

            var created = new SharedFolder(name);
            _context.SharedFolders.Add(created);
            await _context.SaveChangesAsync();
            return created;
        }
    }
}
