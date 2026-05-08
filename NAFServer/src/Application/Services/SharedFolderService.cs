using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Infrastructure.Persistence.Repositories;

namespace NAFServer.src.Application.Services
{
    public class SharedFolderService : ISharedFolderService
    {
        private readonly ISharedFolderRepository _repo;
        private readonly AppDbContext _context;
        private readonly CacheService _cache;

        public SharedFolderService(ISharedFolderRepository repo, AppDbContext context, CacheService cache)
        {
            _repo = repo;
            _context = context;
            _cache = cache;
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
            _cache.Remove(SharedFolderRepository.AllKey);
            return created;
        }
    }
}
