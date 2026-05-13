namespace NAFServer.src.Domain.Entities
{
    public class AuditTrail
    {
        public int Id { get; set; }
        public string Activity { get; set; }
        public string Entity { get; set; }
        public DateTime Timestamp { get; set; }

        public AuditTrail(string activity, string entity)
        {
            Activity = activity;
            Entity = entity;
            Timestamp = DateTime.UtcNow;
        }
    }
}
