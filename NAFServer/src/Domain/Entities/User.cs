namespace NAFServer.src.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string EmployeeNumber { get; set; }
        //public int LocationId { get; set; }
        public bool IsActive { get; set; }
        public DateTime DateAdded { get; set; }
        public DateTime? DateRemoved { get; set; }
        public List<UserRole> UserRoles { get; set; }
        public List<UserLocation> UserLocations { get; set; }
        public List<UserDepartment> UserDepartments { get; set; }
        public Employee Employee { get; set; }
        public User(string EmployeeNumber)
        {
            this.EmployeeNumber = EmployeeNumber;
            DateAdded = DateTime.Now;
            IsActive = true;
        }
        public User SetUserToInactive()
        {
            IsActive = false;
            DateRemoved = DateTime.Now;
            return this;
        }
        public User SetUserToActive()
        {
            IsActive = true;
            DateRemoved = null;
            return this;
        }

    }
}
