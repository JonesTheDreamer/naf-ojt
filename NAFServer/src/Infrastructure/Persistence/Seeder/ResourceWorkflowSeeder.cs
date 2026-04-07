using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Infrastructure.Persistence.Seeder
{
    public class ResourceWorkflowSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (context.Resources.Any()) return;


            var computer = new Resource("Computer", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/4372/4372820.png", false);
            var laptop = new Resource("Laptop", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/4372/4372820.png", false);
            var commonPc = new Resource("Common PC", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/4372/4372820.png", false);
            var microsoft365 = new Resource("Microsoft 365", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/732/732221.png", false);
            var email = new Resource("Email", "F9FFA4", "https://static.vecteezy.com/system/resources/thumbnails/052/933/905/small/white-envelope-icon-with-transparent-background-png.png", false);
            var basicInternet = new Resource("Basic Internet", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/1006/1006771.png", false);
            var printerBlackAndWhite = new Resource("Printer Access (Black and White)", "B4FF9F", "https://images.vexels.com/media/users/3/136620/isolated/preview/0092395e0d1009ae4190b2ca7b941793-print-printer-icon.png", false);
            var microsoft365e1 = new Resource("Microsoft 365 (E1)", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/732/732221.png", false);
            var specialInternet = new Resource("Special Internet", "B4FF9F", "https://cdn-icons-png.flaticon.com/512/1006/1006771.png", true);
            var groupEmail = new Resource("Group Email", "F9FFA4", "https://static.vecteezy.com/system/resources/thumbnails/052/933/905/small/white-envelope-icon-with-transparent-background-png.png", true);
            var sharedFolder = new Resource("Shared Folder", "FFD59E", "https://cdn-icons-png.flaticon.com/512/1383/1383970.png", true);

            context.Resources.AddRange(
                specialInternet,
                groupEmail,
                sharedFolder,
                computer,
                laptop,
                commonPc,
                microsoft365,
                email,
                basicInternet,
                printerBlackAndWhite,
                microsoft365e1
            );
            await context.SaveChangesAsync();

            var computerResource = new ApprovalWorkflowTemplate(computer.Id, 1);
            var laptopResource = new ApprovalWorkflowTemplate(laptop.Id, 1);
            var commonPcResource = new ApprovalWorkflowTemplate(commonPc.Id, 1);
            var microsoft365Resource = new ApprovalWorkflowTemplate(microsoft365.Id, 1);
            var emailResource = new ApprovalWorkflowTemplate(email.Id, 1);
            var basicInternetResource = new ApprovalWorkflowTemplate(basicInternet.Id, 1);
            var printerBlackAndWhiteResource = new ApprovalWorkflowTemplate(printerBlackAndWhite.Id, 1);
            var microsoft365e1Resource = new ApprovalWorkflowTemplate(microsoft365e1.Id, 1);
            var specialInternetResource = new ApprovalWorkflowTemplate(specialInternet.Id, 1);
            var groupEmailResource = new ApprovalWorkflowTemplate(groupEmail.Id, 1);
            var sharedFolderResource = new ApprovalWorkflowTemplate(sharedFolder.Id, 1);

            context.ApprovalWorkflowTemplates.AddRange(
                computerResource,
                laptopResource,
                commonPcResource,
                microsoft365Resource,
                emailResource,
                basicInternetResource,
                printerBlackAndWhiteResource,
                microsoft365e1Resource,
                specialInternetResource,
                groupEmailResource,
                sharedFolderResource
            );
            await context.SaveChangesAsync();

            var specialInternetResourceFirstStep = new ApprovalWorkflowStepsTemplate(specialInternetResource.Id, 1, StepAction.APPROVER, ApproverRole.DEPARTMENT_HEAD, "EMPLOYEE");
            var specialInternetResourceSecondStep = new ApprovalWorkflowStepsTemplate(specialInternetResource.Id, 2, StepAction.FOR_SCREENING, ApproverRole.POSITION, "Network Admin");

            var groupEmailResourceFirstStep = new ApprovalWorkflowStepsTemplate(groupEmailResource.Id, 1, StepAction.APPROVER, ApproverRole.DEPARTMENT_HEAD, "EMPLOYEE");
            var groupEmailResourceSecondStep = new ApprovalWorkflowStepsTemplate(groupEmailResource.Id, 2, StepAction.FOR_SCREENING, ApproverRole.POSITION, "Network Admin");

            var sharedFolderResourceFirstStep = new ApprovalWorkflowStepsTemplate(sharedFolderResource.Id, 1, StepAction.APPROVER, ApproverRole.DEPARTMENT_HEAD, "EMPLOYEE");
            var sharedFolderResourceSecondStep = new ApprovalWorkflowStepsTemplate(sharedFolderResource.Id, 2, StepAction.APPROVER, ApproverRole.DEPARTMENT_HEAD, "FOLDER_OWNER");

            context.ApprovalWorkflowStepsTemplates.AddRange(
                specialInternetResourceFirstStep,
                specialInternetResourceSecondStep,
                groupEmailResourceFirstStep,
                groupEmailResourceSecondStep,
                sharedFolderResourceFirstStep,
                sharedFolderResourceSecondStep
            );
            await context.SaveChangesAsync();
        }
    }
}
