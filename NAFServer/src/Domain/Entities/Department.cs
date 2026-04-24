namespace NAFServer.src.Domain.Entities
{
    public class Department
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public string Name { get; set; }
        public string DepartmentHeadId { get; set; }
        public int LocationId { get; set; }
        public bool IsActive { get; set; }
        public Employee DepartmentHead { get; set; }
        public Location Location { get; set; }
        private Department() { }

        public Department(string Code, string Name, string DepartmentHeadId, int LocationId)
        {
            this.Code = Code;
            this.Name = Name;
            this.DepartmentHeadId = DepartmentHeadId;
            this.LocationId = LocationId;
            IsActive = true;
        }

        public Department SetDepartmentHead(string employeeId)
        {
            DepartmentHeadId = employeeId;
            return this;
        }

        public Department SetLocation(int locationId)
        {
            LocationId = locationId;
            return this;
        }

        public Department SetToInactive()
        {
            IsActive = false;
            return this;
        }

        public Department SetToActive()
        {
            IsActive = true;
            return this;
        }
    }
}
