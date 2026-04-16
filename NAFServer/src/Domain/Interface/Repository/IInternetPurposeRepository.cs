using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IInternetPurposeRepository
    {
        //public Task<InternetPurpose> GetByIdAsync(int id);
        public Task<List<InternetPurpose>> GetAllAsync();
        public Task<List<InternetPurpose>> RecacheAllAsync();
        public Task<InternetPurpose> CreateAsync(string name, string description);
    }
}
