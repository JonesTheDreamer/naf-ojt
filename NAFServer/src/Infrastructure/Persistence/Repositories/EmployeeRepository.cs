using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly AppDbContext _context;

        public EmployeeRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Employee?> GetByIdAsync(string employeeNumber)
        {
            return await _context.Employees.FindAsync(employeeNumber);
        }

        public async Task<List<Employee>> GetEmployeeSubordinates(string employeeNumber)
        {
            return await _context.Employees
                .Where(e =>
                    e.SupervisorId == employeeNumber ||
                    e.DepartmentHeadId == employeeNumber)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<Employee>> SearchEmployee(string match)
        {
            return await _context.Employees
                .Where(e =>
                    e.Status == "Active" && (
                        e.Id.Contains(match) ||
                        e.LastName.Contains(match) ||
                        e.FirstName.Contains(match) ||
                        (e.MiddleName != null && e.MiddleName.Contains(match))
                    ))
                .OrderBy(e => e.Id)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
