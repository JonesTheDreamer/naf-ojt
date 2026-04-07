namespace NAFServer.src.Domain.Entities
{
    public class GroupEmail
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string DepartmentId { get; set; }
        private GroupEmail() { }
        public GroupEmail(string Email, string DepartmentId)
        {
            this.Email = Email;
            this.DepartmentId = DepartmentId;
        }
    }
}
