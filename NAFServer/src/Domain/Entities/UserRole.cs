using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Domain.Entities
{
    public class UserRole
    {
        public int id { get; set; }
        public string userId { get; set; }
        public Roles role { get; set; }
        public DateTime date_added { get; set; }
        public DateTime? date_removed { get; set; }

        public UserRole(string userId, Roles role)
        {
            this.userId = userId;
            this.role = role;
            date_added = DateTime.Now;
        }
    }
}
