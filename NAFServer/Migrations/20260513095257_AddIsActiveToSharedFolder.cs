using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NAFServer.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActiveToSharedFolder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "SharedFolders",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "SharedFolders");
        }
    }
}
