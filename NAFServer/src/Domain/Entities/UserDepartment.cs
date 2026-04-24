namespace NAFServer.src.Domain.Entities
{
    public class UserDepartment
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int DepartmentId { get; set; }
        public bool IsActive { get; set; }
        public DateTime DateAdded { get; set; }
        public DateTime? DateRemoved { get; set; }
        public User User { get; set; }
        public Department Department { get; set; }

        private UserDepartment() { }

        public UserDepartment(int userId, int departmentId)
        {
            UserId = userId;
            DepartmentId = departmentId;
            DateAdded = DateTime.Now;
            IsActive = true;
        }

        public UserDepartment SetToInactive()
        {
            IsActive = false;
            DateRemoved = DateTime.Now;
            return this;
        }

        public UserDepartment SetToActive()
        {
            IsActive = true;
            DateRemoved = null;
            return this;
        }
    }
}
