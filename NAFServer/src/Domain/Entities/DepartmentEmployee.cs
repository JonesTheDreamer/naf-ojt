namespace NAFServer.src.Domain.Entities
{
    public class DepartmentEmployee
    {
        public int Id { get; set; }
        public int DepartmentId { get; set; }
        public string EmployeeId { get; set; }
        public bool IsActive { get; set; }
        public DateTime DateAdded { get; set; }
        public DateTime? DateRemoved { get; set; }
        public Department Department { get; set; }

        private DepartmentEmployee() { }

        public DepartmentEmployee(int departmentId, string employeeId)
        {
            DepartmentId = departmentId;
            EmployeeId = employeeId;
            IsActive = true;
            DateAdded = DateTime.Now;
        }

        public DepartmentEmployee SetToInactive()
        {
            IsActive = false;
            DateRemoved = DateTime.Now;
            return this;
        }
    }
}
