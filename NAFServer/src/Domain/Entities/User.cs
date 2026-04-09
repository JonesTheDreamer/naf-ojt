namespace NAFServer.src.Domain.Entities
{
    public class User
    {
        public int id { get; set; }
        public string employeeId { get; set; }
        public string location { get; set; }
        public DateTime date_added { get; set; }
        public string? date_removed { get; set; }

        public User(string employeeId, string location)
        {
            this.employeeId = employeeId;
            this.location = location;
            this.date_added = DateTime.Now;
        }
    }
}
