namespace NAFServer.src.Domain.Entities
{
    public class Employee
    {
        public string Id { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? FullName { get; set; }
        public string? Status { get; set; }
        public string? Company { get; set; }
        public string? Position { get; set; }
        public string? Location { get; set; }
        public string? SupervisorId { get; set; }
        public string? DepartmentId { get; set; }
        public string? DepartmentDesc { get; set; }
        public string? DepartmentHead { get; set; }
    }
}
