namespace NAFServer.src.Domain.Entities
{
    public class ResourceGroup
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool CanOwnMany { get; set; }
        public bool CanChangeWithoutApproval { get; set; }
        public List<Resource> Resources { get; set; } = new();
        private ResourceGroup() { }
        public ResourceGroup(string Name, bool CanOwnMany, bool CanChangeWithoutApproval)
        {
            this.Name = Name;
            this.CanOwnMany = CanOwnMany;
            this.CanChangeWithoutApproval = CanChangeWithoutApproval;
        }

        public ResourceGroup OwnsOne()
        {
            CanOwnMany = false;
            return this;
        }
        public ResourceGroup OwnsMany()
        {
            CanOwnMany = true;
            return this;
        }

        public ResourceGroup ChangeToOwnOne()
        {
            CanOwnMany = false;
            return this;
        }
        public ResourceGroup ChangeToOwnMany()
        {
            CanOwnMany = true;
            return this;
        }
    }
}