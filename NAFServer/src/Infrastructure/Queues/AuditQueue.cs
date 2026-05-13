using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using System.Threading.Channels;

namespace NAFServer.src.Infrastructure.Queues
{
    public class AuditQueue : IAuditQueue
    {
        private readonly Channel<AuditTrail> _channel;

        public AuditQueue()
        {
            _channel = Channel.CreateBounded<AuditTrail>(
                new BoundedChannelOptions(1000)
                {
                    FullMode = BoundedChannelFullMode.Wait
                });
        }

        public async Task EnqueueAsync(AuditTrail audit)
        {
            await _channel.Writer.WriteAsync(audit);
        }

        public IAsyncEnumerable<AuditTrail> ReadAllAsync()
        {
            return _channel.Reader.ReadAllAsync();
        }
    }
}
