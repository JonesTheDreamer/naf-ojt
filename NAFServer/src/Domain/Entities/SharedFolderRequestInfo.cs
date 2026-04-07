using NAFServer.src.Domain.Interface;

namespace NAFServer.src.Domain.Entities
{
    public class SharedFolderRequestInfo : ResourceRequestAdditionalInfo
    {
        public int SharedFolderId { get; set; }
        public SharedFolder SharedFolder { get; set; }
        protected SharedFolderRequestInfo() { }
        public SharedFolderRequestInfo(int SharedFolderId)
        {
            this.SharedFolderId = SharedFolderId;
        }
    }
}
