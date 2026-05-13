using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Infrastructure.Persistence.Seeder
{
    public class DepartmentEmployeeSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (await context.DepartmentEmployees.AnyAsync()) return;

            var deptMap = await context.Departments
                .ToDictionaryAsync(d => d.Code, d => d.Id);

            var employees = await context.Employees.ToListAsync();

            var records = new List<DepartmentEmployee>();

            foreach (var emp in employees)
            {
                if (!string.IsNullOrWhiteSpace(emp.DepartmentId) &&
                    deptMap.TryGetValue(emp.DepartmentId, out var deptId))
                {
                    records.Add(new DepartmentEmployee(deptId, emp.Id));
                }
            }

            await context.DepartmentEmployees.AddRangeAsync(records);
            await context.SaveChangesAsync();
        }
    }
}
