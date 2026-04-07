using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Mapper;

namespace NAFServer.src.Application.Services
{
    public class ImplementationService : IImplementationService
    {
        private readonly IImplementationRepository _implementationRepository;
        private readonly AppDbContext _context;

        public ImplementationService(IImplementationRepository implementationRepository, AppDbContext context)
        {
            _implementationRepository = implementationRepository;
            _context = context;
        }

        public async Task<ResourceRequestImplementationDTO> SetToAccomplished(string request)
        {
            var implementation = await _implementationRepository.GetByIdAsync(request);
            if (implementation == null)
                throw new KeyNotFoundException("Implementation not found");
            implementation.SetToAccomplished();
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);

        }

        public async Task<ResourceRequestImplementationDTO> SetToDelayed(string request, string DelayReason)
        {
            var implementation = await _implementationRepository.GetByIdAsync(request);
            if (implementation == null)
                throw new KeyNotFoundException("Implementation not found");
            implementation.SetToDelayed(DelayReason);
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }

        public async Task<ResourceRequestImplementationDTO> SetToInProgress(string request, string EmployeeId)
        {
            var implementation = await _implementationRepository.GetByIdAsync(request);
            if (implementation == null)
                throw new KeyNotFoundException("Implementation not found");
            implementation.SetToInProgress(EmployeeId);
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }
    }
}
