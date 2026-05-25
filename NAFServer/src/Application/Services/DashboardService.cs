using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;
using NAFServer.src.Infrastructure.Persistence;

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

        public async Task<DashboardAverageTimeDTO> GetAverageTimeAsync(int? locationId)
        {
            var cacheKey = $"dashboard:avg-time:{locationId?.ToString() ?? "all"}";
            var options = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromHours(8));

            return await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                // Load accomplished requests that have a completed implementation
                var requests = await _context.ResourceRequests
                    .Include(rr => rr.NAF)
                    .Include(rr => rr.ResourceRequestImplementation)
                    .Where(rr => rr.Progress == Progress.ACCOMPLISHED)
                    .Where(rr => rr.ResourceRequestImplementation != null
                              && rr.ResourceRequestImplementation.AccomplishedAt != null)
                    .Where(rr => locationId == null || rr.NAF.LocationId == locationId)
                    .AsNoTracking()
                    .Take(50)
                    .ToListAsync();

                if (!requests.Any())
                    return new DashboardAverageTimeDTO(0, null, null, null, null, null);

                var requestIds = requests.Select(r => r.Id).ToList();

                // Resolve approval step histories via step IDs
                var steps = await _context.ResourceRequestApprovalSteps
                    .Where(s => requestIds.Contains(s.ResourceRequestId))
                    .Select(s => new { s.Id, s.ResourceRequestId })
                    .AsNoTracking()
                    .ToListAsync();

                var stepIdToRequestId = steps.ToDictionary(s => s.Id, s => s.ResourceRequestId);
                var stepIdList = steps.Select(s => s.Id).ToList();

                var histories = await _context.ResourceRequestApprovalStepHistories
                    .Where(h => stepIdList.Contains(h.ResourceRequestApprovalStepId))
                    .Select(h => new { h.ResourceRequestApprovalStepId, h.ActionAt })
                    .AsNoTracking()
                    .ToListAsync();

                // Group action timestamps by ResourceRequestId
                var actionsByRequestId = histories
                    .GroupBy(h => stepIdToRequestId[h.ResourceRequestApprovalStepId])
                    .ToDictionary(g => g.Key, g => g.Select(h => h.ActionAt).ToList());

                var overallDurations = new List<double>();
                var openToApprovalDurations = new List<double>();
                var approvalToScreeningDurations = new List<double>();
                var screeningToImplDurations = new List<double>();
                var implToAccomplishedDurations = new List<double>();

                foreach (var rr in requests)
                {
                    var impl = rr.ResourceRequestImplementation;
                    if (impl?.AccomplishedAt == null) continue;

                    overallDurations.Add((impl.AccomplishedAt.Value - rr.CreatedAt).TotalMinutes);

                    if (actionsByRequestId.TryGetValue(rr.Id, out var actions) && actions.Any())
                    {
                        var firstAction = actions.Min();
                        openToApprovalDurations.Add((firstAction - rr.CreatedAt).TotalMinutes);

                        if (impl.AcceptedAt.HasValue)
                        {
                            var lastAction = actions.Max();
                            approvalToScreeningDurations.Add((impl.AcceptedAt.Value - lastAction).TotalMinutes);
                        }
                    }

                    if (impl.CreatedAt != default(DateTime) && impl.AcceptedAt.HasValue)
                        screeningToImplDurations.Add((impl.AcceptedAt.Value - impl.CreatedAt).TotalMinutes);

                    if (impl.AcceptedAt.HasValue)
                        implToAccomplishedDurations.Add((impl.AccomplishedAt.Value - impl.AcceptedAt.Value).TotalMinutes);
                }

                static double? Avg(List<double> list) =>
                    list.Count > 0 ? Math.Round(list.Average()) : null;

                return new DashboardAverageTimeDTO(
                    requests.Count,
                    overallDurations.Count > 0 ? Math.Round(overallDurations.Average()) : null,
                    Avg(openToApprovalDurations),
                    Avg(approvalToScreeningDurations),
                    Avg(screeningToImplDurations),
                    Avg(implToAccomplishedDurations)
                );
            }, options);
        }
    }
}
