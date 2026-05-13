namespace NAFServer.src.Domain.Entities
{
    public class SharedFolder
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? OwnerId { get; set; }
        public bool IsActive { get; set; } = true;

        private SharedFolder() { }

        public SharedFolder(string name, string? ownerId = null)
        {
            Name = name;
            OwnerId = ownerId;
            IsActive = true;
        }

        public SharedFolder SetOwner(string employeeId)
        {
            OwnerId = employeeId;
            return this;
        }

        public SharedFolder Deactivate()
        {
            IsActive = false;
            return this;
        }
    }
}
