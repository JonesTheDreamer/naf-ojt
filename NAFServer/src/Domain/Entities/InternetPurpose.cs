namespace NAFServer.src.Domain.Entities
{
    public class InternetPurpose
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
        private InternetPurpose() { }
        public InternetPurpose(string Name, string Description)
        {
            this.Name = Name;
            this.Description = Description;
        }
    }
}
