using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class DepartmentEmployeeRepository : IDepartmentEmployeeRepository
    {
        private readonly AppDbContext _context;

        public DepartmentEmployeeRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<DepartmentEmployee>> GetActiveByDepartmentAsync(int departmentId)
        {
            return await _context.DepartmentEmployees
                .Where(de => de.DepartmentId == departmentId && de.IsActive)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<DepartmentEmployee?> GetActiveAsync(int departmentId, string employeeId)
        {
            return await _context.DepartmentEmployees
                .FirstOrDefaultAsync(de => de.DepartmentId == departmentId
                    && de.EmployeeId == employeeId
                    && de.IsActive);
        }

        public async Task<DepartmentEmployee> AddAsync(int departmentId, string employeeId)
        {
            if (await _context.DepartmentEmployees.AnyAsync(de =>
                de.DepartmentId == departmentId && de.EmployeeId == employeeId && de.IsActive))
                throw new InvalidOperationException("Employee is already in this department.");

            var entry = await _context.DepartmentEmployees.AddAsync(
                new DepartmentEmployee(departmentId, employeeId));
            await _context.SaveChangesAsync();
            return entry.Entity;
        }

        public async Task RemoveAsync(int departmentId, string employeeId)
        {
            var record = await GetActiveAsync(departmentId, employeeId);
            if (record == null)
                throw new KeyNotFoundException("Employee assignment not found.");

            record.SetToInactive();
            await _context.SaveChangesAsync();
        }
    }
}
