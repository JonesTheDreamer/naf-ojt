using Microsoft.Extensions.Logging;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using System.Collections.Generic;

namespace NAFServer.src.Application.Services
{
    public class ResourceRequestApprovalStepService : IResourceRequestApprovalStepService
    {
        private readonly AppDbContext _context;
        private readonly IResourceRequestStepRepository _resourceRequestStepRepository;
        private readonly IResourceRequestRepository _resourceRequestRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly INotificationService _notificationService;
        private readonly IAuditQueue _auditQueue;
        private readonly ILogger<ResourceRequestApprovalStepService> _logger;

        public ResourceRequestApprovalStepService(
            AppDbContext context,
            IResourceRequestStepRepository resourceRequestStepRepository,
            IResourceRequestRepository resourceRequestRepository,
            IEmployeeRepository employeeRepository,
            INotificationService notificationService,
            IAuditQueue auditQueue,
            ILogger<ResourceRequestApprovalStepService> logger)
        {
            _context = context;
            _resourceRequestStepRepository = resourceRequestStepRepository;
            _resourceRequestRepository = resourceRequestRepository;
            _employeeRepository = employeeRepository;
            _notificationService = notificationService;
            _auditQueue = auditQueue;
            _logger = logger;
        }
        public async Task<ResourceRequestApprovalStep> ApproveStepAsync(Guid stepId, string? comment)
        {
            try
            {
                var rr = await _resourceRequestRepository.GetByApprovalStepId(stepId);
                var step = rr.ResourceRequestsApprovalSteps.FirstOrDefault(s => s.Id == stepId)
                    ?? throw new KeyNotFoundException("Step not found");

                var naf = rr.NAF;

                if (rr.CurrentStep != step.StepOrder)
                    throw new InvalidOperationException("Step is not the current step for this request");

                step.SetToApproved(comment);
                rr.NextStep();
                if (naf.Progress != Progress.IN_PROGRESS)
                {
                    naf.SetToInProgress();
                }

                if (rr.IsAccomplished())
                {
                    rr.SetToImplementation();
                    await _context.Implementations.AddAsync(new ResourceRequestImplementation(rr.Id));
                }
                else
                {
                    var nextStep = rr.ResourceRequestsApprovalSteps
                        .FirstOrDefault(s => s.StepOrder == rr.CurrentStep);
                    if (nextStep?.StepAction == StepAction.FOR_SCREENING)
                        rr.SetToForScreening();
                    else if (rr.Progress != Progress.IN_PROGRESS)
                        rr.SetToInProgress();
                }

                string historyNote = "Resource request approved";
                if (step.ApproverId is not null)
                {
                    var approver = await _employeeRepository.GetByIdAsync(step.ApproverId);
                    if (approver is not null)
                        historyNote = "Employee " + approver.FirstName + " " + approver.LastName + " approved the resource request";
                }

                await _context.ResourceRequestHistories.AddAsync(new ResourceRequestHistory
                (
                    rr.Id,
                    ResourceRequestAction.APPROVE,
                    historyNote
                ));

                await _context.SaveChangesAsync();

                // Notify requestor and next approver, and record audit
                try
                {
                    var nafEmployee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
                    var employeeName = nafEmployee != null
                        ? $"{nafEmployee.FirstName} {nafEmployee.LastName}".Trim()
                        : rr.NAF.EmployeeId;

                    string approverName = step.ApproverId != null
                        ? (await _employeeRepository.GetByIdAsync(step.ApproverId)) is { } a
                            ? $"{a.FirstName} {a.LastName}".Trim()
                            : step.ApproverId
                        : "An approver";

                    await _auditQueue.EnqueueAsync(new AuditTrail(
                        $"{approverName} approved the {rr.Resource?.Name} request for {employeeName} on NAF {rr.NAF.Reference}",
                        "ApprovalStep"
                    ));

                    var requestorUserId = await _notificationService.FindUserIdByEmployeeNumberAsync(rr.NAF.RequestorId);
                    if (requestorUserId.HasValue)
                    {
                        await _notificationService.CreateForUsersAsync(
                            new List<int> { requestorUserId.Value },
                            "Resource Request Approved",
                            $"{approverName} approved the {rr.Resource?.Name} request for {employeeName}.",
                            $"/NAF/{rr.NAFId}",
                            "ApprovalStep"
                        );
                    }

                    // Notify next approver (only if not all steps are accomplished)
                    if (!rr.IsAccomplished())
                    {
                        var nextStep = rr.ResourceRequestsApprovalSteps
                            .FirstOrDefault(s => s.StepOrder == rr.CurrentStep);
                        if (nextStep?.ApproverId != null)
                        {
                            var nextApproverId = await _notificationService.FindUserIdByEmployeeNumberAsync(nextStep.ApproverId);
                            if (nextApproverId.HasValue && nextApproverId.Value != requestorUserId)
                            {
                                await _notificationService.CreateForUsersAsync(
                                    new List<int> { nextApproverId.Value },
                                    "Resource Request Awaiting Your Approval",
                                    $"{employeeName}'s request for {rr.Resource?.Name} is awaiting your approval.",
                                    $"/admin/NAF/{rr.NAFId}",
                                    "ApprovalStep"
                                );
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send approval notifications for NAF {NafId}", rr.NAFId);
                }

                return step;
            }
            catch (Exception ex)
            {
                throw new ApplicationException("An error occurred while approving the step", ex);
            }

        }

        public async Task<ResourceRequestApprovalStep> RejectStepAsync(Guid stepId, string reasonForRejection)
        {
            var rr = await _resourceRequestRepository.GetByApprovalStepId(stepId);
            var step = rr.ResourceRequestsApprovalSteps.FirstOrDefault(s => s.Id == stepId)
                ?? throw new KeyNotFoundException("Step not found");

            if (reasonForRejection == null)
                throw new ArgumentNullException(nameof(reasonForRejection), "Reason for rejection cannot be null");

            step.SetToRejected(reasonForRejection);
            rr.SetToRejected();

            string historyNote = "Resource request rejected";
            if (step.ApproverId is not null)
            {
                var approver = await _employeeRepository.GetByIdAsync(step.ApproverId);
                if (approver is not null)
                    historyNote = "Employee " + approver.FirstName + " " + approver.LastName + " rejected the resource request";
            }

            await _context.ResourceRequestHistories.AddAsync(new ResourceRequestHistory
            (
                rr.Id,
                ResourceRequestAction.REJECT,
                historyNote
            ));

            await _context.SaveChangesAsync();

            // Notify requestor and record audit
            try
            {
                var nafEmployee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
                var employeeName = nafEmployee != null
                    ? $"{nafEmployee.FirstName} {nafEmployee.LastName}".Trim()
                    : rr.NAF.EmployeeId;

                string approverName = step.ApproverId != null
                    ? (await _employeeRepository.GetByIdAsync(step.ApproverId)) is { } a
                        ? $"{a.FirstName} {a.LastName}".Trim()
                        : step.ApproverId
                    : "An approver";

                await _auditQueue.EnqueueAsync(new AuditTrail(
                    $"{approverName} rejected the {rr.Resource?.Name} request for {employeeName} on NAF {rr.NAF.Reference}",
                    "ApprovalStep"
                ));

                var requestorUserId = await _notificationService.FindUserIdByEmployeeNumberAsync(rr.NAF.RequestorId);
                if (requestorUserId.HasValue)
                {
                    await _notificationService.CreateForUsersAsync(
                        new List<int> { requestorUserId.Value },
                        "Resource Request Rejected",
                        $"{approverName} rejected the {rr.Resource?.Name} request for {employeeName}.",
                        $"/NAF/{rr.NAFId}",
                        "ApprovalStep"
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send rejection notification for NAF {NafId}", rr.NAFId);
            }

            return step;
        }

        public async Task<ResourceRequestApprovalStep> ClaimStepAsync(Guid stepId, string adminEmployeeId)
        {
            var rr = await _resourceRequestRepository.GetByApprovalStepId(stepId);
            var step = rr.ResourceRequestsApprovalSteps.FirstOrDefault(s => s.Id == stepId)
                ?? throw new KeyNotFoundException("Step not found");

            if (rr.CurrentStep != step.StepOrder)
                throw new InvalidOperationException("Step is not the current step for this request");

            step.ClaimStep(adminEmployeeId);

            var adminEmployee = await _employeeRepository.GetByIdAsync(adminEmployeeId);
            var adminName = adminEmployee != null
                ? $"{adminEmployee.FirstName} {adminEmployee.LastName}".Trim()
                : adminEmployeeId;

            await _context.ResourceRequestHistories.AddAsync(new ResourceRequestHistory
            (
                rr.Id,
                ResourceRequestAction.EDITED,
                $"Screening step claimed by {adminName}"
            ));

            await _context.SaveChangesAsync();

            try
            {
                var nafEmployee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
                var employeeName = nafEmployee != null
                    ? $"{nafEmployee.FirstName} {nafEmployee.LastName}".Trim()
                    : rr.NAF.EmployeeId;

                await _auditQueue.EnqueueAsync(new AuditTrail(
                    $"{adminName} claimed the screening step for {rr.Resource?.Name} request of {employeeName} on NAF {rr.NAF.Reference}",
                    "ApprovalStep"
                ));

                var requestorUserId = await _notificationService.FindUserIdByEmployeeNumberAsync(rr.NAF.RequestorId);
                if (requestorUserId.HasValue)
                {
                    await _notificationService.CreateForUsersAsync(
                        new List<int> { requestorUserId.Value },
                        "Resource Request Under Screening",
                        $"{adminName} has claimed the screening step for {employeeName}'s {rr.Resource?.Name} request.",
                        $"/NAF/{rr.NAFId}",
                        "ApprovalStep"
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send notifications for claim step {StepId}", stepId);
            }

            return step;
        }
    }
}
