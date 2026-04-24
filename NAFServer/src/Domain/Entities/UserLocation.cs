namespace NAFServer.src.Domain.Entities
{
    public class UserLocation
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int LocationId { get; set; }
        public bool IsActive { get; set; }
        public DateTime DateAdded { get; set; }
        public DateTime? DateRemoved { get; set; }
        public User User { get; set; }
        public Location Location { get; set; }

        private UserLocation() { }

        public UserLocation(int userId, int locationId)
        {
            UserId = userId;
            LocationId = locationId;
            DateAdded = DateTime.Now;
            IsActive = true;
        }

        public UserLocation SetToInactive()
        {
            IsActive = false;
            DateRemoved = DateTime.Now;
            return this;
        }

        public UserLocation SetToActive()
        {
            IsActive = true;
            DateRemoved = null;
            return this;
        }
    }
}
