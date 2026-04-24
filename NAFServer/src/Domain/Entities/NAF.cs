using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Exceptions;
namespace NAFServer.src.Domain.Entities

{
    public class NAF : TimeStamp
    {
        public Guid Id { get; set; }
        public string Reference { get; set; }
        public string RequestorId { get; set; }
        public string EmployeeId { get; set; }
        public int LocationId { get; set; }
        public DateTime? AccomplishedAt { get; set; }
        public DateTime SubmittedAt { get; set; }
        public Progress Progress { get; set; }
        public Location Location { get; set; }

        public int DepartmentId { get; set; }
        public bool IsActive { get; set; }
        public Department Department { get; set; }
        public List<ResourceRequest> ResourceRequests { get; set; } = new();

        private NAF() { }
        public NAF(string Reference, string RequestorId, string EmployeeId, int DepartmentId, int LocationId)
        {
            this.Reference = Reference;
            this.RequestorId = RequestorId;
            this.EmployeeId = EmployeeId;
            this.DepartmentId = DepartmentId;
            this.LocationId = LocationId;
            SubmittedAt = DateTime.UtcNow;
            Progress = Progress.OPEN;
            IsActive = true;
        }

        public NAF SetToInProgress()
        {
            if (Progress == Progress.IN_PROGRESS) throw new DomainException("Already In Progress");
            Progress = Progress.IN_PROGRESS;
            return this;
        }

        public NAF SetToApproved()
        {
            if (Progress == Progress.ACCOMPLISHED) throw new DomainException("Already Approved");
            Progress = Progress.ACCOMPLISHED;
            AccomplishedAt = DateTime.UtcNow;
            return this;
        }

        public bool IsFullyApproved()
        {
            return ResourceRequests.All(rr => rr.Progress == Progress.ACCOMPLISHED);
        }

        public List<ResourceRequest> AddResource(ResourceRequest request)
        {
            ResourceRequests.Add(request);
            return ResourceRequests;
        }

        public bool CascadeApproval()
        {
            if (Progress == Progress.ACCOMPLISHED)
                return true;

            if (ResourceRequests.All(r => r.Progress == Progress.ACCOMPLISHED))
            {
                Progress = Progress.ACCOMPLISHED;
                AccomplishedAt = DateTime.UtcNow;
                return true;
            }
            return false;
        }

        public NAF DeactivateNAF()
        {
            IsActive = false;
            return this;
        }
        public NAF ActivateNAF()
        {
            IsActive = true;
            return this;
        }
    }
}
