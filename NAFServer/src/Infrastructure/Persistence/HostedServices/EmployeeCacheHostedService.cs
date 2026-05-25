using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Infrastructure.Helper;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Infrastructure.Persistence.HostedServices
{
    public class EmployeeCacheHostedService : IHostedService, IDisposable
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly CacheService _cache;
        private readonly ILogger<EmployeeCacheHostedService> _logger;
        private Timer? _timer;

        private const string EmployeeKey = "employees:all";
        private const string DepartmentKey = "departments:all";
        private static readonly TimeSpan RefreshInterval = TimeSpan.FromHours(6);

        public EmployeeCacheHostedService(
            IServiceScopeFactory scopeFactory,
            CacheService cache,
            ILogger<EmployeeCacheHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _cache = cache;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            await RefreshAsync();
            _timer = new Timer(_ => _ = RefreshAsync(), null, RefreshInterval, RefreshInterval);
        }

        public async Task RefreshAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var employees = await context.Employees.AsNoTracking().ToListAsync();
                var departments = await context.DepartmentViews.AsNoTracking().ToListAsync();

                _cache.Set(EmployeeKey, employees);
                _cache.Set(DepartmentKey, departments);

                _logger.LogInformation("Employee cache refreshed: {Count} employees, {DeptCount} departments.",
                    employees.Count, departments.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh employee cache.");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _timer?.Change(Timeout.Infinite, 0);
            return Task.CompletedTask;
        }

        public void Dispose() => _timer?.Dispose();
    }
}
