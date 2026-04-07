using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface
{
    public abstract class ResourceRequestAdditionalInfo
    {
        public Guid Id { get; set; }
        public Guid ResourceRequestId { get; set; }
        public ResourceRequest ResourceRequest { get; set; }
        protected ResourceRequestAdditionalInfo() { }
    }
}
