using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class UserRoleRepository : IUserRoleRepository
    {
        private readonly AppDbContext _context;

        public UserRoleRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserRole>> AddUserRoleAsync(int userId, int roleId)
        {
            List<UserRole> roles;
            try
            {
                roles = await GetUserRolesAsync(userId);
            }
            catch (KeyNotFoundException)
            {
                roles = new List<UserRole>();
            }

            var existingRole = roles.FirstOrDefault(r => r.RoleId == roleId);
            if (existingRole != null)
            {
                if (existingRole.IsActive)
                    throw new KeyNotFoundException("User already has this role.");
                existingRole.SetToActive();
            }
            else
            {
                _context.UserRoles.Add(new UserRole(userId, roleId));
            }
            await _context.SaveChangesAsync();

            try
            {
                return await GetUserRolesAsync(userId);
            }
            catch (KeyNotFoundException)
            {
                return new List<UserRole>();
            }
        }

        public async Task<List<UserRole>> GetUserRolesAsync(int userId)
        {
            var result = await _context.UserRoles
            .Include(ur => ur.Role)
            .Include(ur => ur.User)
            .Where(ul => ul.UserId == userId)
            .ToListAsync();

            if (!result.Any())
                throw new KeyNotFoundException("No user roles found");

            return result;
        }

        public async Task<List<UserRole>> GetUserActiveRolesAsync(int userId)
        {
            var roles = await GetUserRolesAsync(userId);
            var activeRoles = roles.Where(r => r.IsActive).ToList();
            return activeRoles;
        }

        public async Task<List<UserRole>> RemoveUserRoleAsync(int userId, int roleId)
        {
            var roles = await GetUserRolesAsync(userId);
            var existingRole = roles.FirstOrDefault(r => r.RoleId == roleId);
            if (existingRole != null)
            {
                if (!existingRole.IsActive)
                {
                    throw new KeyNotFoundException("User is doesn't have this role");
                }
                existingRole.SetToInactive();
                await _context.SaveChangesAsync();
            }
            await _context.SaveChangesAsync();
            return await GetUserRolesAsync(userId);
        }

        public async Task<bool> UserHasRoleAsync(int userId, int roleId)
        {
            return await _context.UserRoles
            .AnyAsync(ul => ul.UserId == userId && ul.RoleId == roleId && ul.IsActive);
        }
    }
}
