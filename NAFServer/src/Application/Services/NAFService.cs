using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Handlers.Interface;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using static NAFServer.src.Application.DTOs.Common.PaginatedDTO;

namespace NAFServer.src.Application.Services
{
    public class NAFService : INAFService
    {
        private readonly AppDbContext _context;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly INAFRepository _nafRepository;
        private readonly IApprovalWorkflowTemplateRepository _approvalWorkflowTemplateRepository;
        private readonly IApprovalWorkflowStepsTemplateRepository _approvalWorkflowStepsTemplateRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IResourceRequestService _resourceRequestService;
        private readonly IResourceRepository _resourceRepository;
        private readonly IResourceRequestHandlerRegistry _resourceRequestHandlerRegistry;
        private readonly IUserRepository _userRepository;
        private readonly IUserLocationRepository _userLocationRepository;
        private readonly IUserDepartmentRepository _userDepartmentRepository;
        public NAFService
        (
            AppDbContext context,
            IEmployeeRepository employeeRepository,
            INAFRepository nafRepository,
            IApprovalWorkflowTemplateRepository approvalWorkflowTemplateRepository,
            IApprovalWorkflowStepsTemplateRepository approvalWorkflowStepsTemplateRepository,
            IDepartmentRepository departmentRepository,
            IResourceRequestService resourceRequestService,
            IResourceRepository resourceRepository,
            IResourceRequestHandlerRegistry resourceRequestHandlerRegistry,
            IUserRepository userRepository,
            IUserLocationRepository userLocationRepository,
            IUserDepartmentRepository userDepartmentRepository
        )
        {
            _context = context;
            _employeeRepository = employeeRepository;
            _nafRepository = nafRepository;
            _approvalWorkflowTemplateRepository = approvalWorkflowTemplateRepository;
            _approvalWorkflowStepsTemplateRepository = approvalWorkflowStepsTemplateRepository;
            _departmentRepository = departmentRepository;
            _resourceRequestService = resourceRequestService;
            _resourceRepository = resourceRepository;
            _resourceRequestHandlerRegistry = resourceRequestHandlerRegistry;
            _userRepository = userRepository;
            _userLocationRepository = userLocationRepository;
            _userDepartmentRepository = userDepartmentRepository;
        }

        public async Task<NAFDTO> GetNAFByIdAsync(Guid id)
        {
            var naf = await _nafRepository.GetByIdAsync(id);
            var employee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);

            var approverIds = naf.ResourceRequests
                .SelectMany(rr => rr.ResourceRequestsApprovalSteps)
                .Select(s => s.ApproverId)
                .Distinct()
                .ToList();

            var approverEmployees = await Task.WhenAll(
                approverIds.Select(approverId => _employeeRepository.GetByIdAsync(approverId))
            );

            var approverNames = approverEmployees
                .Where(e => e != null)
                .ToDictionary(
                    e => e.Id,
                    e => $"{e.FirstName} {e.LastName}".Trim()
                );

            return NAFMapper.ToDTO(naf, employee, approverNames);
        }

        private static readonly string[] _withHardwareAutoAddNames = { "Microsoft 365 (E1)", "Basic Internet", "Active Directory", "Printer Access (Black and White)" };
        private static readonly string[] _noHardwareAutoAddNames = { "Active Directory" };

        public async Task<NAFDTO> CreateAsync(CreateNAFRequestDTO request)
        {
            //fetch from peoplecore
            var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId);
            //fetch from users table
            var employeeUser = await _userRepository.GetUserByEmployeeId(request.EmployeeId);

            var employeeActiveDepartment = await _userDepartmentRepository.GetUserActiveDepartment(employeeUser.Id);

            if (employee.Status != "Active") throw new InvalidOperationException("Employee is not active");

            var hasNAFForDepartment = await _nafRepository.EmployeeHasNAFForDepartmentAsync(request.EmployeeId, employeeActiveDepartment.DepartmentId);

            if (hasNAFForDepartment) throw new InvalidOperationException("Employee already has a NAF for this department");

            // Resolve hardware resource IDs from the Computer group in the database
            var hardwareResourceIds = (await _context.Resources
                .Where(r => r.IsActive && r.ResourceGroup.Name == "Hardware")
                .Select(r => r.Id)
                .ToListAsync()).ToHashSet();

            // Resolve auto-add resource IDs by name from the database
            var withHardwareIds = await _context.Resources
                .Where(r => r.IsActive && _withHardwareAutoAddNames.Contains(r.Name))
                .Select(r => r.Id)
                .ToListAsync();

            var noHardwareIds = await _context.Resources
                .Where(r => r.IsActive && _noHardwareAutoAddNames.Contains(r.Name))
                .Select(r => r.Id)
                .ToListAsync();

            var resourcesToAdd = new List<int>();
            if (request.HardwareId != 0 && hardwareResourceIds.Contains(request.HardwareId))
            {
                resourcesToAdd.Add(request.HardwareId);
                resourcesToAdd.AddRange(withHardwareIds);
            }
            else
            {
                resourcesToAdd.AddRange(noHardwareIds);
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                string reference = $"NAF-{DateTime.UtcNow:yyyyMMddHHmmss}-{employee.Id}-{Guid.NewGuid().ToString("N").Substring(0, 6)}";
                var employeeActiveLocation = await _userLocationRepository.GetUserActiveLocation(employeeUser.Id);
                var naf = new NAF(reference, request.RequestorId, request.EmployeeId, employeeActiveDepartment.DepartmentId, employeeActiveLocation.LocationId);
                await _context.NAFs.AddAsync(naf);
                await _context.SaveChangesAsync();

                foreach (var r in resourcesToAdd)
                {
                    await _resourceRequestService.CreateBasicAsync(
                        new CreateResourceRequestDTO(
                            naf.Id,
                            r,
                            "Basic resource needed for all employee",
                            null,
                            request.DateNeeded
                        )
                    );
                }

                await transaction.CommitAsync();
                var nafDto = await _context.NAFs
                    .Where(n => n.Id == naf.Id)
                    .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("NAF not found");

                return NAFMapper.ToDTO(nafDto, employee);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<PagedResult<NAFDTO>> GetNAFsUnderEmployeeAsync(string employeeId, int page)
        {
            return await _nafRepository.GetNAFUnderEmployee(employeeId, page);
        }

        public async Task<PagedResult<NAFDTO>> GetNAFToApproveAsync(string employeeId, int page)
        {
            return await _nafRepository.GetNAFToApprove(employeeId, page);
        }

        public async Task<NAFDTO> DeactivateNAFAsync(Guid nafId)
        {
            var naf = await _nafRepository.GetByIdAsync(nafId);
            var employee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);
            naf.DeactivateNAF();
            return NAFMapper.ToDTO(naf, employee);
        }

        public async Task<NAFDTO> ActivateNAFAsync(Guid nafId)
        {
            var naf = await _nafRepository.GetByIdAsync(nafId);
            var employee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);
            naf.ActivateNAF();
            return NAFMapper.ToDTO(naf, employee);
        }

        public Task<bool> EmployeeHasNAFForDepartmentAsync(string employeeId, int departmentId)
        {
            var hasNAF = _nafRepository.EmployeeHasNAFForDepartmentAsync(employeeId, departmentId);
            return hasNAF;
        }

        public async Task<List<NAFDTO>> GetNAFByEmployeeIdAsync(string employeeId)
        {
            var nafs = await _nafRepository.GetByEmployeeIdAsync(employeeId);
            return nafs;
        }
        //public async Task<List<NAFDTO>> GetNAFByLocationIdAsync(int departmentId)
        //{
        //    var nafs = await _nafRepository.GetByDepartmentIdAsync(departmentId);
        //    return nafs;
        //}

        public async Task<List<AddBasicResourceResultDTO>> AddBasicResourcesToNAFAsync(Guid nafId, List<BasicResourceWithDateDTO> resources)
        {
            var results = new List<AddBasicResourceResultDTO>();

            foreach (var resource in resources.DistinctBy(r => r.ResourceId))
            {
                try
                {
                    bool alreadyExists = await _context.ResourceRequests
                        .AnyAsync(rr => rr.NAFId == nafId && rr.ResourceId == resource.ResourceId);

                    if (alreadyExists)
                    {
                        results.Add(new AddBasicResourceResultDTO(
                            resource.ResourceId, false, "Resource already exists in this NAF", null));
                        continue;
                    }

                    var rr = await _resourceRequestService.CreateBasicAsync(
                        new CreateResourceRequestDTO(nafId, resource.ResourceId, "Basic resource needed", null, resource.DateNeeded));

                    results.Add(new AddBasicResourceResultDTO(resource.ResourceId, true, null, rr));
                }
                catch (Exception ex)
                {
                    results.Add(new AddBasicResourceResultDTO(resource.ResourceId, false, ex.Message, null));
                }
            }

            return results;
        }

        public Task<List<NAFDTO>> GetNAFByLocationAsync(int locationId)
        {
            throw new NotImplementedException();
        }
    }
}
