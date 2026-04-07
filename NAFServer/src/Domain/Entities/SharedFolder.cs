namespace NAFServer.src.Domain.Entities
{
    public class SharedFolder
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Remarks { get; set; }
        public string DepartmentId { get; set; }
        private SharedFolder() { }
        public SharedFolder(string Name, string Remarks, string DepartmentId)
        {
            this.Name = Name;
            this.Remarks = Remarks;
            this.DepartmentId = DepartmentId;
        }
    }
}
