namespace NAFServer.src.Domain.Entities
{
    public class Employee
    {
        public string Id { get; set; }
        public string FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string LastName { get; set; }
        public string Status { get; set; }
        public string Company { get; set; }
        public string? HiredDate { get; set; }
        public string? RegularizedDate { get; set; }
        public string? SeparatedDate { get; set; }
        public string? Position { get; set; }
        public string? Location { get; set; }

        public string? SupervisorId { get; set; }
        public string? DepartmentHeadId { get; set; }

        public string DepartmentId { get; set; }
        public string DepartmentDesc { get; set; }
        private Employee() { }

        public Employee
        (
            string Id,
            string FirstName,
            string? MiddleName,
            string LastName,
            string? SupervisorId,
            string Status,
            string Company,
            string Position,
            string Location,
            string DepartmentId,
            string? DepartmentHeadId,
            string DepartmentDesc)
        {
            this.Id = Id;
            this.FirstName = FirstName;
            this.MiddleName = MiddleName;
            this.LastName = LastName;
            this.SupervisorId = SupervisorId;
            this.Status = Status;
            this.Company = Company;
            this.Position = Position;
            this.Location = Location;
            this.DepartmentId = DepartmentId;
            this.DepartmentHeadId = DepartmentHeadId;
            this.DepartmentDesc = DepartmentDesc;
        }
    }
}
