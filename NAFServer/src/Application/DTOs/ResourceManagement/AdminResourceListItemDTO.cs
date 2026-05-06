namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record AdminResourceListItemDTO(
        int Id,
        string Name,
        string? IconUrl,
        string Color,
        bool IsActive,
        bool IsSpecial,
        string? ResourceGroupName,
        int ActiveWorkflowTemplateVersion
    );
}
