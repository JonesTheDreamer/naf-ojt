using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Exceptions;
using NAFServer.src.Domain.Interface;
namespace NAFServer.src.Domain.Entities
{
    public class ResourceRequest : TimeStamp
    {
        public Guid Id { get; set; }
        public int CurrentStep { get; set; }
        public Progress Progress { get; set; }
        public DateTime AccomplishedAt { get; set; }
        public DateTime? DateNeeded { get; set; }
        public Guid NAFId { get; set; }
        public NAF NAF { get; set; }
        public int ResourceId { get; set; }
        public Resource Resource { get; set; }
        public Guid ApprovalWorkflowTemplateId { get; set; }
        public List<ResourceRequestHistory> Histories { get; set; } = new();
        public ApprovalWorkflowTemplate ApprovalWorkflowTemplate { get; set; }
        public List<ResourceRequestPurpose> ResourceRequestPurposes { get; set; } = new();
        public List<ResourceRequestApprovalStep> ResourceRequestsApprovalSteps { get; set; } = new();
        public bool IsActive { get; set; }
        public ResourceRequestAdditionalInfo AdditionalInfo { get; set; }
        public ResourceRequestImplementation ResourceRequestImplementation { get; set; }
        private ResourceRequest() { }
        public ResourceRequest(
            Guid NAFId,
            int ResourceId,
            Guid ApprovalWorkflowTemplateId,
            ResourceRequestAdditionalInfo AdditionalInfo,
            Progress Progress
        )
        {
            this.NAFId = NAFId;
            this.ResourceId = ResourceId;
            this.ApprovalWorkflowTemplateId = ApprovalWorkflowTemplateId;
            this.AdditionalInfo = AdditionalInfo;
            this.Progress = Progress;
            CurrentStep = 1;
            IsActive = true;
        }

        public ResourceRequest SetToInProgress()
        {
            if (Progress == Progress.IN_PROGRESS) throw new DomainException("Already In Progress");
            Progress = Progress.IN_PROGRESS;
            return this;
        }

        public ResourceRequest SetToRejected()
        {
            if (Progress == Progress.REJECTED) throw new DomainException("Already Rejected");
            Progress = Progress.REJECTED;
            return this;
        }

        public ResourceRequest SetToAccomplished()
        {
            if (Progress == Progress.ACCOMPLISHED) throw new DomainException("Already Approved");
            Progress = Progress.ACCOMPLISHED;
            AccomplishedAt = DateTime.UtcNow;
            return this;
        }

        public ResourceRequest SetToImplementation()
        {
            if (Progress == Progress.IMPLEMENTATION) throw new DomainException("Already In Implementation");
            Progress = Progress.IMPLEMENTATION;
            return this;
        }

        public ResourceRequest NextStep()
        {
            CurrentStep++;
            return this;
        }

        public bool IsAccomplished()
        {
            return ResourceRequestsApprovalSteps.All(rras => rras.Progress == Progress.ACCOMPLISHED);
        }

        public List<ResourceRequestApprovalStep> AddApprovalSteps(List<ResourceRequestApprovalStep> approvalStep)
        {
            ResourceRequestsApprovalSteps.AddRange(approvalStep);
            return ResourceRequestsApprovalSteps;
        }

        public List<ResourceRequestApprovalStep> AddApprovalStep(ResourceRequestApprovalStep approvalStep)
        {
            ResourceRequestsApprovalSteps.Add(approvalStep);
            return ResourceRequestsApprovalSteps;
        }

        public ResourceRequest EditPurpose(string newPurpose, Guid? resourceRequestApprovalStepHistory)
        {
            var purpose = new ResourceRequestPurpose(newPurpose, Id, resourceRequestApprovalStepHistory);
            ResourceRequestPurposes.Add(purpose);
            return this;
        }

        public ResourceRequest DeactivateResourceRequest()
        {
            IsActive = false;
            return this;
        }
        public ResourceRequest ActivateResourceRequest()
        {
            IsActive = true;
            return this;
        }

    }
}
