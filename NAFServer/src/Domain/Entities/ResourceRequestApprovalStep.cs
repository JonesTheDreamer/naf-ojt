using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Exceptions;
namespace NAFServer.src.Domain.Entities
{
    public class ResourceRequestApprovalStep
    {
        public Guid ResourceRequestId { get; set; }
        public Guid Id { get; set; }
        public int StepOrder { get; set; }
        public StepAction StepAction { get; set; }
        public string ApproverId { get; set; }
        public Progress Progress { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public ResourceRequest ResourceRequest { get; set; }

        public List<ResourceRequestApprovalStepHistory> Histories { get; set; } = new();

        private ResourceRequestApprovalStep() { }
        public ResourceRequestApprovalStep
        (
            Guid ResourceRequestId,
            string ApproverId,
            int StepOrder,
            StepAction StepAction
        )
        {
            this.ResourceRequestId = ResourceRequestId;
            this.StepOrder = StepOrder;
            this.StepAction = StepAction;
            this.ApproverId = ApproverId;
            Progress = Progress.OPEN;
        }

        public ResourceRequestApprovalStep SetToInProgress()
        {
            if (Progress == Progress.IN_PROGRESS) throw new DomainException("Already In Progress");
            Progress = Progress.IN_PROGRESS;
            ApprovedAt = DateTime.UtcNow;
            return this;
        }

        public ResourceRequestApprovalStepHistory AddApprovedHistory(string? comment)
        {
            Progress = Progress.ACCOMPLISHED;
            var history = new ResourceRequestApprovalStepHistory(Id, Status.APPROVED, comment, null);
            Histories.Add(history);
            return history;
        }

        public ResourceRequestApprovalStep SetToApproved(string? comment)
        {
            Progress = Progress.ACCOMPLISHED;
            var history = new ResourceRequestApprovalStepHistory(Id, Status.APPROVED, comment, null);
            Histories.Add(history);
            ApprovedAt = DateTime.UtcNow;
            return this;
        }

        public ResourceRequestApprovalStepHistory SetToRejected(string reasonForRejection)
        {
            if (reasonForRejection == null)
            {
                throw new DomainException("Reason for rejection is required when request is rejected");
            }
            Progress = Progress.REJECTED;
            var history = new ResourceRequestApprovalStepHistory(Id, Status.REJECTED, null, reasonForRejection);
            Histories.Add(history);
            return history;
        }
    }
}
