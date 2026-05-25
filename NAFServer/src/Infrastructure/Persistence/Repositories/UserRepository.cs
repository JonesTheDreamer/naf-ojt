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

        public async Task<List<User>> GetAllAsync()
        {
            return await _context.Users.ToListAsync();
        }

        public async Task<List<User>> GetAllUsersInLocationAsync(int locationId)
        {
            return await _context.Users
                .ToListAsync();
        }

        public async Task<User> GetUserById(int userId)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new KeyNotFoundException("User not found");
        }

        public async Task<User> GetUserByEmployeeId(string employeeId)
        {
            return await _context.Users
                .Include(u => u.UserRoles
                    .Where(ur => ur.IsActive))
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.EmployeeNumber == employeeId)
                ?? throw new KeyNotFoundException("User not found");
        }

        public async Task<User> AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> GetNetworkAdminOfLocation(int locationId)
        {
            return await _context.Users
                .Where(u => u.UserRoles.Any(r => r.Role.Name == Roles.ADMIN && r.DateRemoved == null))
                .FirstAsync();
        }

        public async Task<User> ResolveUserByEmployeeId(string employeeNumber)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.EmployeeNumber == employeeNumber)
                ?? throw new KeyNotFoundException("User not found");
        }

        public async Task<User?> GetFirstUserWithRoleAsync(string roleName)
        {
            if (!Enum.TryParse<Roles>(roleName, ignoreCase: true, out var role))
                return null;

            return await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.UserRoles.Any(r => r.Role.Name == role && r.DateRemoved == null));
        }
    }
}
