using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Mapper;

namespace NAFServer.src.Application.Services
{
    public class ResourceService : IResourceService
    {
        private readonly IResourceRepository _resourceRepository;

        public ResourceService(IResourceRepository resourceRepository)
        {
            _resourceRepository = resourceRepository;
        }

        public async Task<List<ResourceDTO>> GetAllResourceAsync()
        {

            var resources = await _resourceRepository.GetAllResourcesAsync();
            return resources.Select(r => ResourceMapper.ToDTO(r)).ToList();
        }

        public async Task<ResourceDTO> GetResourceByIdAsync(int id)
        {
            return ResourceMapper.ToDTO(await _resourceRepository.GetResourceByIdAsync(id));
        }
    }
}
