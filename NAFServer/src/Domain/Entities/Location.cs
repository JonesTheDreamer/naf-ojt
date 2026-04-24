namespace NAFServer.src.Domain.Entities
{
    public class Location
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsActive { get; set; }
        public List<User> Users { get; set; }
        public List<NAF> NAFs { get; set; }

        public Location(string name)
        {
            Name = name;
            IsActive = true;
        }

        public Location SetToInactive()
        {
            IsActive = false;
            return this;
        }

        public Location SetToActive()
        {
            IsActive = true;
            return this;
        }
    }
}
