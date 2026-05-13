using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class DepartmentEmployeeService : IDepartmentEmployeeService
    {
        private readonly IDepartmentEmployeeRepository _departmentEmployeeRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly AppDbContext _context;

        public DepartmentEmployeeService(
            IDepartmentEmployeeRepository departmentEmployeeRepository,
            IEmployeeRepository employeeRepository,
            AppDbContext context)
        {
            _departmentEmployeeRepository = departmentEmployeeRepository;
            _employeeRepository = employeeRepository;
            _context = context;
        }

        public async Task<List<DepartmentEmployeeDTO>> GetDepartmentEmployeesAsync(int departmentId)
        {
            var assignments = await _departmentEmployeeRepository.GetActiveByDepartmentAsync(departmentId);

            var result = new List<DepartmentEmployeeDTO>();
            foreach (var assignment in assignments)
            {
                var employee = await _employeeRepository.GetByIdAsync(assignment.EmployeeId);
                if (employee == null) continue;

                var naf = await _context.NAFs
                    .Where(n => n.EmployeeId == assignment.EmployeeId)
                    .Select(n => new { n.Id, n.Reference, n.Progress })
                    .FirstOrDefaultAsync();

                result.Add(new DepartmentEmployeeDTO(
                    employee.Id,
                    employee.FirstName,
                    employee.MiddleName,
                    employee.LastName,
                    employee.Position,
                    naf?.Id,
                    naf?.Reference,
                    naf?.Progress.ToString()
                ));
            }

            return result;
        }

        public async Task AddEmployeeToDepartmentAsync(int departmentId, string employeeId)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeId);
            if (employee == null)
                throw new KeyNotFoundException($"Employee {employeeId} not found.");

            await _departmentEmployeeRepository.AddAsync(departmentId, employeeId);
        }

        public async Task RemoveEmployeeFromDepartmentAsync(int departmentId, string employeeId)
        {
            await _departmentEmployeeRepository.RemoveAsync(departmentId, employeeId);
        }
    }
}
