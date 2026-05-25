using NAFServer.src.Domain.Entities;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Infrastructure.Persistence.Seeder
{
    public static class LocationSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            var locations = new[]
            {
                new { Name = "MAKATI",  AllowWeekend = false },
                new { Name = "ANTIQUE", AllowWeekend = false },
                new { Name = "CALACA",  AllowWeekend = false },
            };

            foreach (var loc in locations)
            {
                if (!context.Locations.Any(l => l.Name == loc.Name))
                {
                    var location = new Location(loc.Name);
                    location.AllowWeekendDateNeeded = loc.AllowWeekend;
                    context.Locations.Add(location);
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
