using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IEmployeeRepository
    {
        Task<Employee?> GetByIdAsync(string employeeNumber);
        Task<List<Employee>> GetEmployeeSubordinates(string employeeNumber);
        Task<List<Employee>> SearchEmployee(string match);
        //public Task<List<Employee>> GetEmployees(List<string> employeeNumbers);
    }
}
