using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class InternetPurposeService : IInternetPurposeService
    {
        private readonly IInternetPurposeRepository _repo;

        public InternetPurposeService(IInternetPurposeRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<InternetPurposeDTO>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(i => new InternetPurposeDTO(i.Id, i.Name, i.Description)).ToList();
        }
    }
}
