using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IInternetResourceRepository
    {
        public Task<List<InternetResource>> GetAllAsync();
        public Task<InternetResource> GetByIdAsync(int id);
        public Task<List<InternetResource>> RecacheAllAsync();
    }
}
