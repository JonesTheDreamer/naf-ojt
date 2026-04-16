namespace NAFServer.src.Domain.Entities
{
    public class ResourceGroup
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool CanOwnMany { get; set; }
        public bool CanChangeWithoutAPproval { get; set; }
        public List<Resource> Resources { get; set; } = new();
        private ResourceGroup() { }
        public ResourceGroup(string Name, bool CanOwnMany)
        {
            this.Name = Name;
            this.CanOwnMany = CanOwnMany;
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