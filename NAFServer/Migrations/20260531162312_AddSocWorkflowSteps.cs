using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NAFServer.Migrations
{
    /// <inheritdoc />
    public partial class AddSocWorkflowSteps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty — StepAction.FOR_SOC_REVIEW is a new int value (2) requiring no schema changes.
            // The SOC role row and 3-step internet resource workflow steps are handled by the seeder on fresh databases.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty — no schema changes were made in Up().
        }
    }
}
