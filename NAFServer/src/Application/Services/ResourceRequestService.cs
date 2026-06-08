using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Handlers.Interface;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Mapper;
using System.Text.Json;

namespace NAFServer.src.Application.Services
{
    public class ResourceRequestService : IResourceRequestService
    {
        private readonly AppDbContext _context;
        private readonly IResourceRequestRepository _resourceRequestRepository;
        private readonly INAFRepository _nafRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IApprovalWorkflowStepsTemplateRepository _approvalWorkflowStepsTemplateRepository;
        private readonly IResourceRepository _resourceRepository;
        private readonly IApprovalWorkflowTemplateRepository _approvalWorkflowTemplateRepository;
        private readonly IResourceRequestHandlerRegistry _resourceRequestHandlerRegistry;
        private readonly IUserRepository _userRepository;
        private readonly IResourceRequestAllowanceRepository _allowanceRepository;
        private readonly ILocationRepository _locationRepository;
        private readonly IImplementationService _implementationService;
        private readonly IAuditQueue _auditQueue;
        private readonly IResourceGroupRepository _resourceGroupRepository;
        private readonly INotificationService _notificationService;
        private readonly ILogger<ResourceRequestService> _logger;

        public ResourceRequestService(
            IResourceRequestRepository resourceRequestRepository,
            INAFRepository nafRepository,
            IEmployeeRepository employeeRepository,
            IApprovalWorkflowStepsTemplateRepository approvalWorkflowStepsTemplateRepository,
            IResourceRepository resourceRepository,
            IApprovalWorkflowTemplateRepository approvalWorkflowTemplateRepository,
            IResourceRequestHandlerRegistry resourceRequestHandlerRegistry,
            IUserRepository userRepository,
            IResourceRequestAllowanceRepository allowanceRepository,
            ILocationRepository locationRepository,
            IImplementationService implementationService,
            IResourceGroupRepository resourceGroupRepository,
            IAuditQueue auditQueue,
            INotificationService notificationService,
            ILogger<ResourceRequestService> logger,
            AppDbContext context
        )
        {
            _resourceRequestRepository = resourceRequestRepository;
            _nafRepository = nafRepository;
            _employeeRepository = employeeRepository;
            _approvalWorkflowStepsTemplateRepository = approvalWorkflowStepsTemplateRepository;
            _resourceRepository = resourceRepository;
            _approvalWorkflowTemplateRepository = approvalWorkflowTemplateRepository;
            _resourceRequestHandlerRegistry = resourceRequestHandlerRegistry;
            _userRepository = userRepository;
            _allowanceRepository = allowanceRepository;
            _locationRepository = locationRepository;
            _implementationService = implementationService;
            _resourceGroupRepository = resourceGroupRepository;
            _auditQueue = auditQueue;
            _notificationService = notificationService;
            _logger = logger;
            _context = context;
        }

        public async Task<ResourceRequestDTO> CreateSpecialAsync(CreateResourceRequestDTO request)
        {
            var resource = await _resourceRepository.GetResourceByIdAsync(request.resourceId);

            if (!resource.IsSpecial)
                throw new ArgumentException("Invalid Resource. Using CreateSpecialAsync for a basic resource.");

            if (resource.ResourceGroup?.CanOwnMany == false)
            {
                var existing = await _context.ResourceRequests
                    .AnyAsync(rr => rr.ResourceId == request.resourceId && rr.NAFId == request.nafId);
                if (existing)
                {
                    throw new ApplicationException("Duplicate resource request: this resource is already requested in this NAF.");
                }
            }

            var naf = await _nafRepository.GetByIdAsync(request.nafId);
            await ValidateDateNeededAsync(request, naf);

            var hasOuterTransaction = _context.Database.CurrentTransaction != null;

            await using var transaction = hasOuterTransaction
                ? null
                : await _context.Database.BeginTransactionAsync();

            try
            {
                ResourceRequestAdditionalInfo? additionalInfo = null;

                // Only process additional info when required by resource
                if (resource.HasAdditionalInfo)
                {
                    if (request.additionalInfo is not JsonElement element)
                        throw new ApplicationException("Additional Info is required.");

                    var handler = _resourceRequestHandlerRegistry.GetHandler(request.resourceId);

                    additionalInfo = await handler.CreateAdditionalInfo(element);
                    additionalInfo.Id = Guid.NewGuid();

                    // Validate duplicates / business rules
                    bool isValid = await handler.Validate(additionalInfo, request.nafId);

                    if (!isValid)
                    {
                        throw new ApplicationException(
                            "Duplicate resource request: this resource is already requested in this NAF.");
                    }
                }

                var workflowId = await _approvalWorkflowTemplateRepository
                    .GetActiveWorkflowIdOfResourceAsync(request.resourceId);

                var rr = new ResourceRequest(
                    request.nafId,
                    request.resourceId,
                    workflowId,
                    request.dateNeeded,
                    additionalInfo,
                    Progress.OPEN
                );

                rr.NAF = naf;

                // Only assign navigation if additional info exists
                if (additionalInfo != null)
                {
                    additionalInfo.ResourceRequest = rr;
                }

                _context.ResourceRequests.Add(rr);

                await _context.SaveChangesAsync();

                var purpose = new ResourceRequestPurpose(
                    request.purpose,
                    rr.Id,
                    null
                );

                await _context.ResourceRequestPurposes.AddAsync(purpose);

                var approvers = await FetchApproversAsync(rr);

                if (approvers.Count > 0)
                {
                    await _context.ResourceRequestApprovalSteps.AddRangeAsync(approvers);
                }
                else
                {
                    rr.SetToAccomplished();
                }

                await _context.SaveChangesAsync();
                if (!hasOuterTransaction)
                {
                    await transaction.CommitAsync();
                }

                var saved = await _resourceRequestRepository.GetByIdAsync(rr.Id);

                // Notify & audit after commit
                try
                {
                    var nafEmployee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);
                    var employeeName = nafEmployee != null
                        ? $"{nafEmployee.FirstName} {nafEmployee.LastName}".Trim()
                        : naf.EmployeeId;

                    await _auditQueue.EnqueueAsync(new AuditTrail(
                        $"{employeeName} requested {resource.Name} on NAF {naf.Reference}",
                        "ResourceRequest"
                    ));

                    foreach (var approverStep in approvers.Where(a => a.ApproverId != null))
                    {
                        var approverUserId = await _notificationService.FindUserIdByEmployeeNumberAsync(approverStep.ApproverId);
                        if (approverUserId.HasValue)
                        {
                            await _notificationService.CreateForUsersAsync(
                                new List<int> { approverUserId.Value },
                                "Resource Request Awaiting Your Approval",
                                $"{employeeName} has requested access to {resource.Name}. Your approval is required.",
                                $"/admin/NAF/{naf.Id}",
                                "ResourceRequest"
                            );
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send notifications for resource request on NAF {NafId}", naf.Id);
                }

                return ResourceRequestMapper.ToDTO(saved);
            }
            catch
            {
                await transaction?.RollbackAsync();
                throw;
            }
        }

        public async Task<ResourceRequestDTO> CreateBasicAsync(CreateResourceRequestDTO request)
        {
            try
            {
                var resource = await _resourceRepository.GetResourceByIdAsync(request.resourceId);
                if (resource.IsSpecial)
                {
                    throw new ArgumentException("Invalid Resource. Using Create Basic for special resource.");
                }

                if (resource.ResourceGroup?.CanOwnMany == false)
                {
                    var existing = await _context.ResourceRequests
                        .AnyAsync(rr => rr.ResourceId == request.resourceId && rr.NAFId == request.nafId);
                    if (existing)
                    {
                        throw new ApplicationException("Duplicate resource request: this resource is already requested in this NAF.");
                    }
                }

                var naf = await _nafRepository.GetByIdAsync(request.nafId);
                await ValidateDateNeededAsync(request, naf);

                var rr = new ResourceRequest(
                    request.nafId,
                    request.resourceId,
                    null,
                    request.dateNeeded,
                    null,
                    Progress.IMPLEMENTATION
                );
                //rr.DateNeeded = request.dateNeeded;
                //{
                //    Resource = resource
                //    //NAF = naf
                //}
                //;

                await _context.ResourceRequests.AddAsync(rr);
                await _context.SaveChangesAsync();
                var implementation = await _implementationService.CreateImplementationAsync(rr.Id);
                await _context.SaveChangesAsync();
                await _context.Entry(rr).Reference(r => r.Resource).LoadAsync();

                try
                {
                    var nafEmployee = await _employeeRepository.GetByIdAsync(naf.EmployeeId);
                    var employeeName = nafEmployee != null
                        ? $"{nafEmployee.FirstName} {nafEmployee.LastName}".Trim()
                        : naf.EmployeeId;

                    await _auditQueue.EnqueueAsync(new AuditTrail(
                        $"{employeeName} added basic resource {rr.Resource?.Name ?? request.resourceId.ToString()} to NAF {naf.Reference}",
                        "ResourceRequest"
                    ));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to enqueue audit for basic resource request {ResourceId}", request.resourceId);
                }

                return ResourceRequestMapper.ToDTO(rr);
            }
            catch (Exception ex)
            {
                throw new ArgumentException(ex.Message);
            }
        }

        public async Task<List<ResourceRequestApprovalStep>> FetchApproversAsync(ResourceRequest request)
        {
            var employee = await _employeeRepository.GetByIdAsync(request.NAF.EmployeeId);

            if (employee is null) throw new KeyNotFoundException();

            var steps = await _approvalWorkflowStepsTemplateRepository.GetTemplateStepsByResourceId(request.ResourceId);

            var approvers = new List<ResourceRequestApprovalStep>();

            foreach (var step in steps)
            {
                // FOR_SCREENING and FOR_SOC_REVIEW steps are unclaimed — claimed later by role holders
                if (step.StepAction == StepAction.FOR_SCREENING || step.StepAction == StepAction.FOR_SOC_REVIEW)
                {
                    approvers.Add(new ResourceRequestApprovalStep(
                        request.Id,
                        null,
                        step.StepOrder,
                        step.StepAction
                    ));
                    continue;
                }

                string? approverId = null;

                switch (step.ApproverRole)
                {
                    case ApproverRole.SUPERVISOR:
                        approverId = employee.SupervisorId;
                        break;

                    case ApproverRole.DEPARTMENT_HEAD:
                        if (string.IsNullOrEmpty(step.ApproverEntity))
                        {
                            var deptHead = await _employeeRepository.GetByFullNameAsync(employee.DepartmentHead ?? string.Empty);
                            approverId = deptHead?.Id;
                        }
                        else
                        {
                            var dept = await _employeeRepository.GetDepartmentByIdAsync(step.ApproverEntity);
                            if (dept is not null)
                            {
                                var deptHead = await _employeeRepository.GetByFullNameAsync(dept.DepartmentHead);
                                approverId = deptHead?.Id;
                            }
                        }
                        break;

                    case ApproverRole.SPECIFIC_EMPLOYEE:
                        approverId = step.ApproverEntity;
                        break;

                    case ApproverRole.ROLE_BASED:
                        var roleUser = await _userRepository.GetFirstUserWithRoleAsync(step.ApproverEntity!);
                        approverId = roleUser?.EmployeeNumber;
                        break;

                    case ApproverRole.TECHNICAL_HEAD:
                        var techHead = await _userRepository.GetNetworkAdminOfLocation(request.NAF.LocationId);
                        approverId = techHead?.EmployeeNumber;
                        break;

                    case ApproverRole.RESOURCE_OWNER:
                        if (request.AdditionalInfo is SharedFolderRequestInfo sfInfo)
                        {
                            var folder = await _context.SharedFolders.FindAsync(sfInfo.SharedFolderId);
                            approverId = folder?.OwnerId;
                        }
                        break;
                }

                if (approverId is not null)
                {
                    bool isExisting = approvers.Any(a => a.ApproverId == approverId);
                    if (!isExisting)
                    {
                        approvers.Add(new ResourceRequestApprovalStep(
                            request.Id,
                            approverId,
                            step.StepOrder,
                            step.StepAction
                        ));
                    }
                }
            }

            return approvers;
        }

        public async Task<ResourceRequestDTO> GetByIdAsync(Guid id)
        {
            var rr = await _resourceRequestRepository.GetByIdAsync(id);

            var approverIds = rr.ResourceRequestsApprovalSteps
                .Select(s => s.ApproverId)
                .Where(aid => aid is not null)
                .Distinct()
                .ToList();

            var approvers = new Dictionary<string, Employee>();
            foreach (var approverId in approverIds)
            {
                var approver = await _employeeRepository.GetByIdAsync(approverId!);
                if (approver != null)
                    approvers[approverId!] = approver;
            }

            return ResourceRequestMapper.ToDTO(rr, approvers);
        }

        public async Task<ResourceRequestDTO> EditPurposeAsync(Guid requestId, EditPurposeDTO request)
        {
            var rr = await _resourceRequestRepository.GetByIdAsync(requestId);
            var currentStep = rr.ResourceRequestsApprovalSteps.FirstOrDefault(s => s.StepOrder == rr.CurrentStep)
                ?? throw new KeyNotFoundException("Step not found");

            if (rr.Progress != Progress.OPEN && currentStep.Progress != Progress.REJECTED)
                throw new InvalidOperationException("Purpose can only be edited if the request is still open / if an approver rejected requested");

            Guid? resourceRequestApprovalStepHistoryId = null;
            if (currentStep.Progress == Progress.REJECTED)
            {
                resourceRequestApprovalStepHistoryId = currentStep.Histories
                    .OrderByDescending(h => h.ActionAt)
                    .FirstOrDefault()
                    .Id;
                rr.SetToInProgress();
            }


            rr.EditPurpose(request.purpose, resourceRequestApprovalStepHistoryId);

            await _context.ResourceRequestHistories.AddAsync(new ResourceRequestHistory
            (
                rr.Id,
                ResourceRequestAction.EDITED,
                "Resource request edited"
            ));

            await _context.SaveChangesAsync();

            try
            {
                var nafEmployee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
                var employeeName = nafEmployee != null
                    ? $"{nafEmployee.FirstName} {nafEmployee.LastName}".Trim()
                    : rr.NAF.EmployeeId;

                await _auditQueue.EnqueueAsync(new AuditTrail(
                    $"{employeeName} edited purpose for resource request {rr.Resource?.Name} on NAF {rr.NAF.Reference}",
                    "ResourceRequest"
                ));

                var currentStepApproverUserId = await _notificationService.FindUserIdByEmployeeNumberAsync(currentStep.ApproverId);
                if (currentStepApproverUserId.HasValue)
                {
                    await _notificationService.CreateForUsersAsync(
                        new List<int> { currentStepApproverUserId.Value },
                        "Resource Request Updated",
                        $"{employeeName} has updated the purpose for their {rr.Resource?.Name} request.",
                        $"/admin/NAF/{rr.NAFId}",
                        "ResourceRequest"
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send notifications for purpose edit on request {RequestId}", requestId);
            }

            return ResourceRequestMapper.ToDTO(rr);
        }

        public async Task<ResourceRequestDTO> ChangeResourceAsync(Guid requestId, ChangeResourceDTO changeDto)
        {
            var rr = await _resourceRequestRepository.GetByIdAsync(requestId);
            var resource = await _resourceRepository.GetResourceByIdAsync(changeDto.ResourceId);

            if (!resource.IsActive)
            {
                throw new InvalidOperationException("Resource is inactive");
            }

            if (resource.HasAdditionalInfo)
            {
                throw new InvalidOperationException("Resources with additional information are not allowed to be changed or replace.");
            }

            if (rr.Resource.ResourceGroupId != resource.ResourceGroupId)
            {
                throw new InvalidOperationException("Can't change resource for request. Changing resource of a request requires the request to be on same group");
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var purpose = resource.IsSpecial && !string.IsNullOrWhiteSpace(changeDto.Purpose)
                    ? changeDto.Purpose
                    : $"Change from {rr.Resource.Name} to {resource.Name}";

                var dateNeeded = changeDto.DateNeeded ?? rr.DateNeeded;

                var dto = new CreateResourceRequestDTO
                (
                    rr.NAFId,
                    changeDto.ResourceId,
                    purpose,
                    null,
                    dateNeeded
                );

                if (rr.Progress == Progress.ACCOMPLISHED)
                {
                    rr.DeactivateResourceRequest();
                }
                else if (rr.Progress == Progress.OPEN)
                {
                    await DeleteAsync(requestId);
                }
                else
                {
                    rr.Cancel();
                }

                ResourceRequestDTO toReturn = resource.IsSpecial
                    ? await CreateSpecialAsync(dto)
                    : await CreateBasicAsync(dto);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                try
                {
                    var nafEmployee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
                    var employeeName = nafEmployee != null
                        ? $"{nafEmployee.FirstName} {nafEmployee.LastName}".Trim()
                        : rr.NAF.EmployeeId;

                    await _auditQueue.EnqueueAsync(new AuditTrail(
                        $"{employeeName} changed resource from {rr.Resource?.Name} to {resource.Name} on NAF {rr.NAF.Reference}",
                        "ResourceRequest"
                    ));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to enqueue audit for resource change on request {RequestId}", requestId);
                }

                return toReturn;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception(ex.Message);
            }
        }

        public async Task CancelAsync(Guid requestId)
        {
            var rr = await _resourceRequestRepository.GetByIdAsync(requestId);
            rr.Cancel();
            await _context.ResourceRequestHistories.AddAsync(new ResourceRequestHistory
            (
                rr.Id,
                ResourceRequestAction.CANCELLED,
                "Resource request cancelled"
            ));

            await _context.SaveChangesAsync();

            try
            {
                var nafEmployee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
                var employeeName = nafEmployee != null
                    ? $"{nafEmployee.FirstName} {nafEmployee.LastName}".Trim()
                    : rr.NAF.EmployeeId;

                await _auditQueue.EnqueueAsync(new AuditTrail(
                    $"Resource request {rr.Resource?.Name} cancelled for {employeeName} on NAF {rr.NAF.Reference}",
                    "ResourceRequest"
                ));

                var requestorUserId = await _notificationService.FindUserIdByEmployeeNumberAsync(rr.NAF.RequestorId);
                if (requestorUserId.HasValue)
                {
                    await _notificationService.CreateForUsersAsync(
                        new List<int> { requestorUserId.Value },
                        "Resource Request Cancelled",
                        $"The resource request for {rr.Resource?.Name} on NAF {rr.NAF.Reference} has been cancelled.",
                        $"/NAF/{rr.NAFId}",
                        "ResourceRequest"
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send notifications for cancel on request {RequestId}", requestId);
            }
        }

        public async Task<ResourceRequestDTO> DeactivateAsync(Guid requestId)
        {
            var rr = await _resourceRequestRepository.GetByIdAsync(requestId);
            rr.DeactivateResourceRequest();
            await _context.ResourceRequestHistories.AddAsync(new ResourceRequestHistory
            (
                rr.Id,
                ResourceRequestAction.CANCELLED,
                "Resource request deactivated"
            ));

            await _context.SaveChangesAsync();

            try
            {
                var nafEmployee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
                var employeeName = nafEmployee != null
                    ? $"{nafEmployee.FirstName} {nafEmployee.LastName}".Trim()
                    : rr.NAF.EmployeeId;

                await _auditQueue.EnqueueAsync(new AuditTrail(
                    $"Resource request {rr.Resource?.Name} deactivated for {employeeName} on NAF {rr.NAF.Reference}",
                    "ResourceRequest"
                ));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to enqueue audit for deactivation of request {RequestId}", requestId);
            }

            return ResourceRequestMapper.ToDTO(rr);
        }

        public async Task DeleteAsync(Guid requestId)
        {
            var rr = await _resourceRequestRepository.GetByIdAsync(requestId);
            //if (rr.Progress != Progress.OPEN)
            //{
            //    throw new ArgumentException("Resource request can't be deleted");
            //}

            // Remove dependent entities first if cascade delete is not configured
            _context.ResourceRequestApprovalSteps.RemoveRange(rr.ResourceRequestsApprovalSteps);
            _context.ResourceRequestPurposes.RemoveRange(rr.ResourceRequestPurposes);

            _context.ResourceRequests.Remove(rr);

            await _context.SaveChangesAsync();

        }

        private async Task ValidateDateNeededAsync(CreateResourceRequestDTO request, NAF naf)
        {
            var location = await _locationRepository.GetByIdAsync(naf.LocationId);
            if (location is null) return;

            if (!location.AllowWeekendDateNeeded)
            {
                var dow = request.dateNeeded.DayOfWeek;
                if (dow == DayOfWeek.Saturday || dow == DayOfWeek.Sunday)
                    throw new ArgumentException($"Date needed cannot be on a weekend for location '{location.Name}'.");
            }

            var allowance = await _allowanceRepository.GetByResourceAndLocationAsync(request.resourceId, naf.LocationId);
            if (allowance is not null)
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var dateNeeded = DateOnly.FromDateTime(request.dateNeeded);
                var minDate = today.AddDays(allowance.AllowanceDays);
                if (dateNeeded < minDate)
                    throw new ArgumentException(
                        $"Date needed must be at least {allowance.AllowanceDays} day(s) from today for this resource at location '{location.Name}'. Earliest allowed: {minDate:yyyy-MM-dd}.");
            }
        }

    }
}
