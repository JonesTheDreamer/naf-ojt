using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
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
        private readonly IEmployeeRepository _employeeRepo;
        private const int AdminPageSize = 10;

        public SharedFolderService(
            ISharedFolderRepository repo,
            AppDbContext context,
            CacheService cache,
            IEmployeeRepository employeeRepo)
        {
            _repo = repo;
            _context = context;
            _cache = cache;
            _employeeRepo = employeeRepo;
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

        // --- Admin methods ---

        public async Task<(IEnumerable<SharedFolderDTO> Items, int TotalCount)> AdminListAsync(string? search, int page)
        {
            var query = _context.SharedFolders.Where(f => f.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(f => f.Name.Contains(search));

            var totalCount = await query.CountAsync();
            var folders = await query
                .OrderBy(f => f.Name)
                .Skip((page - 1) * AdminPageSize)
                .Take(AdminPageSize)
                .ToListAsync();

            var dtos = new List<SharedFolderDTO>();
            foreach (var f in folders)
            {
                string? ownerName = null;
                if (f.OwnerId != null)
                {
                    var emp = await _employeeRepo.GetByIdAsync(f.OwnerId);
                    ownerName = emp != null ? $"{emp.FirstName} {emp.LastName}".Trim() : f.OwnerId;
                }
                dtos.Add(new SharedFolderDTO(f.Id, f.Name, ownerName, f.OwnerId, f.IsActive));
            }

            return (dtos, totalCount);
        }

        public async Task<SharedFolderDetailDTO?> AdminDetailAsync(int id, string? progress, int page)
        {
            var folder = await _context.SharedFolders.FindAsync(id);
            if (folder == null || !folder.IsActive) return null;

            string? ownerName = null;
            if (folder.OwnerId != null)
            {
                var ownerEmp = await _employeeRepo.GetByIdAsync(folder.OwnerId);
                ownerName = ownerEmp != null ? $"{ownerEmp.FirstName} {ownerEmp.LastName}".Trim() : folder.OwnerId;
            }

            var accessQuery = _context.SharedFolderRequestInfos
                .Where(sfri => sfri.SharedFolderId == id)
                .Join(
                    _context.ResourceRequests,
                    sfri => sfri.ResourceRequestId,
                    rr => rr.Id,
                    (sfri, rr) => new { rr.Progress, rr.NAFId, rr.CreatedAt }
                )
                .Join(
                    _context.NAFs,
                    x => x.NAFId,
                    naf => naf.Id,
                    (x, naf) => new { x.Progress, naf.EmployeeId, x.CreatedAt }
                );

            if (!string.IsNullOrWhiteSpace(progress) && !progress.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<Progress>(progress, ignoreCase: true, out var progressEnum))
                    accessQuery = accessQuery.Where(x => x.Progress == progressEnum);
            }

            var totalCount = await accessQuery.CountAsync();
            var rows = await accessQuery
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * AdminPageSize)
                .Take(AdminPageSize)
                .ToListAsync();

            var entries = new List<SharedFolderAccessEntryDTO>();
            foreach (var row in rows)
            {
                var emp = await _employeeRepo.GetByIdAsync(row.EmployeeId);
                var empName = emp != null ? $"{emp.FirstName} {emp.LastName}".Trim() : row.EmployeeId;
                var position = emp?.Position ?? "";
                entries.Add(new SharedFolderAccessEntryDTO(empName, position, row.Progress.ToString(), row.CreatedAt));
            }

            var accessList = new PagedAccessList(
                entries,
                totalCount,
                AdminPageSize,
                page,
                (int)Math.Ceiling(totalCount / (double)AdminPageSize)
            );

            return new SharedFolderDetailDTO(folder.Id, folder.Name, ownerName, folder.OwnerId, folder.IsActive, accessList);
        }

        public async Task<SharedFolderDTO> AdminCreateAsync(string name, string? ownerId)
        {
            var folder = new SharedFolder(name, ownerId);
            _context.SharedFolders.Add(folder);
            await _context.SaveChangesAsync();
            _cache.Remove(SharedFolderRepository.AllKey);

            string? ownerName = null;
            if (ownerId != null)
            {
                var emp = await _employeeRepo.GetByIdAsync(ownerId);
                ownerName = emp != null ? $"{emp.FirstName} {emp.LastName}".Trim() : ownerId;
            }
            return new SharedFolderDTO(folder.Id, folder.Name, ownerName, folder.OwnerId, folder.IsActive);
        }

        public async Task<SharedFolderDTO> AdminUpdateAsync(int id, string name, string? ownerId)
        {
            var folder = await _context.SharedFolders.FindAsync(id)
                ?? throw new KeyNotFoundException($"SharedFolder {id} not found.");

            folder.Name = name;
            folder.OwnerId = ownerId;
            await _context.SaveChangesAsync();
            _cache.Remove(SharedFolderRepository.AllKey);

            string? ownerName = null;
            if (ownerId != null)
            {
                var emp = await _employeeRepo.GetByIdAsync(ownerId);
                ownerName = emp != null ? $"{emp.FirstName} {emp.LastName}".Trim() : ownerId;
            }
            return new SharedFolderDTO(folder.Id, folder.Name, ownerName, folder.OwnerId, folder.IsActive);
        }

        public async Task AdminDeleteAsync(int id)
        {
            var folder = await _context.SharedFolders.FindAsync(id)
                ?? throw new KeyNotFoundException($"SharedFolder {id} not found.");

            folder.Deactivate();
            await _context.SaveChangesAsync();
            _cache.Remove(SharedFolderRepository.AllKey);
        }
    }
}
