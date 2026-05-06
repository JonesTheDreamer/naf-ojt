namespace NAFServer.src.Domain.Entities
{
    public class GroupEmail
    {
        public int Id { get; set; }
        public string Email { get; set; }

        private GroupEmail() { }

        public GroupEmail(string email)
        {
            Email = email;
        }
    }
}
