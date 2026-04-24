namespace NAFServer.src.Domain.Entities
{
    public class UserRole
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int RoleId { get; set; }
        public bool IsActive { get; set; }
        public User User { get; set; }
        public Role Role { get; set; }
        public DateTime DateAdded { get; set; }
        public DateTime? DateRemoved { get; set; }

        private UserRole() { }
        public UserRole(int UserId, int RoleId)
        {
            this.UserId = UserId;
            this.RoleId = RoleId;
            IsActive = true;
            DateAdded = DateTime.Now;
        }

        public UserRole SetToInactive()
        {
            IsActive = false;
            DateRemoved = DateTime.Now;
            return this;
        }

        public UserRole SetToActive()
        {
            IsActive = true;
            DateRemoved = null;
            return this;
        }
    }
}
