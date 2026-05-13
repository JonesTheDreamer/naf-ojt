using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin/departments")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;
        private readonly IDepartmentEmployeeService _departmentEmployeeService;
        private readonly IEmployeeRepository _employeeRepository;

        public DepartmentsController(
            IDepartmentService departmentService,
            IDepartmentEmployeeService departmentEmployeeService,
            IEmployeeRepository employeeRepository)
        {
            _departmentService = departmentService;
            _departmentEmployeeService = departmentEmployeeService;
            _employeeRepository = employeeRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? locationId)
        {
            return Ok(await _departmentService.GetAllDepartmentsAsync(locationId));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var dept = await _departmentService.GetDepartmentByIdAsync(id);
                var head = dept.DepartmentHeadId != null
                    ? await _employeeRepository.GetByIdAsync(dept.DepartmentHeadId)
                    : null;

                return Ok(new DepartmentDetailDTO(
                    dept.Id,
                    dept.Code,
                    dept.Name,
                    dept.IsActive,
                    dept.DepartmentHeadId,
                    head != null ? $"{head.FirstName} {head.LastName}" : "",
                    head?.Position ?? "",
                    dept.LocationId,
                    dept.Location
                ));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDepartmentDTO dto)
        {
            try
            {
                var dept = await _departmentService.CreateDepartmentAsync(dto);
                return Created("", dept);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPut("{id:int}/head")]
        public async Task<IActionResult> ChangeHead(int id, [FromBody] string employeeId)
        {
            try
            {
                var dept = await _departmentService.GetDepartmentByIdAsync(id);
                var updated = await _departmentService.SetDepartmentHeadAsync(dept.Code, employeeId);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("{id:int}/inactive")]
        public async Task<IActionResult> SetInactive(int id)
        {
            try
            {
                var dept = await _departmentService.GetDepartmentByIdAsync(id);
                await _departmentService.RemoveDepartment(dept.Code);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("{id:int}/employees")]
        public async Task<IActionResult> GetEmployees(int id)
        {
            return Ok(await _departmentEmployeeService.GetDepartmentEmployeesAsync(id));
        }

        [HttpPost("{id:int}/employees")]
        public async Task<IActionResult> AddEmployee(int id, [FromBody] AddDepartmentEmployeeDTO dto)
        {
            try
            {
                await _departmentEmployeeService.AddEmployeeToDepartmentAsync(id, dto.EmployeeId);
                return Created("", null);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{id:int}/employees/{employeeId}")]
        public async Task<IActionResult> RemoveEmployee(int id, string employeeId)
        {
            try
            {
                await _departmentEmployeeService.RemoveEmployeeFromDepartmentAsync(id, employeeId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
