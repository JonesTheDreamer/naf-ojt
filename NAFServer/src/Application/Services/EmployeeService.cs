using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IEmployeeRepository _employeeRepository;

        public EmployeeService(IEmployeeRepository employeeRepository)
        {
            _employeeRepository = employeeRepository;
        }

        public async Task<List<Employee>> SearchEmployee(string match)
        {
            return await _employeeRepository.SearchEmployee(match);
        }
    }
}
