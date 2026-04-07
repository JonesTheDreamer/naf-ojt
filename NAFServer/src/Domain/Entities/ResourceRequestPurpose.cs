using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Domain.Entities
{
    public class ResourceRequestPurpose
    {
        public Guid Id { get; set; }
        [MaxLength(512)]
        public string Purpose { get; set; }
        public Guid? ResourceRequestApprovalStepHistoryId { get; set; }
        public ResourceRequestApprovalStepHistory? ResourceRequestApprovalStepHistory { get; set; }
        public Guid ResourceRequestId { get; set; }
        public ResourceRequest ResourceRequest { get; set; }
        public DateTime CreatedAt { get; set; }
        private ResourceRequestPurpose() { }
        public ResourceRequestPurpose
        (
            string Purpose,
            Guid ResourceRequestId,
            Guid? ResourceRequestApprovalStepHistoryId
        )
        {
            this.Purpose = Purpose;
            this.ResourceRequestId = ResourceRequestId;
            this.ResourceRequestApprovalStepHistoryId = ResourceRequestApprovalStepHistoryId == Guid.Empty
                ? null
                : ResourceRequestApprovalStepHistoryId;
            CreatedAt = DateTime.UtcNow;
        }
    }
}
