namespace NAFServer.src.Domain.Entities
{
    public class ResourceRequestAllowance
    {
        public int Id { get; set; }
        public int ResourceId { get; set; }
        public int LocationId { get; set; }
        public int AllowanceDays { get; set; }

        public Resource Resource { get; set; }
        public Location Location { get; set; }

        private ResourceRequestAllowance() { }

        public ResourceRequestAllowance(int resourceId, int locationId, int allowanceDays)
        {
            ResourceId = resourceId;
            LocationId = locationId;
            AllowanceDays = allowanceDays;
        }
    }
}
