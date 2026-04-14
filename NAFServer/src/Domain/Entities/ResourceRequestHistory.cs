using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Domain.Entities
{
    public class ResourceRequestHistory
    {
        public Guid Id { get; set; }
        public Guid ResourceRequestId { get; set; }
        public ResourceRequestAction Type { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }

        private ResourceRequestHistory() { }

        public ResourceRequestHistory(Guid ResourceRequestId, ResourceRequestAction Type, string Description)
        {
            this.ResourceRequestId = ResourceRequestId;
            this.Type = Type;
            this.Description = Description;
            CreatedAt = DateTime.UtcNow;
        }
    }
}
