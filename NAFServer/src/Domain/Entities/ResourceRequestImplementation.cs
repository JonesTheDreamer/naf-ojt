using NAFServer.src.Domain.Exceptions;

namespace NAFServer.src.Domain.Entities
{
    public class ResourceRequestImplementation : TimeStamp
    {
        public enum ImplementationStatus
        {
            OPEN,
            IN_PROGRESS,
            DELAYED,
            ACCOMPLISHED
        }
        public Guid Id { get; set; }
        public Guid ResourceRequestId { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? AccomplishedAt { get; set; }
        public string? EmployeeId { get; set; }
        public ImplementationStatus Status { get; set; } = ImplementationStatus.OPEN;
        public string? DelayReason { get; set; }
        public DateTime? DelayedAt { get; set; }
        public ResourceRequest ResourceRequest { get; set; }

        public ResourceRequestImplementation(Guid ResourceRequestId)
        {
            this.ResourceRequestId = ResourceRequestId;
        }

        public ResourceRequestImplementation SetToInProgress(string EmployeeId)
        {
            if (Status == ImplementationStatus.IN_PROGRESS) throw new DomainException("Already In Progress");
            Status = ImplementationStatus.IN_PROGRESS;
            this.EmployeeId = EmployeeId;
            AcceptedAt = DateTime.UtcNow;
            return this;
        }

        public ResourceRequestImplementation SetToDelayed(string DelayReason)
        {
            if (Status == ImplementationStatus.DELAYED) throw new DomainException("Already Delayed");
            Status = ImplementationStatus.DELAYED;
            this.DelayReason = DelayReason;
            DelayedAt = DateTime.UtcNow;
            return this;
        }

        public ResourceRequestImplementation SetToAccomplished()
        {
            if (Status == ImplementationStatus.ACCOMPLISHED) throw new DomainException("Already Accomplished");
            Status = ImplementationStatus.ACCOMPLISHED;
            AccomplishedAt = DateTime.UtcNow;
            return this;

        }
    }
}

