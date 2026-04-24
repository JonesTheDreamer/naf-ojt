using NAFServer.src.Domain.Exceptions;

namespace NAFServer.src.Domain.Entities
{
    public class Resource
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
        public string? IconUrl { get; set; }
        public bool IsActive { get; set; }
        public bool IsSpecial { get; set; }
        public bool HasAdditionalInfo { get; set; }
        public int? ResourceGroupId { get; set; }
        public bool IsActiveInGroup { get; set; }
        public ResourceGroup ResourceGroup { get; set; }
        public List<ResourceRequest> ResourceRequests { get; set; } = new();

        private Resource() { }
        public Resource(string Name, string Color, string? IconUrl, bool IsSpecial, bool HasAdditionalInfo)
        {
            this.Name = Name;
            this.Color = Color;
            this.IconUrl = IconUrl;
            this.IsSpecial = IsSpecial;
            this.HasAdditionalInfo = HasAdditionalInfo;
            IsActiveInGroup = false;
            IsActive = true;
        }

        public Resource SetToInactive()
        {
            if (!IsActive) throw new DomainException("Already Inactive");
            IsActive = false;
            return this;
        }

        public Resource SetToActive()
        {
            if (IsActive) throw new DomainException("Already Active");
            IsActive = true;
            return this;
        }

        public Resource SetColor(string Color)
        {
            this.Color = Color;
            return this;
        }

        public Resource SetIconUrl(string IconUrl)
        {
            this.IconUrl = IconUrl;
            return this;
        }

        public Resource AssignToGroup(int groupId)
        {
            ResourceGroupId = groupId;
            IsActiveInGroup = true;
            return this;
        }

        public Resource RemoveFromGroup()
        {
            IsActiveInGroup = false;
            return this;
        }

    }
}
