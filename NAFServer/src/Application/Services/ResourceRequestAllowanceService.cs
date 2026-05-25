using NAFServer.src.Application.DTOs.ResourceRequestAllowance;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Mapper;

namespace NAFServer.src.Application.Services
{
    public class ResourceRequestAllowanceService : IResourceRequestAllowanceService
    {
        private readonly IResourceRequestAllowanceRepository _repository;

        public ResourceRequestAllowanceService(IResourceRequestAllowanceRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<ResourceRequestAllowanceDTO>> GetAllAsync()
        {
            var list = await _repository.GetAllAsync();
            return ResourceRequestAllowanceMapper.ListToDTO(list);
        }

        public async Task<ResourceRequestAllowanceDTO> GetByIdAsync(int id)
        {
            var allowance = await _repository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Allowance {id} not found.");
            return ResourceRequestAllowanceMapper.ToDTO(allowance);
        }

        public async Task<ResourceRequestAllowanceDTO> CreateAsync(CreateResourceRequestAllowanceDTO dto)
        {
            var allowance = await _repository.CreateAsync(dto.ResourceId, dto.LocationId, dto.AllowanceDays);
            return ResourceRequestAllowanceMapper.ToDTO(allowance);
        }

        public async Task<ResourceRequestAllowanceDTO> UpdateAsync(int id, UpdateResourceRequestAllowanceDTO dto)
        {
            var allowance = await _repository.UpdateAsync(id, dto.AllowanceDays);
            return ResourceRequestAllowanceMapper.ToDTO(allowance);
        }

        public Task DeleteAsync(int id) => _repository.DeleteAsync(id);
    }
}
