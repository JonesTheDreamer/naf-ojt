using Microsoft.EntityFrameworkCore;
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

            context.Roles.AddRange(
                new Role(Roles.ADMIN),
                new Role(Roles.REQUESTOR_APPROVER),
                new Role(Roles.HR),
                new Role(Roles.MANAGEMENT)
            );

            await context.SaveChangesAsync();

            var employees = await context.Employees.ToListAsync();
            var roleMap = await context.Roles.ToDictionaryAsync(r => r.Name, r => r.Id);

            var users = new List<User>();

            foreach (var emp in employees)
            {
                var user = new User(emp.Id);
                users.Add(user);
            }

            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();

            var userRoles = new List<UserRole>();

            foreach (var emp in employees)
            {
                var user = users.First(x => x.EmployeeNumber == emp.Id);

                var roleEnum = DetermineRole(emp.Position);
                var roleId = roleMap[roleEnum];

                userRoles.Add(new UserRole(user.Id, roleId));

                if (emp.Position == "Network Administrator")
                {
                    userRoles.Add(new UserRole(user.Id, roleMap[Roles.REQUESTOR_APPROVER]));
                }
            }

            await context.UserRoles.AddRangeAsync(userRoles);
            await context.SaveChangesAsync();
        }

        private static Roles DetermineRole(string? position)
        {
            if (position == "IT Director" || position == "Network Administrator")
                return Roles.ADMIN;

            if (position == "HR Director" || position == "Talent Acquisition Manager" || position == "HR Operations Manager")
                return Roles.HR;

            return Roles.REQUESTOR_APPROVER;
        }
    }
}
