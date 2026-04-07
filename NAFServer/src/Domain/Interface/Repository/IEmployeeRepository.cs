using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IEmployeeRepository
    {
        public Task<Employee?> GetByIdAsync(string employeeNumber);
        public Task<List<Employee>> GetEmployeeSubordinates(string employeeNumber);
        public Task<List<Employee>> SearchEmployee(string match);
        //public Task<List<Employee>> GetEmployees(List<string> employeeNumbers);
    }
}
