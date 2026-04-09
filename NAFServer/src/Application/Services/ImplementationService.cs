using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Mapper;
using static NAFServer.src.Domain.Entities.ResourceRequestImplementation;

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
            implementation.SetToAccomplished();
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }

        public async Task<ResourceRequestImplementationDTO> SetToDelayed(string request, string delayReason)
        {
            var implementation = await _implementationRepository.GetByIdAsync(request);
            implementation.SetToDelayed(delayReason);
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }

        public async Task<ResourceRequestImplementationDTO> SetToInProgress(string request, string employeeId)
        {
            var implementation = await _implementationRepository.GetByIdAsync(request);
            implementation.SetToInProgress(employeeId);
            await _context.SaveChangesAsync();
            return ResourceRequestImplementationMapper.ToDTO(implementation);
        }

        public async Task<List<ForImplementationItemDTO>> GetMyTasksAsync(string employeeId)
        {
            var implementations = await _implementationRepository.GetByEmployeeIdAsync(employeeId);
            return implementations.Select(i => new ForImplementationItemDTO(
                i.ResourceRequest.Id,
                i.ResourceRequest.NAFId,
                i.ResourceRequest.Progress.ToString(),
                i.ResourceRequest.Resource.Name,
                i.Id,
                i.Status,
                i.EmployeeId
            )).ToList();
        }

        public async Task<List<ForImplementationItemDTO>> GetForImplementationsAsync()
        {
            var resourceRequests = await _implementationRepository.GetForImplementationsAsync();
            return resourceRequests.Select(rr => new ForImplementationItemDTO(
                rr.Id,
                rr.NAFId,
                rr.Progress.ToString(),
                rr.Resource.Name,
                rr.ResourceRequestImplementation?.Id,
                rr.ResourceRequestImplementation?.Status,
                rr.ResourceRequestImplementation?.EmployeeId
            )).ToList();
        }

        public async Task<ForImplementationItemDTO> AssignToMeAsync(Guid resourceRequestId, string employeeId)
        {
            var existing = await _implementationRepository.GetByResourceRequestIdAsync(resourceRequestId);
            if (existing != null)
                throw new InvalidOperationException("This resource request already has an implementation record.");

            var implementation = await _implementationRepository.CreateAsync(resourceRequestId);
            implementation.SetToInProgress(employeeId);
            await _context.SaveChangesAsync();

            return new ForImplementationItemDTO(
                resourceRequestId,
                Guid.Empty,
                "IMPLEMENTATION",
                string.Empty,
                implementation.Id,
                implementation.Status,
                implementation.EmployeeId
            );
        }
    }
}
