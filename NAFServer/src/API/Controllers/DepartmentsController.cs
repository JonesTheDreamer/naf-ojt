using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin/departments")]
    [ApiController]
    //[Authorize(Roles = "ADMIN")]
    public class DepartmentsController : ControllerBase
    {
        private readonly IEmployeeRepository _employeeRepository;

        public DepartmentsController(IEmployeeRepository employeeRepository)
        {
            _employeeRepository = employeeRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var departments = await _employeeRepository.GetAllDepartmentsAsync();
            var result = departments.Select(d => new DepartmentViewDTO(d.Id, d.DepartmentDesc, d.DepartmentHead));
            return Ok(result);
        }

        [HttpGet("{departmentId}/employees")]
        public async Task<IActionResult> GetEmployees(string departmentId)
        {
            var employees = await _employeeRepository.GetByDepartmentAsync(departmentId);
            return Ok(employees.Select(NAFMapper.ToEmployeeDTO));
        }
    }
}
