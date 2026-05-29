using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeesController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet("search/{match}")]
        public async Task<IActionResult> Search(string match)
        {
            var employee = await _employeeService.SearchEmployee(match);
            return Ok(employee);
        }

        [HttpGet("{employeeId}/department/search/{match}")]
        public async Task<IActionResult> SearchInDepartment(string employeeId, string match)
        {
            var employees = await _employeeService.SearchInDepartment(employeeId, match);
            return Ok(employees);
        }
    }
}
