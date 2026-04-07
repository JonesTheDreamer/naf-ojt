using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IImplementationRepository
    {
        public Task<ResourceRequestImplementation> GetByIdAsync(string id);
    }
}
