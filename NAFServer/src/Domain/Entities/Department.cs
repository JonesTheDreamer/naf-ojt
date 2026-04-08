namespace NAFServer.src.Domain.Entities
{
    public class Department
    {
        public string Id { get; set; }
        public string DepartmentDesc { get; set; }
        public string DepartmentHeadId { get; set; }
        private Department() { }

        public Department(string Id, string DepartmentDesc, string DepartmentHeadId)
        {
            this.Id = Id;
            this.DepartmentDesc = DepartmentDesc;
            this.DepartmentHeadId = DepartmentHeadId;
        }
    }
}
