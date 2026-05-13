namespace NAFServer.src.Domain.Entities
{
    public class SharedFolder
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? OwnerId { get; set; }

        private SharedFolder() { }

        public SharedFolder(string name, string? ownerId = null)
        {
            Name = name;
            OwnerId = ownerId;
        }

        public SharedFolder SetOwner(string employeeId)
        {
            OwnerId = employeeId;
            return this;
        }
    }
}
