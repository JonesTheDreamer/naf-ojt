
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Infrastructure.BackgroundServices
{
    public class AuditWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IAuditQueue _queue;

        private const int BatchSize = 20;
        private static readonly TimeSpan FlushInterval = TimeSpan.FromSeconds(5);

        public AuditWorker
        (
            IAuditQueue queue,
            IServiceScopeFactory scopeFactory
        )
        {
            _queue = queue;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var buffer = new List<AuditTrail>();
            var lastFlushTime = DateTime.UtcNow;

            await foreach (var audit in _queue.ReadAllAsync().WithCancellation(stoppingToken))
            {
                buffer.Add(audit);
                var shouldFlush = buffer.Count >= BatchSize || DateTime.UtcNow - lastFlushTime >= FlushInterval;
                if (shouldFlush)
                {
                    await FlushAsync(buffer, stoppingToken);
                    buffer.Clear();
                    lastFlushTime = DateTime.UtcNow;
                }
            }

            if (buffer.Count > 0)
            {
                await FlushAsync(buffer, stoppingToken);
            }
        }

        private async Task FlushAsync(
            List<AuditTrail> batch,
            CancellationToken token)
        {
            using var scope = _scopeFactory.CreateScope();

            var db = scope.ServiceProvider
                .GetRequiredService<AppDbContext>();

            await db.AuditTrails.AddRangeAsync(batch, token);
            await db.SaveChangesAsync(token);
        }
    }
}
