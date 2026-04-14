using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IResourceRequestHistoryRepository
    {
        public Task<List<ResourceRequestHistory>> GetByResourceRequestId(Guid resourceRequestId);
    }
}
