namespace NAFServer.src.Domain.Entities
{
    public class Location
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsActive { get; set; }
        public bool AllowWeekendDateNeeded { get; set; }
        public List<NAF> NAFs { get; set; } = new();

        public Location(string name)
        {
            Name = name;
            IsActive = true;
            AllowWeekendDateNeeded = true;
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
