namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record AdminResourceDetailDTO(
        int Id,
        string Name,
        string? IconUrl,
        string Color,
        bool IsActive,
        bool IsSpecial,
        int? ResourceGroupId,
        string? ResourceGroupName,
        List<WorkflowTemplateVersionDTO> WorkflowVersions,
        List<EmployeesByLocationDTO> EmployeesByLocation
    );
}
