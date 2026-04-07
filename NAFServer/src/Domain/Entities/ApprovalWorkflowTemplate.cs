using NAFServer.src.Domain.Exceptions;

namespace NAFServer.src.Domain.Entities
{
    public class ApprovalWorkflowTemplate
    {
        public Guid Id { get; set; }
        public int ResourceId { get; set; }
        public Resource Resource { get; set; }
        public int Version { get; set; }
        public bool IsActive { get; set; }

        public List<ResourceRequest> ResourceRequests { get; set; } = new();

        private ApprovalWorkflowTemplate() { }
        public ApprovalWorkflowTemplate(int ResourceId, int Version)
        {
            this.ResourceId = ResourceId;
            this.Version = Version;
            IsActive = true;
        }

        public ApprovalWorkflowTemplate SetToInactive()
        {
            if (!IsActive) throw new DomainException("Already Inactive");
            IsActive = false;
            return this;
        }

        public ApprovalWorkflowTemplate SetToActive()
        {
            if (IsActive) throw new DomainException("Already Active");
            IsActive = true;
            return this;
        }

    }
}
