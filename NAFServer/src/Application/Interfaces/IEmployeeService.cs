using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Application.Interfaces
{
    public interface IEmployeeService
    {
        public Task<List<Employee>> SearchEmployee(string match);
        public Task<List<Employee>> SearchInDepartment(string employeeId, string match);
    }
}
