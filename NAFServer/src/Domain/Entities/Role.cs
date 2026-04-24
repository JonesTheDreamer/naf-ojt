using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Domain.Entities
{
    public class Role
    {
        public int Id { get; set; }
        public Roles Name { get; set; }
        public bool IsActive { get; set; }
        public List<User> Users { get; set; }
        private Role() { }
        public Role(Roles Name)
        {
            this.Name = Name;
            IsActive = true;
        }
    }
}
