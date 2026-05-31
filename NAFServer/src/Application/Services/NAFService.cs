using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Handlers.Interface;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
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
        private readonly ILocationRepository _locationRepository;
        private readonly IResourceRequestService _resourceRequestService;
        private readonly IResourceRepository _resourceRepository;
        private readonly IResourceRequestHandlerRegistry _resourceRequestHandlerRegistry;
        private readonly IUserRepository _userRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly IConfiguration _configuration;
        private readonly INotificationService _notificationService;
        private readonly IAuditQueue _auditQueue;
        private readonly ILogger<NAFService> _logger;
        public NAFService
        (
            AppDbContext context,
            IEmployeeRepository employeeRepository,
            INAFRepository nafRepository,
            IApprovalWorkflowTemplateRepository approvalWorkflowTemplateRepository,
            IApprovalWorkflowStepsTemplateRepository approvalWorkflowStepsTemplateRepository,
            ILocationRepository locationRepository,
            IResourceRequestService resourceRequestService,
            IResourceRepository resourceRepository,
            IResourceRequestHandlerRegistry resourceRequestHandlerRegistry,
            IUserRepository userRepository,
            ICurrentUserService currentUserService,
            IConfiguration configuration,
            INotificationService notificationService,
            IAuditQueue auditQueue,
            ILogger<NAFService> logger
        )
        {
            _context = context;
            _employeeRepository = employeeRepository;
            _nafRepository = nafRepository;
            _approvalWorkflowTemplateRepository = approvalWorkflowTemplateRepository;
            _approvalWorkflowStepsTemplateRepository = approvalWorkflowStepsTemplateRepository;
            _locationRepository = locationRepository;
            _resourceRequestService = resourceRequestService;
            _resourceRepository = resourceRepository;
            _resourceRequestHandlerRegistry = resourceRequestHandlerRegistry;
            _userRepository = userRepository;
            _currentUserService = currentUserService;
            _configuration = configuration;
            _notificationService = notificationService;
            _auditQueue = auditQueue;
            _logger = logger;
        }

        private async Task AuthorizeNAFAccessAsync(NAF naf)
        {
            var currentUserId = _currentUserService.EmployeeId;

            // Rule 1: current user is the requestor or the employee on the NAF
            if (naf.RequestorId == currentUserId || naf.EmployeeId == currentUserId)
                return;

            // Rule 2: current user is in the same department as the NAF
            var currentDepartmentId = await _currentUserService.GetDepartmentIdAsync();
            if (!string.IsNullOrEmpty(currentDepartmentId) && naf.DepartmentId == currentDepartmentId)
                return;

            // Rule 3: current user is an assigned approver on any step
            bool isApprover = naf.ResourceRequests
                .SelectMany(rr => rr.ResourceRequestsApprovalSteps)
                .Any(s => s.ApproverId == currentUserId);
            if (isApprover)
                return;

            // Rule 4: current user is the employee's supervisor or department head
            var nafEmployee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);
            if (nafEmployee is not null)
            {
                if (nafEmployee.SupervisorId == currentUserId) return;
                var deptHeadEmployee = await _employeeRepository.GetByFullNameAsync(nafEmployee.DepartmentHead ?? string.Empty);
                if (deptHeadEmployee?.Id == currentUserId) return;
            }

            // Rule 5: admin whose active location matches the NAF's location
            if (_currentUserService.Role == "ADMIN")
            {
                //var adminLocationId = await _currentUserService.GetLocationIdAsync();
                //if (naf.LocationId == adminLocationId)
                return;
            }

            throw new UnauthorizedAccessException("You do not have access to this NAF.");
        }

        public async Task<NAFDTO> GetNAFByIdAsync(Guid id)
        {
            var naf = await _nafRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"NAF '{id}' not found.");

            await AuthorizeNAFAccessAsync(naf);

            var nafEmployee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);

            var approverIds = naf.ResourceRequests
                .SelectMany(rr => rr.ResourceRequestsApprovalSteps)
                .Select(s => s.ApproverId)
                .Where(id => id is not null)
                .Distinct()
                .ToList();

            var approvers = new Dictionary<string, Employee>();
            foreach (var approverId in approverIds)
            {
                var approver = await _employeeRepository.GetByIdAsync(approverId!);
                if (approver != null)
                    approvers[approverId!] = approver;
            }

            return NAFMapper.ToDTO(naf, nafEmployee, approvers);
        }

        public async Task<NAFDTO> CreateAsync(CreateNAFRequestDTO request)
        {
            //fetch from people core
            var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId);

            if (employee.Status != "Active") throw new InvalidOperationException("Employee is not active");

            var hasNAFForDepartment = await _nafRepository.EmployeeHasNAFForDepartmentAsync(request.EmployeeId, employee.DepartmentId);

            if (hasNAFForDepartment) throw new InvalidOperationException("Employee already has a NAF for this department");

            // Resolve hardware resource IDs from the Computer group in the database
            var hardwareResourceIds = (await _context.Resources
                .Where(r => r.IsActive && r.ResourceGroup.Name == "Hardware")
                .Select(r => r.Id)
                .ToListAsync()).ToHashSet();

            // Resolve auto-add resource IDs from configuration
            var withHardwareIds = _configuration
                .GetSection("HardwareAutoAdd:WithHardwareResourceIds")
                .Get<List<int>>() ?? new List<int>();

            var noHardwareIds = _configuration
                .GetSection("HardwareAutoAdd:NoHardwareResourceIds")
                .Get<List<int>>() ?? new List<int>();

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
                var location = await _locationRepository.GetByNameAsync(employee.Location ?? string.Empty)
                    ?? throw new InvalidOperationException($"No Location record found matching employee location '{employee.Location}'.");
                var naf = new NAF(reference, request.RequestorId, request.EmployeeId, employee.DepartmentId, location.Id);
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

                // Notify admins + supervisor + dept head about new NAF
                try
                {
                    var adminIds = await _notificationService.GetAdminsByLocationAsync(naf.LocationId);
                    var supervisorId = await _notificationService.FindUserIdByEmployeeNumberAsync(employee.SupervisorId);
                    var deptHead = await _employeeRepository.GetByFullNameAsync(employee.DepartmentHead ?? string.Empty);
                    var deptHeadId = deptHead is not null
                        ? await _notificationService.FindUserIdByEmployeeNumberAsync(deptHead.Id)
                        : (int?)null;

                    if (adminIds.Count > 0)
                    {
                        await _notificationService.CreateForUsersAsync(
                            adminIds,
                            "New NAF Submitted",
                            $"A new NAF has been submitted for {employee.FirstName} {employee.LastName}.",
                            $"/admin/NAF/{naf.Id}",
                            "NAF"
                        );
                    }

                    var nonAdminRecipients = new List<int>();
                    if (supervisorId.HasValue) nonAdminRecipients.Add(supervisorId.Value);
                    if (deptHeadId.HasValue) nonAdminRecipients.Add(deptHeadId.Value);

                    if (nonAdminRecipients.Count > 0)
                    {
                        await _notificationService.CreateForUsersAsync(
                            nonAdminRecipients,
                            "New NAF Submitted",
                            $"A new NAF has been submitted for {employee.FirstName} {employee.LastName}.",
                            $"/NAF/{naf.Id}",
                            "NAF"
                        );
                    }

                    await _auditQueue.EnqueueAsync(new AuditTrail($"NAF created for {employee.FirstName} {employee.LastName} with reference {naf.Reference}", "NAF"));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send notifications for NAF {NafId}", naf.Id);
                }

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
            var employeeName = employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : naf.EmployeeId;
            naf.DeactivateNAF();

            try
            {
                var employeeUserId = await _notificationService.FindUserIdByEmployeeNumberAsync(naf.EmployeeId);
                if (employeeUserId.HasValue)
                {
                    await _notificationService.CreateForUsersAsync(
                        new List<int> { employeeUserId.Value },
                        "NAF Deactivated",
                        $"Your NAF ({naf.Reference}) has been deactivated.",
                        $"/NAF/{naf.Id}",
                        "NAF"
                    );
                }
                await _auditQueue.EnqueueAsync(new AuditTrail($"NAF {naf.Reference} deactivated for {employeeName}", "NAF"));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send notifications for NAF deactivation {NafId}", nafId);
            }

            return NAFMapper.ToDTO(naf, employee);
        }

        public async Task<NAFDTO> ActivateNAFAsync(Guid nafId)
        {
            var naf = await _nafRepository.GetByIdAsync(nafId);
            var employee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);
            var employeeName = employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : naf.EmployeeId;
            naf.ActivateNAF();

            try
            {
                var employeeUserId = await _notificationService.FindUserIdByEmployeeNumberAsync(naf.EmployeeId);
                if (employeeUserId.HasValue)
                {
                    await _notificationService.CreateForUsersAsync(
                        new List<int> { employeeUserId.Value },
                        "NAF Activated",
                        $"Your NAF ({naf.Reference}) has been activated.",
                        $"/NAF/{naf.Id}",
                        "NAF"
                    );
                }
                await _auditQueue.EnqueueAsync(new AuditTrail($"NAF {naf.Reference} activated for {employeeName}", "NAF"));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send notifications for NAF activation {NafId}", nafId);
            }

            return NAFMapper.ToDTO(naf, employee);
        }

        public Task<bool> EmployeeHasNAFForDepartmentAsync(string employeeId, string departmentId)
        {
            var hasNAF = _nafRepository.EmployeeHasNAFForDepartmentAsync(employeeId, departmentId);
            return hasNAF;
        }

        public async Task<List<NAFDTO>> GetNAFByEmployeeIdAsync(string employeeId)
        {
            var nafs = await _nafRepository.GetByEmployeeIdAsync(employeeId);
            return nafs;
        }

        public async Task<List<AddBasicResourceResultDTO>> AddBasicResourcesToNAFAsync(Guid nafId, List<BasicResourceWithDateDTO> resources)
        {
            var results = new List<AddBasicResourceResultDTO>();
            var naf = await _nafRepository.GetByIdAsync(nafId);
            var employee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);
            var employeeName = employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : naf.EmployeeId;

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

                    await _auditQueue.EnqueueAsync(new AuditTrail(
                        $"{employeeName} added resource {rr.Resource?.Name ?? resource.ResourceId.ToString()} to NAF {naf.Reference}",
                        "ResourceRequest"
                    ));
                }
                catch (Exception ex)
                {
                    results.Add(new AddBasicResourceResultDTO(resource.ResourceId, false, ex.Message, null));
                }
            }

            return results;
        }

        public async Task<PagedResult<NAFDTO>> GetNAFsByLocationPagedAsync(int? locationId, string status, int page)
        {
            return await _nafRepository.GetNAFsByLocationPagedAsync(locationId, status, page);
        }

        public async Task<PagedResult<AdminResourceRequestDTO>> GetResourceRequestsByLocationPagedAsync(
            int locationId, string progress, int page)
        {
            const int pageSize = 10;

            var query = _context.ResourceRequests
                .Include(rr => rr.NAF)
                .Include(rr => rr.Resource)
                .Where(rr => rr.NAF.LocationId == locationId);

            if (string.Equals(progress, "beyond_deadline", StringComparison.OrdinalIgnoreCase))
            {
                var today = DateTime.Today;
                query = query.Where(rr => rr.DateNeeded != null && rr.DateNeeded != default(DateTime) && rr.DateNeeded < today && rr.Progress != Progress.ACCOMPLISHED);
            }
            else if (!string.Equals(progress, "all", StringComparison.OrdinalIgnoreCase)
                && Enum.TryParse<Domain.Enums.Progress>(progress, ignoreCase: true, out var parsedProgress))
            {
                query = query.Where(rr => rr.Progress == parsedProgress);
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(rr => rr.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dtos = new List<AdminResourceRequestDTO>();
            foreach (var rr in items)
            {
                var employee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
                var employeeName = employee != null
                    ? $"{employee.FirstName} {employee.LastName}".Trim()
                    : rr.NAF.EmployeeId;

                dtos.Add(new AdminResourceRequestDTO(
                    rr.Id,
                    rr.NAFId,
                    rr.NAF.Reference,
                    employeeName,
                    rr.Resource.Name,
                    (int)rr.Progress,
                    rr.DateNeeded == default(DateTime) ? null : rr.DateNeeded,
                    rr.CreatedAt
                ));
            }

            return new PagedResult<AdminResourceRequestDTO>
            {
                Data = dtos,
                TotalCount = totalCount,
                PageSize = pageSize,
                CurrentPage = page,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }

        public async Task<List<ForSocReviewItemDTO>> GetForSocReviewAsync()
        {
            var requests = await _context.ResourceRequests
                .Include(rr => rr.NAF)
                .Include(rr => rr.Resource)
                .Include(rr => rr.ResourceRequestsApprovalSteps)
                .Where(rr => rr.ResourceRequestsApprovalSteps.Any(
                    s => s.StepOrder == rr.CurrentStep && s.StepAction == StepAction.FOR_SOC_REVIEW))
                .AsNoTracking()
                .ToListAsync();

            var result = new List<ForSocReviewItemDTO>();
            foreach (var rr in requests)
            {
                var employee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
                var employeeName = employee != null
                    ? $"{employee.FirstName} {employee.LastName}".Trim()
                    : rr.NAF.EmployeeId;

                var currentStep = rr.ResourceRequestsApprovalSteps
                    .FirstOrDefault(s => s.StepOrder == rr.CurrentStep);

                if (currentStep == null) continue;

                result.Add(new ForSocReviewItemDTO(
                    rr.Id,
                    rr.NAFId,
                    rr.NAF.Reference,
                    employeeName,
                    rr.Resource.Name,
                    rr.DateNeeded == default(DateTime) ? null : rr.DateNeeded,
                    currentStep.Id,
                    currentStep.ApproverId
                ));
            }
            return result;
        }

        public async Task<List<AdminForScreeningItemDTO>> GetForScreeningAsync(int locationId)
        {
            var requests = await _context.ResourceRequests
                .Where(rr => rr.Progress == Domain.Enums.Progress.FOR_SCREENING && rr.NAF.LocationId == locationId)
                .Include(rr => rr.NAF)
                .Include(rr => rr.Resource)
                .Include(rr => rr.ResourceRequestsApprovalSteps)
                .AsNoTracking()
                .ToListAsync();

            var result = new List<AdminForScreeningItemDTO>();
            foreach (var rr in requests)
            {
                var employee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
                var employeeName = employee != null
                    ? $"{employee.FirstName} {employee.LastName}".Trim()
                    : rr.NAF.EmployeeId;

                var currentStep = rr.ResourceRequestsApprovalSteps
                    .FirstOrDefault(s => s.StepOrder == rr.CurrentStep);

                if (currentStep == null) continue;

                result.Add(new AdminForScreeningItemDTO(
                    rr.Id,
                    rr.NAFId,
                    rr.NAF.Reference,
                    employeeName,
                    rr.Resource.Name,
                    rr.DateNeeded == default(DateTime) ? null : rr.DateNeeded,
                    currentStep.Id,
                    currentStep.ApproverId
                ));
            }
            return result;
        }
    }
}
