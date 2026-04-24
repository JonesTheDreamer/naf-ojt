using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Infrastructure.Persistence.Seeder
{
    public class UserSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (context.Users.Any() || context.UserRoles.Any()
                return;

            context.Roles.AddRange(
                new Role(Roles.ADMIN),
                new Role(Roles.REQUESTOR_APPROVER),
                new Role(Roles.HR),
                new Role(Roles.MANAGEMENT)
            );

            await context.SaveChangesAsync();


            var employees = await context.Employees.ToListAsync();

            var users = new List<User>();

            // STEP 1: Create Users ONLY
            foreach (var emp in employees)
            {
                var user = new User(emp.Id);
                users.Add(user);
            }

            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
            // IMPORTANT: IDs are now generated and stable
            var userRoles = new List<UserRole>();
            var userLocations = new List<UserLocation>();

            foreach (var emp in employees)
            {
                var user = users.First(x => x.EmployeeNumber == emp.Id);

                var role = DetermineRole(emp.Position);

                userRoles.Add(new UserRole
                (
                    user.Id,
                    (int)role // assuming RoleId is int FK
                ));

                // extra rule
                if (emp.Position == "Network Administrator")
                {
                    userRoles.Add(new UserRole
                    (
                        user.Id,
                        (int)Roles.REQUESTOR_APPROVER
                    ));
                }

                if (!string.IsNullOrWhiteSpace(emp.Location))
                {
                    var empLocation = "";

                    switch (emp.Location)
                    {
                        case "Main Branch":
                            empLocation = "Makati HO";
                            break;
                        case "Branch A":
                            empLocation = "Calaca Powerplant";
                            break;
                        case "Branch B":
                            empLocation = "Antique Powerplant";
                            break;
                        default:
                            throw new Exception($"Unknown location for employee {emp.Id}: {emp.Location}");
                    }

                    var location = await context.Locations
                        .FirstOrDefaultAsync(x => x.Name == emp.Location);

                    if (location != null)
                    {
                        userLocations.Add(new UserLocation
                        (
                            user.Id,
                            location.Id
                        ));
                    }
                }
            }

            await context.UserRoles.AddRangeAsync(userRoles);
            await context.SaveChangesAsync();
        }

        private static Roles DetermineRole(string position)
        {

            // ADMIN (top-level leadership)
            if (position == "IT Director" || position == "Network Administrator")
            {
                return Roles.ADMIN;
            }

            if (position == "HR Director" || position == "Talent Acquisition Manager" || position == "HR Operations Manager")
            {
                return Roles.HR;
            }

            //HR Director
            //Talent Acquisition Manager
            //HR Operations Manager

            // DEFAULT
            return Roles.REQUESTOR_APPROVER;
        }
    }
}
