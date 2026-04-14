using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Infrastructure.Persistence.Seeder
{
    public class UserSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (context.Users.Any() || context.UserRoles.Any())
                return;

            var users = new List<User>();
            var userRoles = new List<UserRole>();

            var employees = context.Employees.ToList();

            foreach (var emp in employees)
            {
                // Create User
                var user = new User(
                    emp.Id,
                    emp.Location
                );

                users.Add(user);

                // Determine Role
                var role = DetermineRole(emp.Position);


                userRoles.Add(new UserRole(emp.Id, role));
                if (emp.Position == "Network Administrator")
                {
                    userRoles.Add(new UserRole(emp.Id, Roles.TECHNICAL_HEAD));
                }

            }

            await context.Users.AddRangeAsync(users);
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

            // TECHNICAL TEAM (IT / Engineering / Technical roles)
            if (position == "IT Support Specialist" || position == "Help Desk Analyst")
            {
                return Roles.TECHNICAL_TEAM;
            }

            // DEFAULT
            return Roles.REQUESTOR_APPROVER;
        }
    }
}
