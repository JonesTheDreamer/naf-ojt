using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Exceptions;
namespace NAFServer.src.Domain.Entities
{
    public class ResourceRequestApprovalStepHistory
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public string? Comment { get; set; }
        public string? ReasonForRejection { get; set; }
        public DateTime ActionAt { get; set; }

        public Guid ResourceRequestApprovalStepId { get; set; }
        public ResourceRequestApprovalStep ResourceRequestApprovalStep { get; set; }

        private ResourceRequestApprovalStepHistory() { }
        public ResourceRequestApprovalStepHistory
        (
            Guid ResourceRequestApprovalStepId,
            Status Status,
            string? Comment,
            string? ReasonForRejection
        )
        {
            this.ResourceRequestApprovalStepId = ResourceRequestApprovalStepId;
            this.Status = Status;
            this.Comment = Comment;
            this.ReasonForRejection = ReasonForRejection;
            ActionAt = DateTime.UtcNow;
        }

        public ResourceRequestApprovalStepHistory Reject(string ReasonForRejection)
        {
            if (Status == Status.REJECTED) throw new DomainException("Already Rejected");

            Status = Status.REJECTED;
            this.ReasonForRejection = ReasonForRejection;
            ActionAt = DateTime.UtcNow;

            return this;
        }

        public ResourceRequestApprovalStepHistory Approve(string? Comment)
        {
            if (Status == Status.APPROVED) throw new DomainException("Already Approved");

            Status = Status.APPROVED;
            this.Comment = Comment;
            ActionAt = DateTime.UtcNow;

            return this;
        }
    }
}
