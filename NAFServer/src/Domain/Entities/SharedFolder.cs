namespace NAFServer.src.Domain.Entities
{
    public class SharedFolder
    {
        public int Id { get; set; }
        public string Name { get; set; }

        private SharedFolder() { }

        public SharedFolder(string name)
        {
            Name = name;
        }
    }
}
