using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Application.Interfaces
{
    public interface IAuditQueue
    {
        Task EnqueueAsync(AuditTrail audit);
        IAsyncEnumerable<AuditTrail> ReadAllAsync();
    }
}
