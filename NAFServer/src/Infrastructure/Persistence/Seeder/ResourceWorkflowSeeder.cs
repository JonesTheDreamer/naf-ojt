using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Infrastructure.Persistence.Seeder
{
    public class ResourceWorkflowSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (context.Resources.Any()) return;

            var hardwareResourceGroup = new ResourceGroup("Hardware", true, true);
            var microsoft365ResourceGroup = new ResourceGroup("Microsoft 365", false, true);
            var internetResourceGroup = new ResourceGroup("Internet", true, false);

            context.ResourceGroups.AddRange(
                hardwareResourceGroup,
                microsoft365ResourceGroup,
                internetResourceGroup
            );
            await context.SaveChangesAsync();

            var computer = new Resource("Computer", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/4372/4372820.png", false);
            var laptop = new Resource("Laptop", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/4372/4372820.png", false);
            var commonPc = new Resource("Common PC", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/4372/4372820.png", false);
            var printerBlackAndWhite = new Resource("Printer Access (Black and White)", "B4FF9F", "https://images.vexels.com/media/users/3/136620/isolated/preview/0092395e0d1009ae4190b2ca7b941793-print-printer-icon.png", false);
            var activeDirectory = new Resource("Active Directory", "FFD59E", "https://cdn-icons-png.flaticon.com/512/1383/1383970.png", false);

            var basicInternet = new Resource("Basic Internet", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/1006/1006771.png", false);
            var specialInternet = new Resource("Special Internet", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/1006/1006771.png", true);

            var microsoft365E1 = new Resource("Microsoft 365 (E1)", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/732/732221.png", false);
            var microsoft365E3 = new Resource("Microsoft 365 (E3)", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/732/732221.png", true);
            var microsoft365E5 = new Resource("Microsoft 365 (E5)", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/732/732221.png", true);
            var microsoft365Business = new Resource("Microsoft 365 (Business Central)", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/732/732221.png", true);

            var groupEmail = new Resource("Group Email", "F9FFA4", "https://static.vecteezy.com/system/resources/thumbnails/052/933/905/small/white-envelope-icon-with-transparent-background-png.png", true);
            var sharedFolder = new Resource("Shared Folder", "FFD59E", "https://cdn-icons-png.flaticon.com/512/1383/1383970.png", true);

            computer.AssignToGroup(hardwareResourceGroup.Id);
            laptop.AssignToGroup(hardwareResourceGroup.Id);
            commonPc.AssignToGroup(hardwareResourceGroup.Id);

            basicInternet.AssignToGroup(internetResourceGroup.Id);
            specialInternet.AssignToGroup(internetResourceGroup.Id);

            microsoft365E1.AssignToGroup(microsoft365ResourceGroup.Id);
            microsoft365E3.AssignToGroup(microsoft365ResourceGroup.Id);
            microsoft365E5.AssignToGroup(microsoft365ResourceGroup.Id);
            microsoft365Business.AssignToGroup(microsoft365ResourceGroup.Id);

            context.Resources.AddRange(
                computer,
                laptop,
                commonPc,
                printerBlackAndWhite,
                activeDirectory,

                basicInternet,
                specialInternet,

                microsoft365E1,
                microsoft365E3,
                microsoft365E5,
                microsoft365Business,

                groupEmail,
                sharedFolder
            );
            await context.SaveChangesAsync();

            var specialResources = new List<Resource> { specialInternet, groupEmail, sharedFolder, microsoft365E3, microsoft365E5, microsoft365Business };

            var workflowTemplates = new List<ApprovalWorkflowTemplate>();

            foreach (var r in specialResources)
            {
                workflowTemplates.Add(new ApprovalWorkflowTemplate(r.Id, 1));
            }

            context.ApprovalWorkflowTemplates.AddRange(workflowTemplates);
            await context.SaveChangesAsync();

            var workflowStepsTemplates = new List<ApprovalWorkflowStepsTemplate>();
            foreach (var t in workflowTemplates)
            {
                workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 1, StepAction.APPROVER, ApproverRole.DEPARTMENT_HEAD, "EMPLOYEE"));
                if (t.Resource.Name != "Shared Folder")
                {
                    workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 2, StepAction.APPROVER, ApproverRole.TECHNICAL_HEAD, "EMPLOYEE"));
                }
                else
                {
                    workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 2, StepAction.APPROVER, ApproverRole.DEPARTMENT_HEAD, "FOLDER_OWNER"));
                }
            }

            context.ApprovalWorkflowStepsTemplates.AddRange(workflowStepsTemplates);

            await context.SaveChangesAsync();
        }
    }
}
