using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class ResourceRequestApprovalStepService : IResourceRequestApprovalStepService
    {
        private readonly AppDbContext _context;
        private readonly IResourceRequestStepRepository _resourceRequestStepRepository;
        private readonly IResourceRequestRepository _resourceRequestRepository;
        private readonly IEmployeeRepository _employeeRepository;

        public ResourceRequestApprovalStepService(AppDbContext context, IResourceRequestStepRepository resourceRequestStepRepository, IResourceRequestRepository resourceRequestRepository, IEmployeeRepository employeeRepository)
        {
            _context = context;
            _resourceRequestStepRepository = resourceRequestStepRepository;
            _resourceRequestRepository = resourceRequestRepository;
            _employeeRepository = employeeRepository;
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
                if (rr.IsAccomplished())
                {
                    rr.SetToImplementation();
                    await _context.Implementations.AddAsync(new ResourceRequestImplementation(rr.Id));
                }
                else
                {
                    if (rr.Progress != Progress.IN_PROGRESS)
                    {
                        rr.SetToInProgress();
                    }
                }

                var approver = await _employeeRepository.GetByIdAsync(step.ApproverId);

                await _context.ResourceRequestHistories.AddAsync(new ResourceRequestHistory
                (
                    rr.Id,
                    ResourceRequestAction.APPROVE,
                    "Employee " + approver.FirstName + " " + approver.LastName + " approved the resource request"
                ));

                await _context.SaveChangesAsync();

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

            var approver = await _employeeRepository.GetByIdAsync(step.ApproverId);

            await _context.ResourceRequestHistories.AddAsync(new ResourceRequestHistory
            (
                rr.Id,
                ResourceRequestAction.REJECT,
                "Employee " + approver.FirstName + " " + approver.LastName + " rejected the resource request"
            ));

            await _context.SaveChangesAsync();

            return step;
        }

    }
}
