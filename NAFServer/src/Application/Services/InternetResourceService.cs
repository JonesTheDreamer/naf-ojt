using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class InternetResourceService : IInternetResourceService
    {
        private readonly IInternetResourceRepository _repo;

        public InternetResourceService(IInternetResourceRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<InternetResourceItemDTO>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(i => new InternetResourceItemDTO(
                i.Id, i.Name, i.Url, i.Description, i.PurposeId)).ToList();
        }

        public async Task<InternetResourceItemDTO> CreateAsync(CreateInternetResourceDTO dto)
        {
            var entity = await _repo.CreateAsync(dto.Name, dto.Url, dto.Description, dto.PurposeId);
            return new InternetResourceItemDTO(entity.Id, entity.Name, entity.Url, entity.Description, entity.PurposeId);
        }
    }
}
