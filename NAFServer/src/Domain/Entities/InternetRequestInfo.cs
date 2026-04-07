using NAFServer.src.Domain.Interface;

namespace NAFServer.src.Domain.Entities
{
    public class InternetRequestInfo : ResourceRequestAdditionalInfo
    {
        public int InternetResourceId { get; set; }
        public InternetResource InternetResource { get; set; }
        protected InternetRequestInfo() { }
        public InternetRequestInfo(int InternetResourceId)
        {
            this.InternetResourceId = InternetResourceId;
        }
    }
}
