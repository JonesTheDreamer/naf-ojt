using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class UserDepartmentRepository : IUserDepartmentRepository
    {
        private readonly AppDbContext _context;

        public UserDepartmentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserDepartment>> AddUserCurrentDepartment(int userId, int departmentId)
        {
            var departments = await GetUserDepartmentsAsync(userId);
            var existingDepartment = departments.FirstOrDefault(d => d.DepartmentId == departmentId);
            if (existingDepartment != null)
            {
                if (existingDepartment.IsActive)
                {
                    throw new InvalidOperationException("User is already in this department");
                }
                existingDepartment.SetToActive();
            }
            else
            {
                var activeDepartment = departments.FirstOrDefault(d => d.IsActive);
                if (activeDepartment != null)
                {
                    activeDepartment.SetToInactive();
                }
                else
                    _context.UserDepartments.Add(new UserDepartment(userId, departmentId));
            }
            await _context.SaveChangesAsync();
            return await GetUserDepartmentsAsync(userId);
        }

        public async Task<UserDepartment> GetUserActiveDepartment(int userId)
        {
            var departments = await GetUserDepartmentsAsync(userId);
            return departments.FirstOrDefault(d => d.IsActive) ?? throw new KeyNotFoundException("No active department found");
        }

        public async Task<List<UserDepartment>> GetUserDepartmentsAsync(int userId)
        {
            var result = await _context.UserDepartments
                .Include(ud => ud.Department)
                .Include(ud => ud.User)
                .Where(ud => ud.UserId == userId)
                .ToListAsync();

            if (!result.Any())
                throw new KeyNotFoundException("No user departments found");

            return result;
        }


        public async Task<List<UserDepartment>> RemoveUserFromDepartment(int userId, int departmentId)
        {
            var departments = await GetUserDepartmentsAsync(userId);
            var existingDepartment = departments.FirstOrDefault(d => d.DepartmentId == departmentId);
            if (existingDepartment != null)
            {
                if (!existingDepartment.IsActive)
                {
                    throw new KeyNotFoundException("User is already not in the department");
                }
                existingDepartment.SetToInactive();
                await _context.SaveChangesAsync();
            }
            return await GetUserDepartmentsAsync(userId);
        }

    }
}
