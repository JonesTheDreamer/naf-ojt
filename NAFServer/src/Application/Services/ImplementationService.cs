using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Mapper;
using static NAFServer.src.Domain.Entities.ResourceRequestImplementation;

namespace NAFServer.src.Application.Services
{
    public class ImplementationService : IImplementationService
    {
        private readonly IImplementationRepository _implementationRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly AppDbContext _context;

        public ImplementationService(
            IImplementationRepository implementationRepository,
            IEmployeeRepository employeeRepository,
            AppDbContext context)
        {
            _implementationRepository = implementationRepository;
            _employeeRepository = employeeRepository;
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

        public async Task<List<NAFDTO>> GetForImplementationsAsync()
        {
            var nafs = await _implementationRepository.GetForImplementationsAsync();
            return await MapNAFsToDTO(nafs);
        }

        public async Task<List<NAFDTO>> GetMyTasksAsync(string employeeId)
        {
            var nafs = await _implementationRepository.GetMyTasksByEmployeeIdAsync(employeeId);
            return await MapNAFsToDTO(nafs);
        }

        public async Task<ForImplementationItemDTO> AssignToMeAsync(Guid resourceRequestId, string employeeId)
        {
            var existing = await _implementationRepository.GetByResourceRequestIdAsync(resourceRequestId);

            if (existing != null && existing.EmployeeId != null)
                throw new InvalidOperationException("This resource request is already assigned.");

            var implementation = existing ?? await _implementationRepository.CreateAsync(resourceRequestId);
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

        private async Task<List<NAFDTO>> MapNAFsToDTO(List<NAF> nafs)
        {
            var employeeIds = nafs.Select(n => n.EmployeeId).Distinct().ToList();
            var employees = new List<Employee>();
            foreach (var id in employeeIds)
            {
                var employee = await _employeeRepository.GetByIdAsync(id);
                if (employee != null) employees.Add(employee);
            }
            var employeeLookup = employees.ToDictionary(e => e.Id);

            var result = new List<NAFDTO>();
            foreach (var naf in nafs)
            {
                if (!employeeLookup.TryGetValue(naf.EmployeeId, out var employee)) continue;
                result.Add(NAFMapper.ToDTO(naf, employee));
            }
            return result;
        }
    }
}
