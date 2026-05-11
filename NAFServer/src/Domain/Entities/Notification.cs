namespace NAFServer.src.Domain.Entities
{
    public class Notification
    {
        public Guid Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Link { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public User User { get; set; }

        private Notification() { }

        public Notification(int userId, string title, string message, string link)
        {
            UserId = userId;
            Title = title;
            Message = message;
            Link = link;
            IsRead = false;
            CreatedAt = DateTime.UtcNow;
        }
    }
}
