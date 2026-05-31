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

            var computer = new Resource("Computer", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/4372/4372820.png", false, false);
            var laptop = new Resource("Laptop", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/4372/4372820.png", false, false);
            var commonPc = new Resource("Common PC", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/4372/4372820.png", false, false);
            var printerBlackAndWhite = new Resource("Printer Access (Black and White)", "#B4FF9F", "https://images.vexels.com/media/users/3/136620/isolated/preview/0092395e0d1009ae4190b2ca7b941793-print-printer-icon.png", false, false);
            var activeDirectory = new Resource("Active Directory", "#FFD59E", "https://cdn-icons-png.flaticon.com/512/1383/1383970.png", false, false);

            var basicInternet = new Resource("Basic Internet", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/1006/1006771.png", false, false);
            var specialInternet = new Resource("Special Internet Access", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/1006/1006771.png", true, true);
            var aiSpecialInternet = new Resource("AI Internet Access", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/1006/1006771.png", true, false);
            var hbSpecialInternet = new Resource("High Bandwidth Internet Access", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/1006/1006771.png", true, false);
            var ssSpecialInternet = new Resource("Social Media Internet Access", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/1006/1006771.png", true, false);

            var microsoft365E1 = new Resource("Microsoft 365 (E1)", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/732/732221.png", false, false);
            var microsoft365E3 = new Resource("Microsoft 365 (E3)", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/732/732221.png", true, false);
            var microsoft365E5 = new Resource("Microsoft 365 (E5)", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/732/732221.png", true, false);
            var microsoft365Business = new Resource("Microsoft 365 (Business Standard)", "#B4FF9F", "https://cdn-icons-png.flaticon.com/512/732/732221.png", true, false);

            var groupEmail = new Resource("Group Email", "#F9FFA4", "https://static.vecteezy.com/system/resources/thumbnails/052/933/905/small/white-envelope-icon-with-transparent-background-png.png", true, true);
            var sharedFolder = new Resource("Shared Folder", "#FFD59E", "https://cdn-icons-png.flaticon.com/512/1383/1383970.png", true, true);

            computer.AssignToGroup(hardwareResourceGroup.Id);
            laptop.AssignToGroup(hardwareResourceGroup.Id);
            commonPc.AssignToGroup(hardwareResourceGroup.Id);

            basicInternet.AssignToGroup(internetResourceGroup.Id);
            aiSpecialInternet.AssignToGroup(internetResourceGroup.Id);
            ssSpecialInternet.AssignToGroup(internetResourceGroup.Id);
            hbSpecialInternet.AssignToGroup(internetResourceGroup.Id);
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
                aiSpecialInternet,
                hbSpecialInternet,
                ssSpecialInternet,

                microsoft365E1,
                microsoft365E3,
                microsoft365E5,
                microsoft365Business,

                groupEmail,
                sharedFolder
            );
            await context.SaveChangesAsync();

            var specialResources = new List<Resource> { aiSpecialInternet, hbSpecialInternet, ssSpecialInternet, specialInternet, groupEmail, sharedFolder, microsoft365E3, microsoft365E5, microsoft365Business };

            var workflowTemplates = new List<ApprovalWorkflowTemplate>();

            foreach (var r in specialResources)
            {
                workflowTemplates.Add(new ApprovalWorkflowTemplate(r.Id, 1));
            }

            context.ApprovalWorkflowTemplates.AddRange(workflowTemplates);
            await context.SaveChangesAsync();

            var internetResources = new List<Resource>
            {
                aiSpecialInternet, hbSpecialInternet, ssSpecialInternet, specialInternet
            };

            var workflowStepsTemplates = new List<ApprovalWorkflowStepsTemplate>();
            foreach (var t in workflowTemplates)
            {
                // Step 1: employee's own department head
                workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 1, StepAction.APPROVER, ApproverRole.DEPARTMENT_HEAD, null));

                if (internetResources.Any(r => r.Id == t.ResourceId))
                {
                    // Step 2: SOC review (claim-based, any SOC user)
                    workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 2, StepAction.FOR_SOC_REVIEW, ApproverRole.ROLE_BASED, nameof(Roles.SOC)));
                    // Step 3: admin screening
                    workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 3, StepAction.FOR_SCREENING, ApproverRole.TECHNICAL_HEAD, null));
                }
                else if (t.Resource.Name == "Shared Folder")
                {
                    // Step 2: owner of the specific shared folder being requested
                    workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 2, StepAction.APPROVER, ApproverRole.RESOURCE_OWNER, null));
                }
                else
                {
                    // Step 2: unclaimed screening by any technical admin at the employee's location
                    workflowStepsTemplates.Add(new ApprovalWorkflowStepsTemplate(t.Id, 2, StepAction.FOR_SCREENING, ApproverRole.TECHNICAL_HEAD, null));
                }
            }

            context.ApprovalWorkflowStepsTemplates.AddRange(workflowStepsTemplates);

            await context.SaveChangesAsync();
        }
    }
}
