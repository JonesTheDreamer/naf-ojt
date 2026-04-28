using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;
        //private readonly CacheService _cacheService;
        //private readonly string cacheKey = "user_";

        public UserRepository(AppDbContext context)
        {
            _context = context;
            //_cacheService = cacheService;
        }

        public async Task<List<User>> GetAllAsync()
        {
            return await _context.Users.ToListAsync();
        }

        public async Task<List<User>> GetAllUsersInLocationAsync(int locationId)
        {
            return await _context.Users
                .Include(u => u.Employee)
                .Where(u => u.UserLocations.Any(ul => ul.LocationId == locationId && ul.IsActive))
                .ToListAsync();
        }

        public async Task<User> GetUserById(int userId)
        {
            return await _context.Users
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new KeyNotFoundException("User not found");
        }

        public async Task<User> GetUserByEmployeeId(string employeeId)
        {
            return await _context.Users
                .Include(u => u.Employee)

                .Include(u => u.UserLocations
                    .Where(ul => ul.IsActive))
                    .ThenInclude(ul => ul.Location)

                .Include(u => u.UserRoles
                    .Where(ur => ur.IsActive))
                    .ThenInclude(ur => ur.Role)

                .Include(u => u.UserDepartments
                    .Where(ud => ud.IsActive))
                    .ThenInclude(ud => ud.Department)

                .FirstOrDefaultAsync(u => u.EmployeeNumber == employeeId) ?? throw new KeyNotFoundException("User not found"); ;
        }

        public async Task<User> SetUserToInactive(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new KeyNotFoundException($"User {userId} not found");

            user.SetUserToInactive();
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> SetUserToActive(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new KeyNotFoundException($"User {userId} not found");

            user.SetUserToActive();
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            return user;
        }

        //public async Task<User>

        public async Task<User> GetNetworkAdminOfLocation(int locationId)
        {
            return await _context.Users
                .Include(u => u.Employee)
                .Where
                (
                    u =>
                    u.UserLocations.Any(l => l.LocationId == locationId) &&
                    u.UserRoles.Any(r => r.Role.Name == Roles.ADMIN && r.DateRemoved == null)
                )
                .FirstAsync();
        }

        public async Task<User> ResolveUserByEmployeeId(string employeeNumber)
        {
            return await _context.Users
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.EmployeeNumber == employeeNumber)
                ?? throw new KeyNotFoundException($"User not found");
        }
    }
}