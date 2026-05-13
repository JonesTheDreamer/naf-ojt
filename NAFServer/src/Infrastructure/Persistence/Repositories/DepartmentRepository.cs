using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class DepartmentRepository : IDepartmentRepository
    {
        private readonly AppDbContext _context;

        public DepartmentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Department> AddAsync(CreateDepartmentDTO department)
        {
            if (await _context.Departments.AnyAsync(d => d.Code == department.Code))
                throw new InvalidOperationException("Department already exists.");

            var entry = await _context.Departments.AddAsync(
                new Department(department.Code, department.Name, department.DepartmentHeadId, department.LocationId));

            await _context.SaveChangesAsync();
            return entry.Entity;
        }

        public async Task RemoveAsync(string code)
        {
            var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == code);
            if (dept == null)
                throw new KeyNotFoundException("Department doesn't exist.");

            dept.SetToInactive();
            await _context.SaveChangesAsync();
        }

        public async Task<List<Department>> GetAllAsync(int? locationId = null)
        {
            var query = _context.Departments
                .Include(d => d.DepartmentHead)
                .Include(d => d.Location)
                .AsQueryable();

            if (locationId.HasValue)
                query = query.Where(d => d.LocationId == locationId.Value);

            return await query.AsNoTracking().ToListAsync();
        }

        public async Task<Department?> GetByIdAsync(int id)
        {
            return await _context.Departments
                .Include(d => d.DepartmentHead)
                .Include(d => d.Location)
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == id)
                ?? throw new KeyNotFoundException("No department found");
        }

        public async Task<Department> GetByCodeAsync(string code)
        {
            return await _context.Departments
                .Include(d => d.DepartmentHead)
                .Include(d => d.Location)
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Code == code)
                ?? throw new KeyNotFoundException("No department found");
        }

        public async Task<Department> SetDepartmentHeadAsync(string departmentCode, string employeeNumber)
        {
            var department = await _context.Departments
                .Include(d => d.DepartmentHead)
                .Include(d => d.Location)
                .FirstOrDefaultAsync(d => d.Code == departmentCode);

            if (department == null)
                throw new KeyNotFoundException($"Department {departmentCode} not found");

            department.SetDepartmentHead(employeeNumber);
            await _context.SaveChangesAsync();
            return department;
        }

        public async Task<Department> SetLocationAsync(string departmentCode, int locationId)
        {
            var department = await _context.Departments
                .Include(d => d.DepartmentHead)
                .Include(d => d.Location)
                .FirstOrDefaultAsync(d => d.Code == departmentCode);

            if (department == null)
                throw new KeyNotFoundException($"Department {departmentCode} not found");

            department.SetLocation(locationId);
            await _context.SaveChangesAsync();
            return department;
        }
    }
}
