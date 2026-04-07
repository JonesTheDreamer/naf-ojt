using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class ResourceRequestApprovalStepService : IResourceRequestApprovalStepService
    {
        private readonly AppDbContext _context;
        private readonly IResourceRequestStepRepository _resourceRequestStepRepository;
        private readonly IResourceRequestRepository _resourceRequestRepository;

        public ResourceRequestApprovalStepService(AppDbContext context, IResourceRequestStepRepository resourceRequestStepRepository, IResourceRequestRepository resourceRequestRepository)
        {
            _context = context;
            _resourceRequestStepRepository = resourceRequestStepRepository;
            _resourceRequestRepository = resourceRequestRepository;
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
                    rr.SetToAccomplished();
                    await _context.Implementations.AddAsync(new ResourceRequestImplementation(rr.Id));

                    if (naf.IsFullyApproved())
                    {
                        naf.SetToApproved();
                    }
                }

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
            var resourceRequest = await _resourceRequestRepository.GetByApprovalStepId(stepId);
            var rr = await _resourceRequestRepository.GetByApprovalStepId(stepId);
            var step = resourceRequest.ResourceRequestsApprovalSteps.FirstOrDefault(s => s.Id == stepId)
                ?? throw new KeyNotFoundException("Step not found");

            if (reasonForRejection == null)
                throw new ArgumentNullException(nameof(reasonForRejection), "Reason for rejection cannot be null");

            step.SetToRejected(reasonForRejection);
            rr.SetToRejected();
            await _context.SaveChangesAsync();
            return step;
        }

    }
}
