using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> HasRoleAsync(string employeeId, Roles role)
        {
            return await _context.UserRoles.AnyAsync(ur =>
                ur.userId == employeeId &&
                ur.role == role &&
                ur.date_removed == null);
        }

        public async Task<List<User>> GetAllAsync()
        {
            return await _context.Users.ToListAsync();
        }

        public async Task<List<UserRole>> GetRolesByEmployeeIdAsync(string employeeId)
        {
            return await _context.UserRoles
                .Where(ur => ur.userId == employeeId)
                .ToListAsync();
        }

        public async Task AddAsync(User user, UserRole userRole)
        {
            await _context.Users.AddAsync(user);
            await _context.UserRoles.AddAsync(userRole);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveRoleAsync(string employeeId, Roles role)
        {
            var userRole = await _context.UserRoles.FirstOrDefaultAsync(ur =>
                ur.userId == employeeId &&
                ur.role == role &&
                ur.date_removed == null)
                ?? throw new KeyNotFoundException($"Active role {role} not found for employee {employeeId}");
            userRole.date_removed = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<List<string>> GetLocationsAsync()
        {
            return await _context.Users
                .Select(u => u.location)
                .Distinct()
                .ToListAsync();
        }

        public async Task AssignLocationAsync(string employeeId, string location)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.employeeId == employeeId)
                ?? throw new KeyNotFoundException($"User {employeeId} not found");
            user.location = location;
            await _context.SaveChangesAsync();
        }
    }
}
