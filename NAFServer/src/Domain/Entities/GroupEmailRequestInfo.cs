using NAFServer.src.Domain.Interface;

namespace NAFServer.src.Domain.Entities
{
    public class GroupEmailRequestInfo : ResourceRequestAdditionalInfo
    {
        public int GroupEmailId { get; set; }
        public GroupEmail GroupEmail { get; set; }

        protected GroupEmailRequestInfo() { }
        public GroupEmailRequestInfo(int GroupEmailId)
        {
            this.GroupEmailId = GroupEmailId;
        }
    }
}
