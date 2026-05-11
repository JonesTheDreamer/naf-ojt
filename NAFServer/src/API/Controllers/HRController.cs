using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.HR;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using static NAFServer.src.Application.DTOs.Common.PaginatedDTO;
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.API.Controllers
{
    [Route("api/hr")]
    [ApiController]
    [Authorize(Roles = "HR")]
    public class HRController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmployeeRepository _employeeRepository;

        public HRController(AppDbContext context, IEmployeeRepository employeeRepository)
        {
            _context = context;
            _employeeRepository = employeeRepository;
        }

        [HttpGet("nafs")]
        public async Task<IActionResult> GetNafs(
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            const int pageSize = 50;

            var totalCount = await _context.NAFs.CountAsync();

            var nafs = await _context.NAFs
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            var dtos = new List<HRNafDTO>();
            foreach (var naf in nafs)
            {
                var employee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);
                var employeeName = employee != null
                    ? $"{employee.FirstName} {employee.LastName}".Trim()
                    : naf.EmployeeId;
                var department = employee?.DepartmentDesc ?? string.Empty;

                dtos.Add(new HRNafDTO(naf.Id, employeeName, department, naf.CreatedAt));
            }

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return Ok(new PagedResult<HRNafDTO>
            {
                Data = dtos,
                TotalCount = totalCount,
                PageSize = pageSize,
                CurrentPage = page,
                TotalPages = totalPages
            });
        }
    }
}
