namespace NAFServer.src.Domain.Entities
{
    public class InternetResource
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Url { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public int PurposeId { get; set; }
        public InternetPurpose Purpose { get; set; }
        private InternetResource() { }
        public InternetResource(string Name, string Url, string? Description, int PurposeId)
        {
            this.Name = Name;
            this.Url = Url;
            this.Description = Description;
            this.PurposeId = PurposeId;
        }
    }
}
