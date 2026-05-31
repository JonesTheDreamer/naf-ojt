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
                new Role(Roles.MANAGEMENT),
                new Role(Roles.SOC)
            );

            await context.SaveChangesAsync();

            var user = new User("9081429");

            context.Users.Add(user);

            await context.SaveChangesAsync();

            context.UserRoles.AddRange(
                [
                    new UserRole(user.Id, 1),
                    new UserRole(user.Id, 2),
                    new UserRole(user.Id, 3),
                    new UserRole(user.Id, 4),
                    new UserRole(user.Id, 5),
                ]
            );

            await context.SaveChangesAsync();
        }


    }
}
