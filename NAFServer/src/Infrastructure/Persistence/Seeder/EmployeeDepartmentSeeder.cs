namespace NAFServer.src.Infrastructure.Persistence.Seeder
{
    // Deprecated: Department/Employee seeding is replaced by LocationSeeder + stored-proc employee data. Kept as a stub.
    public class EmployeeDepartmentSeeder
    {
        public static Task SeedAsync(AppDbContext context) => Task.CompletedTask;
    }
}
