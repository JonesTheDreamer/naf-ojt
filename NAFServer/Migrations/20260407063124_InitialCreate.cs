using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NAFServer.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Department",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartmentDesc = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartmentHeadId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                });

            migrationBuilder.CreateTable(
                name: "Employee",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MiddleName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Company = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HiredDate = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RegularizedDate = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SeparatedDate = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Position = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupervisorId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DepartmentHeadId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DepartmentId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartmentDesc = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                });

            migrationBuilder.CreateTable(
                name: "GroupEmails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartmentId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupEmails", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InternetPurposes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InternetPurposes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NAFs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Reference = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequestorId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmployeeId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AccomplishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Progress = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NAFs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Resources",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IconUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsSpecial = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Resources", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SharedFolders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartmentId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SharedFolders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InternetResources",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    PurposeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InternetResources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InternetResources_InternetPurposes_PurposeId",
                        column: x => x.PurposeId,
                        principalTable: "InternetPurposes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ApprovalWorkflowTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    ResourceId = table.Column<int>(type: "int", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalWorkflowTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApprovalWorkflowTemplates_Resources_ResourceId",
                        column: x => x.ResourceId,
                        principalTable: "Resources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ApprovalWorkflowStepsTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    StepOrder = table.Column<int>(type: "int", nullable: false),
                    StepAction = table.Column<int>(type: "int", nullable: false),
                    ApproverRole = table.Column<int>(type: "int", nullable: false),
                    ApproverEntity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApprovalWorkflowTemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalWorkflowStepsTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApprovalWorkflowStepsTemplates_ApprovalWorkflowTemplates_ApprovalWorkflowTemplateId",
                        column: x => x.ApprovalWorkflowTemplateId,
                        principalTable: "ApprovalWorkflowTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ResourceRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    CurrentStep = table.Column<int>(type: "int", nullable: false),
                    Progress = table.Column<int>(type: "int", nullable: false),
                    AccomplishedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NAFId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResourceId = table.Column<int>(type: "int", nullable: false),
                    ApprovalWorkflowTemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResourceRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResourceRequests_ApprovalWorkflowTemplates_ApprovalWorkflowTemplateId",
                        column: x => x.ApprovalWorkflowTemplateId,
                        principalTable: "ApprovalWorkflowTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ResourceRequests_NAFs_NAFId",
                        column: x => x.NAFId,
                        principalTable: "NAFs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ResourceRequests_Resources_ResourceId",
                        column: x => x.ResourceId,
                        principalTable: "Resources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AdditionalInfo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    ResourceRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AdditionalInfoType = table.Column<string>(type: "nvarchar(34)", maxLength: 34, nullable: false),
                    GroupEmailId = table.Column<int>(type: "int", nullable: true),
                    InternetResourceId = table.Column<int>(type: "int", nullable: true),
                    SharedFolderId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdditionalInfo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdditionalInfo_GroupEmails_GroupEmailId",
                        column: x => x.GroupEmailId,
                        principalTable: "GroupEmails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AdditionalInfo_InternetResources_InternetResourceId",
                        column: x => x.InternetResourceId,
                        principalTable: "InternetResources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AdditionalInfo_ResourceRequests_ResourceRequestId",
                        column: x => x.ResourceRequestId,
                        principalTable: "ResourceRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AdditionalInfo_SharedFolders_SharedFolderId",
                        column: x => x.SharedFolderId,
                        principalTable: "SharedFolders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Implementations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    ResourceRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AccomplishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EmployeeId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    DelayReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DelayedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Implementations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Implementations_ResourceRequests_ResourceRequestId",
                        column: x => x.ResourceRequestId,
                        principalTable: "ResourceRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ResourceRequestApprovalSteps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    ResourceRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StepOrder = table.Column<int>(type: "int", nullable: false),
                    ApproverId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Progress = table.Column<int>(type: "int", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResourceRequestApprovalSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResourceRequestApprovalSteps_ResourceRequests_ResourceRequestId",
                        column: x => x.ResourceRequestId,
                        principalTable: "ResourceRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ResourceRequestApprovalStepHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReasonForRejection = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ActionAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ResourceRequestApprovalStepId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResourceRequestApprovalStepHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResourceRequestApprovalStepHistories_ResourceRequestApprovalSteps_ResourceRequestApprovalStepId",
                        column: x => x.ResourceRequestApprovalStepId,
                        principalTable: "ResourceRequestApprovalSteps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ResourceRequestPurposes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Purpose = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    ResourceRequestApprovalStepHistoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ResourceRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResourceRequestPurposes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResourceRequestPurposes_ResourceRequestApprovalStepHistories_ResourceRequestApprovalStepHistoryId",
                        column: x => x.ResourceRequestApprovalStepHistoryId,
                        principalTable: "ResourceRequestApprovalStepHistories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ResourceRequestPurposes_ResourceRequests_ResourceRequestId",
                        column: x => x.ResourceRequestId,
                        principalTable: "ResourceRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalInfo_GroupEmailId",
                table: "AdditionalInfo",
                column: "GroupEmailId");

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalInfo_InternetResourceId",
                table: "AdditionalInfo",
                column: "InternetResourceId");

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalInfo_ResourceRequestId",
                table: "AdditionalInfo",
                column: "ResourceRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalInfo_SharedFolderId",
                table: "AdditionalInfo",
                column: "SharedFolderId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalWorkflowStepsTemplates_ApprovalWorkflowTemplateId",
                table: "ApprovalWorkflowStepsTemplates",
                column: "ApprovalWorkflowTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalWorkflowTemplates_ResourceId",
                table: "ApprovalWorkflowTemplates",
                column: "ResourceId");

            migrationBuilder.CreateIndex(
                name: "IX_Implementations_ResourceRequestId",
                table: "Implementations",
                column: "ResourceRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InternetResources_PurposeId",
                table: "InternetResources",
                column: "PurposeId");

            migrationBuilder.CreateIndex(
                name: "IX_ResourceRequestApprovalStepHistories_ResourceRequestApprovalStepId",
                table: "ResourceRequestApprovalStepHistories",
                column: "ResourceRequestApprovalStepId");

            migrationBuilder.CreateIndex(
                name: "IX_ResourceRequestApprovalSteps_ResourceRequestId",
                table: "ResourceRequestApprovalSteps",
                column: "ResourceRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_ResourceRequestPurposes_ResourceRequestApprovalStepHistoryId",
                table: "ResourceRequestPurposes",
                column: "ResourceRequestApprovalStepHistoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ResourceRequestPurposes_ResourceRequestId",
                table: "ResourceRequestPurposes",
                column: "ResourceRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_ResourceRequests_ApprovalWorkflowTemplateId",
                table: "ResourceRequests",
                column: "ApprovalWorkflowTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_ResourceRequests_NAFId",
                table: "ResourceRequests",
                column: "NAFId");

            migrationBuilder.CreateIndex(
                name: "IX_ResourceRequests_ResourceId",
                table: "ResourceRequests",
                column: "ResourceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdditionalInfo");

            migrationBuilder.DropTable(
                name: "ApprovalWorkflowStepsTemplates");

            migrationBuilder.DropTable(
                name: "Department");

            migrationBuilder.DropTable(
                name: "Employee");

            migrationBuilder.DropTable(
                name: "Implementations");

            migrationBuilder.DropTable(
                name: "ResourceRequestPurposes");

            migrationBuilder.DropTable(
                name: "GroupEmails");

            migrationBuilder.DropTable(
                name: "InternetResources");

            migrationBuilder.DropTable(
                name: "SharedFolders");

            migrationBuilder.DropTable(
                name: "ResourceRequestApprovalStepHistories");

            migrationBuilder.DropTable(
                name: "InternetPurposes");

            migrationBuilder.DropTable(
                name: "ResourceRequestApprovalSteps");

            migrationBuilder.DropTable(
                name: "ResourceRequests");

            migrationBuilder.DropTable(
                name: "ApprovalWorkflowTemplates");

            migrationBuilder.DropTable(
                name: "NAFs");

            migrationBuilder.DropTable(
                name: "Resources");
        }
    }
}
