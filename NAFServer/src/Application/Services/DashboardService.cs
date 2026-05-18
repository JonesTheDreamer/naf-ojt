using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;
using NAFServer.src.Infrastructure.Persistence;
using Microsoft.Extensions.Caching.Memory;

namespace NAFServer.src.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly CacheService _cacheService;

        public DashboardService(
            AppDbContext context,
            IEmployeeRepository employeeRepository,
            CacheService cacheService)
        {
            _context = context;
            _employeeRepository = employeeRepository;
            _cacheService = cacheService;
        }

        public async Task<DashboardStatsDTO> GetStatsAsync(int? locationId)
        {
            // 1. Recent 5 requests per progress status
            var recentByStatus = new Dictionary<string, List<AdminResourceRequestDTO>>();

            foreach (var progress in Enum.GetValues<Progress>())
            {
                var items = await _context.ResourceRequests
                    .Include(rr => rr.NAF)
                    .Include(rr => rr.Resource)
                    .Where(rr => rr.Progress == progress)
                    .Where(rr => locationId == null || rr.NAF.LocationId == locationId)
                    .OrderByDescending(rr => rr.CreatedAt)
                    .Take(5)
                    .AsNoTracking()
                    .ToListAsync();

                var dtos = new List<AdminResourceRequestDTO>();
                foreach (var rr in items)
                {
                    var employee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
                    var employeeName = employee != null
                        ? $"{employee.FirstName} {employee.LastName}".Trim()
                        : rr.NAF.EmployeeId;

                    dtos.Add(new AdminResourceRequestDTO(
                        rr.Id,
                        rr.NAFId,
                        rr.NAF.Reference,
                        employeeName,
                        rr.Resource.Name,
                        (int)rr.Progress,
                        rr.DateNeeded == default(DateTime) ? null : rr.DateNeeded,
                        rr.CreatedAt
                    ));
                }

                recentByStatus[progress.ToString()] = dtos;
            }

            // 2. Beyond deadline count (active, non-terminal requests past DateNeeded)
            var today = DateTime.Today;
            var beyondDeadlineCount = await _context.ResourceRequests
                .Where(rr => locationId == null || rr.NAF.LocationId == locationId)
                .Where(rr => rr.DateNeeded != default(DateTime) && rr.DateNeeded < today)
                .Where(rr => rr.Progress != Progress.ACCOMPLISHED
                          && rr.Progress != Progress.CANCELLED
                          && rr.Progress != Progress.REJECTED
                          && rr.Progress != Progress.DEACTIVATED)
                .CountAsync();

            // 3. Resource access counts (distinct employees per resource with ACCOMPLISHED requests)
            var accomplishedRequests = await _context.ResourceRequests
                .Include(rr => rr.NAF)
                .Include(rr => rr.Resource)
                .Where(rr => rr.Progress == Progress.ACCOMPLISHED)
                .Where(rr => locationId == null || rr.NAF.LocationId == locationId)
                .AsNoTracking()
                .ToListAsync();

            var resourceAccessCounts = accomplishedRequests
                .GroupBy(rr => new { rr.ResourceId, rr.Resource.Name })
                .Select(g => new ResourceAccessCountDTO(
                    g.Key.ResourceId,
                    g.Key.Name,
                    g.Select(rr => rr.NAF.EmployeeId).Distinct().Count()
                ))
                .OrderByDescending(x => x.Count)
                .ToList();

            return new DashboardStatsDTO(recentByStatus, beyondDeadlineCount, resourceAccessCounts);
        }

        public Task<DashboardAverageTimeDTO> GetAverageTimeAsync(int? locationId)
            => throw new NotImplementedException();
    }
}
